'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const posSaleItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  sku: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  stock: z.number().int().nonnegative(),
  category: z.string().min(1),
})

const posSaleSchema = z.object({
  items: z.array(posSaleItemSchema).min(1),
  discount: z.number().nonnegative(),
  paymentMethod: z.enum(['Efectivo', 'Tarjeta', 'Credito', 'Crédito', 'Mixto']),
})

const PAYMENT_METHOD_MAP = {
  Efectivo: 'efectivo',
  Tarjeta: 'tarjeta',
  Credito: 'credito',
  Crédito: 'credito',
  Mixto: 'mixto',
} as const

const orderStatusSchema = z.enum([
  'pendiente',
  'confirmado',
  'procesando',
  'enviado',
  'entregado',
  'cancelado',
  'reembolsado',
])

const orderStatusLabels: Record<z.infer<typeof orderStatusSchema>, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  procesando: 'Preparacion',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  reembolsado: 'Reembolsado',
}

type PosSupabaseClient = Awaited<ReturnType<typeof createClient>>

async function requirePosStaff(supabase: PosSupabaseClient) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw new Error(userError.message)
  }

  if (!user) {
    throw new Error('Debes iniciar sesión para realizar esta acción.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    throw new Error(profileError.message)
  }

  if (!profile || !['admin', 'employee'].includes(profile.role)) {
    throw new Error('Tu usuario no tiene permisos para administrar pedidos.')
  }

  return user
}

async function getOrCreateOpenSession(supabase: PosSupabaseClient, processedBy: string) {

  const { data: existingSession, error: existingSessionError } = await supabase
    .from('pos_sessions')
    .select('id, total_sales, total_transactions')
    .eq('opened_by', processedBy)
    .eq('status', 'open')
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingSessionError) {
    throw new Error(existingSessionError.message)
  }

  if (existingSession) {
    return existingSession
  }

  const { data: newSession, error: newSessionError } = await supabase
    .from('pos_sessions')
    .insert({
      opened_by: processedBy,
      opening_cash: 0,
      status: 'open',
      notes: 'Sesión POS creada automáticamente al registrar una venta.',
    })
    .select('id, total_sales, total_transactions')
    .single()

  if (newSessionError) {
    throw new Error(newSessionError.message)
  }

  return newSession
}

export async function updateOrderStatus(input: unknown) {
  const payload = z.object({
    orderId: z.string().uuid(),
    status: orderStatusSchema,
  }).parse(input)

  const supabase = await createClient()
  await requirePosStaff(supabase)

  const { data: order, error } = await supabase
    .from('orders')
    .update({
      status: payload.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payload.orderId)
    .select('id, order_number, status')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin')
  revalidatePath('/dashboard')

  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status as z.infer<typeof orderStatusSchema>,
    statusLabel: orderStatusLabels[order.status as z.infer<typeof orderStatusSchema>],
  }
}

export async function createPosSale(input: unknown) {
  const payload = posSaleSchema.parse(input)
  const supabase = await createClient()

  const user = await requirePosStaff(supabase)

  const itemIds = payload.items.map((item) => item.id)
  const subtotal = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discount = Math.min(payload.discount, subtotal)
  const total = Math.max(0, subtotal - discount)

  const { data: inventories, error: inventoryError } = await supabase
    .from('inventory')
    .select('id, product_id, quantity')
    .in('product_id', itemIds)

  if (inventoryError) {
    throw new Error(inventoryError.message)
  }

  const inventoryByProductId = new Map<string, Array<{ id: string; quantity: number }>>()

  for (const inventory of inventories ?? []) {
    if (!inventory.product_id) continue
    const current = inventoryByProductId.get(inventory.product_id) ?? []
    current.push({
      id: inventory.id,
      quantity: Number(inventory.quantity ?? 0),
    })
    inventoryByProductId.set(inventory.product_id, current)
  }

  for (const item of payload.items) {
    const inventoryRows = inventoryByProductId.get(item.id) ?? []
    const availableStock = inventoryRows.reduce((sum, inventory) => sum + inventory.quantity, 0)

    if (inventoryRows.length === 0) {
      throw new Error(`El producto ${item.name} no tiene inventario configurado.`)
    }

    if (availableStock < item.quantity) {
      throw new Error(`Stock insuficiente para ${item.name}.`)
    }
  }

  const session = await getOrCreateOpenSession(supabase, user.id)

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      status: 'confirmado',
      payment_status: 'pagado',
      subtotal,
      discount,
      tax: 0,
      shipping_cost: 0,
      credits_applied: 0,
      total,
      notes: 'Venta registrada desde el punto de venta.',
      source: 'pos',
    })
    .select('id, order_number')
    .single()

  if (orderError) {
    throw new Error(orderError.message)
  }

  const orderItems = payload.items.map((item) => ({
    order_id: order.id,
    product_id: item.id,
    animal_id: null,
    name: item.name,
    sku: item.sku,
    quantity: item.quantity,
    unit_price: item.price,
    total: item.price * item.quantity,
  }))

  const { error: orderItemsError } = await supabase.from('order_items').insert(orderItems)

  if (orderItemsError) {
    await supabase.from('orders').delete().eq('id', order.id)
    throw new Error(orderItemsError.message)
  }

  const { data: transaction, error: transactionError } = await supabase
    .from('pos_transactions')
    .insert({
      session_id: session.id,
      order_id: order.id,
      customer_name: 'Cliente de mostrador',
      subtotal,
      discount,
      tax: 0,
      credits_applied: 0,
      total,
      payment_method: PAYMENT_METHOD_MAP[payload.paymentMethod],
      items: payload.items.map((item) => ({
        product_id: item.id,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.price,
        total: item.price * item.quantity,
        category: item.category,
      })),
      status: 'completed',
      processed_by: user.id,
    })
    .select('id, transaction_number')
    .single()

  if (transactionError) {
    await supabase.from('orders').delete().eq('id', order.id)
    throw new Error(transactionError.message)
  }

  for (const item of payload.items) {
    const inventoryRows = inventoryByProductId.get(item.id) ?? []
    let remaining = item.quantity

    for (const inventory of inventoryRows) {
      if (remaining <= 0) break

      const deduction = Math.min(inventory.quantity, remaining)
      remaining -= deduction

      const { error: updateInventoryError } = await supabase
        .from('inventory')
        .update({ quantity: inventory.quantity - deduction })
        .eq('id', inventory.id)

      if (updateInventoryError) {
        throw new Error(updateInventoryError.message)
      }
    }

    if (remaining > 0) {
      throw new Error(`No se pudo actualizar completamente el inventario de ${item.name}.`)
    }
  }

  const { error: sessionUpdateError } = await supabase
    .from('pos_sessions')
    .update({
      total_sales: Number(session.total_sales ?? 0) + total,
      total_transactions: Number(session.total_transactions ?? 0) + 1,
    })
    .eq('id', session.id)

  if (sessionUpdateError) {
    throw new Error(sessionUpdateError.message)
  }

  return {
    orderId: order.id,
    orderNumber: order.order_number,
    transactionId: transaction.id,
    transactionNumber: transaction.transaction_number,
    total,
  }
}

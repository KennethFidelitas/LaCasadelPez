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
  discount: z.number().finite().nonnegative('El descuento no puede ser negativo.'),
  paymentMethod: z.enum(['Efectivo', 'Tarjeta', 'Credito', 'Crédito', 'Mixto']),
  cashReceived: z.number().finite().nonnegative('El efectivo no puede ser negativo.'),
  cardAmount: z.number().finite().nonnegative('El monto de tarjeta no puede ser negativo.'),
  creditAmount: z.number().finite().nonnegative('El monto de crédito no puede ser negativo.'),
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

async function findOpenSession(supabase: PosSupabaseClient, processedBy: string) {

  const { data: existingSession, error: existingSessionError } = await supabase
    .from('pos_sessions')
    .select('id, opening_cash, total_sales, total_transactions')
    .eq('opened_by', processedBy)
    .eq('status', 'open')
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingSessionError) {
    throw new Error(existingSessionError.message)
  }

  return existingSession
}

export async function getPosCashSession() {
  const supabase = await createClient()
  const user = await requirePosStaff(supabase)
  const session = await findOpenSession(supabase, user.id)
  return session ? { openingCash: Number(session.opening_cash) } : null
}

export async function setPosCashSession(input: unknown) {
  const payload = z.discriminatedUnion('action', [
    z.object({ action: z.literal('open'), amount: z.number().finite().nonnegative() }),
    z.object({ action: z.literal('close'), amount: z.number().finite().nonnegative(), notes: z.string().trim().max(1000) }),
  ]).parse(input)
  const supabase = await createClient()
  const user = await requirePosStaff(supabase)
  const session = await findOpenSession(supabase, user.id)

  if (payload.action === 'open') {
    if (session) return { openingCash: Number(session.opening_cash) }
    const { error } = await supabase.from('pos_sessions').insert({
      opened_by: user.id,
      opening_cash: payload.amount,
      status: 'open',
    })
    if (error) throw new Error(error.message)
    return { openingCash: payload.amount }
  }

  if (session) {
    const { error } = await supabase.from('pos_sessions').update({
      status: 'closed',
      closed_by: user.id,
      closed_at: new Date().toISOString(),
      closing_cash: payload.amount,
      notes: payload.notes || null,
    }).eq('id', session.id).eq('status', 'open')
    if (error) throw new Error(error.message)
  }
  return null
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
  const parsed = posSaleSchema.safeParse(input)
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)
  const payload = parsed.data
  const supabase = await createClient()

  const user = await requirePosStaff(supabase)

  const itemIds = payload.items.map((item) => item.id)
  if (new Set(itemIds).size !== itemIds.length) throw new Error('El carrito contiene productos repetidos.')
  const subtotal = Math.round(payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100
  const discount = payload.discount
  if (discount > subtotal) throw new Error('El descuento no puede superar el subtotal.')
  const total = Math.round((subtotal - discount) * 100) / 100
  const method = PAYMENT_METHOD_MAP[payload.paymentMethod]
  const cash = method === 'efectivo' || method === 'mixto' ? payload.cashReceived : 0
  const card = method === 'tarjeta' || method === 'mixto' ? payload.cardAmount : 0
  const credit = method === 'credito' ? payload.creditAmount : 0
  if (Math.round((cash + card + credit) * 100) < Math.round(total * 100)) {
    throw new Error('El monto recibido no cubre el total de la venta.')
  }
  if (card + credit > total) throw new Error('El monto de tarjeta o crédito no puede superar el total.')
  const session = await findOpenSession(supabase, user.id)
  if (!session) throw new Error('Debés abrir la caja antes de confirmar una venta.')

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
      payment_method: method,
      cash_received: cash || null,
      cash_change: cash ? Math.round((cash + card - total) * 100) / 100 : null,
      card_amount: card || null,
      credit_amount: credit || null,
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
    stockByProduct: Object.fromEntries(payload.items.map((item) => [
      item.id,
      (inventoryByProductId.get(item.id) ?? []).reduce((sum, row) => sum + row.quantity, 0) - item.quantity,
    ])),
  }
}

'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PosReturnRequest } from '@/lib/pos/types'
import type { CustomerReturnRequest } from './types'

const returnReasonSchema = z.enum(['no_satisfecho', 'producto_danado', 'producto_incorrecto', 'otro'])
const returnStatusSchema = z.enum(['pendiente', 'aprobada', 'rechazada'])

const createReturnRequestSchema = z.object({
  orderId: z.string().uuid(),
  orderItemId: z.string().uuid().nullable(),
  reason: returnReasonSchema,
  details: z.string().trim().min(10, 'Explicá el motivo con al menos 10 caracteres.').max(1000),
})

const updateReturnRequestSchema = z.object({
  requestId: z.string().uuid(),
  status: returnStatusSchema.exclude(['pendiente']),
})

const REQUEST_STATUS_LABELS: Record<string, PosReturnRequest['requestStatus']> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
}

const PAYMENT_STATUS_LABELS: Record<string, PosReturnRequest['paymentStatus']> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  fallido: 'Fallido',
  reembolsado: 'Reembolsado',
}

export async function createReturnRequest(input: unknown) {
  const payload = createReturnRequestSchema.parse(input)
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw new Error(userError.message)
  if (!user) throw new Error('Debes iniciar sesión para solicitar una devolución.')

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, user_id, status, payment_status, total')
    .eq('id', payload.orderId)
    .eq('user_id', user.id)
    .single()

  if (orderError || !order) throw new Error('Pedido no encontrado.')
  if (order.payment_status !== 'pagado') throw new Error('Solo podés solicitar devolución de pedidos pagados.')
  if (['cancelado', 'reembolsado'].includes(order.status)) {
    throw new Error('Este pedido ya no permite nuevas solicitudes de devolución.')
  }

  if (payload.orderItemId) {
    const { data: item, error: itemError } = await supabase
      .from('order_items')
      .select('id')
      .eq('id', payload.orderItemId)
      .eq('order_id', payload.orderId)
      .single()

    if (itemError || !item) throw new Error('El artículo seleccionado no pertenece a este pedido.')
  }

  const { data: existing } = await supabase
    .from('return_requests')
    .select('id')
    .eq('order_id', payload.orderId)
    .eq('user_id', user.id)
    .in('status', ['pendiente', 'aprobada'])
    .maybeSingle()

  if (existing) throw new Error('Ya existe una solicitud de devolución activa para este pedido.')

  const { data, error } = await supabase
    .from('return_requests')
    .insert({
      order_id: payload.orderId,
      order_item_id: payload.orderItemId,
      user_id: user.id,
      reason: payload.reason,
      details: payload.details,
      requested_amount: Number(order.total ?? 0),
      status: 'pendiente',
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/cuenta')
  revalidatePath(`/cuenta/pedidos/${payload.orderId}`)
  revalidatePath('/admin')

  return { id: data.id }
}

export async function getCustomerReturnRequest(orderId: string): Promise<CustomerReturnRequest | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('return_requests')
    .select('id, order_id, order_item_id, reason, details, status, requested_amount, admin_notes, created_at, updated_at')
    .eq('order_id', orderId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as CustomerReturnRequest | null
}

export async function getReturnRequestsForAdmin(): Promise<PosReturnRequest[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('return_requests')
    .select(`
      id,
      order_id,
      status,
      requested_amount,
      details,
      created_at,
      order:orders(order_number, payment_status, total, profile:profiles(email, first_name, last_name))
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(error.message)

  return ((data ?? []) as unknown as Array<{
    id: string
    order_id: string
    status: string
    requested_amount: number | null
    details: string | null
    created_at: string
    order: {
      order_number: string | null
      payment_status: string | null
      total: number | null
      profile: { email: string | null; first_name: string | null; last_name: string | null } | Array<{ email: string | null; first_name: string | null; last_name: string | null }> | null
    } | Array<{
      order_number: string | null
      payment_status: string | null
      total: number | null
      profile: { email: string | null; first_name: string | null; last_name: string | null } | Array<{ email: string | null; first_name: string | null; last_name: string | null }> | null
    }> | null
  }>).map((request) => {
    const order = Array.isArray(request.order) ? request.order[0] : request.order
    const profile = Array.isArray(order?.profile) ? order?.profile[0] : order?.profile
    const customer = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.email || 'Cliente tienda en linea'

    return {
      id: request.id,
      orderId: request.order_id,
      orderNumber: order?.order_number ?? 'Sin numero',
      customer,
      requestedAt: request.created_at,
      requestStatus: REQUEST_STATUS_LABELS[request.status] ?? 'Pendiente',
      paymentStatus: PAYMENT_STATUS_LABELS[order?.payment_status ?? 'pendiente'] ?? 'Pendiente',
      refundAmount: Number(request.requested_amount ?? order?.total ?? 0),
      notes: request.details,
    }
  })
}

export async function updateReturnRequestStatus(input: unknown) {
  const payload = updateReturnRequestSchema.parse(input)
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw new Error(userError.message)
  if (!user) throw new Error('Debes iniciar sesión para administrar devoluciones.')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) throw new Error(profileError.message)
  if (!profile || !['admin', 'employee'].includes(profile.role)) {
    throw new Error('Tu usuario no tiene permisos para administrar devoluciones.')
  }

  const { data, error } = await supabase
    .from('return_requests')
    .update({
      status: payload.status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', payload.requestId)
    .select('id, order_id, status')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath('/cuenta')
  if (data?.order_id) revalidatePath(`/cuenta/pedidos/${data.order_id}`)

  return {
    id: data.id,
    status: REQUEST_STATUS_LABELS[data.status] ?? 'Pendiente',
  }
}

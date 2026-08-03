'use server'

// lib/customers/traceability-report.ts
// RF-CL-0010: Reporte consolidado de trazabilidad de pedidos y pagos de un cliente

import { createAdminClient } from '@/lib/supabase/admin'

export interface TraceabilityFilters {
  userId?: string
  customerEmail?: string
  dateFrom?: string  // ISO string
  dateTo?: string    // ISO string
}

export interface OrderTrace {
  order_number: string
  created_at: string
  status: string
  payment_status: string
  total: number
  paid_amount: number
  balance: number
  items_count: number
  source: string
}

export interface TraceabilityReportData {
  customer: {
    name: string
    email: string | null
    phone: string | null
    role: string
    created_at: string
  }
  filters: { dateFrom?: string; dateTo?: string }
  orders: OrderTrace[]
  summary: {
    total_orders: number
    total_billed: number
    total_paid: number
    total_pending: number
    compliance_rate: number  // % de órdenes completamente pagadas
    cancelled_orders: number
  }
  generatedAt: string
}

export async function getTraceabilityReport(
  filters: TraceabilityFilters,
): Promise<{ data: TraceabilityReportData | null; error: string | null }> {
  const supabase = createAdminClient()

  if (!filters.userId && !filters.customerEmail) {
    return { data: null, error: 'Debés indicar el ID o email del cliente.' }
  }

  // ── Obtener perfil del cliente ────────────────────────────────────────────
  let profileQuery = supabase.from('profiles').select('*')

  if (filters.userId) {
    profileQuery = profileQuery.eq('id', filters.userId)
  } else {
    profileQuery = profileQuery.eq('email', filters.customerEmail!)
  }

  const { data: profile, error: profileError } = await profileQuery.single()

  if (profileError || !profile) {
    return { data: null, error: 'Cliente no encontrado.' }
  }

  // ── Obtener órdenes del cliente ───────────────────────────────────────────
  let ordersQuery = supabase
    .from('orders')
    .select(`
      id,
      order_number,
      created_at,
      status,
      payment_status,
      subtotal,
      discount,
      total,
      source,
      order_items(id)
    `)
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  // Filtro por período (Caso 3 del RF)
  if (filters.dateFrom) {
    ordersQuery = ordersQuery.gte('created_at', filters.dateFrom)
  }
  if (filters.dateTo) {
    // Incluir todo el día de cierre
    const endOfDay = new Date(filters.dateTo)
    endOfDay.setHours(23, 59, 59, 999)
    ordersQuery = ordersQuery.lte('created_at', endOfDay.toISOString())
  }

  const { data: orders, error: ordersError } = await ordersQuery

  if (ordersError) {
    return { data: null, error: `Error obteniendo órdenes: ${ordersError.message}` }
  }

  // ── También obtener órdenes de producción del cliente ────────────────────
  let productionQuery = supabase
    .from('production_orders')
    .select('order_number, created_at, status, payment_status, total, deposit_paid')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  if (filters.dateFrom) productionQuery = productionQuery.gte('created_at', filters.dateFrom)
  if (filters.dateTo) {
    const endOfDay = new Date(filters.dateTo)
    endOfDay.setHours(23, 59, 59, 999)
    productionQuery = productionQuery.lte('created_at', endOfDay.toISOString())
  }

  const { data: productionOrders } = await productionQuery

  // ── Construir trazas de órdenes ───────────────────────────────────────────
  const orderTraces: OrderTrace[] = []

  // Órdenes normales
  for (const o of orders ?? []) {
    const paidAmount = o.payment_status === 'pagado' ? o.total : 0
    orderTraces.push({
      order_number: o.order_number,
      created_at: o.created_at,
      status: o.status,
      payment_status: o.payment_status,
      total: o.total,
      paid_amount: paidAmount,
      balance: Math.max(0, o.total - paidAmount),
      items_count: Array.isArray(o.order_items) ? o.order_items.length : 0,
      source: o.source ?? 'online',
    })
  }

  // Órdenes de producción
  for (const p of productionOrders ?? []) {
    orderTraces.push({
      order_number: `PROD-${p.order_number}`,
      created_at: p.created_at,
      status: p.status,
      payment_status: p.payment_status,
      total: p.total,
      paid_amount: p.deposit_paid ?? 0,
      balance: Math.max(0, p.total - (p.deposit_paid ?? 0)),
      items_count: 1,
      source: 'produccion',
    })
  }

  // Ordenar todo junto por fecha descendente
  orderTraces.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // ── Calcular resumen ──────────────────────────────────────────────────────
  const nonCancelledOrders = orderTraces.filter(o => o.status !== 'cancelado')
  const totalBilled = nonCancelledOrders.reduce((s, o) => s + o.total, 0)
  const totalPaid = nonCancelledOrders.reduce((s, o) => s + o.paid_amount, 0)
  const fullyPaid = nonCancelledOrders.filter(o => o.payment_status === 'pagado').length
  const complianceRate = nonCancelledOrders.length > 0
    ? Math.round((fullyPaid / nonCancelledOrders.length) * 100)
    : 0

  const reportData: TraceabilityReportData = {
    customer: {
      name: `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'Sin nombre',
      email: profile.email,
      phone: profile.phone,
      role: profile.role,
      created_at: profile.created_at,
    },
    filters: {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    },
    orders: orderTraces,
    summary: {
      total_orders: orderTraces.length,
      total_billed: totalBilled,
      total_paid: totalPaid,
      total_pending: totalBilled - totalPaid,
      compliance_rate: complianceRate,
      cancelled_orders: orderTraces.filter(o => o.status === 'cancelado').length,
    },
    generatedAt: new Date().toISOString(),
  }

  return { data: reportData, error: null }
}

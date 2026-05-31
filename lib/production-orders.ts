// Tipos y helpers para el módulo de Órdenes de Producción
// RF-OP-006, RF-OP-007, RF-OP-008, RF-OP-009

import { createClient } from '@/lib/supabase/client'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ProductionOrderStatus =
  | 'cotizado'
  | 'confirmado'
  | 'en_produccion'
  | 'listo'
  | 'entregado'
  | 'cancelado'

export type ProductionPaymentStatus = 'pendiente' | 'anticipo' | 'pagado' | 'reembolsado'

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'sinpe' | 'transferencia'

export interface ProductionOrder {
  id: string
  order_number: string
  user_id: string | null
  status: ProductionOrderStatus
  payment_status: ProductionPaymentStatus
  config: Record<string, unknown>
  width: number | null
  height: number | null
  depth: number | null
  glass_type: string | null
  glass_thickness: number | null
  accessories: unknown[]
  materials_cost: number
  labor_cost: number
  accessories_cost: number
  subtotal: number
  discount: number
  total: number
  deposit_paid: number
  estimated_days: number | null
  started_at: string | null
  completed_at: string | null
  delivered_at: string | null
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  notes: string | null
  internal_notes: string | null
  created_at: string
  updated_at: string
}

export interface ProductionUpdate {
  id: string
  production_order_id: string
  status: ProductionOrderStatus | null
  message: string
  images: string[]
  created_by: string | null
  created_at: string
}

/** Datos para crear una nueva orden de producción (RF-OP-009) */
export interface CreateProductionOrderInput {
  customer_name: string
  customer_email: string
  customer_phone: string
  user_id?: string
  width: number
  height: number
  depth: number
  glass_type: string
  glass_thickness: number
  accessories: unknown[]
  materials_cost: number
  labor_cost: number
  accessories_cost: number
  subtotal: number
  discount: number
  total: number
  estimated_days: number
  notes?: string
  config?: Record<string, unknown>
}

/** Datos para registrar un pago (RF-OP-007 y RF-OP-008) */
export interface RegisterPaymentInput {
  order_id: string
  amount: number
  payment_method: PaymentMethod
  notes?: string
}

// ─── Helpers de estado ────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<ProductionOrderStatus, string> = {
  cotizado: 'Cotizado',
  confirmado: 'Confirmado',
  en_produccion: 'En producción',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export const STATUS_FLOW: ProductionOrderStatus[] = [
  'cotizado',
  'confirmado',
  'en_produccion',
  'listo',
  'entregado',
]

export const STATUS_NOTIFICATION_MESSAGES: Record<ProductionOrderStatus, string> = {
  cotizado: 'Su orden ha sido cotizada. Por favor confirme para iniciar producción.',
  confirmado: 'Su orden ha sido confirmada. Pronto comenzaremos la producción.',
  en_produccion: 'Su pecera está en producción. Le avisaremos cuando esté lista.',
  listo: '¡Su pecera está lista! Puede coordinar la entrega.',
  entregado: 'Su orden ha sido entregada. ¡Gracias por su preferencia!',
  cancelado: 'Su orden ha sido cancelada. Contáctenos si tiene preguntas.',
}

export function getNextStatus(
  current: ProductionOrderStatus,
): ProductionOrderStatus | null {
  const idx = STATUS_FLOW.indexOf(current)
  if (idx === -1 || idx === STATUS_FLOW.length - 1) return null
  return STATUS_FLOW[idx + 1]
}

export function getStatusVariant(
  status: ProductionOrderStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'cotizado':
      return 'outline'
    case 'confirmado':
      return 'default'
    case 'en_produccion':
      return 'default'
    case 'listo':
      return 'secondary'
    case 'entregado':
      return 'secondary'
    case 'cancelado':
      return 'destructive'
  }
}

/** Calcula el 50 % del total de la orden */
export function calcDeposit(total: number): number {
  return Math.round(total * 0.5 * 100) / 100
}

/** Calcula el saldo restante después del anticipo */
export function calcBalance(total: number, depositPaid: number): number {
  return Math.max(0, total - depositPaid)
}

// ─── Funciones de Supabase ────────────────────────────────────────────────────

/**
 * RF-OP-009 — Guarda una nueva orden de producción en Supabase.
 */
export async function createProductionOrder(
  input: CreateProductionOrderInput,
): Promise<{ data: ProductionOrder | null; error: string | null }> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('production_orders')
    .insert([
      {
        user_id: input.user_id ?? null,
        status: 'cotizado' as ProductionOrderStatus,
        payment_status: 'pendiente' as ProductionPaymentStatus,
        config: input.config ?? {},
        width: input.width,
        height: input.height,
        depth: input.depth,
        glass_type: input.glass_type,
        glass_thickness: input.glass_thickness,
        accessories: input.accessories,
        materials_cost: input.materials_cost,
        labor_cost: input.labor_cost,
        accessories_cost: input.accessories_cost,
        subtotal: input.subtotal,
        discount: input.discount,
        total: input.total,
        deposit_paid: 0,
        estimated_days: input.estimated_days,
        customer_name: input.customer_name,
        customer_email: input.customer_email,
        customer_phone: input.customer_phone,
        notes: input.notes ?? null,
        internal_notes: null,
      },
    ])
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as ProductionOrder, error: null }
}

/**
 * RF-OP-006 — Cambia el estado de una orden y registra un production_update
 * para notificación.
 */
export async function updateProductionOrderStatus(
  orderId: string,
  newStatus: ProductionOrderStatus,
  adminUserId: string,
): Promise<{ error: string | null }> {
  const supabase = createClient()

  // 1. Actualizar estado de la orden
  const { error: updateError } = await supabase
    .from('production_orders')
    .update({
      status: newStatus,
      ...(newStatus === 'en_produccion' ? { started_at: new Date().toISOString() } : {}),
      ...(newStatus === 'listo' ? { completed_at: new Date().toISOString() } : {}),
      ...(newStatus === 'entregado' ? { delivered_at: new Date().toISOString() } : {}),
    })
    .eq('id', orderId)

  if (updateError) return { error: updateError.message }

  // 2. Registrar el update (actúa como notificación interna / historial)
  const { error: noteError } = await supabase.from('production_updates').insert([
    {
      production_order_id: orderId,
      status: newStatus,
      message: STATUS_NOTIFICATION_MESSAGES[newStatus],
      created_by: adminUserId,
    },
  ])

  if (noteError) return { error: noteError.message }

  return { error: null }
}

/**
 * RF-OP-007 — Registra el pago del anticipo del 50 %.
 */
export async function registerDepositPayment(
  input: RegisterPaymentInput,
): Promise<{ error: string | null }> {
  const supabase = createClient()

  // Obtener la orden actual
  const { data: order, error: fetchError } = await supabase
    .from('production_orders')
    .select('total, deposit_paid, status')
    .eq('id', input.order_id)
    .single()

  if (fetchError || !order) return { error: fetchError?.message ?? 'Orden no encontrada' }

  const expectedDeposit = calcDeposit(order.total)

  if (input.amount < expectedDeposit) {
    return {
      error: `El anticipo debe ser al menos el 50% del total (${expectedDeposit.toFixed(2)}).`,
    }
  }

  const newDepositPaid = (order.deposit_paid ?? 0) + input.amount

  const { error: updateError } = await supabase
    .from('production_orders')
    .update({
      deposit_paid: newDepositPaid,
      payment_status: 'anticipo' as ProductionPaymentStatus,
      // Si el anticipo cubre el total completo, marcamos como pagado
      ...(newDepositPaid >= order.total
        ? ({ payment_status: 'pagado' } as { payment_status: ProductionPaymentStatus })
        : {}),
    })
    .eq('id', input.order_id)

  if (updateError) return { error: updateError.message }

  // Registrar nota interna
  await supabase.from('production_updates').insert([
    {
      production_order_id: input.order_id,
      status: null,
      message: `Anticipo del 50% registrado: ${input.amount.toFixed(2)} via ${input.payment_method}. ${input.notes ?? ''}`.trim(),
    },
  ])

  return { error: null }
}

/**
 * RF-OP-008 — Registra el pago del saldo restante.
 */
export async function registerFinalPayment(
  input: RegisterPaymentInput,
): Promise<{ error: string | null }> {
  const supabase = createClient()

  // Obtener la orden actual
  const { data: order, error: fetchError } = await supabase
    .from('production_orders')
    .select('total, deposit_paid, payment_status')
    .eq('id', input.order_id)
    .single()

  if (fetchError || !order) return { error: fetchError?.message ?? 'Orden no encontrada' }

  const balance = calcBalance(order.total, order.deposit_paid ?? 0)

  if (input.amount < balance) {
    return {
      error: `El monto ingresado (${input.amount.toFixed(2)}) es menor al saldo pendiente (${balance.toFixed(2)}).`,
    }
  }

  const { error: updateError } = await supabase
    .from('production_orders')
    .update({
      deposit_paid: order.total, // Orden completamente pagada
      payment_status: 'pagado' as ProductionPaymentStatus,
    })
    .eq('id', input.order_id)

  if (updateError) return { error: updateError.message }

  // Registrar nota interna
  await supabase.from('production_updates').insert([
    {
      production_order_id: input.order_id,
      status: null,
      message: `Saldo restante cancelado: ${input.amount.toFixed(2)} via ${input.payment_method}. Orden completamente pagada. ${input.notes ?? ''}`.trim(),
    },
  ])

  return { error: null }
}

/**
 * Obtiene una orden de producción con su historial de actualizaciones.
 */
export async function getProductionOrder(orderId: string): Promise<{
  data: (ProductionOrder & { updates: ProductionUpdate[] }) | null
  error: string | null
}> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('production_orders')
    .select('*, updates:production_updates(*)')
    .eq('id', orderId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as ProductionOrder & { updates: ProductionUpdate[] }, error: null }
}

/**
 * Lista todas las órdenes de producción (para admin/vendedor).
 */
export async function listProductionOrders(): Promise<{
  data: ProductionOrder[]
  error: string | null
}> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('production_orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: data as ProductionOrder[], error: null }
}

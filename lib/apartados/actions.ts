'use server'

// lib/apartados/actions.ts
// RF: Cancelar apartado para liberar inventario
// RF: Alertas de apartados próximos a vencer
// RF: Crear orden de producción al confirmar pago inicial (vía trigger SQL)

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ApartadoStatus = 'activo' | 'pagado' | 'cancelado' | 'vencido'
export type ApartadoItemType = 'product' | 'animal' | 'pecera_prediseno' | 'pecera_personalizada'
export type AlertType = 'vencimiento_3dias' | 'vencimiento_1dia' | 'vencido' | 'cancelado'

export interface Apartado {
  id: string
  apartado_number: string
  user_id: string | null
  customer_name: string
  customer_email: string | null
  customer_phone: string
  item_type: ApartadoItemType
  product_id: string | null
  animal_id: string | null
  quantity: number
  aquarium_config: Record<string, unknown>
  total_price: number
  deposit_amount: number
  balance: number
  status: ApartadoStatus
  expires_at: string
  created_by: string | null
  cancelled_by: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  production_order_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ApartadoAlert {
  id: string
  apartado_id: string
  alert_type: AlertType
  resolved: boolean
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  apartado?: Apartado
}

export interface CreateApartadoInput {
  user_id?: string
  customer_name: string
  customer_email?: string
  customer_phone: string
  item_type: ApartadoItemType
  product_id?: string
  animal_id?: string
  quantity?: number        // default: 1
  aquarium_config?: Record<string, unknown>
  total_price: number
  deposit_amount: number
  expires_days?: number   // días hasta vencimiento (default: 7)
  created_by?: string
  notes?: string
}

export type ApartadoPaymentMethod = 'efectivo' | 'tarjeta' | 'credito' | 'mixto'

export interface ApartadoPayment {
  id: string
  apartado_id: string
  amount: number
  payment_method: ApartadoPaymentMethod
  received_by: string | null
  notes: string | null
  created_at: string
}

// ─── Labels ───────────────────────────────────────────────────────────────────

export const APARTADO_STATUS_LABELS: Record<ApartadoStatus, string> = {
  activo: 'Activo',
  pagado: 'Pagado',
  cancelado: 'Cancelado',
  vencido: 'Vencido',
}

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  vencimiento_3dias: 'Vence en 3 días',
  vencimiento_1dia: 'Vence mañana',
  vencido: 'Vencido',
  cancelado: 'Cancelado',
}

export const ALERT_URGENCY: Record<AlertType, 'low' | 'medium' | 'high'> = {
  vencimiento_3dias: 'low',
  vencimiento_1dia: 'medium',
  vencido: 'high',
  cancelado: 'low',
}

// ─── Crear apartado ───────────────────────────────────────────────────────────

export async function crearApartado(input: CreateApartadoInput): Promise<Apartado> {
  const supabase = createAdminClient()

  const expires_at = new Date()
  expires_at.setDate(expires_at.getDate() + (input.expires_days ?? 7))

  const { data, error } = await supabase
    .from('apartados')
    .insert([{
      user_id: input.user_id ?? null,
      customer_name: input.customer_name,
      customer_email: input.customer_email ?? null,
      customer_phone: input.customer_phone,
      item_type: input.item_type,
      product_id: input.product_id ?? null,
      animal_id: input.animal_id ?? null,
      quantity: input.quantity ?? 1,
      aquarium_config: input.aquarium_config ?? {},
      total_price: input.total_price,
      deposit_amount: input.deposit_amount,
      status: 'activo',
      expires_at: expires_at.toISOString(),
      created_by: input.created_by ?? null,
      notes: input.notes ?? null,
    }])
    .select()
    .single()

  // El trigger reserve_inventory_for_apartado (AFTER INSERT, con bloqueo de fila)
  // descuenta el inventario de forma atómica y lanza una excepción si no hay
  // stock suficiente, que Supabase devuelve acá como `error`.
  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  return data as Apartado
}

// ─── Cancelar apartado (libera inventario vía trigger) ────────────────────────

export async function cancelarApartado(
  apartadoId: string,
  cancelledBy: string,
  reason: string,
): Promise<{ error: string | null }> {
  const supabase = createAdminClient()

  // Verificar que el apartado esté activo
  const { data: apartado, error: fetchError } = await supabase
    .from('apartados')
    .select('id, status')
    .eq('id', apartadoId)
    .single()

  if (fetchError || !apartado) return { error: 'Apartado no encontrado.' }
  if (apartado.status !== 'activo') {
    return { error: `El apartado ya está en estado "${APARTADO_STATUS_LABELS[apartado.status as ApartadoStatus]}".` }
  }

  // El trigger handle_apartado_cancellation en la BD se encarga de:
  // 1. Liberar el inventario
  // 2. Insertar la alerta de 'cancelado'
  const { error } = await supabase
    .from('apartados')
    .update({
      status: 'cancelado',
      cancelled_by: cancelledBy,
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', apartadoId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { error: null }
}

// ─── Registrar pago parcial (abono al anticipo) ────────────────────────────────

export async function registrarPagoApartado(
  apartadoId: string,
  amount: number,
  paymentMethod: ApartadoPaymentMethod,
  receivedBy: string,
  notes?: string,
): Promise<{ error: string | null; balance: number | null; status: ApartadoStatus | null }> {
  const supabase = createAdminClient()

  if (amount <= 0) {
    return { error: 'El monto del abono debe ser mayor a cero.', balance: null, status: null }
  }

  const { data: apartado, error: fetchError } = await supabase
    .from('apartados')
    .select('id, status, total_price, deposit_amount, balance')
    .eq('id', apartadoId)
    .single()

  if (fetchError || !apartado) {
    return { error: 'Apartado no encontrado.', balance: null, status: null }
  }

  if (apartado.status !== 'activo') {
    return {
      error: `El apartado ya está en estado "${APARTADO_STATUS_LABELS[apartado.status as ApartadoStatus]}".`,
      balance: null,
      status: null,
    }
  }

  if (amount > apartado.balance) {
    return { error: 'El abono no puede ser mayor al saldo pendiente.', balance: null, status: null }
  }

  const { error: paymentError } = await supabase.from('apartado_payments').insert({
    apartado_id: apartadoId,
    amount,
    payment_method: paymentMethod,
    received_by: receivedBy,
    notes: notes ?? null,
  })

  if (paymentError) {
    return { error: paymentError.message, balance: null, status: null }
  }

  const newDepositAmount = Number(apartado.deposit_amount) + amount
  const newBalance = Number(apartado.total_price) - newDepositAmount
  const newStatus: ApartadoStatus = newBalance <= 0 ? 'pagado' : 'activo'

  const { error: updateError } = await supabase
    .from('apartados')
    .update({ deposit_amount: newDepositAmount, status: newStatus })
    .eq('id', apartadoId)

  if (updateError) {
    return { error: updateError.message, balance: null, status: null }
  }

  revalidatePath('/admin')
  return { error: null, balance: Math.max(newBalance, 0), status: newStatus }
}

// ─── Confirmar pago completo (activa la creación de production_order) ─────────

export async function confirmarPagoApartado(
  apartadoId: string,
): Promise<{ error: string | null; production_order_id: string | null }> {
  const supabase = createAdminClient()

  // El trigger create_production_from_apartado crea la production_order
  // automáticamente cuando el status cambia a 'pagado' y item_type es pecera_*
  const { data, error } = await supabase
    .from('apartados')
    .update({
      status: 'pagado',
      updated_at: new Date().toISOString(),
    })
    .eq('id', apartadoId)
    .select('production_order_id')
    .single()

  if (error) return { error: error.message, production_order_id: null }

  revalidatePath('/admin')
  return { error: null, production_order_id: data?.production_order_id ?? null }
}

// ─── Listar apartados ─────────────────────────────────────────────────────────

export async function listarApartados(params?: {
  status?: ApartadoStatus
  buscar?: string
}): Promise<Apartado[]> {
  const supabase = createAdminClient()

  let query = supabase
    .from('apartados')
    .select('*')
    .order('created_at', { ascending: false })

  if (params?.status) query = query.eq('status', params.status)
  if (params?.buscar) {
    query = query.or(
      `apartado_number.ilike.%${params.buscar}%,customer_name.ilike.%${params.buscar}%,customer_phone.ilike.%${params.buscar}%`,
    )
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data as Apartado[]
}

// ─── Listar alertas pendientes ────────────────────────────────────────────────

export async function listarAlertasPendientes(): Promise<ApartadoAlert[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('apartado_alerts')
    .select('*, apartado:apartados(*)')
    .eq('resolved', false)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as ApartadoAlert[]
}

// ─── Resolver alerta ──────────────────────────────────────────────────────────

export async function resolverAlerta(
  alertId: string,
  resolvedBy: string,
): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('apartado_alerts')
    .update({
      resolved: true,
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', alertId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

// ─── Disparar generación de alertas manualmente (llamar desde cron) ──────────

export async function generarAlertasVencimiento(): Promise<number> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('generate_apartado_alerts')
  if (error) throw new Error(error.message)
  return data as number
}
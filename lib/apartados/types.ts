// lib/apartados/types.ts
// Tipos y constantes del módulo de Apartados.
// Separado de actions.ts porque un archivo 'use server' solo puede
// exportar funciones async (Next.js rechaza exportar objetos/tipos ahí).

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

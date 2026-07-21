export type ReturnRequestStatus = 'pendiente' | 'aprobada' | 'rechazada'
export type ReturnReason = 'no_satisfecho' | 'producto_danado' | 'producto_incorrecto' | 'otro'

export interface CustomerReturnRequest {
  id: string
  order_id: string
  order_item_id: string | null
  reason: ReturnReason
  details: string
  status: ReturnRequestStatus
  requested_amount: number
  admin_notes: string | null
  created_at: string
  updated_at: string
}

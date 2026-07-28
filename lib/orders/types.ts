export type CustomerOrderItem = {
  id: string
  name: string
  sku: string | null
  quantity: number
  unit_price?: number | null
  total?: number | null
}

export type CustomerOrder = {
  id: string
  order_number: string
  status: string
  payment_status: string
  total: number
  notes: string | null
  source: string | null
  created_at: string
  updated_at: string
  order_items: CustomerOrderItem[]
}

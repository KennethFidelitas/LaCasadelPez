import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { CustomerOrder } from './types'

const CUSTOMER_ORDER_SELECT = `
  id,
  order_number,
  status,
  payment_status,
  total,
  notes,
  source,
  created_at,
  updated_at,
  order_items(id, name, sku, quantity, unit_price, total)
`

export async function getCustomerOrders(userId: string, limit?: number): Promise<CustomerOrder[]> {
  const supabase = await createClient()
  let query = supabase
    .from('orders')
    .select(CUSTOMER_ORDER_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return (data ?? []) as unknown as CustomerOrder[]
}

export async function getCustomerOrderById(
  userId: string,
  orderId: string,
): Promise<CustomerOrder | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select(CUSTOMER_ORDER_SELECT)
    .eq('id', orderId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as unknown as CustomerOrder | null
}

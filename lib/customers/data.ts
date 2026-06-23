import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { CustomerContactRecord } from '@/lib/customers/types'

export async function getCustomerContacts(): Promise<CustomerContactRecord[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customer_contacts')
    .select('id, first_name, last_name, email, phone, notes, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((customer) => {
    const firstName = customer.first_name ?? ''
    const lastName = customer.last_name ?? ''

    return {
      id: customer.id,
      firstName,
      lastName,
      fullName: [firstName, lastName].filter(Boolean).join(' ').trim() || 'Cliente sin nombre',
      email: customer.email ?? '',
      phone: customer.phone ?? '',
      notes: customer.notes ?? '',
      createdAt: customer.created_at,
    }
  })
}

'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireStaffUser } from '@/lib/auth/session'
import type { ProductionOrder } from '@/lib/types'
import { ordenProduccionSchema } from './schemas'
import { crearReporteOrdenesProduccion } from './report'

export async function listarOrdenes(params?: {
  status?: string
  payment_status?: string
  buscar?: string
}) {
  const supabase = createAdminClient()

  let query = supabase
    .from('production_orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (params?.status) {
    query = query.eq('status', params.status)
  }
  if (params?.payment_status) {
    query = query.eq('payment_status', params.payment_status)
  }
  if (params?.buscar) {
    query = query.or(
      `order_number.ilike.%${params.buscar}%,customer_name.ilike.%${params.buscar}%`,
    )
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function obtenerReporteOrdenesProduccion() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('production_orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return crearReporteOrdenesProduccion((data ?? []) as ProductionOrder[])
}

export async function obtenerOrden(id: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('production_orders')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function crearOrden(input: unknown) {
  await requireStaffUser('/dashboard/ordenes-produccion/nueva')
  const values = ordenProduccionSchema.parse(input)
  const supabase = createAdminClient()
  // order_number es auto-generado por trigger
  const { data, error } = await supabase
    .from('production_orders')
    .insert(values)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/ordenes-produccion')
  return data
}

export async function actualizarOrden(id: string, input: unknown) {
  await requireStaffUser('/dashboard/ordenes-produccion')
  const values = ordenProduccionSchema.parse(input)
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('production_orders')
    .update(values)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/ordenes-produccion')
  revalidatePath(`/dashboard/ordenes-produccion/${id}`)
  return data
}

export async function eliminarOrden(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('production_orders')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/ordenes-produccion')
}

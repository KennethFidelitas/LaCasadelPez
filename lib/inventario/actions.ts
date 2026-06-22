'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { RegistroEntradaValues } from './schemas'

export async function registrarEntradaAnimal(values: RegistroEntradaValues) {
  const supabase = createAdminClient()

  // 1. Obtener el stock actual del animal
  const { data: inventario, error: errorInventario } = await supabase
    .from('inventory')
    .select('id, quantity')
    .eq('animal_id', values.animal_id)
    .single()

  if (errorInventario) {
    throw new Error(`No se encontró el inventario del animal: ${errorInventario.message}`)
  }

  // 2. Registrar la entrada en inventory_entries
  const { error: errorEntrada } = await supabase.from('inventory_entries').insert({
    animal_id: values.animal_id,
    quantity: values.quantity,
    purchase_price: values.purchase_price,
    supplier: values.supplier ?? null,
    entry_date: values.entry_date,
    notes: values.notes ?? null,
  })

  if (errorEntrada) {
    throw new Error(`Error al registrar la entrada: ${errorEntrada.message}`)
  }

  // 3. Sumar la cantidad al stock actual en inventory
  const { error: errorUpdate } = await supabase
    .from('inventory')
    .update({ quantity: inventario.quantity + values.quantity })
    .eq('id', inventario.id)

  if (errorUpdate) {
    throw new Error(`Error al actualizar el stock: ${errorUpdate.message}`)
  }

  revalidatePath('/inventario/agregar-animal')
  revalidatePath('/inventario/consultar-animales')
}

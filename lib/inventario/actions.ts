'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { type RegistroEntradaValues, type RegistroMuerteValues } from './schemas'

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

// ─── RF-INV-006: Registrar muerte de animales ─────────────────────────────────

export async function registrarMuerteAnimal(
  data: RegistroMuerteValues,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // 1. Obtener usuario autenticado
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()

    // 2. Obtener stock actual del animal
    const { data: inventario, error: errorInventario } = await supabase
      .from('inventory')
      .select('id, quantity')
      .eq('animal_id', data.animal_id)
      .single()

    if (errorInventario) {
      return { success: false, error: 'No se encontró el inventario del animal.' }
    }

    // 3. Validar que la cantidad no supere el stock actual
    if (data.quantity > inventario.quantity) {
      return {
        success: false,
        error: `La cantidad ingresada (${data.quantity}) supera el stock actual (${inventario.quantity}).`,
      }
    }

    // 4. Registrar en animal_mortality
    const { error: errorMuerte } = await supabase.from('animal_mortality').insert({
      animal_id: data.animal_id,
      quantity: data.quantity,
      reason: data.reason,
      notes: data.notes ?? null,
      recorded_by: user?.id ?? null,
      recorded_at: data.recorded_at,
    })

    if (errorMuerte) {
      return { success: false, error: `Error al registrar la baja: ${errorMuerte.message}` }
    }

    // 5. Restar la cantidad del stock en inventory
    const { error: errorUpdate } = await supabase
      .from('inventory')
      .update({ quantity: inventario.quantity - data.quantity })
      .eq('id', inventario.id)

    if (errorUpdate) {
      return { success: false, error: `Error al actualizar el stock: ${errorUpdate.message}` }
    }

    // 6. Revalidar rutas afectadas
    revalidatePath('/inventario/consultar-animales')
    revalidatePath('/inventario/registro-muerte')

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return { success: false, error: message }
  }
}



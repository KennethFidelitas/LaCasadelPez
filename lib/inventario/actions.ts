'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { type EntradaItemValues, type RegistroMuerteValues, type SalidaProductoValues } from './schemas'

export type RegistrarEntradaInventarioInput = EntradaItemValues & {
  itemType: 'animal' | 'product'
  itemId: string
}

// Reemplaza a la antigua registrarEntradaAnimal (animal-only). Genérica para
// animal_id o product_id — inventory e inventory_entries soportan ambos
// (ver scripts/001_core_schema.sql y scripts/011_inventory_entries_product_support.sql).
export async function registrarEntradaInventario(input: RegistrarEntradaInventarioInput) {
  const supabase = createAdminClient()
  const idColumn = input.itemType === 'animal' ? 'animal_id' : 'product_id'

  // 0. Usuario autenticado, para registered_by (trazabilidad contable)
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  // 1. Obtener el stock actual del ítem
  const { data: inventario, error: errorInventario } = await supabase
    .from('inventory')
    .select('id, quantity')
    .eq(idColumn, input.itemId)
    .single()

  if (errorInventario) {
    throw new Error(`No se encontró el inventario: ${errorInventario.message}`)
  }

  // 2. Registrar la entrada en inventory_entries
  const { data: entradaInsertada, error: errorEntrada } = await supabase
    .from('inventory_entries')
    .insert({
      [idColumn]: input.itemId,
      entry_type: 'entrada',
      quantity: input.quantity,
      purchase_price: input.purchase_price,
      supplier: input.supplier ?? null,
      entry_date: input.entry_date,
      notes: input.notes ?? null,
      registered_by: user?.id ?? null,
    })
    .select('id')
    .single()

  if (errorEntrada || !entradaInsertada) {
    throw new Error(`Error al registrar la entrada: ${errorEntrada?.message}`)
  }

  // 3. Sumar la cantidad al stock actual en inventory.
  //    No hay transacción real (no existe un RPC en Postgres para esto todavía;
  //    sería la forma correcta de garantizar atomicidad real). Como mitigación,
  //    si este update falla se revierte manualmente la entrada recién insertada
  //    para no dejar un movimiento huérfano que no sumó stock.
  const { error: errorUpdate } = await supabase
    .from('inventory')
    .update({ quantity: inventario.quantity + input.quantity })
    .eq('id', inventario.id)

  if (errorUpdate) {
    await supabase.from('inventory_entries').delete().eq('id', entradaInsertada.id)
    throw new Error(`Error al actualizar el stock (la entrada fue revertida): ${errorUpdate.message}`)
  }

  if (input.itemType === 'animal') {
    revalidatePath('/inventario/agregar-animal')
    revalidatePath('/inventario/consultar-animales')
  }
  // No hay páginas de producto todavía (formularios de alta/edición de
  // producto quedaron para un paso posterior) — nada más que revalidar.
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

// ─── Salida de productos ──────────────────────────────────────────────────────
// Equivalente de registrarMuerteAnimal para productos, pero sin evento
// biológico: se registra como movimiento en inventory_entries con
// entry_type='salida' (scripts/012_inventory_entries_tipo_movimiento.sql),
// no en animal_mortality.

export async function registrarSalidaProducto(
  data: SalidaProductoValues & { productId: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // 1. Obtener usuario autenticado
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()

    // 2. Obtener stock actual del producto
    const { data: inventario, error: errorInventario } = await supabase
      .from('inventory')
      .select('id, quantity')
      .eq('product_id', data.productId)
      .single()

    if (errorInventario) {
      return { success: false, error: 'No se encontró el inventario del producto.' }
    }

    // 3. Validar que la cantidad no supere el stock actual
    if (data.quantity > inventario.quantity) {
      return {
        success: false,
        error: `La cantidad ingresada (${data.quantity}) supera el stock actual (${inventario.quantity}).`,
      }
    }

    // 4. Registrar la salida en inventory_entries
    const { data: salidaInsertada, error: errorSalida } = await supabase
      .from('inventory_entries')
      .insert({
        product_id: data.productId,
        entry_type: 'salida',
        quantity: data.quantity,
        entry_date: data.recorded_at,
        reason: data.reason,
        notes: data.notes ?? null,
        registered_by: user?.id ?? null,
      })
      .select('id')
      .single()

    if (errorSalida || !salidaInsertada) {
      return { success: false, error: `Error al registrar la salida: ${errorSalida?.message}` }
    }

    // 5. Restar la cantidad del stock en inventory.
    //    Misma mitigación de atomicidad que registrarEntradaInventario: si el
    //    update falla, se revierte la salida recién insertada.
    const { error: errorUpdate } = await supabase
      .from('inventory')
      .update({ quantity: inventario.quantity - data.quantity })
      .eq('id', inventario.id)

    if (errorUpdate) {
      await supabase.from('inventory_entries').delete().eq('id', salidaInsertada.id)
      return { success: false, error: `Error al actualizar el stock (la salida fue revertida): ${errorUpdate.message}` }
    }

    // No hay páginas de producto todavía — nada más que revalidar.

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return { success: false, error: message }
  }
}


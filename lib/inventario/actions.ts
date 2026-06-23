'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { CAUSA_MUERTE_LABELS, CAUSAS_MUERTE, type RegistroEntradaValues, type RegistroMuerteValues } from './schemas'
import type { MuerteConAnimal } from '@/lib/types'

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
    revalidatePath('/inventario/historial-muertes')
    revalidatePath('/inventario/estadisticas-mortalidad')

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

// ─── RF-INV-007: Historial de muertes de animales ─────────────────────────────

export async function getHistorialMuertes(filtros: {
  fechaInicio?: string
  fechaFin?: string
  nombreAnimal?: string
  causa?: string
  page?: number
}): Promise<{ data: MuerteConAnimal[]; total: number }> {
  const supabase = createAdminClient()
  const PAGE_SIZE = 20
  const page = filtros.page ?? 1
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // Resolver IDs si hay búsqueda por nombre de animal
  let animalIds: string[] | null = null
  if (filtros.nombreAnimal) {
    const { data: animales } = await supabase
      .from('animals')
      .select('id')
      .ilike('name', `%${filtros.nombreAnimal}%`)

    animalIds = (animales ?? []).map((a) => a.id)

    if (animalIds.length === 0) {
      return { data: [], total: 0 }
    }
  }

  let query = supabase
    .from('animal_mortality')
    .select('*, animals(name, scientific_name)', { count: 'exact' })
    .order('recorded_at', { ascending: false })
    .range(from, to)

  if (filtros.fechaInicio) {
    query = query.gte('recorded_at', filtros.fechaInicio)
  }
  if (filtros.fechaFin) {
    query = query.lte('recorded_at', `${filtros.fechaFin}T23:59:59`)
  }
  if (filtros.causa) {
    query = query.eq('reason', filtros.causa)
  }
  if (animalIds !== null) {
    query = query.in('animal_id', animalIds)
  }

  const { data, count, error } = await query

  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as MuerteConAnimal[],
    total: count ?? 0,
  }
}

// ─── RF-INV-008: Estadísticas de mortalidad ───────────────────────────────────

export interface EstadisticasMortalidad {
  totalRegistros: number
  totalAnimales: number
  porCausa: { causa: string; etiqueta: string; cantidad: number }[]
  porMes: { mes: string; cantidad: number }[]
  topAnimales: { nombre: string; cantidad: number }[]
}

export async function getEstadisticasMortalidad(filtros?: {
  fechaInicio?: string
  fechaFin?: string
}): Promise<EstadisticasMortalidad> {
  const supabase = createAdminClient()

  // Rango por defecto: últimos 12 meses completos
  const hoy = new Date()
  const fechaFin = filtros?.fechaFin ?? hoy.toLocaleDateString('en-CA')
  const inicioDefault = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1)
  const fechaInicio = filtros?.fechaInicio ?? inicioDefault.toLocaleDateString('en-CA')

  const { data, error } = await supabase
    .from('animal_mortality')
    .select('quantity, reason, recorded_at, animals(name)')
    .gte('recorded_at', fechaInicio)
    .lte('recorded_at', `${fechaFin}T23:59:59`)
    .order('recorded_at', { ascending: true })

  if (error) throw new Error(error.message)

  type Registro = {
    quantity: number
    reason: string
    recorded_at: string | null
    animals: { name: string } | null
  }

  const registros = (data ?? []) as Registro[]

  // Totales
  const totalRegistros = registros.length
  const totalAnimales = registros.reduce((sum, r) => sum + r.quantity, 0)

  // Por causa — ordenado por cantidad descendente
  const causaMap = new Map<string, number>()
  for (const r of registros) {
    causaMap.set(r.reason, (causaMap.get(r.reason) ?? 0) + r.quantity)
  }
  const porCausa = Array.from(causaMap.entries())
    .map(([causa, cantidad]) => ({
      causa,
      etiqueta: CAUSA_MUERTE_LABELS[causa as typeof CAUSAS_MUERTE[number]] ?? causa,
      cantidad,
    }))
    .sort((a, b) => b.cantidad - a.cantidad)

  // Por mes — genera todos los meses del rango aunque tengan 0
  const mesMap = new Map<string, number>()
  for (const r of registros) {
    if (!r.recorded_at) continue
    const clave = r.recorded_at.slice(0, 7) // YYYY-MM
    mesMap.set(clave, (mesMap.get(clave) ?? 0) + r.quantity)
  }
  const porMes = generarMeses(fechaInicio, fechaFin).map(({ clave, etiqueta }) => ({
    mes: etiqueta,
    cantidad: mesMap.get(clave) ?? 0,
  }))

  // Top 5 animales con más bajas
  const animalMap = new Map<string, number>()
  for (const r of registros) {
    const nombre = r.animals?.name ?? 'Desconocido'
    animalMap.set(nombre, (animalMap.get(nombre) ?? 0) + r.quantity)
  }
  const topAnimales = Array.from(animalMap.entries())
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5)

  return { totalRegistros, totalAnimales, porCausa, porMes, topAnimales }
}

const MESES_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

function generarMeses(
  fechaInicio: string,
  fechaFin: string,
): { clave: string; etiqueta: string }[] {
  const meses: { clave: string; etiqueta: string }[] = []

  // T00:00:00 fuerza interpretación local (evita desfase UTC)
  const ini = new Date(fechaInicio + 'T00:00:00')
  const fin = new Date(fechaFin + 'T00:00:00')

  const cursor = new Date(ini.getFullYear(), ini.getMonth(), 1)
  const limite = new Date(fin.getFullYear(), fin.getMonth(), 1)

  while (cursor <= limite) {
    const año = cursor.getFullYear()
    const mes = cursor.getMonth()
    meses.push({
      clave: `${año}-${String(mes + 1).padStart(2, '0')}`,
      etiqueta: `${MESES_ES[mes]} ${año}`,
    })
    cursor.setMonth(mes + 1)
  }

  return meses
}

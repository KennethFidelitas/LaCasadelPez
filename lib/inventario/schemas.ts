import { z } from 'zod'

export const UBICACIONES = [
  'Bodega A',
  'Bodega B',
  'Area viva',
  'Mostrador',
] as const

export const UBICACION_LABELS: Record<typeof UBICACIONES[number], string> = {
  'Bodega A': 'Bodega A',
  'Bodega B': 'Bodega B',
  'Area viva': 'Área viva',
  'Mostrador': 'Mostrador',
}

export const registroEntradaSchema = z.object({
  animal_id: z.string().uuid('Debe seleccionar un animal válido'),
  quantity: z.coerce
    .number({ invalid_type_error: 'Ingrese una cantidad válida' })
    .int('La cantidad debe ser un número entero')
    .positive('La cantidad debe ser mayor a 0'),
  purchase_price: z.coerce
    .number({ invalid_type_error: 'Ingrese un costo válido' })
    .min(0, 'El costo no puede ser negativo'),
  supplier: z.string().max(200).nullable().optional(),
  entry_date: z.string().min(1, 'La fecha es requerida'),
  notes: z.string().max(1000).nullable().optional(),
})

export type RegistroEntradaValues = z.infer<typeof registroEntradaSchema>

// ─── Entrada genérica (modal "Ajustar stock") ─────────────────────────────────
// Mismos campos/validación que registroEntradaSchema, sin animal_id: el modal
// ya conoce el id del ítem (animal o producto) por props, no lo pide en el form.

export const entradaItemSchema = registroEntradaSchema.omit({ animal_id: true })

export type EntradaItemValues = z.infer<typeof entradaItemSchema>

// ─── RF-INV-006: Registro de muerte de animales ───────────────────────────────

export const CAUSAS_MUERTE = [
  'enfermedad',
  'transporte',
  'pelea',
  'condiciones_agua',
  'edad',
  'desconocido',
  'otro',
] as const

export const CAUSA_MUERTE_LABELS: Record<typeof CAUSAS_MUERTE[number], string> = {
  enfermedad: 'Enfermedad',
  transporte: 'Transporte / traslado',
  pelea: 'Pelea entre animales',
  condiciones_agua: 'Condiciones del agua',
  edad: 'Muerte por edad',
  desconocido: 'Causa desconocida',
  otro: 'Otro',
}

export const registroMuerteSchema = z.object({
  animal_id: z.string().uuid({ message: 'Selecciona un animal válido' }),
  quantity: z.coerce
    .number({ invalid_type_error: 'Ingresa una cantidad' })
    .int()
    .min(1, 'La cantidad mínima es 1'),
  recorded_at: z.string({ required_error: 'La fecha es requerida' }).min(1, 'La fecha es requerida'),
  reason: z.enum(CAUSAS_MUERTE, { required_error: 'Selecciona una causa' }),
  notes: z.string().max(1000).optional(),
})

export type RegistroMuerteValues = z.infer<typeof registroMuerteSchema>

// ─── Salida de productos (modal "Ajustar stock") ──────────────────────────────
// Equivalente a registroMuerteSchema pero para productos: no hay evento
// biológico (no usa animal_mortality), se registra como movimiento en
// inventory_entries con entry_type='salida' (scripts/012_...).

export const MOTIVOS_SALIDA_PRODUCTO = [
  'danado',
  'vencido',
  'extraviado',
  'devolucion_proveedor',
  'uso_interno',
  'ajuste_conteo',
] as const

export const MOTIVO_SALIDA_PRODUCTO_LABELS: Record<typeof MOTIVOS_SALIDA_PRODUCTO[number], string> = {
  danado: 'Dañado',
  vencido: 'Vencido',
  extraviado: 'Extraviado',
  devolucion_proveedor: 'Devolución a proveedor',
  uso_interno: 'Uso interno',
  ajuste_conteo: 'Ajuste de conteo',
}

export const salidaProductoSchema = z.object({
  quantity: z.coerce
    .number({ invalid_type_error: 'Ingresa una cantidad' })
    .int()
    .positive('La cantidad debe ser mayor a 0'),
  recorded_at: z.string({ required_error: 'La fecha es requerida' }).min(1, 'La fecha es requerida'),
  reason: z.enum(MOTIVOS_SALIDA_PRODUCTO, { required_error: 'Selecciona un motivo' }),
  notes: z.string().max(1000).optional(),
})

export type SalidaProductoValues = z.infer<typeof salidaProductoSchema>

// Nota: "no mayor al stock" no se valida acá (el stock disponible es dinámico
// por ítem, no algo que el schema estático pueda conocer) — se valida igual
// que en registroMuerteSchema/registrarMuerteAnimal: guardia en el cliente
// (dialogo-ajuste-stock.tsx) + validación server-side en registrarSalidaProducto.

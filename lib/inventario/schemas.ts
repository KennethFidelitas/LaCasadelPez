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

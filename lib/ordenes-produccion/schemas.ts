import { z } from 'zod'

export const PRODUCTION_STATUSES = [
  'cotizado',
  'confirmado',
  'en_produccion',
  'listo',
  'entregado',
  'cancelado',
] as const

export const PAYMENT_STATUSES = [
  'pendiente',
  'anticipo',
  'pagado',
  'reembolsado',
] as const

export const STATUS_LABELS: Record<typeof PRODUCTION_STATUSES[number], string> = {
  cotizado: 'Cotizado',
  confirmado: 'Confirmado',
  en_produccion: 'En producción',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export const PAYMENT_LABELS: Record<typeof PAYMENT_STATUSES[number], string> = {
  pendiente: 'Pendiente',
  anticipo: 'Anticipo',
  pagado: 'Pagado',
  reembolsado: 'Reembolsado',
}

export const ordenProduccionSchema = z.object({
  status: z.enum(PRODUCTION_STATUSES).default('cotizado'),
  payment_status: z.enum(PAYMENT_STATUSES).default('pendiente'),
  // Dimensiones (cm) — opcionales
  width: z.coerce.number().positive('Debe ser mayor a 0').nullable().optional(),
  height: z.coerce.number().positive('Debe ser mayor a 0').nullable().optional(),
  depth: z.coerce.number().positive('Debe ser mayor a 0').nullable().optional(),
  glass_type: z.string().max(100).nullable().optional(),
  glass_thickness: z.coerce.number().positive().nullable().optional(),
  // Desglose de precios
  materials_cost: z.coerce.number().min(0, 'No puede ser negativo').default(0),
  labor_cost: z.coerce.number().min(0, 'No puede ser negativo').default(0),
  accessories_cost: z.coerce.number().min(0, 'No puede ser negativo').default(0),
  subtotal: z.coerce.number().min(0, 'No puede ser negativo'),
  discount: z.coerce.number().min(0, 'No puede ser negativo').default(0),
  total: z.coerce.number().min(0, 'No puede ser negativo'),
  deposit_paid: z.coerce.number().min(0, 'No puede ser negativo').default(0),
  // Tiempos
  estimated_days: z.coerce.number().int().positive().nullable().optional(),
  // Contacto — customer_name es el único obligatorio
  customer_name: z.string().min(1, 'El nombre del cliente es requerido').max(200),
  customer_email: z
    .string()
    .email('Email inválido')
    .or(z.literal(''))
    .nullable()
    .optional(),
  customer_phone: z.string().max(50).nullable().optional(),
  // Notas
  notes: z.string().nullable().optional(),
  internal_notes: z.string().nullable().optional(),
})

export type OrdenProduccionValues = z.infer<typeof ordenProduccionSchema>

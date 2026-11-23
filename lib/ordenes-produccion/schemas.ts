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

const optionalDimension = z.literal('').transform(() => null)
  .or(z.coerce.number().finite().positive('Debe ser mayor a 0').nullable())
  .optional()

const money = z.coerce.number().finite('Ingresá un monto válido').min(0, 'No puede ser negativo').default(0)

export function calcularTotalesOrden(materiales: unknown, manoDeObra: unknown, accesorios: unknown, descuento: unknown) {
  const cents = (value: unknown) => Math.round((Number(value) || 0) * 100)
  const subtotal = cents(materiales) + cents(manoDeObra) + cents(accesorios)
  return { subtotal: subtotal / 100, total: Math.max(0, subtotal - cents(descuento)) / 100 }
}

export const ordenProduccionSchema = z.object({
  status: z.enum(PRODUCTION_STATUSES).default('cotizado'),
  payment_status: z.enum(PAYMENT_STATUSES).default('pendiente'),
  // Dimensiones (cm) — opcionales
  width: optionalDimension,
  height: optionalDimension,
  depth: optionalDimension,
  glass_type: z.string().max(100).nullable().optional(),
  glass_thickness: optionalDimension,
  // Desglose de precios
  materials_cost: money,
  labor_cost: money,
  accessories_cost: money,
  discount: money,
  deposit_paid: money,
  // Tiempos
  estimated_days: z.literal('').transform(() => null)
    .or(z.coerce.number().int().positive('Ingresá un número entero mayor a 0').nullable())
    .optional(),
  // Contacto — customer_name es el único obligatorio
  customer_name: z.string().trim().min(1, 'El nombre del cliente es requerido').max(200),
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
}).transform((values, ctx) => {
  const { subtotal, total } = calcularTotalesOrden(
    values.materials_cost,
    values.labor_cost,
    values.accessories_cost,
    values.discount,
  )
  if (values.discount > subtotal) {
    ctx.addIssue({ code: 'custom', path: ['discount'], message: 'El descuento no puede superar el subtotal.' })
  }
  if (values.deposit_paid > total) {
    ctx.addIssue({ code: 'custom', path: ['deposit_paid'], message: 'El anticipo no puede superar el total.' })
  }
  return { ...values, subtotal, total }
})

export type OrdenProduccionValues = z.infer<typeof ordenProduccionSchema>

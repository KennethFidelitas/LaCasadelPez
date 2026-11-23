import { z } from 'zod'

export const phoneSchema = z.string().trim().refine(
  (value) => value === '' || /^\+?\d{1,15}$/.test(value),
  'Ingresá un teléfono de hasta 15 dígitos. Podés usar + al inicio.',
)

'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const customerContactSchema = z
  .object({
    firstName: z.string().trim().min(1, 'El nombre es obligatorio.'),
    lastName: z.string().trim().optional().default(''),
    email: z.string().trim().email('Ingresa un correo válido.').optional().or(z.literal('')),
    phone: z.string().trim().optional().default(''),
    notes: z.string().trim().optional().default(''),
  })
  .superRefine((value, ctx) => {
    if (!value.email && !value.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debes registrar al menos correo o teléfono.',
        path: ['email'],
      })
    }
  })

export async function createCustomerContact(input: unknown) {
  const payload = customerContactSchema.parse(input)
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw new Error(userError.message)
  }

  if (!user) {
    throw new Error('Debes iniciar sesión para registrar clientes.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    throw new Error(profileError.message)
  }

  if (!profile || !['admin', 'employee'].includes(profile.role)) {
    throw new Error('Tu usuario no tiene permisos para registrar clientes.')
  }

  const { data, error } = await supabase
    .from('customer_contacts')
    .insert({
      first_name: payload.firstName,
      last_name: payload.lastName || null,
      email: payload.email || null,
      phone: payload.phone || null,
      notes: payload.notes || null,
      created_by: user.id,
    })
    .select('id, first_name, last_name, email, phone, notes, created_at')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return {
    id: data.id,
    firstName: data.first_name ?? '',
    lastName: data.last_name ?? '',
    fullName: [data.first_name, data.last_name].filter(Boolean).join(' ').trim(),
    email: data.email ?? '',
    phone: data.phone ?? '',
    notes: data.notes ?? '',
    createdAt: data.created_at,
  }
}

'use server'

import { randomBytes, randomInt } from 'crypto'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTemporaryPasswordEmail } from '@/lib/email/sender'

// Genera una contraseña temporal aleatoria y segura (12 caracteres,
// garantiza al menos una mayúscula, un número y un símbolo para pasar
// las políticas de contraseña por defecto de Supabase Auth).
function createTemporaryPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const symbols = '!@#$%*?'
  const all = upper + lower + digits + symbols

  const pick = (chars: string) => chars[randomInt(chars.length)]

  const required = [pick(upper), pick(lower), pick(digits), pick(symbols)]
  const rest = Array.from(randomBytes(8)).map((byte) => all[byte % all.length])

  const passwordChars = [...required, ...rest]
  // Mezclar (Fisher-Yates) para que los caracteres requeridos no queden siempre al inicio.
  for (let i = passwordChars.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1)
    ;[passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]]
  }

  return passwordChars.join('')
}

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

  let authUserId: string | null = null

  if (payload.email) {
    const customerEmail = payload.email.trim()
    // Una sola contraseña temporal: es la que se usa para crear/actualizar la
    // cuenta en Supabase Auth Y la que se envía por correo. Deben coincidir
    // siempre, o el cliente recibe credenciales que no funcionan para loguearse.
    const temporaryPassword = createTemporaryPassword()

    try {
      const adminSupabase = createAdminClient()
      const { data: existingUsers, error: listError } = await adminSupabase.auth.admin.listUsers()

      if (listError) {
        throw new Error(listError.message || 'No se pudo verificar la cuenta de autenticación del cliente.')
      }

      const existingAuthUser = existingUsers.users.find(
        (candidate) => candidate.email?.toLowerCase() === customerEmail.toLowerCase(),
      )

      if (existingAuthUser?.id) {
        // El usuario ya existe en Auth: le reseteamos la contraseña a la nueva
        // temporal para que el correo que reciba sea válido para loguearse.
        const { error: updateUserError } = await adminSupabase.auth.admin.updateUserById(
          existingAuthUser.id,
          { password: temporaryPassword },
        )

        if (updateUserError) {
          throw new Error(updateUserError.message || 'No se pudo actualizar la cuenta de autenticación del cliente.')
        }

        authUserId = existingAuthUser.id
      } else {
        const { data: createdUser, error: createUserError } = await adminSupabase.auth.admin.createUser({
          email: customerEmail,
          password: temporaryPassword,
          email_confirm: true,
          user_metadata: {
            first_name: payload.firstName,
            last_name: payload.lastName || '',
            phone: payload.phone || '',
            role: 'customer',
          },
        })

        if (createUserError || !createdUser.user?.id) {
          throw new Error(createUserError?.message || 'No se pudo crear la cuenta de autenticación del cliente.')
        }

        authUserId = createdUser.user.id
      }

      if (authUserId) {
        await adminSupabase.from('profiles').upsert({
          id: authUserId,
          email: customerEmail,
          first_name: payload.firstName,
          last_name: payload.lastName || null,
          phone: payload.phone || null,
          role: 'customer',
        }, { onConflict: 'id' })

        const emailResult = await sendTemporaryPasswordEmail({
          to: customerEmail,
          firstName: payload.firstName,
          temporaryPassword,
        })

        if (!emailResult.ok) {
          console.error('[createCustomerContact] Temporary password email failed:', emailResult.error)
        }
      }
    } catch (authError) {
      console.error('[createCustomerContact] Auth registration warning:', authError)
    }
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
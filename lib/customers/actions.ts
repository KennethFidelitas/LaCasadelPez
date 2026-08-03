'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTemporaryPasswordEmail } from '@/lib/email/sender'

function createTemporaryPassword(firstName: string, lastName: string) {
  const base = `${firstName}${lastName || 'temp'}`.toLowerCase().replace(/[^a-z0-9]/g, '')
  const suffix = Math.random().toString(36).slice(-6)
  return `${base.slice(0, 8)}A1!${suffix}`.slice(0, 16)
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
        authUserId = existingAuthUser.id
      } else {
        const temporaryPassword = createTemporaryPassword(payload.firstName, payload.lastName || '')
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

        const temporaryPassword = createTemporaryPassword(payload.firstName, payload.lastName || '')
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

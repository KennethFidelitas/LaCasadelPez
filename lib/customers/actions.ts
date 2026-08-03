'use server'

import { randomBytes, randomInt } from 'crypto'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTemporaryPasswordEmail } from '@/lib/email/sender'
import type { CustomerContactRecord } from '@/lib/customers/types'

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

// ── Resultado unificado, en la misma línea que lib/customers/create-access.ts ──
export type CreateCustomerContactResult =
  | { ok: true; customer: CustomerContactRecord; accountCreated: boolean; message: string }
  | {
      ok: false
      code: 'VALIDATION_ERROR' | 'PERMISSION_ERROR' | 'DUPLICATE_AUTH_USER' | 'SERVER_ERROR'
      message: string
    }

export async function createCustomerContact(input: unknown): Promise<CreateCustomerContactResult> {
  // ── Validación de formulario ──────────────────────────────────────────────
  const parsed = customerContactSchema.safeParse(input)

  if (!parsed.success) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: parsed.error.issues[0]?.message ?? 'Revisa los datos del formulario.',
    }
  }

  const payload = parsed.data
  const supabase = await createClient()

  // ── Sesión y permisos ────────────────────────────────────────────────────
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    return { ok: false, code: 'SERVER_ERROR', message: userError.message }
  }

  if (!user) {
    return {
      ok: false,
      code: 'PERMISSION_ERROR',
      message: 'Debes iniciar sesión para registrar clientes.',
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    return { ok: false, code: 'SERVER_ERROR', message: profileError.message }
  }

  if (!profile || !['admin', 'employee'].includes(profile.role)) {
    return {
      ok: false,
      code: 'PERMISSION_ERROR',
      message: 'Tu usuario no tiene permisos para registrar clientes.',
    }
  }

  let accountCreated = false

  if (payload.email) {
    const customerEmail = payload.email.trim()
    const adminSupabase = createAdminClient()

    // ── Verificar usuario duplicado ─────────────────────────────────────────
    // Buscamos primero si ya existe un usuario de Auth con ese correo. Si existe,
    // avisamos al admin en vez de resetear su contraseña o crear un duplicado.
    const { data: existingUsers, error: listError } = await adminSupabase.auth.admin.listUsers()

    if (listError) {
      return {
        ok: false,
        code: 'SERVER_ERROR',
        message: listError.message || 'No se pudo verificar la cuenta de autenticación del cliente.',
      }
    }

    const existingAuthUser = existingUsers.users.find(
      (candidate) => candidate.email?.toLowerCase() === customerEmail.toLowerCase(),
    )

    if (existingAuthUser) {
      return {
        ok: false,
        code: 'DUPLICATE_AUTH_USER',
        message: `Ya existe un usuario registrado con el correo ${customerEmail}. Usa la sección de clientes para ubicarlo en vez de crear uno nuevo.`,
      }
    }

    // ── Crear la cuenta de Auth + enviar la contraseña temporal ────────────
    const temporaryPassword = createTemporaryPassword()

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
      return {
        ok: false,
        code: 'SERVER_ERROR',
        message: createUserError?.message || 'No se pudo crear la cuenta de autenticación del cliente.',
      }
    }

    const authUserId = createdUser.user.id

    await adminSupabase.from('profiles').upsert(
      {
        id: authUserId,
        email: customerEmail,
        first_name: payload.firstName,
        last_name: payload.lastName || null,
        phone: payload.phone || null,
        role: 'customer',
      },
      { onConflict: 'id' },
    )

    const emailResult = await sendTemporaryPasswordEmail({
      to: customerEmail,
      firstName: payload.firstName,
      temporaryPassword,
    })

    if (!emailResult.ok) {
      console.error('[createCustomerContact] Temporary password email failed:', emailResult.error)
    }

    accountCreated = true
  }

  // ── Registrar el contacto ────────────────────────────────────────────────
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
    return { ok: false, code: 'SERVER_ERROR', message: error.message }
  }

  const customer: CustomerContactRecord = {
    id: data.id,
    firstName: data.first_name ?? '',
    lastName: data.last_name ?? '',
    fullName: [data.first_name, data.last_name].filter(Boolean).join(' ').trim(),
    email: data.email ?? '',
    phone: data.phone ?? '',
    notes: data.notes ?? '',
    createdAt: data.created_at,
  }

  return {
    ok: true,
    customer,
    accountCreated,
    message: accountCreated
      ? `Cliente ${customer.fullName} registrado y se le envió su contraseña temporal por correo.`
      : `Cliente ${customer.fullName} registrado correctamente.`,
  }
}

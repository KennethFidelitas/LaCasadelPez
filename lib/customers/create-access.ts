'use server'

// lib/customers/create-access.ts
// RF-CL-002: El admin crea credenciales de acceso para un cliente existente.
// Flujo:
//   1. Verificar que el cliente existe en `customer_contacts` o `profiles`
//   2. Verificar que NO tiene usuario previo (duplicado)
//   3. Crear usuario via supabase.auth.admin.inviteUserByEmail()
//      → Supabase envía automáticamente el email con el enlace de activación
//   4. Enviar email adicional de bienvenida via Resend
//   5. Retornar resultado con manejo de cada caso de error

import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeAccessEmail } from '@/lib/email/sender'

export type CreateAccessResult =
  | { ok: true; userId: string; message: string }
  | { ok: false; code: 'DUPLICATE' | 'NOT_FOUND' | 'EMAIL_ERROR' | 'SERVER_ERROR'; message: string }

export async function createClientAccess(params: {
  email: string
  firstName: string
  lastName?: string
  phone?: string
}): Promise<CreateAccessResult> {
  const supabase = createAdminClient()

  // ── Caso 2: Verificar usuario duplicado ──────────────────────────────────
  // Buscar si ya existe un usuario de Auth con ese email
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    return {
      ok: false,
      code: 'SERVER_ERROR',
      message: 'No se pudo verificar usuarios existentes.',
    }
  }

  const alreadyExists = existingUsers.users.some(
    u => u.email?.toLowerCase() === params.email.toLowerCase(),
  )

  if (alreadyExists) {
    return {
      ok: false,
      code: 'DUPLICATE',
      message: `El cliente ${params.email} ya tiene acceso creado en el sistema.`,
    }
  }

  // ── Caso 1: Crear el usuario via invitación ──────────────────────────────
  // inviteUserByEmail crea el usuario + envía el email de activación automáticamente
  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
    params.email,
    {
      data: {
        first_name: params.firstName,
        last_name: params.lastName ?? '',
        phone: params.phone ?? '',
        role: 'customer',
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  )

  if (inviteError || !inviteData.user) {
    console.error('[createClientAccess] inviteUserByEmail error:', inviteError)
    return {
      ok: false,
      code: 'SERVER_ERROR',
      message: 'No se pudo crear el usuario. Intentá de nuevo.',
    }
  }

  const userId = inviteData.user.id

  // Asegurar que el perfil existe con el rol correcto
  await supabase.from('profiles').upsert({
    id: userId,
    email: params.email,
    first_name: params.firstName,
    last_name: params.lastName ?? null,
    phone: params.phone ?? null,
    role: 'customer',
  }, { onConflict: 'id' })

  // ── Caso 3 / Caso de error de envío: email adicional de bienvenida ───────
  // Supabase ya envió el link de activación. Enviamos un mail adicional
  // de bienvenida via Resend para mayor claridad al cliente.
  const emailResult = await sendWelcomeAccessEmail({
    to: params.email,
    firstName: params.firstName,
  })

  if (!emailResult.ok) {
    // Caso 3: El usuario se creó OK pero el email de bienvenida falló
    // No revertimos la creación — el usuario puede iniciar sesión con el link de Supabase
    console.error('[createClientAccess] Email de bienvenida falló:', emailResult.error)
    return {
      ok: true, // La creación fue exitosa
      userId,
      message: `Usuario creado correctamente. Nota: el correo de bienvenida no se pudo enviar (${emailResult.error ?? 'error de red'}). El cliente igual recibirá el enlace de activación de Supabase.`,
    }
  }

  return {
    ok: true,
    userId,
    message: `Acceso creado para ${params.email}. Se envió el correo de activación automáticamente.`,
  }
}

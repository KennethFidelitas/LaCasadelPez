'use server'

import { z } from 'zod'
import { sendPasswordResetEmail } from '@/lib/email/sender'
import { getSiteUrl } from '@/lib/site-url'
import { createAdminClient } from '@/lib/supabase/admin'

const emailSchema = z.string().trim().email('Ingresá un correo válido.')
const confirmation = 'Si el correo está registrado, recibirás un enlace para crear una nueva contraseña.'

export async function requestPasswordReset(input: unknown): Promise<{ ok: boolean; message: string }> {
  const parsed = z.object({ email: emailSchema }).safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Ingresá un correo válido.' }
  }

  try {
    const email = parsed.data.email.toLowerCase()
    const supabase = createAdminClient()
    const { data, error } = await supabase.auth.admin.generateLink({ type: 'recovery', email })
    if (error) {
      if (error.code !== 'user_not_found') console.error('[Password reset] Error al generar el enlace:', error.code)
      return { ok: true, message: confirmation }
    }

    const resetUrl = new URL('/auth/reset-password', getSiteUrl())
    resetUrl.searchParams.set('token', data.properties.hashed_token)
    const result = await sendPasswordResetEmail({ to: email, resetUrl: resetUrl.toString() })
    if (!result.ok) console.error('[Password reset] Error de envío:', result.error)

    return { ok: true, message: confirmation }
  } catch (error) {
    console.error('[Password reset] Error inesperado:', error)
    return { ok: true, message: confirmation }
  }
}

'use server'

import { z } from 'zod'
import { verifyPasswordResetToken } from '@/lib/auth/password-reset-token'
import { createAdminClient } from '@/lib/supabase/admin'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'El enlace no es válido.'),
  password: z.string().min(6, 'Usá al menos 6 caracteres.'),
  confirmPassword: z.string().min(6, 'Confirmá la contraseña.'),
})

export type ResetPasswordResult =
  | { ok: true; message: string }
  | { ok: false; message: string }

export async function resetPasswordWithToken(input: unknown): Promise<ResetPasswordResult> {
  const parsed = resetPasswordSchema.safeParse(input)

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Revisá los datos.',
    }
  }

  const { token, password, confirmPassword } = parsed.data

  if (password !== confirmPassword) {
    return { ok: false, message: 'Las contraseñas no coinciden.' }
  }

  const payload = verifyPasswordResetToken(token)

  if (!payload) {
    return {
      ok: false,
      message: 'El enlace para cambiar la contraseña expiró o no es válido. Solicitá uno nuevo.',
    }
  }

  const supabase = createAdminClient()
  const { error } = await supabase.auth.admin.updateUserById(payload.sub, {
    password,
  })

  if (error) {
    console.error('[Password reset] No se pudo actualizar contraseña:', {
      userId: payload.sub,
      email: payload.email,
      error: error.message,
    })
    return { ok: false, message: error.message }
  }

  console.info('[Password reset] Contraseña actualizada:', {
    userId: payload.sub,
    email: payload.email,
  })

  return { ok: true, message: 'Contraseña actualizada correctamente. Ya podés iniciar sesión.' }
}

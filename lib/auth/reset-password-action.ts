'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

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

  const supabase = await createClient()
  const { data, error: verificationError } = await supabase.auth.verifyOtp({
    type: 'recovery',
    token_hash: token,
  })
  if (verificationError || !data.session) {
    return {
      ok: false,
      message: 'El enlace expiró, ya fue usado o no es válido. Solicitá uno nuevo.',
    }
  }

  const { error } = await supabase.auth.updateUser({ password })
  await supabase.auth.signOut({ scope: 'local' })

  if (error) {
    return { ok: false, message: `${error.message} Solicitá un enlace nuevo para volver a intentarlo.` }
  }

  return { ok: true, message: 'Contraseña actualizada correctamente. Ya podés iniciar sesión.' }
}

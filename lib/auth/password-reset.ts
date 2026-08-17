'use server'

import { z } from 'zod'
import { sendPasswordResetEmail } from '@/lib/email/sender'
import { createPasswordResetToken } from '@/lib/auth/password-reset-token'
import { getSiteUrl } from '@/lib/site-url'
import { createAdminClient } from '@/lib/supabase/admin'

const resetSchema = z.object({
  email: z.string().trim().email('Ingresá un correo válido.'),
})

function maskEmail(email: string) {
  return email.replace(/^(.).+(@.+)$/, '$1***$2')
}

async function findAuthUserByEmail(email: string) {
  const supabase = createAdminClient()
  const target = email.toLowerCase()
  let page = 1

  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 })
    if (error) throw error

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === target)
    if (user) return user
    if (data.users.length < 100) return null

    page += 1
  }

  return null
}

export async function requestPasswordReset(input: unknown): Promise<{
  ok: boolean
  message: string
}> {
  const parsed = resetSchema.safeParse(input)

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Ingresá un correo válido.',
    }
  }

  const email = parsed.data.email

  try {
    console.info('[Password reset] Solicitud recibida:', maskEmail(email))
    const user = await findAuthUserByEmail(email)

    if (!user) {
      console.info('[Password reset] Correo no registrado:', maskEmail(email))
      return {
        ok: true,
        message: 'Si el correo está registrado, recibirás un enlace para crear una nueva contraseña.',
      }
    }

    const siteUrl = getSiteUrl()
    const resetToken = createPasswordResetToken({ userId: user.id, email: email })
    const resetUrl = `${siteUrl}/auth/reset-password?token=${encodeURIComponent(resetToken)}`

    console.info('[Password reset] Link generado:', maskEmail(email))

    const emailResult = await sendPasswordResetEmail({ to: email, resetUrl })

    if (!emailResult.ok) {
      console.error('[Password reset] Resend rechazó el correo:', {
        to: maskEmail(email),
        error: emailResult.error,
      })
      return {
        ok: false,
        message: emailResult.error ?? 'No se pudo enviar el correo de recuperación.',
      }
    }

    console.info('[Password reset] Correo aceptado por Resend:', {
      to: maskEmail(email),
      id: emailResult.id,
    })

    if (!process.env.RESEND_API_KEY) {
      console.info('[Password reset] RESEND_API_KEY no configurada. Link para prueba local:', {
        to: maskEmail(email),
        resetUrl,
      })
      return {
        ok: true,
        message: 'Correo no configurado. Para probar en local, revisá la consola del servidor: ahí quedó el enlace de recuperación.',
      }
    }

    return {
      ok: true,
      message:
        process.env.NODE_ENV === 'development'
          ? `Correo aceptado por Resend${emailResult.id ? ` (${emailResult.id})` : ''}. Revisá spam/cuarentena si no aparece en Outlook.`
          : 'Si el correo está registrado, recibirás un enlace para crear una nueva contraseña.',
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'No se pudo generar el enlace de recuperación.',
    }
  }
}

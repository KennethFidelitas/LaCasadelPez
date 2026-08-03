'use server'

// lib/customers/self-register.ts
// Envía el correo de bienvenida cuando un cliente se registra por su cuenta
// desde components/auth/auth-form.tsx (signUp del lado del cliente).
// El registro en sí lo hace el navegador contra Supabase Auth con la anon key;
// esta acción solo se encarga de la notificación por correo una vez confirmado
// el éxito del signUp.

import { z } from 'zod'
import { sendSelfRegistrationWelcomeEmail } from '@/lib/email/sender'

export type NotifySelfRegistrationResult =
  | { ok: true; message: string }
  | { ok: false; code: 'VALIDATION_ERROR' | 'EMAIL_ERROR'; message: string }

const notifySelfRegistrationSchema = z.object({
  email: z.string().trim().email('Correo inválido.'),
  firstName: z.string().trim().min(1, 'Nombre requerido.'),
})

export async function notifySelfRegistration(input: unknown): Promise<NotifySelfRegistrationResult> {
  const parsed = notifySelfRegistrationSchema.safeParse(input)

  if (!parsed.success) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: parsed.error.issues[0]?.message ?? 'Datos incompletos para enviar el correo de bienvenida.',
    }
  }

  const { email, firstName } = parsed.data

  const emailResult = await sendSelfRegistrationWelcomeEmail({ to: email, firstName })

  if (!emailResult.ok) {
    console.error('[notifySelfRegistration] welcome email failed:', emailResult.error)
    return {
      ok: false,
      code: 'EMAIL_ERROR',
      message: emailResult.error ?? 'No se pudo enviar el correo de bienvenida.',
    }
  }

  return { ok: true, message: 'Correo de bienvenida enviado.' }
}

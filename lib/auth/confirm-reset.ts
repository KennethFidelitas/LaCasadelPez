'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function getSafeNext(value: FormDataEntryValue | null) {
  return typeof value === 'string' && value.startsWith('/') ? value : '/auth/reset-password'
}

export async function confirmPasswordReset(formData: FormData) {
  const tokenHash = formData.get('token_hash')
  const next = getSafeNext(formData.get('next'))

  if (typeof tokenHash !== 'string' || !tokenHash) {
    redirect('/auth/login?error=reset_link_expired')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'recovery',
  })

  if (error) {
    console.error('[Password reset] Token inválido o vencido:', error.message)
    redirect('/auth/login?error=reset_link_expired')
  }

  redirect(next)
}

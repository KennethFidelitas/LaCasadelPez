'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'El nombre es obligatorio.').max(100),
  lastName: z.string().trim().max(100).optional().default(''),
  phone: z.string().trim().max(50).optional().default(''),
})

export type UpdateAccountProfileResult =
  | { ok: true; message: string }
  | { ok: false; message: string }

export async function updateAccountProfile(input: unknown): Promise<UpdateAccountProfileResult> {
  const parsed = profileSchema.safeParse(input)

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Revisá los datos del perfil.',
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    return { ok: false, message: userError.message }
  }

  if (!user) {
    return { ok: false, message: 'Debés iniciar sesión para actualizar tu perfil.' }
  }

  const payload = parsed.data
  const { data: currentProfile, error: currentProfileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (currentProfileError) {
    return { ok: false, message: currentProfileError.message }
  }

  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      email: user.email ?? null,
      first_name: payload.firstName,
      last_name: payload.lastName || null,
      phone: payload.phone || null,
      role: currentProfile?.role ?? user.user_metadata?.role ?? 'customer',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )

  if (error) {
    return { ok: false, message: error.message }
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      first_name: payload.firstName,
      last_name: payload.lastName || '',
      phone: payload.phone || '',
    },
  })

  if (metadataError) {
    return { ok: false, message: metadataError.message }
  }

  revalidatePath('/cuenta')

  return { ok: true, message: 'Perfil actualizado correctamente.' }
}

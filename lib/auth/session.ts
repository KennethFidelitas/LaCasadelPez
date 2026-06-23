import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const STAFF_ROLES = new Set(['admin', 'employee'])

type StaffProfile = {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  role: string
}

export async function requireStaffUser(redirectTo: string) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect(`/auth/login?redirect=${encodeURIComponent(redirectTo)}`)
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role')
    .eq('id', user.id)
    .single<StaffProfile>()

  if (profileError || !profile || !STAFF_ROLES.has(profile.role)) {
    redirect('/cuenta')
  }

  return {
    supabase,
    user,
    profile,
  }
}

export async function requireAdminUser(redirectTo: string) {
  const { supabase, user, profile } = await requireStaffUser(redirectTo)

  if (profile.role !== 'admin') {
    redirect('/cuenta')
  }

  return {
    supabase,
    user,
    profile,
  }
}

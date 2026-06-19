import { createServerClient } from '@supabase/ssr'


export function createAdminClient() {
  return createServerClient(
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)!,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  )
}

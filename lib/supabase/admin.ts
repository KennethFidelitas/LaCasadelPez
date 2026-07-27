import { createServerClient } from '@supabase/ssr'


export function createAdminClient() {
  return createServerClient(
    // Debe apuntar al mismo proyecto que utiliza el resto de la aplicación.
    // Algunas integraciones agregan SUPABASE_URL de otro proyecto en .env.
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  )
}

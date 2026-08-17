import { NextResponse, type NextRequest } from 'next/server'
import { getSiteUrl } from '@/lib/site-url'
import { createClient } from '@/lib/supabase/server'

function getSafeNext(value: string | null) {
  return value?.startsWith('/') ? value : '/cuenta'
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = getSafeNext(requestUrl.searchParams.get('next'))
  const siteUrl = getSiteUrl()

  if (tokenHash && type === 'recovery') {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery',
    })

    if (!error) {
      return NextResponse.redirect(`${siteUrl}${next}`)
    }
  }

  return NextResponse.redirect(`${siteUrl}/auth/login?error=reset_link_expired`)
}

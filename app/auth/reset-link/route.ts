import { NextResponse, type NextRequest } from 'next/server'
import { getSiteUrl } from '@/lib/site-url'

function isAllowedSupabaseLink(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname.endsWith('.supabase.co')
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const link = requestUrl.searchParams.get('link')
  const siteUrl = getSiteUrl()

  if (link && isAllowedSupabaseLink(link)) {
    return NextResponse.redirect(link)
  }

  return NextResponse.redirect(`${siteUrl}/auth/login?error=reset_link_expired`)
}

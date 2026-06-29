import { CartProvider } from '@/lib/cart-context'
import { StoreHeader } from '@/components/store/header'
import { StoreFooter } from '@/components/store/footer'
import { CartDrawer } from '@/components/store/cart-drawer'
import { Toaster } from '@/components/ui/feedback/sonner'
import { createClient } from '@/lib/supabase/server'
import { getStoreSettings, buildSocialUrls } from '@/lib/store-settings'

type LayoutProfile = {
  role: 'customer' | 'admin' | 'employee'
}

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let showAdminLink = false

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle<LayoutProfile>()

    showAdminLink = profile?.role === 'admin'
  }

  const settings = await getStoreSettings()
  const socialUrls = buildSocialUrls(settings.redes, settings.mapas.wazeUrl)

  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <StoreHeader showAdminLink={showAdminLink} isLoggedIn={!!user} socialUrls={socialUrls} />
        <main className="flex-1">{children}</main>
        <StoreFooter />
        <CartDrawer />
        <Toaster richColors position="bottom-right" />
      </div>
    </CartProvider>
  )
}

import { CartProvider } from '@/lib/cart-context'
import { StoreHeader } from '@/components/store/header'
import { StoreFooter } from '@/components/store/footer'
import { CartDrawer } from '@/components/store/cart-drawer'

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <StoreHeader />
        <main className="flex-1">{children}</main>
        <StoreFooter />
        <CartDrawer />
      </div>
    </CartProvider>
  )
}

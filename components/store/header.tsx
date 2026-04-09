'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Fish, ShoppingCart, Menu, X, Search, User } from 'lucide-react'
import { Button } from '@/components/ui/actions/button'
import { useCart } from '@/lib/cart-context'

const navigation = [
  { name: 'Inicio', href: '/' },
  { name: 'Tienda', href: '/tienda' },
  { name: 'Peces', href: '/peces' },
  { name: 'Acuarios a Medida', href: '/configurador' },
  { name: 'Nosotros', href: '/nosotros' },
]

export function StoreHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { totalItems, openCart } = useCart()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Fish className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <p className="text-lg font-bold leading-tight text-foreground">La Casa del Pez</p>
            <p className="text-xs text-muted-foreground">Acuarios y Peces Tropicales</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Search className="h-5 w-5" />
            <span className="sr-only">Buscar</span>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/auth/login">
              <User className="h-5 w-5" />
              <span className="sr-only">Mi cuenta</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={openCart}
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
            <span className="sr-only">Carrito</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-background p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <Fish className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">La Casa del Pez</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Cerrar</span>
              </Button>
            </div>
            <div className="mt-8 flow-root">
              <div className="flex flex-col gap-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="rounded-lg px-3 py-2 text-base font-medium text-foreground transition-colors hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="mt-8 border-t border-border pt-6">
                <Link
                  href="/auth/login"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-foreground transition-colors hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  Mi Cuenta
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/actions/button'
import { useCart } from '@/lib/cart-context'
import { formatPrice } from '@/lib/format'

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, clearCart } = useCart()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={closeCart}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 flex w-full max-w-md flex-col bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            Carrito de Compras
          </h2>
          <Button variant="ghost" size="icon" onClick={closeCart}>
            <X className="h-5 w-5" />
            <span className="sr-only">Cerrar</span>
          </Button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-medium text-foreground">
                Tu carrito esta vacio
              </h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Explora nuestra tienda y encuentra productos increibles
              </p>
              <Button onClick={closeCart} asChild>
                <Link href="/tienda">Ver Productos</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-lg border border-border bg-card p-3"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-medium text-foreground line-clamp-2">
                          {item.name}
                        </h4>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.type === 'animal' ? 'Pez' : 'Producto'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                          <span className="sr-only">Reducir cantidad</span>
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="h-3 w-3" />
                          <span className="sr-only">Aumentar cantidad</span>
                        </Button>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border px-4 py-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base font-medium text-foreground">Subtotal</span>
              <span className="text-lg font-bold text-foreground">
                {formatPrice(subtotal)}
              </span>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Envio e impuestos calculados en el checkout
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild onClick={closeCart}>
                <Link href="/checkout">Proceder al Pago</Link>
              </Button>
              <Button variant="outline" onClick={clearCart}>
                Vaciar Carrito
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

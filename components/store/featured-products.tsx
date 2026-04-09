'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Package } from 'lucide-react'
import { Button } from '@/components/ui/actions/button'
import { useCart } from '@/lib/cart-context'
import { formatPrice } from '@/lib/format'
import type { Product } from '@/lib/types'

interface FeaturedProductsProps {
  products: Product[]
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  const { addItem, openCart } = useCart()

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      type: 'product',
      name: product.name,
      price: product.price,
      image: product.images?.[0],
      stock: product.stock_quantity,
      sku: product.sku,
    })
    openCart()
  }

  if (products.length === 0) {
    return (
      <div className="mt-8 flex items-center justify-center rounded-lg border border-dashed border-border bg-card py-12">
        <p className="text-muted-foreground">No hay productos destacados disponibles</p>
      </div>
    )
  }

  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <div
          key={product.id}
          className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg"
        >
          <Link href={`/tienda/${product.slug}`} className="relative aspect-square bg-muted">
            {product.images?.[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-12 w-12 text-muted-foreground/50" />
              </div>
            )}
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="absolute left-3 top-3 rounded-full bg-destructive px-2 py-1 text-xs font-semibold text-destructive-foreground">
                -{Math.round((1 - product.price / product.compare_at_price) * 100)}%
              </span>
            )}
          </Link>
          <div className="flex flex-1 flex-col p-4">
            <Link href={`/tienda/${product.slug}`}>
              <h3 className="font-medium text-foreground line-clamp-2 group-hover:text-primary">
                {product.name}
              </h3>
            </Link>
            {product.category && (
              <p className="mt-1 text-xs text-muted-foreground">
                {product.category.name}
              </p>
            )}
            <div className="mt-auto pt-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">
                  {formatPrice(product.price)}
                </span>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(product.compare_at_price)}
                  </span>
                )}
              </div>
              <div className="mt-3">
                {product.stock_quantity > 0 ? (
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Agregar al Carrito
                  </Button>
                ) : (
                  <Button className="w-full" size="sm" variant="secondary" disabled>
                    Agotado
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

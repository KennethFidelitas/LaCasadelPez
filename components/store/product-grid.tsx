'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ShoppingCart, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/actions/button'
import { useCart } from '@/lib/cart-context'
import { formatPrice } from '@/lib/format'
import type { Product } from '@/lib/types'

interface ProductGridProps {
  products: Product[]
  totalPages: number
  currentPage: number
  totalProducts: number
}

export function ProductGrid({ products, totalPages, currentPage, totalProducts }: ProductGridProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
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

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page > 1) {
      params.set('pagina', page.toString())
    } else {
      params.delete('pagina')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-16">
        <Package className="mb-4 h-16 w-16 text-muted-foreground/50" />
        <h3 className="mb-2 text-lg font-medium text-foreground">
          No se encontraron productos
        </h3>
        <p className="text-center text-sm text-muted-foreground">
          Intenta ajustar los filtros o busqueda
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Results count */}
      <p className="mb-6 text-sm text-muted-foreground">
        Mostrando {products.length} de {totalProducts} productos
      </p>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
              {product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0 && (
                <span className="absolute right-3 top-3 rounded-full bg-yellow-500 px-2 py-1 text-xs font-semibold text-white">
                  Pocas unidades
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
              {product.short_description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {product.short_description}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                // Show first, last, current, and adjacent pages
                return (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1
                )
              })
              .map((page, index, array) => {
                // Add ellipsis
                const showEllipsisBefore = index > 0 && page - array[index - 1] > 1
                return (
                  <div key={page} className="flex items-center">
                    {showEllipsisBefore && (
                      <span className="px-2 text-muted-foreground">...</span>
                    )}
                    <Button
                      variant={page === currentPage ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </Button>
                  </div>
                )
              })}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

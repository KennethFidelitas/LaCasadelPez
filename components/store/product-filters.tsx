'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { useState, useTransition, useCallback } from 'react'
import { Button } from '@/components/ui/actions/button'
import { Input } from '@/components/ui/forms/input'
import type { Category } from '@/lib/types'

interface ProductFiltersProps {
  categories: Category[]
  currentCategory?: string
  currentSearch?: string
  currentOrder?: string
}

const orderOptions = [
  { value: '', label: 'Mas Recientes' },
  { value: 'precio-asc', label: 'Precio: Menor a Mayor' },
  { value: 'precio-desc', label: 'Precio: Mayor a Menor' },
  { value: 'nombre', label: 'Nombre A-Z' },
]

export function ProductFilters({
  categories,
  currentCategory,
  currentSearch,
  currentOrder,
}: ProductFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(currentSearch || '')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })
      
      // Reset to page 1 when filters change
      if (!updates.hasOwnProperty('pagina')) {
        params.delete('pagina')
      }
      
      return params.toString()
    },
    [searchParams]
  )

  const handleCategoryChange = (category: string | null) => {
    startTransition(() => {
      const query = createQueryString({ categoria: category })
      router.push(`${pathname}${query ? `?${query}` : ''}`)
    })
  }

  const handleOrderChange = (order: string) => {
    startTransition(() => {
      const query = createQueryString({ orden: order || null })
      router.push(`${pathname}${query ? `?${query}` : ''}`)
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(() => {
      const query = createQueryString({ buscar: search || null })
      router.push(`${pathname}${query ? `?${query}` : ''}`)
    })
  }

  const clearFilters = () => {
    setSearch('')
    startTransition(() => {
      router.push(pathname)
    })
  }

  const hasActiveFilters = currentCategory || currentSearch || currentOrder

  const filterContent = (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Buscar</h3>
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" size="icon" disabled={isPending}>
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Categories */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Categorias</h3>
        <div className="space-y-1">
          <button
            onClick={() => handleCategoryChange(null)}
            className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
              !currentCategory
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            disabled={isPending}
          >
            Todas las Categorias
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.slug)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                currentCategory === category.slug
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              disabled={isPending}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Order */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Ordenar por</h3>
        <div className="space-y-1">
          {orderOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleOrderChange(option.value)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                (currentOrder || '') === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              disabled={isPending}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          className="w-full"
          onClick={clearFilters}
          disabled={isPending}
        >
          <X className="mr-2 h-4 w-4" />
          Limpiar Filtros
        </Button>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setMobileFiltersOpen(true)}
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              Activos
            </span>
          )}
        </Button>
      </div>

      {/* Mobile Filters Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-full max-w-sm bg-background p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filtros</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileFiltersOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {filterContent}
          </div>
        </div>
      )}

      {/* Desktop Filters */}
      <div className="hidden rounded-xl border border-border bg-card p-6 lg:block">
        {filterContent}
      </div>
    </>
  )
}

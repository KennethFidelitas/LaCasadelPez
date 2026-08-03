'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronRight, SlidersHorizontal } from 'lucide-react'
import { FilterSidebar } from '@/components/peces/FilterSidebar'
import { ProductGrid } from '@/components/peces/ProductGrid'
import type { FiltrosState } from '@/components/peces/types'
import type { Animal, Category } from '@/lib/types'

interface PecesExplorerProps {
  animales: Animal[]
  categorias: Category[]
  precioMin: number
  precioMax: number
}

export function PecesExplorer({ animales, categorias, precioMin, precioMax }: PecesExplorerProps) {
  const filtrosIniciales: FiltrosState = {
    categorias: [],
    nivelCuidado: [],
    temperamento: [],
    precioMin,
    precioMax,
    soloDisponibles: false,
    ordenar: 'relevancia',
  }

  const [filtros, setFiltros] = useState<FiltrosState>(filtrosIniciales)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const productosFiltrados = useMemo(() => {
    let result = animales.filter((animal) => {
      if (
        filtros.categorias.length > 0 &&
        (!animal.category_id || !filtros.categorias.includes(animal.category_id))
      ) {
        return false
      }
      // Un animal sin care_level/temperament cargado no debe aparecer cuando
      // ese filtro está activo — pero no rompe nada cuando el filtro está vacío.
      if (
        filtros.nivelCuidado.length > 0 &&
        (!animal.care_level || !filtros.nivelCuidado.includes(animal.care_level))
      ) {
        return false
      }
      if (
        filtros.temperamento.length > 0 &&
        (!animal.temperament || !filtros.temperamento.includes(animal.temperament))
      ) {
        return false
      }
      if (animal.price < filtros.precioMin || animal.price > filtros.precioMax) return false
      if (filtros.soloDisponibles && animal.stock_quantity <= 0) return false
      return true
    })

    switch (filtros.ordenar) {
      case 'precio-asc':
        result = [...result].sort((a, b) => a.price - b.price)
        break
      case 'precio-desc':
        result = [...result].sort((a, b) => b.price - a.price)
        break
      case 'nombre-az':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name, 'es'))
        break
      default:
        // relevancia: destacados primero
        result = [...result].sort((a, b) => Number(b.is_featured) - Number(a.is_featured))
    }

    return result
  }, [animales, filtros])

  const limpiarFiltros = () => setFiltros(filtrosIniciales)

  const hayFiltrosActivos =
    filtros.categorias.length > 0 ||
    filtros.nivelCuidado.length > 0 ||
    filtros.temperamento.length > 0 ||
    filtros.precioMin > precioMin ||
    filtros.precioMax < precioMax ||
    filtros.soloDisponibles

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <nav
        aria-label="Ruta de navegación"
        className="mb-4 flex items-center gap-1.5 text-xs text-foreground/50"
      >
        <Link href="/" className="transition-colors hover:text-foreground">
          Inicio
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Peces y Fauna Acuática</span>
      </nav>

      {/* Título */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Peces y Fauna Acuática</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Explora nuestra colección de peces tropicales, invertebrados y plantas para tu acuario.
        </p>
      </div>

      {/* Botón de filtros — solo visible para los móviles */}
      <div className="mb-4 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {hayFiltrosActivos && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              •
            </span>
          )}
        </button>
      </div>

      {/* Layout principal */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[256px_1fr]">
        {/* Sidebar de filtros */}
        <FilterSidebar
          filtros={filtros}
          onFiltrosChange={setFiltros}
          onLimpiar={limpiarFiltros}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          categorias={categorias}
          precioMin={precioMin}
          precioMax={precioMax}
        />

        {/* Grid de productos */}
        <ProductGrid
          productos={productosFiltrados}
          ordenar={filtros.ordenar}
          onOrdenarChange={(ordenar) => setFiltros((prev) => ({ ...prev, ordenar }))}
          onLimpiarFiltros={limpiarFiltros}
        />
      </div>
    </div>
  )
}

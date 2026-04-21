'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronRight, SlidersHorizontal } from 'lucide-react'
import { FilterSidebar } from '@/components/peces/FilterSidebar'
import { ProductGrid } from '@/components/peces/ProductGrid'
import { PRODUCTOS, PRECIO_MIN, PRECIO_MAX } from '@/components/peces/data'
import type { FiltrosState } from '@/components/peces/types'

const FILTROS_INICIALES: FiltrosState = {
  tipoAgua: 'todos',
  categorias: [],
  nivelCuidado: [],
  temperamento: [],
  precioMin: PRECIO_MIN,
  precioMax: PRECIO_MAX,
  soloDisponibles: false,
  ordenar: 'relevancia',
}

export default function PecesPage() {
  const [filtros, setFiltros] = useState<FiltrosState>(FILTROS_INICIALES)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const productosFiltrados = useMemo(() => {
    let result = PRODUCTOS.filter(p => {
      if (filtros.tipoAgua !== 'todos' && p.tipoAgua !== filtros.tipoAgua) return false
      if (filtros.categorias.length > 0 && !filtros.categorias.includes(p.categoria)) return false
      if (filtros.nivelCuidado.length > 0 && !filtros.nivelCuidado.includes(p.nivelCuidado)) return false
      if (filtros.temperamento.length > 0 && !filtros.temperamento.includes(p.temperamento)) return false
      if (p.precio < filtros.precioMin || p.precio > filtros.precioMax) return false
      if (filtros.soloDisponibles && !p.disponible) return false
      return true
    })

    switch (filtros.ordenar) {
      case 'precio-asc':
        result = [...result].sort((a, b) => a.precio - b.precio)
        break
      case 'precio-desc':
        result = [...result].sort((a, b) => b.precio - a.precio)
        break
      case 'nombre-az':
        result = [...result].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
        break
      default:
        // relevancia: destacados primero
        result = [...result].sort((a, b) => Number(b.destacado) - Number(a.destacado))
    }

    return result
  }, [filtros])

  const limpiarFiltros = () => setFiltros(FILTROS_INICIALES)

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
          {(filtros.tipoAgua !== 'todos' ||
            filtros.categorias.length > 0 ||
            filtros.nivelCuidado.length > 0 ||
            filtros.temperamento.length > 0 ||
            filtros.precioMin > PRECIO_MIN ||
            filtros.precioMax < PRECIO_MAX ||
            filtros.soloDisponibles) && (
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
        />

        {/* Grid de productos */}
        <ProductGrid
          productos={productosFiltrados}
          ordenar={filtros.ordenar}
          onOrdenarChange={ordenar => setFiltros(prev => ({ ...prev, ordenar }))}
          onLimpiarFiltros={limpiarFiltros}
        />
      </div>
    </div>
  )
}

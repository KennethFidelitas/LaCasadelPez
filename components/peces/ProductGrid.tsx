'use client'

import { Fish, ChevronDown } from 'lucide-react'
import { ProductCard } from './ProductCard'
import type { Producto, Ordenamiento } from './types'

const ORDEN_OPCIONES: { value: Ordenamiento; label: string }[] = [
  { value: 'relevancia', label: 'Relevancia' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' },
  { value: 'nombre-az', label: 'Nombre A-Z' },
]

interface ProductGridProps {
  productos: Producto[]
  ordenar: Ordenamiento
  onOrdenarChange: (ordenar: Ordenamiento) => void
  onLimpiarFiltros: () => void
}

export function ProductGrid({
  productos,
  ordenar,
  onOrdenarChange,
  onLimpiarFiltros,
}: ProductGridProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Barra superior */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-foreground/60">
          <span className="font-medium text-foreground">{productos.length}</span>{' '}
          {productos.length === 1 ? 'producto encontrado' : 'productos encontrados'}
        </p>

        <div className="relative">
          <select
            value={ordenar}
            onChange={e => onOrdenarChange(e.target.value as Ordenamiento)}
            className="appearance-none rounded-lg border border-border bg-background py-1.5 pl-3 pr-8 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {ORDEN_OPCIONES.map(op => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
        </div>
      </div>

      {/* Grid o estado vacío */}
      {productos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-background py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <Fish className="h-8 w-8 text-foreground/20" />
          </div>
          <h3 className="mt-4 text-sm font-medium text-foreground">
            No encontramos productos con esos filtros
          </h3>
          <p className="mt-1 text-xs text-foreground/50">
            Intenta ajustar o eliminar algunos filtros para ver más resultados.
          </p>
          <button
            onClick={onLimpiarFiltros}
            className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {productos.map(producto => (
            <ProductCard key={producto.id} producto={producto} />
          ))}
        </div>
      )}
    </div>
  )
}

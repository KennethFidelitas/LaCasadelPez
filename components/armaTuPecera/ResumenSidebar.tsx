'use client'

import { X, ShoppingCart, Trash2, Bookmark, Droplets, Fish } from 'lucide-react'
import { PECERAS, FILTROS, PECES, formatColones } from './data'
import type { ArmaTuPeceraState } from './types'

interface ResumenSidebarProps {
  state: ArmaTuPeceraState
  total: number
  litrosUsados: number
  totalPeces: number
  onRemoveWaterType: () => void
  onRemovePecera: () => void
  onRemoveFiltro: () => void
  onRemoveFish: (fishId: string) => void
  onClear: () => void
}

export function ResumenSidebar({
  state,
  total,
  litrosUsados,
  totalPeces,
  onRemoveWaterType,
  onRemovePecera,
  onRemoveFiltro,
  onRemoveFish,
  onClear,
}: ResumenSidebarProps) {
  const selectedPecera = PECERAS.find(p => p.id === state.selectedPeceraId) ?? null
  const selectedFiltro = FILTROS.find(f => f.id === state.selectedFiltroId) ?? null
  const fishInCart = Object.entries(state.fishQuantities)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ fish: PECES.find(f => f.id === id)!, qty }))
    .filter(item => item.fish != null)

  const hasItems = total > 0
  const mitadInicial = Math.round(total * 0.5)

  return (
    <aside className="rounded-xl border border-border bg-background">
      {/* Header */}
      <div className="rounded-t-xl bg-ocean px-4 py-3">
        <h3 className="text-sm font-medium text-white">Resumen de tu Pecera</h3>
      </div>

      <div className="p-4">
        {/* Capacity info */}
        {selectedPecera && (
          <div className="mb-4 flex items-center justify-between rounded-lg bg-secondary px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-foreground/70">
              <Droplets className="h-3.5 w-3.5" />
              <span className="font-mono">{litrosUsados}L / {selectedPecera.litros}L</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-foreground/70">
              <Fish className="h-3.5 w-3.5" />
              <span className="font-mono">{totalPeces} peces</span>
            </div>
          </div>
        )}

        {/* Items list */}
        <ul className="flex flex-col gap-2">
          {/* Water type */}
          {state.waterType && (
            <SidebarItem
              label={state.waterType === 'dulce' ? 'Agua Dulce' : 'Agua Salada'}
              price={null}
              icon={state.waterType === 'dulce' ? '💧' : '🌊'}
              onRemove={onRemoveWaterType}
            />
          )}

          {/* Pecera */}
          {selectedPecera && (
            <SidebarItem
              label={selectedPecera.name}
              price={selectedPecera.price}
              icon={selectedPecera.icon}
              onRemove={onRemovePecera}
            />
          )}

          {/* Filtro */}
          {selectedFiltro && (
            <SidebarItem
              label={selectedFiltro.name}
              price={selectedFiltro.price}
              icon={selectedFiltro.icon}
              onRemove={onRemoveFiltro}
            />
          )}

          {/* Peces */}
          {fishInCart.map(({ fish, qty }) => (
            <SidebarItem
              key={fish.id}
              label={`${fish.name} ×${qty}`}
              price={fish.price * qty}
              icon={fish.icon}
              onRemove={() => onRemoveFish(fish.id)}
            />
          ))}

          {!hasItems && (
            <li className="rounded-lg bg-muted/50 px-3 py-4 text-center text-xs text-muted-foreground">
              Aún no has seleccionado nada.
              <br />
              Comienza eligiendo el tipo de agua.
            </li>
          )}
        </ul>

        {/* Total */}
        {hasItems && (
          <>
            <div className="mt-4 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Total</span>
                <span className="font-mono text-base font-medium text-foreground">
                  {formatColones(total)}
                </span>
              </div>
              <p className="mt-1 text-xs text-foreground/60">
                50% inicial: <span className="font-mono">{formatColones(mitadInicial)}</span>
              </p>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="mt-4 flex flex-col gap-2">
          <button
            disabled={!hasItems}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-ocean-light disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingCart className="h-4 w-4" />
            Añadir al carrito
          </button>

          <button
            disabled={!hasItems}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Bookmark className="h-4 w-4" />
            Guardar configuración
          </button>

          {hasItems && (
            <button
              onClick={onClear}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpiar todo
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}

interface SidebarItemProps {
  label: string
  price: number | null
  icon: string
  onRemove: () => void
}

function SidebarItem({ label, price, icon, onRemove }: SidebarItemProps) {
  return (
    <li className="flex items-center justify-between gap-2 rounded-lg bg-secondary px-3 py-2">
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="shrink-0 text-base">{icon}</span>
        <span className="truncate text-xs text-foreground">{label}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {price !== null && (
          <span className="font-mono text-xs text-foreground/70">{formatColones(price)}</span>
        )}
        <button
          onClick={onRemove}
          className="flex h-5 w-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
          aria-label="Eliminar"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </li>
  )
}

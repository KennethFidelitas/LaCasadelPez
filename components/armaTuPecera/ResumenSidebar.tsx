'use client'

import { X, Printer, ShoppingCart, Trash2, Bookmark, Droplets, Fish } from 'lucide-react'
import { ACCESORIOS_OPCIONALES, FILTROS, ILUMINACIONES, PECERAS, PECERAS_PREDISENO, PECES, formatColones } from './data'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/overlays/dialog'
import type { ArmaTuPeceraStateExtended } from './types'

interface ResumenSidebarProps {
  state: ArmaTuPeceraStateExtended
  total: number
  litrosUsados: number
  totalPeces: number
  onRemoveWaterType: () => void
  onRemovePecera: () => void
  onRemoveFiltro: () => void
  onRemoveIluminacion: () => void
  onRemoveAccesorio: (accesorioId: string) => void
  onRemoveFish: (fishId: string) => void
  onClear: () => void
  onSaveDraft: () => void
  onLoadDraft: () => void
  onClearDraft: () => void
  onPrint: () => void
  hasDraft: boolean
}

export function ResumenSidebar({
  state,
  total,
  litrosUsados,
  totalPeces,
  onRemoveWaterType,
  onRemovePecera,
  onRemoveFiltro,
  onRemoveIluminacion,
  onRemoveAccesorio,
  onRemoveFish,
  onClear,
  onSaveDraft,
  onLoadDraft,
  onClearDraft,
  onPrint,
  hasDraft,
}: ResumenSidebarProps) {
  const selectedPecera = PECERAS.find(p => p.id === state.selectedPeceraId) ?? null
  const selectedPrediseno = PECERAS_PREDISENO.find(p => p.id === state.selectedPeceraId) ?? null
  const selectedFiltro = FILTROS.find(f => f.id === state.selectedFiltroId) ?? null
  const selectedIluminacion = ILUMINACIONES.find(l => l.id === state.selectedIluminacionId) ?? null
  const accesoriosActivos = ACCESORIOS_OPCIONALES.filter(a => state.accesoriosSeleccionados[a.id])
  const selectedAquarium = selectedPrediseno ?? selectedPecera
  const fishInCart = Object.entries(state.fishQuantities)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ fish: PECES.find(f => f.id === id)!, qty }))
    .filter(item => item.fish != null)

  const hasItems = total > 0
  const mitadInicial = Math.round(total * 0.5)

  return (
    <Dialog>
      <aside className="rounded-xl border border-border bg-background">
        {/* Header */}
        <div className="rounded-t-xl bg-ocean px-4 py-3">
          <h3 className="text-sm font-medium text-white">Resumen de tu Pecera</h3>
        </div>

        <div className="p-4">
        {/* Capacity info */}
        {selectedAquarium && (
          <div className="mb-4 flex items-center justify-between rounded-lg bg-secondary px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-foreground/70">
              <Droplets className="h-3.5 w-3.5" />
              <span className="font-mono">{litrosUsados}L / {selectedAquarium.litros}L</span>
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
          {selectedAquarium && (
            <SidebarItem
              label={selectedPrediseno ? `Kit: ${selectedPrediseno.name}` : selectedAquarium.name}
              price={selectedAquarium.price}
              icon={selectedPrediseno ? '📦' : selectedAquarium.image ? '🐠' : '🐟'}
              onRemove={onRemovePecera}
            />
          )}

          {/* Filtro */}
          {selectedFiltro && (
            <SidebarItem
              label={selectedFiltro.name}
              price={selectedFiltro.price}
              icon="⚙️"
              onRemove={onRemoveFiltro}
            />
          )}

          {selectedIluminacion && (
            <SidebarItem
              label={selectedIluminacion.name}
              price={selectedIluminacion.price}
              icon="💡"
              onRemove={onRemoveIluminacion}
            />
          )}

          {accesoriosActivos.map(accesorio => (
            <SidebarItem
              key={accesorio.id}
              label={accesorio.name}
              price={accesorio.price}
              icon="➕"
              onRemove={() => onRemoveAccesorio(accesorio.id)}
            />
          ))}

          {/* Peces */}
          {fishInCart.map(({ fish, qty }) => (
            <SidebarItem
              key={fish.id}
              label={`${fish.name} ×${qty}`}
              price={fish.price * qty}
              icon={fish.waterType === 'dulce' ? '🐟' : '🐠'}
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
                <span className="font-mono text-base font-medium text-primary">
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

          <DialogTrigger asChild>
            <button
              type="button"
              disabled={!hasItems}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ShoppingCart className="h-4 w-4" />
              Revisar antes de comprar
            </button>
          </DialogTrigger>

          <button
            type="button"
            disabled={!hasItems}
            onClick={onPrint}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Printer className="h-4 w-4" />
            Imprimir presupuesto
          </button>

          <button
            type="button"
            disabled={!hasItems}
            onClick={onSaveDraft}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Bookmark className="h-4 w-4" />
            Guardar configuración
          </button>

          <button
            type="button"
            disabled={!hasDraft}
            onClick={onLoadDraft}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Bookmark className="h-4 w-4" />
            Cargar configuración guardada
          </button>

          <button
            type="button"
            disabled={!hasDraft}
            onClick={onClearDraft}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            Borrar configuración guardada
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

    <DialogContent>
      <DialogHeader>
        <DialogTitle>Resumen antes de comprar</DialogTitle>
        <DialogDescription>Revisa tu selección completa y el total antes de continuar.</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-secondary p-4">
          <h4 className="text-sm font-semibold text-foreground">Resumen rápido</h4>
          <div className="mt-3 grid gap-2 text-sm text-foreground/80">
            <div className="flex justify-between">
              <span>Tipo de agua</span>
              <span>{state.waterType === 'salada' ? 'Agua Salada' : state.waterType === 'dulce' ? 'Agua Dulce' : 'No seleccionada'}</span>
            </div>
            <div className="flex justify-between">
              <span>{selectedPrediseno ? 'Kit' : 'Pecera'}</span>
              <span>{selectedAquarium?.name ?? 'No seleccionada'}</span>
            </div>
            <div className="flex justify-between">
              <span>Filtro</span>
              <span>{selectedPrediseno ? 'Incluido en el kit' : selectedFiltro?.name ?? 'No seleccionado'}</span>
            </div>
            <div className="flex justify-between">
              <span>Iluminación</span>
              <span>{selectedIluminacion?.name ?? 'No seleccionada'}</span>
            </div>
            <div className="flex justify-between">
              <span>Litros usados</span>
              <span>{selectedAquarium ? `${litrosUsados}L / ${selectedAquarium.litros}L` : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span>Total de peces</span>
              <span>{totalPeces}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="font-semibold">Total</span>
              <span className="font-mono font-semibold text-primary">{formatColones(total)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <h4 className="text-sm font-semibold text-foreground">Detalle de selección</h4>
          <ul className="mt-3 space-y-2 text-sm">
            {state.waterType && (
              <li className="flex justify-between rounded-md bg-secondary/60 p-3">
                <span>{state.waterType === 'dulce' ? 'Agua Dulce' : 'Agua Salada'}</span>
                <span className="font-mono">—</span>
              </li>
            )}
            {selectedAquarium && (
              <li className="flex justify-between rounded-md bg-secondary/60 p-3">
                <span>{selectedPrediseno ? `Kit: ${selectedPrediseno.name}` : selectedAquarium.name}</span>
                <span className="font-mono">{formatColones(selectedAquarium.price)}</span>
              </li>
            )}
            {selectedFiltro && (
              <li className="flex justify-between rounded-md bg-secondary/60 p-3">
                <span>{selectedFiltro.name}</span>
                <span className="font-mono">{formatColones(selectedFiltro.price)}</span>
              </li>
            )}
            {selectedIluminacion && (
              <li className="flex justify-between rounded-md bg-secondary/60 p-3">
                <span>{selectedIluminacion.name}</span>
                <span className="font-mono">{formatColones(selectedIluminacion.price)}</span>
              </li>
            )}
            {accesoriosActivos.map(accesorio => (
              <li key={accesorio.id} className="flex justify-between rounded-md bg-secondary/60 p-3">
                <span>{accesorio.name}</span>
                <span className="font-mono">{formatColones(accesorio.price)}</span>
              </li>
            ))}
            {fishInCart.length > 0 ? (
              fishInCart.map(({ fish, qty }) => (
                <li key={fish.id} className="flex justify-between rounded-md bg-secondary/60 p-3">
                  <span>{fish.name} ×{qty}</span>
                  <span className="font-mono">{formatColones(fish.price * qty)}</span>
                </li>
              ))
            ) : (
              <li className="rounded-md bg-secondary/60 p-3 text-sm text-muted-foreground">No hay peces seleccionados.</li>
            )}
          </ul>
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <button className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
            Cerrar
          </button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
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

'use client'

import { X } from 'lucide-react'
import { PRECIO_MIN, PRECIO_MAX, formatColones } from './data'
import type { FiltrosState } from './types'

interface FilterSidebarProps {
  filtros: FiltrosState
  onFiltrosChange: (filtros: FiltrosState) => void
  onLimpiar: () => void
  isOpen: boolean
  onClose: () => void
}

const CATEGORIAS = [
  { value: 'pez-dulce', label: 'Peces Agua Dulce' },
  { value: 'pez-salado', label: 'Peces Agua Salada' },
  { value: 'coral', label: 'Corales' },
  { value: 'invertebrado', label: 'Invertebrados' },
  { value: 'planta-acuatica', label: 'Plantas Acuáticas' },
]

const NIVELES = [
  { value: 'facil', label: 'Fácil' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
]

const TEMPERAMENTOS = [
  { value: 'pacifico', label: 'Pacífico' },
  { value: 'agresivo', label: 'Agresivo' },
  { value: 'solitario', label: 'Solitario' },
]

function toggleArr(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
}

function hayFiltrosActivos(f: FiltrosState): boolean {
  return (
    f.tipoAgua !== 'todos' ||
    f.categorias.length > 0 ||
    f.nivelCuidado.length > 0 ||
    f.temperamento.length > 0 ||
    f.precioMin > PRECIO_MIN ||
    f.precioMax < PRECIO_MAX ||
    f.soloDisponibles
  )
}

export function FilterSidebar({
  filtros,
  onFiltrosChange,
  onLimpiar,
  isOpen,
  onClose,
}: FilterSidebarProps) {
  const activo = hayFiltrosActivos(filtros)

  const panel = (
    <div className="rounded-xl border border-border bg-background p-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">Filtros</h2>
        <div className="flex items-center gap-3">
          {activo && (
            <button
              onClick={onLimpiar}
              className="text-xs text-primary transition-colors hover:text-primary/80"
            >
              Limpiar todo
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Cerrar filtros"
            className="lg:hidden text-foreground/50 hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tipo de agua */}
      <div className="mt-4 border-t border-border pt-4">
        <p className="mb-2 text-sm font-medium text-foreground">Tipo de agua</p>
        <div className="flex flex-col gap-1.5">
          {(['todos', 'dulce', 'salada'] as const).map(tipo => (
            <label key={tipo} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="tipoAgua"
                value={tipo}
                checked={filtros.tipoAgua === tipo}
                onChange={() => onFiltrosChange({ ...filtros, tipoAgua: tipo })}
                className="accent-primary"
              />
              <span className="text-sm text-foreground">
                {tipo === 'todos' ? 'Todos' : tipo === 'dulce' ? 'Agua Dulce' : 'Agua Salada'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Categoría */}
      <div className="mt-4 border-t border-border pt-4">
        <p className="mb-2 text-sm font-medium text-foreground">Categoría</p>
        <div className="flex flex-col gap-1.5">
          {CATEGORIAS.map(cat => (
            <label key={cat.value} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={filtros.categorias.includes(cat.value)}
                onChange={() =>
                  onFiltrosChange({
                    ...filtros,
                    categorias: toggleArr(filtros.categorias, cat.value),
                  })
                }
                className="accent-primary"
              />
              <span className="text-sm text-foreground">{cat.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Nivel de cuidado */}
      <div className="mt-4 border-t border-border pt-4">
        <p className="mb-2 text-sm font-medium text-foreground">Nivel de cuidado</p>
        <div className="flex flex-col gap-1.5">
          {NIVELES.map(n => (
            <label key={n.value} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={filtros.nivelCuidado.includes(n.value)}
                onChange={() =>
                  onFiltrosChange({
                    ...filtros,
                    nivelCuidado: toggleArr(filtros.nivelCuidado, n.value),
                  })
                }
                className="accent-primary"
              />
              <span className="text-sm text-foreground">{n.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Temperamento */}
      <div className="mt-4 border-t border-border pt-4">
        <p className="mb-2 text-sm font-medium text-foreground">Temperamento</p>
        <div className="flex flex-col gap-1.5">
          {TEMPERAMENTOS.map(t => (
            <label key={t.value} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={filtros.temperamento.includes(t.value)}
                onChange={() =>
                  onFiltrosChange({
                    ...filtros,
                    temperamento: toggleArr(filtros.temperamento, t.value),
                  })
                }
                className="accent-primary"
              />
              <span className="text-sm text-foreground">{t.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Precio */}
      <div className="mt-4 border-t border-border pt-4">
        <p className="mb-2 text-sm font-medium text-foreground">Precio</p>
        <div className="flex items-center justify-between mb-2 text-xs text-foreground/60">
          <span>{formatColones(filtros.precioMin)}</span>
          <span>{formatColones(filtros.precioMax)}</span>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs text-foreground/50">Mínimo</label>
            <input
              type="range"
              min={PRECIO_MIN}
              max={PRECIO_MAX}
              step={500}
              value={filtros.precioMin}
              onChange={e => {
                const val = Number(e.target.value)
                if (val <= filtros.precioMax)
                  onFiltrosChange({ ...filtros, precioMin: val })
              }}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-foreground/50">Máximo</label>
            <input
              type="range"
              min={PRECIO_MIN}
              max={PRECIO_MAX}
              step={500}
              value={filtros.precioMax}
              onChange={e => {
                const val = Number(e.target.value)
                if (val >= filtros.precioMin)
                  onFiltrosChange({ ...filtros, precioMax: val })
              }}
              className="w-full accent-primary"
            />
          </div>
        </div>
      </div>

      {/* Solo disponibles */}
      <div className="mt-4 border-t border-border pt-4">
        <label className="flex cursor-pointer items-center justify-between">
          <span className="text-sm font-medium text-foreground">Solo disponibles</span>
          <button
            role="switch"
            aria-checked={filtros.soloDisponibles}
            onClick={() =>
              onFiltrosChange({ ...filtros, soloDisponibles: !filtros.soloDisponibles })
            }
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
              filtros.soloDisponibles ? 'bg-primary' : 'bg-border'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                filtros.soloDisponibles ? 'translate-x-[18px]' : 'translate-x-[3px]'
              }`}
            />
          </button>
        </label>
      </div>

      {/* Limpiar filtros */}
      <div className="mt-4 border-t border-border pt-4">
        <button
          onClick={onLimpiar}
          className="w-full rounded-lg border border-border py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Mobile: drawer con overlay ─────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-background p-4 shadow-lg transition-transform duration-300 lg:static lg:z-auto lg:w-full lg:translate-x-0 lg:overflow-visible lg:p-0 lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {panel}
      </aside>
    </>
  )
}

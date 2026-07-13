'use client'

import { Settings } from 'lucide-react'
import { formatColones } from './data'
import type { CustomGlassType, CustomPeceraDimensions } from './types'

export const CUSTOM_PECERA_ID = 'custom'
export const DEFAULT_CUSTOM_DIMENSIONS: CustomPeceraDimensions = { largo: 60, ancho: 35, alto: 35 }
export const DEFAULT_CUSTOM_GLASS_TYPE: CustomGlassType = 'claro-6mm'

const CUSTOM_MIN_PRICE = 45000
const CUSTOM_ASSEMBLY_BASE = 18000

export const CUSTOM_GLASS_OPTIONS: Array<{
  id: CustomGlassType
  label: string
  description: string
  pricePerSquareMeter: number
}> = [
  {
    id: 'claro-6mm',
    label: 'Vidrio claro 6 mm',
    description: 'Para peceras pequenas y medianas.',
    pricePerSquareMeter: 38000,
  },
  {
    id: 'claro-8mm',
    label: 'Vidrio claro 8 mm',
    description: 'Mayor rigidez para volumen medio.',
    pricePerSquareMeter: 52000,
  },
  {
    id: 'templado-10mm',
    label: 'Vidrio templado 10 mm',
    description: 'Recomendado para peceras grandes.',
    pricePerSquareMeter: 76000,
  },
  {
    id: 'templado-12mm',
    label: 'Vidrio templado 12 mm',
    description: 'Para proyectos de alto volumen.',
    pricePerSquareMeter: 98000,
  },
]

export function calculateCustomLitros(dimensions: CustomPeceraDimensions | null): number {
  if (!dimensions) return 0
  const { largo, ancho, alto } = dimensions
  if (largo <= 0 || ancho <= 0 || alto <= 0) return 0
  return Math.round((largo * ancho * alto) / 1000)
}

export function calculateCustomGlassArea(dimensions: CustomPeceraDimensions | null): number {
  if (!dimensions) return 0
  const { largo, ancho, alto } = dimensions
  if (largo <= 0 || ancho <= 0 || alto <= 0) return 0
  const squareCentimeters = (largo * alto * 2) + (ancho * alto * 2) + (largo * ancho)
  return squareCentimeters / 10000
}

export function getCustomGlassOption(glassType: CustomGlassType | null) {
  return CUSTOM_GLASS_OPTIONS.find(option => option.id === glassType) ?? CUSTOM_GLASS_OPTIONS[0]
}

export function calculateCustomPrice(dimensions: CustomPeceraDimensions | null, glassType: CustomGlassType | null): number {
  const area = calculateCustomGlassArea(dimensions)
  if (area <= 0) return 0
  const glass = getCustomGlassOption(glassType)
  return Math.max(CUSTOM_MIN_PRICE, Math.round(area * glass.pricePerSquareMeter + CUSTOM_ASSEMBLY_BASE))
}

export function formatCustomDimensions(dimensions: CustomPeceraDimensions | null): string {
  if (!dimensions) return 'Dimensiones pendientes'
  return `${dimensions.largo} x ${dimensions.ancho} x ${dimensions.alto} cm`
}

interface CustomPeceraCardProps {
  selected: boolean
  dimensions: CustomPeceraDimensions | null
  glassType: CustomGlassType | null
  litros: number
  price: number
  onSelect: () => void
  onChange: (key: keyof CustomPeceraDimensions, value: number) => void
  onGlassChange: (glassType: CustomGlassType) => void
}

export function CustomPeceraCard({
  selected,
  dimensions,
  glassType,
  litros,
  price,
  onSelect,
  onChange,
  onGlassChange,
}: CustomPeceraCardProps) {
  const currentDimensions = dimensions ?? DEFAULT_CUSTOM_DIMENSIONS
  const selectedGlass = getCustomGlassOption(glassType)

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        selected ? 'border-teal bg-secondary ring-1 ring-teal' : 'border-border bg-background hover:border-teal hover:bg-secondary'
      }`}
    >
      <button type="button" onClick={onSelect} className="w-full text-left">
        <div className="relative mb-3 h-40 w-full">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20" />
          <div className="absolute inset-3 flex items-center justify-center rounded-md border border-dashed border-primary/40 bg-card shadow">
            <Settings className="h-8 w-8 text-primary/60" />
          </div>
        </div>
        <span className="mb-1 inline-block rounded-sm bg-accent/20 px-1.5 py-0.5 font-mono text-xs text-teal">
          {litros > 0 ? `${litros}L` : 'A medida'}
        </span>
        <div className="mb-0.5 text-sm font-medium text-foreground">Pecera a la medida</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{formatCustomDimensions(currentDimensions)}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{selectedGlass.label}</div>
        <div className="mt-2 font-mono text-sm font-medium text-primary">
          {price > 0 ? formatColones(price) : 'Precio pendiente'}
        </div>
      </button>

      {selected && (
        <div className="mt-3 border-t border-border pt-3">
          <div className="grid grid-cols-3 gap-2">
            <DimensionInput label="Largo" value={currentDimensions.largo} onChange={value => onChange('largo', value)} />
            <DimensionInput label="Ancho" value={currentDimensions.ancho} onChange={value => onChange('ancho', value)} />
            <DimensionInput label="Alto" value={currentDimensions.alto} onChange={value => onChange('alto', value)} />
          </div>
          <label className="mt-3 grid gap-1 text-xs text-muted-foreground">
            Vidrio
            <select
              value={selectedGlass.id}
              onChange={event => onGlassChange(event.target.value as CustomGlassType)}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none transition-colors focus:border-teal"
            >
              {CUSTOM_GLASS_OPTIONS.map(option => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-2 text-xs text-muted-foreground">{selectedGlass.description}</p>
        </div>
      )}
    </div>
  )
}

function DimensionInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-1 text-xs text-muted-foreground">
      {label}
      <input
        type="number"
        min={1}
        value={value}
        onChange={event => onChange(Number(event.target.value))}
        className="h-9 rounded-md border border-border bg-background px-2 font-mono text-sm text-foreground outline-none transition-colors focus:border-teal"
      />
    </label>
  )
}

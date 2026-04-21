'use client'

import { useState, useMemo } from 'react'
import { Minus, Plus, Fish as FishIcon } from 'lucide-react'
import { StepSection } from './StepSection'
import { ResumenSidebar } from './ResumenSidebar'
import { PECERAS, FILTROS, PECES, formatColones } from './data'
import type { ArmaTuPeceraState, WaterType, Fish, Filtro, Pecera } from './types'

const LITROS_POR_PEZ = 5

const INITIAL_STATE: ArmaTuPeceraState = {
  waterType: null,
  selectedPeceraId: null,
  selectedFiltroId: null,
  fishQuantities: {},
}

export function ArmaTuPeceraBuilder() {
  const [state, setState] = useState<ArmaTuPeceraState>(INITIAL_STATE)

  // Derived selections
  const selectedPecera = useMemo(
    () => PECERAS.find(p => p.id === state.selectedPeceraId) ?? null,
    [state.selectedPeceraId]
  )
  const selectedFiltro = useMemo(
    () => FILTROS.find(f => f.id === state.selectedFiltroId) ?? null,
    [state.selectedFiltroId]
  )
  const availableFish = useMemo(
    () => PECES.filter(f => f.waterType === state.waterType),
    [state.waterType]
  )

  // Incompatibility: a fish is blocked if any cart fish lists it as incompatible,
  // OR if it lists any cart fish in its own incompatibleWith.
  const incompatibleFishIds = useMemo(() => {
    const cartIds = new Set(
      Object.entries(state.fishQuantities)
        .filter(([, qty]) => qty > 0)
        .map(([id]) => id)
    )
    if (cartIds.size === 0) return new Set<string>()

    const blocked = new Set<string>()
    PECES.forEach(fish => {
      if (cartIds.has(fish.id)) return
      const blockedByCart = fish.incompatibleWith.some(id => cartIds.has(id))
      const blocksCart = [...cartIds].some(cartId => {
        const cartFish = PECES.find(f => f.id === cartId)
        return cartFish?.incompatibleWith.includes(fish.id) ?? false
      })
      if (blockedByCart || blocksCart) blocked.add(fish.id)
    })
    return blocked
  }, [state.fishQuantities])

  const totalPeces = useMemo(
    () => Object.values(state.fishQuantities).reduce((sum, qty) => sum + qty, 0),
    [state.fishQuantities]
  )
  const litrosUsados = totalPeces * LITROS_POR_PEZ

  const total = useMemo(() => {
    let sum = 0
    if (selectedPecera) sum += selectedPecera.price
    if (selectedFiltro) sum += selectedFiltro.price
    Object.entries(state.fishQuantities).forEach(([fishId, qty]) => {
      const fish = PECES.find(f => f.id === fishId)
      if (fish) sum += fish.price * qty
    })
    return sum
  }, [selectedPecera, selectedFiltro, state.fishQuantities])

  // --- Handlers ---
  const handleSelectWaterType = (wt: WaterType) => {
    setState({ waterType: wt, selectedPeceraId: null, selectedFiltroId: null, fishQuantities: {} })
  }

  const handleSelectPecera = (id: string) => {
    setState(prev => ({ ...prev, selectedPeceraId: id, selectedFiltroId: null, fishQuantities: {} }))
  }

  const handleSelectFiltro = (id: string) => {
    setState(prev => ({ ...prev, selectedFiltroId: id }))
  }

  const handleFishQty = (fishId: string, delta: number) => {
    setState(prev => {
      const fish = PECES.find(f => f.id === fishId)
      if (!fish) return prev
      const current = prev.fishQuantities[fishId] ?? 0
      const next = Math.max(0, Math.min(fish.maxQuantity, current + delta))
      const quantities = { ...prev.fishQuantities }
      if (next === 0) delete quantities[fishId]
      else quantities[fishId] = next
      return { ...prev, fishQuantities: quantities }
    })
  }

  const handleRemoveWaterType = () => setState(INITIAL_STATE)
  const handleRemovePecera = () =>
    setState(prev => ({ ...prev, selectedPeceraId: null, selectedFiltroId: null, fishQuantities: {} }))
  const handleRemoveFiltro = () =>
    setState(prev => ({ ...prev, selectedFiltroId: null }))
  const handleRemoveFish = (fishId: string) =>
    setState(prev => {
      const quantities = { ...prev.fishQuantities }
      delete quantities[fishId]
      return { ...prev, fishQuantities: quantities }
    })
  const handleClear = () => setState(INITIAL_STATE)

  // Step gating
  const step1Done = state.waterType !== null
  const step2Done = state.selectedPeceraId !== null
  const step3Done = state.selectedFiltroId !== null

  const densityPercent = selectedPecera
    ? Math.min(100, (litrosUsados / selectedPecera.litros) * 100)
    : 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Arma tu Pecera</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configura tu acuario paso a paso — cada elección desbloquea el siguiente paso.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_288px]">
        {/* Builder column */}
        <div className="flex flex-col gap-4">
          {/* Step 1 — Water type */}
          <StepSection
            step={1}
            title="Tipo de agua"
            description="Define el ecosistema base de tu acuario"
            isCompleted={step1Done}
            isLocked={false}
          >
            <div className="grid grid-cols-2 gap-3">
              <WaterTypeCard
                type="dulce"
                selected={state.waterType === 'dulce'}
                onClick={() => handleSelectWaterType('dulce')}
              />
              <WaterTypeCard
                type="salada"
                selected={state.waterType === 'salada'}
                onClick={() => handleSelectWaterType('salada')}
              />
            </div>
          </StepSection>

          {/* Step 2 — Pecera */}
          <StepSection
            step={2}
            title="Pecera"
            description="Elige el tamaño que más se ajuste a tu espacio"
            isCompleted={step2Done}
            isLocked={!step1Done}
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {PECERAS.map(pecera => (
                <PeceraCard
                  key={pecera.id}
                  pecera={pecera}
                  selected={state.selectedPeceraId === pecera.id}
                  onClick={() => handleSelectPecera(pecera.id)}
                />
              ))}
            </div>
          </StepSection>

          {/* Step 3 — Filtro */}
          <StepSection
            step={3}
            title="Filtro"
            description="Solo los filtros compatibles con tu pecera son seleccionables"
            isCompleted={step3Done}
            isLocked={!step2Done}
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {FILTROS.map(filtro => {
                const compatible = selectedPecera
                  ? selectedPecera.litros >= filtro.minLitros &&
                    selectedPecera.litros <= filtro.maxLitros
                  : false
                return (
                  <FiltroCard
                    key={filtro.id}
                    filtro={filtro}
                    selected={state.selectedFiltroId === filtro.id}
                    compatible={compatible}
                    onClick={() => compatible && handleSelectFiltro(filtro.id)}
                  />
                )
              })}
            </div>
          </StepSection>

          {/* Step 4 — Peces */}
          <StepSection
            step={4}
            title="Peces y fauna"
            description={
              state.waterType
                ? `Mostrando especies de agua ${state.waterType}`
                : 'Selecciona el tipo de agua primero'
            }
            isCompleted={Object.keys(state.fishQuantities).length > 0}
            isLocked={!step3Done}
          >
            {/* Density bar */}
            {selectedPecera && (
              <div className="mb-4">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Densidad del acuario</span>
                  <span
                    className={`font-mono font-medium ${
                      densityPercent >= 90
                        ? 'text-coral'
                        : densityPercent >= 70
                        ? 'text-sand'
                        : 'text-teal'
                    }`}
                  >
                    {Math.round(densityPercent)}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      densityPercent >= 90
                        ? 'bg-coral'
                        : densityPercent >= 70
                        ? 'bg-sand'
                        : 'bg-teal'
                    }`}
                    style={{ width: `${densityPercent}%` }}
                  />
                </div>
                {densityPercent >= 90 && (
                  <p className="mt-1.5 text-xs text-coral">
                    Capacidad crítica — considera una pecera más grande o reducir peces.
                  </p>
                )}
                {densityPercent >= 70 && densityPercent < 90 && (
                  <p className="mt-1.5 text-xs text-sand">
                    Acercándose al límite recomendado de densidad.
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-2">
              {availableFish.map(fish => {
                const qty = state.fishQuantities[fish.id] ?? 0
                const isIncompatible = incompatibleFishIds.has(fish.id)
                return (
                  <FishCard
                    key={fish.id}
                    fish={fish}
                    qty={qty}
                    isIncompatible={isIncompatible}
                    onAdd={() => handleFishQty(fish.id, 1)}
                    onRemove={() => handleFishQty(fish.id, -1)}
                  />
                )
              })}
            </div>
          </StepSection>
        </div>

        {/* Sidebar column */}
        <div className="sticky top-4 self-start">
          <ResumenSidebar
            state={state}
            total={total}
            litrosUsados={litrosUsados}
            totalPeces={totalPeces}
            onRemoveWaterType={handleRemoveWaterType}
            onRemovePecera={handleRemovePecera}
            onRemoveFiltro={handleRemoveFiltro}
            onRemoveFish={handleRemoveFish}
            onClear={handleClear}
          />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function WaterTypeCard({
  type,
  selected,
  onClick,
}: {
  type: WaterType
  selected: boolean
  onClick: () => void
}) {
  const config = {
    dulce: {
      icon: '💧',
      label: 'Agua Dulce',
      description: 'Lagos, ríos y estanques. Gran variedad de especies tropicales coloridas.',
    },
    salada: {
      icon: '🌊',
      label: 'Agua Salada',
      description: 'Ecosistemas de arrecife. Peces exóticos de alto impacto visual.',
    },
  }[type]

  return (
    <button
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition-colors ${
        selected
          ? 'border-teal bg-secondary ring-1 ring-teal'
          : 'border-border bg-background hover:border-teal hover:bg-secondary'
      }`}
    >
      <div className="mb-2 text-3xl">{config.icon}</div>
      <div className="text-sm font-medium text-foreground">{config.label}</div>
      <div className="mt-1 text-xs text-muted-foreground">{config.description}</div>
    </button>
  )
}

function PeceraCard({
  pecera,
  selected,
  onClick,
}: {
  pecera: Pecera
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border p-3 text-left transition-colors ${
        selected
          ? 'border-teal bg-secondary ring-1 ring-teal'
          : 'border-border bg-background hover:border-teal hover:bg-secondary'
      }`}
    >
      <div className="relative mb-1 h-40 w-40">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20" />
        <div className="absolute inset-1.5 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30" />
        <div className="absolute inset-3 flex items-center justify-center rounded-md bg-card shadow">
          {pecera.image
            ? <img src={pecera.image} alt={pecera.name} className="h-full w-full object-cover rounded-md" />
            : <FishIcon className="h-8 w-8 text-primary/50" />}
        </div>
      </div>
      <span className="mb-1 inline-block rounded-sm bg-accent/20 px-1.5 py-0.5 font-mono text-xs text-teal">
        {pecera.litros}L
      </span>
      <div className="mb-0.5 text-sm font-medium text-foreground">{pecera.name}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{pecera.dimensions}</div>
      <div className="mt-2 font-mono text-sm font-medium text-primary">
        {formatColones(pecera.price)}
      </div>
    </button>
  )
}

function FiltroCard({
  filtro,
  selected,
  compatible,
  onClick,
}: {
  filtro: Filtro
  selected: boolean
  compatible: boolean
  onClick: () => void
}) {
  const rangeLabel =
    filtro.maxLitros === Infinity
      ? `${filtro.minLitros}L+`
      : `${filtro.minLitros}–${filtro.maxLitros}L`

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border p-3 transition-colors ${
        !compatible
          ? 'cursor-not-allowed opacity-40'
          : selected
          ? 'cursor-pointer border-teal bg-secondary ring-1 ring-teal'
          : 'cursor-pointer border-border bg-background hover:border-teal hover:bg-secondary'
      }`}
    >
      <div className="relative mb-1 h-40 w-40">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20" />
        <div className="absolute inset-1.5 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30" />
        <div className="absolute inset-3 flex items-center justify-center rounded-md bg-card shadow">
          {filtro.image
            ? <img src={filtro.image} alt={filtro.name} className="h-full w-full object-cover rounded-md" />
            : <FishIcon className="h-8 w-8 text-primary/50" />}
        </div>
      </div>
      <span
        className={`mb-1 inline-block rounded-sm px-1.5 py-0.5 text-xs ${
          compatible ? 'bg-accent/20 text-teal' : 'bg-destructive/20 text-destructive'
        }`}
      >
        {compatible ? 'Compatible' : 'Incompatible'}
      </span>
      <div className="mb-0.5 text-sm font-medium text-foreground">{filtro.name}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">
        {filtro.tipo} · {rangeLabel}
      </div>
      <div className="mt-2 font-mono text-sm font-medium text-primary">
        {formatColones(filtro.price)}
      </div>
    </div>
  )
}

const TEMPERAMENT_BADGE: Record<
  Fish['temperament'],
  { label: string; className: string }
> = {
  pacifico: { label: 'Pacífico', className: 'bg-accent/20 text-teal' },
  solitario: { label: 'Solitario', className: 'bg-accent/20 text-teal' },
  agresivo: { label: 'Agresivo', className: 'bg-destructive/20 text-destructive' },
  semiagresivo: { label: 'Semiagresi…', className: 'bg-sand/30 text-sand' },
  predador: { label: 'Predador', className: 'bg-destructive/20 text-destructive' },
}

function FishCard({
  fish,
  qty,
  isIncompatible,
  onAdd,
  onRemove,
}: {
  fish: Fish
  qty: number
  isIncompatible: boolean
  onAdd: () => void
  onRemove: () => void
}) {
  const badge = TEMPERAMENT_BADGE[fish.temperament]
  const atMax = qty >= fish.maxQuantity
  const isBlocked = isIncompatible && qty === 0

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        isBlocked
          ? 'pointer-events-none cursor-not-allowed border-border bg-background opacity-40'
          : qty > 0
          ? 'border-teal bg-secondary ring-1 ring-teal'
          : 'border-border bg-background'
      }`}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="relative h-14 w-14 shrink-0">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20" />
            <div className="absolute inset-1 rounded-md bg-gradient-to-br from-primary/30 to-accent/30" />
            <div className="absolute inset-2 flex items-center justify-center rounded-sm bg-card shadow">
              {fish.image
                ? <img src={fish.image} alt={fish.name} className="h-full w-full object-cover rounded-sm" />
                : <FishIcon className="h-4 w-4 text-primary/50" />}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-foreground leading-tight">{fish.name}</div>
            <span className={`inline-block rounded-sm px-1.5 py-0.5 text-xs ${badge.className}`}>
              {badge.label}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-xs text-primary">
            {formatColones(fish.price)}
          </div>
          <div className="text-xs text-muted-foreground">c/u</div>
        </div>
      </div>

      <p className="mb-2.5 text-xs text-muted-foreground line-clamp-2">{fish.description}</p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Máx. {fish.maxQuantity}</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onRemove}
            disabled={qty === 0}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-5 text-center font-mono text-sm font-medium text-foreground">
            {qty}
          </span>
          <button
            onClick={onAdd}
            disabled={atMax}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle, Fish as FishIcon, Lightbulb, Minus, Package, Plus, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { StepSection } from './StepSection'
import { ResumenSidebar } from './ResumenSidebar'
import { VistaPecera3D } from './VistaPecera3D'
import {
  ACCESORIOS_OPCIONALES,
  FILTROS,
  ILUMINACIONES,
  PECERAS,
  PECERAS_PREDISENO,
  PECES,
  formatColones,
} from './data'
import type {
  AccesorioOpcional,
  AquariumMode,
  ArmaTuPeceraStateExtended,
  Filtro,
  Fish,
  Iluminacion,
  Pecera,
  PeceraPrediseno,
  WaterType,
} from './types'

const LITROS_POR_PEZ = 5
const DRAFT_STORAGE_KEY = 'arma-tu-pecera-draft'

const INITIAL_STATE: ArmaTuPeceraStateExtended = {
  mode: null,
  waterType: null,
  selectedPeceraId: null,
  selectedFiltroId: null,
  selectedIluminacionId: null,
  accesoriosSeleccionados: {},
  fishQuantities: {},
}

function normalizeDraft(draft: Partial<ArmaTuPeceraStateExtended>): ArmaTuPeceraStateExtended {
  return {
    ...INITIAL_STATE,
    ...draft,
    accesoriosSeleccionados: draft.accesoriosSeleccionados ?? {},
    fishQuantities: draft.fishQuantities ?? {},
  }
}

export function ArmaTuPeceraBuilder() {
  const [state, setState] = useState<ArmaTuPeceraStateExtended>(INITIAL_STATE)
  const [hasDraft, setHasDraft] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (!saved) return

      const draft = JSON.parse(saved) as Partial<ArmaTuPeceraStateExtended>
      if (!draft || typeof draft !== 'object') return

      setState(normalizeDraft(draft))
      setHasDraft(true)
      toast.success('Se cargó tu última configuración guardada.')
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
    }
  }, [])

  const selectedPecera = useMemo(
    () => PECERAS.find(p => p.id === state.selectedPeceraId) ?? null,
    [state.selectedPeceraId],
  )
  const selectedFiltro = useMemo(
    () => FILTROS.find(f => f.id === state.selectedFiltroId) ?? null,
    [state.selectedFiltroId],
  )
  const selectedIluminacion = useMemo(
    () => ILUMINACIONES.find(l => l.id === state.selectedIluminacionId) ?? null,
    [state.selectedIluminacionId],
  )
  const selectedPrediseno = useMemo(
    () => PECERAS_PREDISENO.find(p => p.id === state.selectedPeceraId) ?? null,
    [state.selectedPeceraId],
  )
  const accesoriosActivos = useMemo(
    () => ACCESORIOS_OPCIONALES.filter(a => state.accesoriosSeleccionados[a.id]),
    [state.accesoriosSeleccionados],
  )
  const availableFish = useMemo(
    () => PECES.filter(f => f.waterType === state.waterType),
    [state.waterType],
  )

  const incompatibleFishIds = useMemo(() => {
    const cartIds = new Set(
      Object.entries(state.fishQuantities)
        .filter(([, qty]) => qty > 0)
        .map(([id]) => id),
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
    [state.fishQuantities],
  )
  const litrosUsados = totalPeces * LITROS_POR_PEZ
  const litrosBase = state.mode === 'prediseno'
    ? selectedPrediseno?.litros ?? 0
    : selectedPecera?.litros ?? 0

  const total = useMemo(() => {
    let sum = 0
    if (state.mode === 'prediseno' && selectedPrediseno) {
      sum += selectedPrediseno.price
    } else {
      if (selectedPecera) sum += selectedPecera.price
      if (selectedFiltro) sum += selectedFiltro.price
    }
    if (selectedIluminacion) sum += selectedIluminacion.price
    accesoriosActivos.forEach(accesorio => {
      sum += accesorio.price
    })
    Object.entries(state.fishQuantities).forEach(([fishId, qty]) => {
      const fish = PECES.find(f => f.id === fishId)
      if (fish) sum += fish.price * qty
    })
    return sum
  }, [accesoriosActivos, selectedFiltro, selectedIluminacion, selectedPecera, selectedPrediseno, state.fishQuantities, state.mode])

  const fishItems = useMemo(
    () =>
      Object.entries(state.fishQuantities)
        .map(([fishId, qty]) => ({ fish: PECES.find(f => f.id === fishId), qty }))
        .filter((item): item is { fish: Fish; qty: number } => Boolean(item.fish)),
    [state.fishQuantities],
  )

  const handleSaveDraft = useCallback(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(state))
      setHasDraft(true)
      toast.success('Configuración guardada. Puedes completarla después.')
    } catch {
      toast.error('No se pudo guardar la configuración.')
    }
  }, [state])

  const handleLoadDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (!saved) {
        setHasDraft(false)
        toast.error('No hay configuración guardada.')
        return
      }

      const draft = JSON.parse(saved) as Partial<ArmaTuPeceraStateExtended>
      setState(normalizeDraft(draft))
      setHasDraft(true)
      toast.success('Configuración guardada cargada correctamente.')
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
      setHasDraft(false)
      toast.error('No se pudo cargar la configuración guardada.')
    }
  }, [])

  const handleClearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_STORAGE_KEY)
    setHasDraft(false)
    toast.success('Se borró la configuración guardada.')
  }, [])

  const handleSelectMode = (mode: AquariumMode) => setState({ ...INITIAL_STATE, mode })

  const handleSelectWaterType = (wt: WaterType) =>
    setState(prev => ({
      ...prev,
      waterType: wt,
      selectedPeceraId: null,
      selectedFiltroId: null,
      selectedIluminacionId: null,
      accesoriosSeleccionados: {},
      fishQuantities: {},
    }))

  const handleSelectPecera = (id: string) =>
    setState(prev => ({
      ...prev,
      selectedPeceraId: id,
      selectedFiltroId: null,
      selectedIluminacionId: null,
      fishQuantities: {},
    }))

  const handleSelectFiltro = (id: string) =>
    setState(prev => ({ ...prev, selectedFiltroId: id }))

  const handleSelectIluminacion = (id: string) =>
    setState(prev => ({
      ...prev,
      selectedIluminacionId: prev.selectedIluminacionId === id ? null : id,
    }))

  const handleToggleAccesorio = (id: string) =>
    setState(prev => ({
      ...prev,
      accesoriosSeleccionados: {
        ...prev.accesoriosSeleccionados,
        [id]: !prev.accesoriosSeleccionados[id],
      },
    }))

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

  const handleRemoveWaterType = () =>
    setState(prev => ({
      ...prev,
      waterType: null,
      selectedPeceraId: null,
      selectedFiltroId: null,
      selectedIluminacionId: null,
      accesoriosSeleccionados: {},
      fishQuantities: {},
    }))
  const handleRemovePecera = () =>
    setState(prev => ({
      ...prev,
      selectedPeceraId: null,
      selectedFiltroId: null,
      selectedIluminacionId: null,
      fishQuantities: {},
    }))
  const handleRemoveFiltro = () =>
    setState(prev => ({ ...prev, selectedFiltroId: null }))
  const handleRemoveIluminacion = () =>
    setState(prev => ({ ...prev, selectedIluminacionId: null }))
  const handleRemoveAccesorio = (accesorioId: string) =>
    setState(prev => {
      const accesoriosSeleccionados = { ...prev.accesoriosSeleccionados }
      delete accesoriosSeleccionados[accesorioId]
      return { ...prev, accesoriosSeleccionados }
    })
  const handleRemoveFish = (fishId: string) =>
    setState(prev => {
      const quantities = { ...prev.fishQuantities }
      delete quantities[fishId]
      return { ...prev, fishQuantities: quantities }
    })
  const handleClear = () => setState(INITIAL_STATE)
  const handlePrint = () => window.print()

  const step0Done = state.mode !== null
  const step1Done = state.waterType !== null
  const step2Done = state.selectedPeceraId !== null
  const step3Done = state.mode === 'prediseno' ? step2Done : state.selectedFiltroId !== null
  const step4Done = state.selectedIluminacionId !== null
  const densityPercent = litrosBase
    ? Math.min(100, (litrosUsados / litrosBase) * 100)
    : 0

  return (
    <>
      <div className="hidden print:block">
        <div className="mx-auto max-w-4xl px-6 py-10 text-foreground">
          <div className="mb-8 border-b border-border pb-6">
            <h1 className="text-3xl font-bold">Presupuesto de Pecera</h1>
            <p className="mt-2 text-sm text-muted-foreground">La Casa del Pez</p>
          </div>

          <section className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Resumen de la configuración
            </h2>
            <dl className="grid gap-2 text-sm leading-relaxed">
              <PrintRow label="Modo" value={state.mode === 'prediseno' ? 'Kit prediseñado' : state.mode === 'personalizada' ? 'Personalizada' : 'No seleccionado'} />
              <PrintRow label="Tipo de agua" value={state.waterType === 'salada' ? 'Agua Salada' : state.waterType === 'dulce' ? 'Agua Dulce' : 'No seleccionada'} />
              <PrintRow label={state.mode === 'prediseno' ? 'Kit' : 'Pecera'} value={(selectedPrediseno ?? selectedPecera)?.name ?? 'No seleccionada'} />
              <PrintRow label="Filtro" value={state.mode === 'prediseno' ? 'Incluido en el kit' : selectedFiltro?.name ?? 'No seleccionado'} />
              <PrintRow label="Iluminación" value={selectedIluminacion?.name ?? 'No seleccionada'} />
              <PrintRow label="Litros usados" value={litrosBase ? `${litrosUsados}L / ${litrosBase}L` : '-'} />
              <PrintRow label="Total de peces" value={String(totalPeces)} />
            </dl>
          </section>

          <section className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Accesorios adicionales
            </h2>
            {accesoriosActivos.length > 0 ? (
              <ul className="grid gap-2 text-sm">
                {accesoriosActivos.map(accesorio => (
                  <li key={accesorio.id} className="flex justify-between">
                    <span>{accesorio.name}</span>
                    <span>{formatColones(accesorio.price)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No hay accesorios seleccionados.</p>
            )}
          </section>

          <section className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Desglose de peces
            </h2>
            {fishItems.length > 0 ? (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-border pb-2 text-left">Especie</th>
                    <th className="border-b border-border pb-2 text-right">Cantidad</th>
                    <th className="border-b border-border pb-2 text-right">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {fishItems.map(({ fish, qty }) => (
                    <tr key={fish.id}>
                      <td className="py-2">{fish.name}</td>
                      <td className="py-2 text-right">{qty}</td>
                      <td className="py-2 text-right">{formatColones(fish.price * qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">No hay peces seleccionados.</p>
            )}
          </section>

          <section className="mb-6">
            <div className="flex justify-between border-t border-border pt-4 text-base font-semibold">
              <span>Total del presupuesto</span>
              <span>{formatColones(total)}</span>
            </div>
          </section>

          <footer className="text-xs text-muted-foreground">
            Documento generado el {new Date().toLocaleDateString('es-CR')}.
          </footer>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 print:hidden">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Arma tu Pecera</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configura tu acuario paso a paso - cada elección desbloquea el siguiente paso.
          </p>
          <div className="mt-4 rounded-3xl border border-border bg-secondary/70 p-4 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-foreground/80">Precio total final</span>
              <span className="font-mono text-lg font-semibold text-primary">
                {formatColones(total)}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Se suma el precio de la configuración, iluminación, accesorios y especies seleccionadas.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_288px]">
          <div className="flex flex-col gap-4">
            <StepSection
              step={1}
              title="¿Cómo querés tu pecera?"
              description="Elegí entre una opción lista o personalizala a tu gusto"
              isCompleted={step0Done}
              isLocked={false}
            >
              <div className="grid grid-cols-2 gap-3">
                <ModeCard mode="prediseno" selected={state.mode === 'prediseno'} onClick={() => handleSelectMode('prediseno')} />
                <ModeCard mode="personalizada" selected={state.mode === 'personalizada'} onClick={() => handleSelectMode('personalizada')} />
              </div>
            </StepSection>

            <StepSection
              step={2}
              title="Tipo de agua"
              description="Define el ecosistema base de tu acuario"
              isCompleted={step1Done}
              isLocked={!step0Done}
            >
              <div className="grid grid-cols-2 gap-3">
                <WaterTypeCard type="dulce" selected={state.waterType === 'dulce'} onClick={() => handleSelectWaterType('dulce')} />
                <WaterTypeCard type="salada" selected={state.waterType === 'salada'} onClick={() => handleSelectWaterType('salada')} />
              </div>
            </StepSection>

            <StepSection
              step={3}
              title={state.mode === 'prediseno' ? 'Elige tu kit completo' : 'Pecera'}
              description={
                state.mode === 'prediseno'
                  ? 'Kits completos listos para montar, adaptados a tu tipo de agua'
                  : 'Elige el tamaño que más se ajuste a tu espacio'
              }
              isCompleted={step2Done}
              isLocked={!step1Done}
            >
              {state.mode === 'prediseno' ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {PECERAS_PREDISENO
                    .filter(pecera => !state.waterType || pecera.waterType.includes(state.waterType))
                    .map(pecera => (
                      <PredisenoCard
                        key={pecera.id}
                        pecera={pecera}
                        selected={state.selectedPeceraId === pecera.id}
                        onClick={() => handleSelectPecera(pecera.id)}
                      />
                    ))}
                </div>
              ) : (
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
              )}
            </StepSection>

            {state.mode === 'personalizada' && (
              <StepSection
                step={4}
                title="Filtro"
                description="Solo los filtros compatibles con tu pecera son seleccionables"
                isCompleted={step3Done}
                isLocked={!step2Done}
              >
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {FILTROS.map(filtro => {
                    const compatible = selectedPecera
                      ? selectedPecera.litros >= filtro.minLitros && selectedPecera.litros <= filtro.maxLitros
                      : false
                    return (
                      <FiltroCard
                        key={filtro.id}
                        filtro={filtro}
                        selected={state.selectedFiltroId === filtro.id}
                        compatible={compatible}
                        litrosPecera={selectedPecera?.litros ?? null}
                        onClick={() => compatible && handleSelectFiltro(filtro.id)}
                      />
                    )
                  })}
                </div>
              </StepSection>
            )}

            <StepSection
              step={state.mode === 'personalizada' ? 5 : 4}
              title="Sistema de iluminación"
              description="Elige la luz adecuada según el tamaño de tu pecera y sus habitantes"
              isCompleted={step4Done}
              isLocked={!step3Done}
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {ILUMINACIONES.map(luz => {
                  const compatible = litrosBase > 0
                    ? litrosBase >= luz.minLitros && litrosBase <= luz.maxLitros
                    : true
                  return (
                    <IluminacionCard
                      key={luz.id}
                      luz={luz}
                      selected={state.selectedIluminacionId === luz.id}
                      compatible={compatible}
                      onClick={() => compatible && handleSelectIluminacion(luz.id)}
                    />
                  )
                })}
              </div>
            </StepSection>

            <StepSection
              step={state.mode === 'personalizada' ? 6 : 5}
              title="Accesorios adicionales"
              description="Completa tu pecera con los extras que necesitás"
              isCompleted={accesoriosActivos.length > 0}
              isLocked={!step4Done}
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {ACCESORIOS_OPCIONALES.map(accesorio => (
                  <AccesorioCard
                    key={accesorio.id}
                    accesorio={accesorio}
                    selected={!!state.accesoriosSeleccionados[accesorio.id]}
                    onClick={() => handleToggleAccesorio(accesorio.id)}
                  />
                ))}
              </div>
            </StepSection>

            <StepSection
              step={state.mode === 'personalizada' ? 7 : 6}
              title="Peces y fauna"
              description={
                state.waterType
                  ? `Mostrando especies de agua ${state.waterType}`
                  : 'Selecciona el tipo de agua primero'
              }
              isCompleted={Object.keys(state.fishQuantities).length > 0}
              isLocked={!step4Done}
            >
              {litrosBase > 0 && (
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
                      Capacidad crítica - considera una pecera más grande o reducir peces.
                    </p>
                  )}
                  {densityPercent >= 70 && densityPercent < 90 && (
                    <p className="mt-1.5 text-xs text-sand">
                      Acercándose al límite recomendado de densidad.
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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

            <VistaPecera3D
              waterType={state.waterType}
              peceraId={state.selectedPeceraId}
              filtroId={state.selectedFiltroId}
              iluminacionId={state.selectedIluminacionId}
              accesoriosSeleccionados={state.accesoriosSeleccionados}
              fishQuantities={state.fishQuantities}
            />
          </div>

          <div className="sticky top-4 self-start">
            <ResumenSidebar
              state={state}
              total={total}
              litrosUsados={litrosUsados}
              totalPeces={totalPeces}
              onRemoveWaterType={handleRemoveWaterType}
              onRemovePecera={handleRemovePecera}
              onRemoveFiltro={handleRemoveFiltro}
              onRemoveIluminacion={handleRemoveIluminacion}
              onRemoveAccesorio={handleRemoveAccesorio}
              onRemoveFish={handleRemoveFish}
              onClear={handleClear}
              onSaveDraft={handleSaveDraft}
              onLoadDraft={handleLoadDraft}
              onClearDraft={handleClearDraft}
              onPrint={handlePrint}
              hasDraft={hasDraft}
            />
          </div>
        </div>
      </div>
    </>
  )
}

function PrintRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function ModeCard({ mode, selected, onClick }: { mode: AquariumMode; selected: boolean; onClick: () => void }) {
  const config = {
    prediseno: {
      icon: <Package className="h-8 w-8 text-primary" />,
      label: 'Kit prediseñado',
      description: 'Seleccioná un kit completo ya armado, listo para llevar a casa.',
    },
    personalizada: {
      icon: <Settings className="h-8 w-8 text-primary" />,
      label: 'Personalizada',
      description: 'Elegí cada componente por separado según tus preferencias.',
    },
  }[mode]

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition-colors ${
        selected
          ? 'border-teal bg-secondary ring-1 ring-teal'
          : 'border-border bg-background hover:border-teal hover:bg-secondary'
      }`}
    >
      <div className="mb-2">{config.icon}</div>
      <div className="text-sm font-medium text-foreground">{config.label}</div>
      <div className="mt-1 text-xs text-muted-foreground">{config.description}</div>
      {selected && <CheckCircle className="mt-2 h-4 w-4 text-teal" />}
    </button>
  )
}

function WaterTypeCard({ type, selected, onClick }: { type: WaterType; selected: boolean; onClick: () => void }) {
  const config = {
    dulce: { icon: '💧', label: 'Agua Dulce', description: 'Lagos, ríos y estanques. Gran variedad de especies tropicales coloridas.' },
    salada: { icon: '🌊', label: 'Agua Salada', description: 'Ecosistemas de arrecife. Peces exóticos de alto impacto visual.' },
  }[type]

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition-colors ${
        selected ? 'border-teal bg-secondary ring-1 ring-teal' : 'border-border bg-background hover:border-teal hover:bg-secondary'
      }`}
    >
      <div className="mb-2 text-3xl">{config.icon}</div>
      <div className="text-sm font-medium text-foreground">{config.label}</div>
      <div className="mt-1 text-xs text-muted-foreground">{config.description}</div>
    </button>
  )
}

function PredisenoCard({ pecera, selected, onClick }: { pecera: PeceraPrediseno; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition-colors ${
        selected ? 'border-teal bg-secondary ring-1 ring-teal' : 'border-border bg-background hover:border-teal hover:bg-secondary'
      }`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">{pecera.name}</span>
        <span className="font-mono text-xs text-muted-foreground">{pecera.litros}L</span>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">{pecera.descripcion}</p>
      <ul className="mb-3 grid gap-0.5">
        {pecera.incluye.map(item => (
          <li key={item} className="flex items-center gap-1.5 text-xs text-foreground/80">
            <CheckCircle className="h-3 w-3 shrink-0 text-green-500" />
            {item}
          </li>
        ))}
      </ul>
      <div className="font-mono text-sm font-bold text-primary">{formatColones(pecera.price)}</div>
    </button>
  )
}

function PeceraCard({ pecera, selected, onClick }: { pecera: Pecera; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-3 text-left transition-colors ${
        selected ? 'border-teal bg-secondary ring-1 ring-teal' : 'border-border bg-background hover:border-teal hover:bg-secondary'
      }`}
    >
      <div className="relative mb-1 h-40 w-full">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20" />
        <div className="absolute inset-1.5 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30" />
        <div className="absolute inset-3 flex items-center justify-center rounded-md bg-card shadow">
          {pecera.image ? (
            <img src={pecera.image} alt={pecera.name} className="h-full w-full rounded-md object-cover" />
          ) : (
            <FishIcon className="h-8 w-8 text-primary/50" />
          )}
        </div>
      </div>
      <span className="mb-1 inline-block rounded-sm bg-accent/20 px-1.5 py-0.5 font-mono text-xs text-teal">{pecera.litros}L</span>
      <div className="mb-0.5 text-sm font-medium text-foreground">{pecera.name}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{pecera.dimensions}</div>
      <div className="mt-2 font-mono text-sm font-medium text-primary">{formatColones(pecera.price)}</div>
    </button>
  )
}

function FiltroCard({
  filtro,
  selected,
  compatible,
  litrosPecera,
  onClick,
}: {
  filtro: Filtro
  selected: boolean
  compatible: boolean
  litrosPecera: number | null
  onClick: () => void
}) {
  const rangeLabel =
    filtro.maxLitros === Infinity
      ? `${filtro.minLitros}L+`
      : `${filtro.minLitros}-${filtro.maxLitros}L`

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
      <div className="relative mb-1 h-40 w-full">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20" />
        <div className="absolute inset-1.5 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30" />
        <div className="absolute inset-3 flex items-center justify-center rounded-md bg-card shadow">
          {filtro.image ? (
            <img src={filtro.image} alt={filtro.name} className="h-full w-full rounded-md object-cover" />
          ) : (
            <FishIcon className="h-8 w-8 text-primary/50" />
          )}
        </div>
      </div>
      <span className={`mb-1 inline-block rounded-sm px-1.5 py-0.5 text-xs ${compatible ? 'bg-accent/20 text-teal' : 'bg-destructive/20 text-destructive'}`}>
        {compatible ? 'Compatible' : 'Incompatible'}
      </span>
      <div className="mb-0.5 text-sm font-medium text-foreground">{filtro.name}</div>
      {!compatible && litrosPecera !== null && (
        <p className="mb-2 text-xs text-destructive">
          Requiere una pecera entre {filtro.minLitros}L y {filtro.maxLitros === Infinity ? 'más litros' : `${filtro.maxLitros}L`}
        </p>
      )}
      <div className="mt-0.5 text-xs text-muted-foreground">{filtro.tipo} · {rangeLabel}</div>
      <div className="mt-2 font-mono text-sm font-medium text-primary">{formatColones(filtro.price)}</div>
    </div>
  )
}

function IluminacionCard({ luz, selected, compatible, onClick }: { luz: Iluminacion; selected: boolean; compatible: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg border p-3 transition-colors ${
        !compatible ? 'cursor-not-allowed opacity-40'
          : selected ? 'cursor-pointer border-teal bg-secondary ring-1 ring-teal'
            : 'cursor-pointer border-border bg-background hover:border-teal hover:bg-secondary'
      }`}
    >
      <div className="relative mb-1 flex h-24 w-full items-center justify-center rounded-lg bg-gradient-to-br from-yellow-100/30 to-orange-100/30">
        <Lightbulb className={`h-8 w-8 ${selected ? 'text-yellow-500' : 'text-yellow-400/60'}`} />
      </div>
      <span className={`mb-1 inline-block rounded-sm px-1.5 py-0.5 text-xs ${compatible ? 'bg-accent/20 text-teal' : 'bg-destructive/20 text-destructive'}`}>
        {compatible ? luz.tipo : 'Incompatible'}
      </span>
      <div className="text-sm font-medium text-foreground">{luz.name}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{luz.potencia} · {luz.cobertura}</div>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{luz.descripcion}</p>
      <div className="mt-2 font-mono text-sm font-medium text-primary">{formatColones(luz.price)}</div>
    </div>
  )
}

function AccesorioCard({ accesorio, selected, onClick }: { accesorio: AccesorioOpcional; selected: boolean; onClick: () => void }) {
  const categoryEmoji: Record<string, string> = {
    calefaccion: '🌡️',
    co2: '💨',
    sustrato: '🪨',
    proteccion: '🛡️',
    monitoreo: '📊',
    mantenimiento: '🧹',
    'tratamiento-agua': '💧',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-3 text-left transition-colors ${
        selected ? 'border-teal bg-secondary ring-1 ring-teal' : 'border-border bg-background hover:border-teal hover:bg-secondary'
      }`}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <span className="text-xl">{categoryEmoji[accesorio.categoria] ?? '📦'}</span>
        {selected && <CheckCircle className="h-4 w-4 shrink-0 text-teal" />}
      </div>
      <div className="text-sm font-medium text-foreground">{accesorio.name}</div>
      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{accesorio.descripcion}</p>
      <div className="mt-2 font-mono text-sm font-medium text-primary">{formatColones(accesorio.price)}</div>
    </button>
  )
}

const TEMPERAMENT_BADGE: Record<Fish['temperament'], { label: string; className: string }> = {
  pacifico: { label: 'Pacífico', className: 'bg-accent/20 text-teal' },
  solitario: { label: 'Solitario', className: 'bg-accent/20 text-teal' },
  agresivo: { label: 'Agresivo', className: 'bg-destructive/20 text-destructive' },
  semiagresivo: { label: 'Semiagresivo', className: 'bg-sand/30 text-sand' },
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
  const isBlocked = isIncompatible && qty === 0

  return (
    <div className={`rounded-lg border p-3 transition-colors ${
      isBlocked ? 'pointer-events-none opacity-40'
        : qty > 0 ? 'border-teal bg-secondary ring-1 ring-teal'
          : 'border-border bg-background'
    }`}>
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="relative h-14 w-14 shrink-0">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20" />
            <div className="absolute inset-1 rounded-md bg-gradient-to-br from-primary/30 to-accent/30" />
            <div className="absolute inset-2 flex items-center justify-center rounded-sm bg-card shadow">
              {fish.image ? (
                <img src={fish.image} alt={fish.name} className="h-full w-full rounded-sm object-cover" />
              ) : (
                <FishIcon className="h-4 w-4 text-primary/50" />
              )}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium leading-tight text-foreground">{fish.name}</div>
            <span className={`inline-block rounded-sm px-1.5 py-0.5 text-xs ${badge.className}`}>{badge.label}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-xs text-primary">{formatColones(fish.price)}</div>
          <div className="text-xs text-muted-foreground">c/u</div>
        </div>
      </div>
      <p className="mb-2.5 line-clamp-2 text-xs text-muted-foreground">{fish.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Máx. {fish.maxQuantity}</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onRemove}
            disabled={qty === 0}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-5 text-center font-mono text-sm font-medium text-foreground">{qty}</span>
          <button
            type="button"
            onClick={onAdd}
            disabled={qty >= fish.maxQuantity}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

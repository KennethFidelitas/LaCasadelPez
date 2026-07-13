'use client'

import { useMemo } from 'react'
import { FILTROS, PECERAS, PECES } from './data'
import type { WaterType } from './types'

interface Props {
  waterType: WaterType | null
  peceraId: string | null
  filtroId: string | null
  fishQuantities: Record<string, number>
}

interface PezEscena {
  id: string
  instance: number
  name: string
  color: string
  image?: string
  left: number
  top: number
  delay: number
}

export function VistaPecera3D({
  waterType,
  peceraId,
  filtroId,
  fishQuantities,
}: Props) {
  const pecera = PECERAS.find(item => item.id === peceraId) ?? null
  const filtro = FILTROS.find(item => item.id === filtroId) ?? null

  const peces = useMemo<PezEscena[]>(() => {
    const resultado: PezEscena[] = []

    Object.entries(fishQuantities).forEach(([fishId, cantidad]) => {
      const pez = PECES.find(item => item.id === fishId)
      if (!pez) return

      for (let index = 0; index < cantidad; index += 1) {
        const globalIndex = resultado.length
        resultado.push({
          id: pez.id,
          instance: index,
          name: pez.name,
          color: obtenerColorPez(pez.id),
          image: pez.image,
          left: 14 + ((globalIndex * 17) % 68),
          top: 24 + ((globalIndex * 19) % 48),
          delay: (globalIndex % 6) * 0.45,
        })
      }
    })

    return resultado
  }, [fishQuantities])

  if (!pecera) {
    return (
      <div className="rounded-xl border border-border bg-background p-8 text-center text-sm text-muted-foreground">
        Selecciona una pecera para activar la vista previa.
      </div>
    )
  }

  const waterClass = waterType === 'salada'
    ? 'from-sky-500/35 via-cyan-400/20 to-blue-700/35'
    : 'from-emerald-500/30 via-teal-400/20 to-cyan-700/30'

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-slate-950">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white">
        <div>
          <h3 className="text-sm font-semibold">Vista previa de tu pecera</h3>
          <p className="text-xs text-slate-400">
            Representación visual de capacidad, filtro y fauna seleccionada.
          </p>
        </div>

        <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
          {pecera.litros} L
        </span>
      </div>

      <div className="relative h-[420px] w-full overflow-hidden bg-[radial-gradient(circle_at_top,#12385a,#06111f_58%)]">
        <div className="absolute inset-x-[8%] bottom-12 top-12 rounded-xl border border-cyan-100/35 bg-white/5 shadow-2xl shadow-cyan-500/10">
          <div className={`absolute inset-3 rounded-lg bg-gradient-to-br ${waterClass}`} />
          <div className="absolute inset-3 rounded-lg bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.20)_18%,transparent_34%)]" />

          <div className="absolute inset-x-6 bottom-4 h-8 rounded-[50%] bg-amber-200/50 blur-sm" />
          <div className="absolute inset-x-8 bottom-5 flex justify-between">
            {Array.from({ length: 14 }).map((_, index) => (
              <span
                key={index}
                className="block rounded-full bg-slate-200/80"
                style={{
                  width: `${8 + (index % 4) * 3}px`,
                  height: `${5 + (index % 3) * 2}px`,
                }}
              />
            ))}
          </div>

          <Plant className="left-[10%] h-28" />
          <Plant className="left-[18%] h-20" />
          <Plant className="right-[14%] h-24" />
          <Plant className="right-[23%] h-16" />

          {filtro && (
            <div className="absolute right-5 top-12 h-40 w-9 rounded-md bg-slate-900/90 shadow-lg">
              <div className="mx-auto mt-3 h-24 w-5 rounded bg-slate-700" />
              <div className="absolute -left-5 top-5 h-3 w-7 rounded bg-slate-700" />
              <div className="absolute -left-4 top-12 grid gap-1">
                <Bubble />
                <Bubble className="ml-2" />
                <Bubble className="ml-1" />
              </div>
            </div>
          )}

          {peces.map(pez => (
            <FishPreview key={`${pez.id}-${pez.instance}`} pez={pez} />
          ))}

          {peces.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-white/55">
              Agrega peces para verlos en la vista previa.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function FishPreview({ pez }: { pez: PezEscena }) {
  return (
    <div
      className="absolute z-10 flex h-12 w-16 items-center justify-center rounded-full"
      style={{
        left: `${pez.left}%`,
        top: `${pez.top}%`,
        transform: 'translate(-50%, -50%)',
        animation: `fish-drift 5.5s ease-in-out ${pez.delay}s infinite alternate`,
      }}
      title={pez.name}
    >
      {pez.image ? (
        <img src={`/${pez.image}`} alt={pez.name} className="max-h-12 max-w-16 object-contain drop-shadow-lg" />
      ) : (
        <div className="relative h-6 w-11">
          <div className="absolute left-2 top-0 h-6 w-8 rounded-[50%]" style={{ backgroundColor: pez.color }} />
          <div
            className="absolute left-0 top-1 h-0 w-0 border-y-[8px] border-r-[13px] border-y-transparent"
            style={{ borderRightColor: pez.color }}
          />
          <div className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-slate-950" />
        </div>
      )}
    </div>
  )
}

function Plant({ className }: { className: string }) {
  return (
    <div className={`absolute bottom-7 w-10 ${className}`}>
      <span className="absolute bottom-0 left-4 h-full w-2 origin-bottom rounded-full bg-emerald-500/80" />
      <span className="absolute bottom-0 left-2 h-[82%] w-2 origin-bottom -rotate-12 rounded-full bg-green-400/80" />
      <span className="absolute bottom-0 left-6 h-[72%] w-2 origin-bottom rotate-12 rounded-full bg-lime-400/75" />
    </div>
  )
}

function Bubble({ className = '' }: { className?: string }) {
  return <span className={`block h-2 w-2 rounded-full bg-cyan-100/70 ${className}`} />
}

function obtenerColorPez(id: string) {
  const colores: Record<string, string> = {
    betta: '#2563eb',
    'neon-tetra': '#38bdf8',
    guppy: '#f97316',
    goldfish: '#f59e0b',
    angel: '#cbd5e1',
    pleco: '#57534e',
    corydoras: '#d6d3d1',
    oscar: '#ea580c',
    clownfish: '#fb6a22',
    damsel: '#1d4ed8',
    'marine-angel': '#facc15',
    tang: '#2563eb',
    'neon-goby': '#22d3ee',
    mandarin: '#a855f7',
    lionfish: '#dc2626',
    chromis: '#10b981',
  }

  return colores[id] ?? '#e2e8f0'
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { TrendingDown, Fish, AlertTriangle, RefreshCw, Plus } from 'lucide-react'
import Link from 'next/link'

type MortalityRecord = {
  id: string
  recorded_at: string
  quantity: number
  reason: string
  animal_name: string
}

type TimelinePoint = { date: string; total: number }
type BySpecies = { name: string; total: number }
type ByReason = { reason: string; total: number }

const REASON_LABELS: Record<string, string> = {
  enfermedad: 'Enfermedad',
  transporte: 'Transporte',
  pelea: 'Pelea',
  condiciones_agua: 'Condiciones agua',
  edad: 'Edad',
  desconocido: 'Desconocido',
  otro: 'Otro',
}

const COLORS = ['#006f95', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe', '#f0f9ff']

type Range = '7d' | '30d' | '90d' | '1y'

function subDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() - n); return r
}

export default function MortalidadPage() {
  const [records, setRecords] = useState<MortalityRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<Range>('30d')
  const supabase = createClient()

  const rangeMap: Record<Range, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }

  const load = useCallback(async () => {
    setLoading(true)
    const since = subDays(new Date(), rangeMap[range]).toISOString()

    const { data, error } = await supabase
      .from('animal_mortality')
      .select(`
        id, recorded_at, quantity, reason,
        animals!inner(name)
      `)
      .gte('recorded_at', since)
      .order('recorded_at', { ascending: true })

    if (!error && data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setRecords(data.map((r: any) => ({
        id: r.id,
        recorded_at: r.recorded_at,
        quantity: r.quantity,
        reason: r.reason ?? 'desconocido',
        animal_name: r.animals?.name ?? '—',
      })))
    }
    setLoading(false)
  }, [range, supabase])

  useEffect(() => { load() }, [load])

  // ── Derived data ──────────────────────────────────────────────
  const totalMuertes = records.reduce((s, r) => s + r.quantity, 0)

  // Timeline por día
  const timelineMap: Record<string, number> = {}
  records.forEach(r => {
    const day = r.recorded_at.slice(0, 10)
    timelineMap[day] = (timelineMap[day] ?? 0) + r.quantity
  })
  const timeline: TimelinePoint[] = Object.entries(timelineMap).map(([date, total]) => ({ date, total }))

  // Por especie
  const speciesMap: Record<string, number> = {}
  records.forEach(r => {
    speciesMap[r.animal_name] = (speciesMap[r.animal_name] ?? 0) + r.quantity
  })
  const bySpecies: BySpecies[] = Object.entries(speciesMap)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)

  // Por causa
  const reasonMap: Record<string, number> = {}
  records.forEach(r => {
    reasonMap[r.reason] = (reasonMap[r.reason] ?? 0) + r.quantity
  })
  const byReason: ByReason[] = Object.entries(reasonMap)
    .map(([reason, total]) => ({ reason, total }))
    .sort((a, b) => b.total - a.total)

  const rangeLabels: Record<Range, string> = {
    '7d': 'Últimos 7 días',
    '30d': 'Últimos 30 días',
    '90d': 'Últimos 90 días',
    '1y': 'Último año',
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500">Inventario</p>
            <h1 className="text-2xl font-bold text-slate-800">Gráficos de mortalidad</h1>
            <p className="text-sm text-slate-500 mt-1">
              Visualización de pérdidas de animales en el tiempo para detectar patrones y tendencias.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={load}
              className="flex items-center gap-1.5 rounded-md border bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>
            <Link
              href="/inventario/reporte-mortalidad"
              className="flex items-center gap-1.5 rounded-md border bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Ver reporte
            </Link>
            <Link
              href="/inventario/mortalidad/registrar"
              className="flex items-center gap-1.5 rounded-md bg-[#006f95] px-4 py-2 text-sm font-medium text-white hover:bg-[#005f80]"
            >
              <Plus className="h-4 w-4" />
              Registrar muerte
            </Link>
          </div>
        </div>

        {/* Filtro de rango */}
        <div className="flex gap-1 rounded-lg border bg-white p-1 w-fit shadow-sm">
          {(Object.keys(rangeLabels) as Range[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                range === r
                  ? 'bg-[#006f95] text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {rangeLabels[r]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-sm text-slate-400">
            Cargando datos…
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border bg-white py-20 text-center shadow-sm">
            <Fish className="h-10 w-10 text-slate-300" />
            <p className="text-slate-500 font-medium">Sin registros de mortalidad en este período</p>
            <Link
              href="/inventario/mortalidad/registrar"
              className="mt-1 text-sm text-[#006f95] underline-offset-2 hover:underline"
            >
              Registrar primera muerte
            </Link>
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: 'Total muertes', value: totalMuertes, icon: <TrendingDown className="h-5 w-5 text-red-500" /> },
                { label: 'Registros', value: records.length, icon: <Fish className="h-5 w-5 text-[#006f95]" /> },
                { label: 'Especies afectadas', value: bySpecies.length, icon: <AlertTriangle className="h-5 w-5 text-amber-500" /> },
                { label: 'Causa + frecuente', value: byReason[0] ? REASON_LABELS[byReason[0].reason] : '—', icon: <AlertTriangle className="h-5 w-5 text-slate-400" /> },
              ].map(card => (
                <div key={card.label} className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
                    {card.icon}
                    {card.label}
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                </div>
              ))}
            </div>

            {/* Gráfico de línea — timeline */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="mb-1 text-base font-semibold text-slate-800">Mortalidad en el tiempo</h2>
              <p className="mb-4 text-xs text-slate-500">Total de animales muertos por día — {rangeLabels[range]}</p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={timeline} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    formatter={(v: number) => [v, 'Muertes']}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#006f95"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#006f95' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico de barras — por especie + pie — por causa */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="mb-1 text-base font-semibold text-slate-800">Por especie</h2>
                <p className="mb-4 text-xs text-slate-500">Especies con más pérdidas registradas</p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={bySpecies} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                      formatter={(v: number) => [v, 'Muertes']}
                    />
                    <Bar dataKey="total" fill="#006f95" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="mb-1 text-base font-semibold text-slate-800">Por causa</h2>
                <p className="mb-4 text-xs text-slate-500">Distribución de causas de muerte</p>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={byReason}
                      dataKey="total"
                      nameKey="reason"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ reason, percent }) =>
                        `${REASON_LABELS[reason] ?? reason} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {byReason.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                      formatter={(v: number, _: string, props: { payload?: { reason?: string } }) => [
                        v,
                        REASON_LABELS[props.payload?.reason ?? ''] ?? props.payload?.reason ?? ''
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tabla de registros recientes */}
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="text-base font-semibold text-slate-800">Registros recientes</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Especie</th>
                      <th className="px-4 py-3 text-center">Cantidad</th>
                      <th className="px-4 py-3">Causa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...records].reverse().slice(0, 10).map(r => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(r.recorded_at).toLocaleDateString('es-CR')}
                        </td>
                        <td className="px-4 py-3 font-medium">{r.animal_name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                            {r.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {REASON_LABELS[r.reason] ?? r.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

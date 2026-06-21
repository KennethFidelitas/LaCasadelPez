'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Printer, Download, Filter, X } from 'lucide-react'

const REASON_LABELS: Record<string, string> = {
  enfermedad:       'Enfermedad',
  transporte:       'Transporte',
  pelea:            'Pelea',
  condiciones_agua: 'Condiciones del agua',
  edad:             'Edad',
  desconocido:      'Desconocido',
  otro:             'Otro',
}

type Record_ = {
  id: string
  recorded_at: string
  quantity: number
  reason: string
  notes: string | null
  animal_name: string
  sku: string
}

export default function ReporteMortalidadPage() {
  const [records, setRecords] = useState<Record_[]>([])
  const [loading, setLoading] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)

  // Filters
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [speciesFilter, setSpeciesFilter] = useState('')
  const [reasonFilter, setReasonFilter] = useState('')

  const printRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('animal_mortality')
      .select(`
        id, recorded_at, quantity, reason, notes,
        animals!inner(common_name, sku)
      `)
      .order('recorded_at', { ascending: false })

    if (desde) query = query.gte('recorded_at', desde)
    if (hasta) query = query.lte('recorded_at', hasta + 'T23:59:59')

    const { data, error } = await query

    if (!error && data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let rows: Record_[] = data.map((r: any) => ({
        id: r.id,
        recorded_at: r.recorded_at,
        quantity: r.quantity,
        reason: r.reason ?? 'desconocido',
        notes: r.notes,
        animal_name: r.animals?.common_name ?? '—',
        sku: r.animals?.sku ?? '—',
      }))

      if (speciesFilter)
        rows = rows.filter(r => r.animal_name.toLowerCase().includes(speciesFilter.toLowerCase()))
      if (reasonFilter)
        rows = rows.filter(r => r.reason === reasonFilter)

      setRecords(rows)
    }
    setLoading(false)
  }, [desde, hasta, speciesFilter, reasonFilter, supabase])

  useEffect(() => { load() }, [load])

  const clearFilters = () => {
    setDesde(''); setHasta(''); setSpeciesFilter(''); setReasonFilter('')
  }

  const hasFilters = desde || hasta || speciesFilter || reasonFilter

  const totalMuertes = records.reduce((s, r) => s + r.quantity, 0)

  const handlePrint = () => window.print()

  const handleExportCSV = () => {
    const headers = ['Fecha', 'Especie', 'SKU', 'Cantidad', 'Causa', 'Notas']
    const rows = records.map(r => [
      new Date(r.recorded_at).toLocaleDateString('es-CR'),
      r.animal_name,
      r.sku,
      r.quantity,
      REASON_LABELS[r.reason] ?? r.reason,
      r.notes ?? '',
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-mortalidad-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .print-area { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl space-y-5">

          {/* Header */}
          <div className="no-print flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-500">Inventario</p>
              <h1 className="text-2xl font-bold text-slate-800">Reporte de mortalidad</h1>
              <p className="text-sm text-slate-500 mt-0.5">Documentación de pérdidas de animales para análisis y auditoría.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterOpen(f => !f)}
                className="flex items-center gap-1.5 rounded-md border bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <Filter className="h-4 w-4" />
                Filtros {hasFilters && <span className="rounded-full bg-[#006f95] text-white text-xs px-1.5">!</span>}
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 rounded-md border bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-md bg-[#006f95] px-4 py-2 text-sm font-medium text-white hover:bg-[#005f80]"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </button>
            </div>
          </div>

          {/* Panel de filtros */}
          {filterOpen && (
            <div className="no-print rounded-xl border bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm text-slate-700">Filtrar reporte</h3>
                {hasFilters && (
                  <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                    <X className="h-3.5 w-3.5" /> Limpiar filtros
                  </button>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Desde</label>
                  <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Hasta</label>
                  <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Especie</label>
                  <input value={speciesFilter} onChange={e => setSpeciesFilter(e.target.value)}
                    placeholder="Buscar especie…"
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Causa</label>
                  <select value={reasonFilter} onChange={e => setReasonFilter(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm">
                    <option value="">Todas las causas</option>
                    {Object.entries(REASON_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={load}
                className="rounded-md bg-[#006f95] px-4 py-2 text-sm font-medium text-white hover:bg-[#005f80]">
                Aplicar filtros
              </button>
            </div>
          )}

          {/* Área de impresión */}
          <div ref={printRef} className="print-area rounded-xl border bg-white shadow-sm overflow-hidden">
            {/* Encabezado del reporte (visible al imprimir) */}
            <div className="border-b px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">La Casa del Pez — Reporte de Mortalidad</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Generado: {new Date().toLocaleDateString('es-CR', { dateStyle: 'full' })}
                    {hasFilters && ' · Filtros aplicados'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-600">{totalMuertes}</p>
                  <p className="text-xs text-slate-500">total muertes</p>
                </div>
              </div>

              {/* Resumen */}
              <div className="mt-4 grid grid-cols-3 gap-4">
                {[
                  { label: 'Registros', value: records.length },
                  { label: 'Especies afectadas', value: new Set(records.map(r => r.animal_name)).size },
                  { label: 'Período', value: desde && hasta ? `${desde} → ${hasta}` : hasta ? `Hasta ${hasta}` : desde ? `Desde ${desde}` : 'Todo el historial' },
                ].map(c => (
                  <div key={c.label} className="rounded-lg bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-500">{c.label}</p>
                    <p className="mt-0.5 font-semibold text-slate-800">{c.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-sm text-slate-400">Cargando…</div>
            ) : records.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-400">
                No se encontraron registros con los filtros aplicados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Especie</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3 text-center">Cantidad</th>
                      <th className="px-4 py-3">Causa</th>
                      <th className="px-4 py-3">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map(r => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {new Date(r.recorded_at).toLocaleDateString('es-CR')}
                        </td>
                        <td className="px-4 py-3 font-medium">{r.animal_name}</td>
                        <td className="px-4 py-3 text-slate-500">{r.sku}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                            {r.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {REASON_LABELS[r.reason] ?? r.reason}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">
                          {r.notes ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 bg-slate-50 font-semibold">
                      <td colSpan={3} className="px-4 py-3 text-slate-700">TOTAL</td>
                      <td className="px-4 py-3 text-center text-red-600">{totalMuertes}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}

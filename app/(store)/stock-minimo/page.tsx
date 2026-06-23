'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, CheckCircle2, Save, RefreshCw } from 'lucide-react'

type AnimalStock = {
  inventory_id: string
  animal_id: string
  name: string
  sku: string
  quantity: number
  low_stock_threshold: number
  draft_threshold: number // valor que el usuario está editando
  location: string
  dirty: boolean
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function StockMinimoPage() {
  const [rows, setRows] = useState<AnimalStock[]>([])
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [search, setSearch] = useState('')

  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        id,
        animal_id,
        quantity,
        low_stock_threshold,
        location,
        animals!inner(name, sku)
      `)
      .not('animal_id', 'is', null)
      .order('quantity', { ascending: true })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped: AnimalStock[] = (data ?? []).map((r: any) => ({
      inventory_id: r.id,
      animal_id: r.animal_id,
      name: r.animals?.name ?? '—',
      sku: r.animals?.sku ?? '—',
      quantity: r.quantity ?? 0,
      low_stock_threshold: r.low_stock_threshold ?? 5,
      draft_threshold: r.low_stock_threshold ?? 5,
      location: r.location ?? 'almacen',
      dirty: false,
    }))
    setRows(mapped)
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const handleChange = (inventory_id: string, value: string) => {
    const num = parseInt(value, 10)
    setRows(prev =>
      prev.map(r =>
        r.inventory_id === inventory_id
          ? { ...r, draft_threshold: isNaN(num) ? 0 : Math.max(0, num), dirty: true }
          : r
      )
    )
  }

  const validate = (): string | null => {
    const dirty = rows.filter(r => r.dirty)
    if (dirty.length === 0) return 'No hay cambios que guardar.'
    for (const r of dirty) {
      if (r.draft_threshold < 0) return `El mínimo de "${r.name}" no puede ser negativo.`
      if (r.draft_threshold > 9999) return `El mínimo de "${r.name}" parece demasiado alto.`
    }
    return null
  }

  const handleSave = async () => {
    const err = validate()
    if (err) { setErrorMsg(err); return }
    setErrorMsg('')
    setSaveStatus('saving')

    const dirty = rows.filter(r => r.dirty)
    const updates = dirty.map(r =>
      supabase
        .from('inventory')
        .update({ low_stock_threshold: r.draft_threshold, updated_at: new Date().toISOString() })
        .eq('id', r.inventory_id)
    )

    const results = await Promise.all(updates)
    const failed = results.find(r => r.error)

    if (failed?.error) {
      setErrorMsg(failed.error.message)
      setSaveStatus('error')
    } else {
      setSaveStatus('saved')
      setRows(prev =>
        prev.map(r => r.dirty ? { ...r, low_stock_threshold: r.draft_threshold, dirty: false } : r)
      )
      setTimeout(() => setSaveStatus('idle'), 2500)
    }
  }

  const filtered = rows.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.sku.toLowerCase().includes(search.toLowerCase())
  )

  const critical = rows.filter(r => r.quantity < r.low_stock_threshold).length
  const dirtyCount = rows.filter(r => r.dirty).length

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500">Inventario</p>
            <h1 className="text-2xl font-bold text-slate-800">Niveles mínimos de stock</h1>
            <p className="text-sm text-slate-500 mt-1">
              Define el umbral mínimo por especie. El sistema generará una alerta cuando el stock baje de ese nivel.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="flex items-center gap-1.5 rounded-md border bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving' || dirtyCount === 0}
              className="flex items-center gap-1.5 rounded-md bg-[#006f95] px-4 py-2 text-sm font-medium text-white hover:bg-[#005f80] disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saveStatus === 'saving' ? 'Guardando…' : `Guardar${dirtyCount > 0 ? ` (${dirtyCount})` : ''}`}
            </button>
          </div>
        </div>

        {/* Feedback banners */}
        {saveStatus === 'saved' && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Niveles mínimos guardados correctamente.
          </div>
        )}
        {(saveStatus === 'error' || errorMsg) && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Alertas activas */}
        {critical > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">{critical} especie{critical > 1 ? 's' : ''}</span> con stock por debajo del mínimo establecido.
            </p>
          </div>
        )}

        {/* Buscador */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o SKU…"
          className="w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm md:max-w-sm"
        />

        {/* Tabla */}
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-slate-400">
              Cargando inventario…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">
              No se encontraron animales.
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Especie</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Ubicación</th>
                  <th className="px-4 py-3 text-center">Stock actual</th>
                  <th className="px-4 py-3 text-center">Mínimo</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => {
                  const isLow = row.quantity < row.draft_threshold
                  return (
                    <tr
                      key={row.inventory_id}
                      className={`border-b last:border-0 transition-colors ${row.dirty ? 'bg-blue-50/40' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {row.name}
                        {row.dirty && (
                          <span className="ml-2 text-xs text-blue-500 font-normal">● editado</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{row.sku}</td>
                      <td className="px-4 py-3 text-slate-500 capitalize">{row.location}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isLow
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {row.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={9999}
                          value={row.draft_threshold}
                          onChange={e => handleChange(row.inventory_id, e.target.value)}
                          className={`w-20 rounded-md border px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-[#006f95] ${
                            row.dirty ? 'border-blue-400' : 'border-slate-300'
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isLow ? (
                          <span className="flex items-center justify-center gap-1 text-xs text-red-600 font-medium">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Bajo mínimo
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1 text-xs text-emerald-600 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
        <p className="text-xs text-slate-400">
          Los cambios no guardados se muestran en azul. Presiona "Guardar" para confirmarlos.
        </p>
      </div>
    </main>
  )
}

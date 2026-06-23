import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

async function registrarMuerte(formData: FormData) {
  'use server'
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const animal_id  = formData.get('animal_id') as string
  const quantity   = Number(formData.get('quantity'))
  const reason     = formData.get('reason') as string
  const notes      = formData.get('notes') as string

  if (!animal_id || quantity < 1) return

  const { error } = await supabase.from('animal_mortality').insert({
    animal_id,
    quantity,
    reason,
    notes: notes || null,
    recorded_by: user?.id ?? null,
    recorded_at: new Date().toISOString(),
  })

  if (error) throw new Error(error.message)
  redirect('/inventario/mortalidad')
}

export default async function RegistrarMuertePage() {
  const supabase = await createClient()

  const { data: animals } = await supabase
    .from('animals')
    .select('id, name, sku')
    .eq('is_active', true)
    .order('name')

  const reasons = [
    { value: 'enfermedad',       label: 'Enfermedad' },
    { value: 'transporte',       label: 'Transporte / traslado' },
    { value: 'pelea',            label: 'Pelea entre animales' },
    { value: 'condiciones_agua', label: 'Condiciones del agua' },
    { value: 'edad',             label: 'Muerte por edad' },
    { value: 'desconocido',      label: 'Desconocido' },
    { value: 'otro',             label: 'Otro' },
  ]

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-xl">
        <div className="mb-6">
          <p className="text-sm text-slate-500">Inventario / Mortalidad</p>
          <h1 className="text-2xl font-bold text-slate-800">Registrar muerte de animales</h1>
          <p className="mt-1 text-sm text-slate-500">
            El stock se reducirá automáticamente al confirmar el registro.
          </p>
        </div>

        <form action={registrarMuerte} className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Especie *</label>
            <select
              name="animal_id"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006f95]"
            >
              <option value="">Seleccione una especie</option>
              {(animals ?? []).map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Cantidad muerta *</label>
            <input
              name="quantity"
              type="number"
              min={1}
              required
              placeholder="Ej: 3"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006f95]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Causa *</label>
            <select
              name="reason"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006f95]"
            >
              {reasons.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Observaciones</label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Detalles adicionales sobre el evento…"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006f95]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <a
              href="/mortalidad"
              className="rounded-md border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </a>
            <button
              type="submit"
              className="rounded-md bg-[#006f95] px-5 py-2 text-sm font-medium text-white hover:bg-[#005f80]"
            >
              Guardar registro
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

async function registrarAnimal(formData: FormData) {
  "use server"

  const nombre = formData.get("nombre") as string
  const especie = formData.get("especie") as string
  const cantidad = Number(formData.get("cantidad"))
  const costo = Number(formData.get("costo"))
  const ubicacion = formData.get("ubicacion") as string
  const proveedor = formData.get("proveedor") as string
  const observaciones = formData.get("observaciones") as string

  const slug = `${nombre}-${Date.now()}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

  const sku = `AN-${Date.now()}`

  const supabase = await createClient()

  const { error } = await supabase.from("animals").insert({
    name: nombre,
    slug: slug,
    description: observaciones || especie,
    price: costo,
    cost: costo,
    sku: sku,
    is_active: true,
    is_featured: false,
    meta: {
      especie,
      cantidad,
      ubicacion,
      proveedor,
      fecha_ingreso: new Date().toISOString(),
    },
  })

  if (error) {
    console.error("Error completo al registrar animal:", error)

    throw new Error(
      `Error Supabase: ${error.message} | Código: ${error.code} | Detalle: ${error.details}`
    )
  }

  redirect("/dashboard")
}

export default function AgregarAnimalPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 space-y-2">
          <p className="text-sm text-slate-500">Inventario</p>

          <h1 className="text-2xl font-bold">
            Registrar la entrada de nuevos animales
          </h1>

          <p className="text-slate-600">
            Complete la información para ingresar nuevos animales al inventario.
          </p>
        </div>

        <form
          action={registrarAnimal}
          className="rounded-xl border bg-white p-6 shadow-sm"
        >
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Nombre del animal
              </label>
              <input
                name="nombre"
                required
                placeholder="Ej: Betta Halfmoon"
                className="w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Especie o categoría
              </label>
              <input
                name="especie"
                required
                placeholder="Ej: Pez tropical"
                className="w-full rounded-md border px-3 py-2"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Cantidad
                </label>
                <input
                  name="cantidad"
                  type="number"
                  min="1"
                  required
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Costo unitario
                </label>
                <input
                  name="costo"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Ubicación
              </label>
              <select
                name="ubicacion"
                required
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="">Seleccione una ubicación</option>
                <option value="Bodega A">Bodega A</option>
                <option value="Bodega B">Bodega B</option>
                <option value="Area viva">Área viva</option>
                <option value="Mostrador">Mostrador</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Proveedor
              </label>
              <input
                name="proveedor"
                placeholder="Nombre del proveedor"
                className="w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Observaciones
              </label>
              <textarea
                name="observaciones"
                placeholder="Ej: Lote recibido en buen estado"
                className="w-full rounded-md border px-3 py-2"
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <a
                href="/dashboard"
                className="rounded-md border px-4 py-2 text-sm font-medium"
              >
                Cancelar
              </a>

              <button
                type="submit"
                className="rounded-md bg-[#006f95] px-4 py-2 text-sm font-medium text-white hover:bg-[#005f80]"
              >
                Guardar animal
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function EditarAnimalPage() {
  const params = useParams()
  const animalId = params?.id as string
  const [animal, setAnimal] = useState<any>(null)
  const [inventario, setInventario] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!animalId) return

    const cargarDatos = async () => {
      try {
        const supabase = createClient()

        // Cargar animal
        const { data: animalData, error: animalError } = await supabase
          .from("animals")
          .select("*")
          .eq("id", animalId)
          .single()

        if (animalError) throw animalError

        // Cargar inventario
        const { data: inventarioData, error: inventarioError } = await supabase
          .from("inventory")
          .select("*")
          .eq("animal_id", animalId)
          .single()

        setAnimal(animalData)
        setInventario(inventarioData)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [animalId])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)

    try {
      const formData = new FormData(e.currentTarget)
      const supabase = createClient()

      console.log("🔍 Iniciando actualización del animal ID:", animalId)

      // Actualizar animal
      const { data: animalResult, error: errorAnimal } = await supabase
        .from("animals")
        .update({
          name: formData.get("nombre"),
          scientific_name: formData.get("nombreCientifico") || null,
          description: formData.get("descripcion"),
          price: Number(formData.get("precio")),
          cost: Number(formData.get("costo")),
          care_level: formData.get("nivelCuidado") || null,
          temperament: formData.get("temperamento") || null,
          diet: formData.get("dieta") || null,
          min_tank_size: Number(formData.get("tamanioMinimo")) || null,
          temperature_min: Number(formData.get("temperaturaMin")) || null,
          temperature_max: Number(formData.get("temperaturaMax")) || null,
          ph_min: Number(formData.get("phMin")) || null,
          ph_max: Number(formData.get("phMax")) || null,
          max_size: Number(formData.get("tamanioMaximo")) || null,
          origin: formData.get("origen") || null,
          lifespan: formData.get("esperanzaVida") || null,
          compatibility: (formData.get("compatibilidad") as string)
            ? (formData.get("compatibilidad") as string).split(",").map((item) => item.trim())
            : null,
          images: (formData.get("imagenes") as string)
            ? (formData.get("imagenes") as string).split(",").map((img) => img.trim())
            : null,
          is_featured: formData.get("esFeatured") === "true",
        })
        .eq("id", animalId)
        .select()

      console.log("📊 Resultado animal:", { animalResult, errorAnimal })

      if (errorAnimal) {
        console.error("❌ Error al actualizar animal:", errorAnimal)
        throw errorAnimal
      }

      console.log("✅ Animal actualizado:", animalResult)

      // Actualizar inventario usando el ID del inventario
      if (inventario?.id) {
        console.log("🔍 Actualizando inventario ID:", inventario.id)

        const { data: inventoryResult, error: errorInventario } = await supabase
          .from("inventory")
          .update({
            quantity: Number(formData.get("cantidad")),
            location: formData.get("ubicacion"),
          })
          .eq("id", inventario.id)
          .select()

        console.log("📊 Resultado inventario:", { inventoryResult, errorInventario })

        if (errorInventario) {
          console.error("❌ Error al actualizar inventario:", errorInventario)
          throw errorInventario
        }

        console.log("✅ Inventario actualizado:", inventoryResult)
      } else {
        console.warn("⚠️ No hay ID de inventario disponible")
      }

      alert("✅ Animal actualizado correctamente")
      setTimeout(() => {
        window.location.href = "/inventario/consultar-animales"
      }, 500)
    } catch (err: any) {
      console.error("🔴 Error completo:", err)
      alert(`❌ Error: ${err.message}`)
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8">Cargando...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>
  if (!animal) return <div className="p-8">Animal no encontrado</div>

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 space-y-2">
          <p className="text-sm text-slate-500">Inventario</p>

          <h1 className="text-2xl font-bold">
            Editar animal: {animal.name}
          </h1>

          <p className="text-slate-600">
            Modifique los campos necesarios y guarde los cambios.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border bg-white p-6 shadow-sm"
        >
          <div className="grid gap-6">
            {/* Información básica */}
            <div className="border-b pb-6">
              <h3 className="mb-4 text-lg font-semibold">Información básica</h3>

              <div className="grid gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Nombre del animal *
                  </label>
                  <input
                    name="nombre"
                    defaultValue={animal.name}
                    required
                    className="w-full rounded-md border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Nombre científico
                  </label>
                  <input
                    name="nombreCientifico"
                    defaultValue={animal.scientific_name || ""}
                    className="w-full rounded-md border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Descripción *
                  </label>
                  <textarea
                    name="descripcion"
                    defaultValue={animal.description || ""}
                    required
                    className="w-full rounded-md border px-3 py-2"
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Precio de venta *
                    </label>
                    <input
                      name="precio"
                      type="number"
                      step="0.01"
                      defaultValue={animal.price}
                      required
                      className="w-full rounded-md border px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Costo unitario *
                    </label>
                    <input
                      name="costo"
                      type="number"
                      step="0.01"
                      defaultValue={animal.cost}
                      required
                      className="w-full rounded-md border px-3 py-2"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    name="esFeatured"
                    type="checkbox"
                    value="true"
                    defaultChecked={animal.is_featured}
                    id="featured"
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="featured" className="text-sm font-medium">
                    Marcar como destacado
                  </label>
                </div>
              </div>
            </div>

            {/* Características */}
            <div className="border-b pb-6">
              <h3 className="mb-4 text-lg font-semibold">Características</h3>

              <div className="grid gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Nivel de cuidado
                  </label>
                  <select
                    name="nivelCuidado"
                    defaultValue={animal.care_level || ""}
                    className="w-full rounded-md border px-3 py-2"
                  >
                    <option value="">Seleccione...</option>
                    <option value="facil">Fácil</option>
                    <option value="moderado">Moderado</option>
                    <option value="avanzado">Avanzado</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Temperamento
                  </label>
                  <select
                    name="temperamento"
                    defaultValue={animal.temperament || ""}
                    className="w-full rounded-md border px-3 py-2"
                  >
                    <option value="">Seleccione...</option>
                    <option value="pacifico">Pacífico</option>
                    <option value="semi-agresivo">Semi-agresivo</option>
                    <option value="agresivo">Agresivo</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Dieta
                  </label>
                  <input
                    name="dieta"
                    defaultValue={animal.diet || ""}
                    className="w-full rounded-md border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Origen
                  </label>
                  <input
                    name="origen"
                    defaultValue={animal.origin || ""}
                    className="w-full rounded-md border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Esperanza de vida
                  </label>
                  <input
                    name="esperanzaVida"
                    defaultValue={animal.lifespan || ""}
                    className="w-full rounded-md border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Compatibilidad (separadas por coma)
                  </label>
                  <textarea
                    name="compatibilidad"
                    defaultValue={animal.compatibility?.join(", ") || ""}
                    className="w-full rounded-md border px-3 py-2"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Parámetros del acuario */}
            <div className="border-b pb-6">
              <h3 className="mb-4 text-lg font-semibold">Parámetros del acuario</h3>

              <div className="grid gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Tamaño mínimo (litros)
                  </label>
                  <input
                    name="tamanioMinimo"
                    type="number"
                    defaultValue={animal.min_tank_size || ""}
                    className="w-full rounded-md border px-3 py-2"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Temperatura mínima (°C)
                    </label>
                    <input
                      name="temperaturaMin"
                      type="number"
                      step="0.1"
                      defaultValue={animal.temperature_min || ""}
                      className="w-full rounded-md border px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Temperatura máxima (°C)
                    </label>
                    <input
                      name="temperaturaMax"
                      type="number"
                      step="0.1"
                      defaultValue={animal.temperature_max || ""}
                      className="w-full rounded-md border px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      pH mínimo
                    </label>
                    <input
                      name="phMin"
                      type="number"
                      step="0.1"
                      defaultValue={animal.ph_min || ""}
                      className="w-full rounded-md border px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      pH máximo
                    </label>
                    <input
                      name="phMax"
                      type="number"
                      step="0.1"
                      defaultValue={animal.ph_max || ""}
                      className="w-full rounded-md border px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Tamaño máximo (cm)
                  </label>
                  <input
                    name="tamanioMaximo"
                    type="number"
                    step="0.1"
                    defaultValue={animal.max_size || ""}
                    className="w-full rounded-md border px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Inventario y logística */}
            <div className="border-b pb-6">
              <h3 className="mb-4 text-lg font-semibold">Inventario y logística</h3>

              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Cantidad *
                    </label>
                    <input
                      name="cantidad"
                      type="number"
                      min="0"
                      defaultValue={inventario?.quantity || 0}
                      required
                      className="w-full rounded-md border px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Ubicación *
                    </label>
                    <select
                      name="ubicacion"
                      defaultValue={inventario?.location || ""}
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
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Imágenes (URLs separadas por coma)
                  </label>
                  <textarea
                    name="imagenes"
                    defaultValue={animal.images?.join(", ") || ""}
                    className="w-full rounded-md border px-3 py-2"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4">
              <Link
                href="/dashboard"
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-[#006f95] px-4 py-2 text-sm font-medium text-white hover:bg-[#005f80] disabled:bg-slate-400"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}

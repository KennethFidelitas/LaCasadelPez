"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowRight, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { DialogoAjusteStock } from "@/components/inventario/dialogo-ajuste-stock"
import { useGestionImagenes } from "@/hooks/use-gestion-imagenes"

export default function EditarAnimalPage() {
  const params = useParams()
  const animalId = params?.id as string
  const [animal, setAnimal] = useState<any>(null)
  const [inventario, setInventario] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarDatos = useCallback(async () => {
    if (!animalId) return

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
  }, [animalId])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  // Refresco liviano tras un ajuste de stock: solo el inventario, sin
  // reactivar el "Cargando..." de página completa que usa cargarDatos.
  const refrescarInventario = useCallback(async () => {
    if (!animalId) return
    const supabase = createClient()
    const { data: inventarioData } = await supabase
      .from("inventory")
      .select("*")
      .eq("animal_id", animalId)
      .single()
    if (inventarioData) setInventario(inventarioData)
  }, [animalId])

  if (loading) return <div className="p-8">Cargando...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>
  if (!animal) return <div className="p-8">Animal no encontrado</div>

  return (
    <FormularioAnimal
      animal={animal}
      inventario={inventario}
      animalId={animalId}
      onInventarioActualizado={refrescarInventario}
    />
  )
}

// Componente separado a propósito: solo se monta una vez que `animal` ya
// cargó, así useGestionImagenes se inicializa con animal.images real (si el
// hook viviera en el componente de arriba, arrancaría con [] antes de que
// termine el fetch, y ya no se actualizaría después).
function FormularioAnimal({
  animal,
  inventario,
  animalId,
  onInventarioActualizado,
}: {
  animal: any
  inventario: any
  animalId: string
  onInventarioActualizado: () => void
}) {
  const [saving, setSaving] = useState(false)
  const {
    keptImages,
    newFiles,
    totalCount,
    maxImages,
    hasChanges: imagesChanged,
    addFiles,
    removeExisting,
    removeNewFile,
  } = useGestionImagenes({ initialImages: animal.images ?? [] })

  function handleImagesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    const errorMsg = addFiles(files)
    if (errorMsg) alert(errorMsg)
    event.target.value = ""
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)

    try {
      const formData = new FormData(e.currentTarget)
      const supabase = createClient()

      if (imagesChanged) {
        const imagesFormData = new FormData()
        newFiles.forEach((image) => imagesFormData.append("imagenes", image))
        imagesFormData.append("keepImages", JSON.stringify(keptImages))

        const imageResponse = await fetch(`/api/animals/${animalId}/images`, {
          method: "POST",
          body: imagesFormData,
        })
        const imageResult = await imageResponse.json()

        if (!imageResponse.ok) {
          throw new Error(imageResult.error || "No se pudieron actualizar las imágenes.")
        }
      }

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

      window.location.href = "/dashboard?modulo=inventory"
    } catch (err: any) {
      console.error("🔴 Error completo:", err)
      alert(`❌ Error: ${err.message}`)
      setSaving(false)
    }
  }

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
                      Cantidad
                    </label>
                    <div className="flex h-[38px] items-center justify-between gap-2 rounded-md border bg-gray-50 px-3 text-sm">
                      <span>{inventario?.quantity ?? 0} unidades</span>
                      <DialogoAjusteStock
                        item={{
                          id: animalId,
                          type: "animal",
                          name: animal.name,
                          sku: animal.sku,
                          stock: inventario?.quantity ?? 0,
                        }}
                        onAjusteRealizado={onInventarioActualizado}
                        trigger={
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-sm font-medium text-[#006f95] hover:underline"
                          >
                            Ajustar stock
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        }
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      La cantidad solo se modifica desde "Ajustar stock"
                    </p>
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
                    Imágenes del animal
                  </label>
                  {(keptImages.length > 0 || newFiles.length > 0) && (
                    <div className="mt-3 mb-3 flex flex-wrap gap-3">
                      {keptImages.map((image: string, index: number) => (
                        <div key={image} className="relative h-24 w-24">
                          <img
                            src={image}
                            alt={`Imagen ${index + 1} de ${animal.name}`}
                            className="h-24 w-24 rounded-md border object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeExisting(image)}
                            aria-label="Eliminar imagen"
                            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white shadow"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {newFiles.map((file, index) => (
                        <div key={`${file.name}-${index}`} className="relative h-24 w-24">
                          <div className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed bg-slate-50 p-1 text-center">
                            <span className="line-clamp-2 text-[10px] text-slate-500">
                              {file.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeNewFile(index)}
                            aria-label="Quitar imagen"
                            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white shadow"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    type="file"
                    name="imagenes"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={totalCount >= maxImages}
                    onChange={handleImagesChange}
                    className="w-full cursor-pointer rounded-md border px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-[#006f95] file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-[#005f80] disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {totalCount}/{maxImages} imágenes. JPG, PNG o WEBP, máximo 5 MB cada una.
                  </p>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4">
              <Link
                href="/dashboard?modulo=inventory"
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

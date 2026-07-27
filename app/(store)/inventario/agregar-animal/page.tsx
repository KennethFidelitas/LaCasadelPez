import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"

const ANIMAL_IMAGES_BUCKET = "animal-images"
const MAX_IMAGES = 5
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

function fileExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase()
  if (extension && ["jpg", "jpeg", "png", "webp"].includes(extension)) {
    return extension === "jpeg" ? "jpg" : extension
  }

  return file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
}

async function registrarAnimal(formData: FormData) {
  "use server"

  const nombre = formData.get("nombre") as string
  const nombreCientifico = formData.get("nombreCientifico") as string
  const descripcion = formData.get("descripcion") as string
  const precio = Number(formData.get("precio"))
  const costo = Number(formData.get("costo"))
  const nivelCuidado = formData.get("nivelCuidado") as string
  const temperamento = formData.get("temperamento") as string
  const dieta = formData.get("dieta") as string
  const tamanioMinimo = Number(formData.get("tamanioMinimo")) || null
  const temperaturaMin = Number(formData.get("temperaturaMin")) || null
  const temperaturaMax = Number(formData.get("temperaturaMax")) || null
  const phMin = Number(formData.get("phMin")) || null
  const phMax = Number(formData.get("phMax")) || null
  const tamanioMaximo = Number(formData.get("tamanioMaximo")) || null
  const origen = formData.get("origen") as string
  const esperanzaVida = formData.get("esperanzaVida") as string
  const compatibilidad = formData.get("compatibilidad") as string
  const imagenes = formData
    .getAll("imagenes")
    .filter((value): value is File => value instanceof File && value.size > 0)
  const cantidad = Number(formData.get("cantidad"))
  const ubicacion = formData.get("ubicacion") as string
  const proveedor = formData.get("proveedor") as string
  const esFeatured = formData.get("esFeatured") === "true"

  const slug = `${nombre}-${Date.now()}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

  const sku = `AN-${Date.now()}`

  const supabase = await createClient()
  const storage = createAdminClient()
  const uploadedPaths: string[] = []

  if (imagenes.length > MAX_IMAGES) {
    throw new Error(`Puede cargar un máximo de ${MAX_IMAGES} imágenes.`)
  }

  for (const imagen of imagenes) {
    if (!ALLOWED_IMAGE_TYPES.has(imagen.type)) {
      throw new Error("Las imágenes deben ser JPG, PNG o WEBP.")
    }

    if (imagen.size > MAX_IMAGE_SIZE) {
      throw new Error(`Cada imagen puede pesar como máximo ${MAX_IMAGE_SIZE / 1024 / 1024} MB.`)
    }
  }

  if (imagenes.length) {
    const { data: bucket, error: getBucketError } = await storage.storage.getBucket(ANIMAL_IMAGES_BUCKET)
    if (getBucketError && !getBucketError.message.toLowerCase().includes("not found")) {
      throw new Error(
        `No se pudo conectar con el almacenamiento de imágenes. Verifique que la clave administrativa pertenezca al proyecto configurado en NEXT_PUBLIC_SUPABASE_URL. Detalle: ${getBucketError.message}`
      )
    }

    if (!bucket) {
      const { error: bucketError } = await storage.storage.createBucket(ANIMAL_IMAGES_BUCKET, {
        public: true,
        allowedMimeTypes: [...ALLOWED_IMAGE_TYPES],
        fileSizeLimit: MAX_IMAGE_SIZE,
      })

      if (bucketError && !bucketError.message.toLowerCase().includes("already exists")) {
        throw new Error(`No se pudo preparar el almacenamiento de imágenes: ${bucketError.message}`)
      }
    }
  }

  const imageUrls: string[] = []
  for (const [index, imagen] of imagenes.entries()) {
    const path = `${slug}/${crypto.randomUUID()}-${index}.${fileExtension(imagen)}`
    const { error: uploadError } = await storage.storage
      .from(ANIMAL_IMAGES_BUCKET)
      .upload(path, await imagen.arrayBuffer(), {
        contentType: imagen.type,
        upsert: false,
      })

    if (uploadError) {
      if (uploadedPaths.length) {
        await storage.storage.from(ANIMAL_IMAGES_BUCKET).remove(uploadedPaths)
      }
      throw new Error(`No se pudo cargar la imagen "${imagen.name}": ${uploadError.message}`)
    }

    uploadedPaths.push(path)
    const { data } = storage.storage.from(ANIMAL_IMAGES_BUCKET).getPublicUrl(path)
    imageUrls.push(data.publicUrl)
  }

  // Insertar animal
  const { data: animal, error: errorAnimal } = await supabase.from("animals").insert({
    name: nombre,
    slug: slug,
    scientific_name: nombreCientifico || null,
    description: descripcion,
    price: precio,
    cost: costo,
    sku: sku,
    care_level: nivelCuidado || null,
    temperament: temperamento || null,
    diet: dieta || null,
    min_tank_size: tamanioMinimo,
    temperature_min: temperaturaMin,
    temperature_max: temperaturaMax,
    ph_min: phMin,
    ph_max: phMax,
    max_size: tamanioMaximo,
    origin: origen || null,
    lifespan: esperanzaVida || null,
    compatibility: compatibilidad
      ? compatibilidad.split(",").map((item: string) => item.trim())
      : null,
    images: imageUrls.length ? imageUrls : null,
    is_active: true,
    is_featured: esFeatured,
  }).select()

  if (errorAnimal) {
    if (uploadedPaths.length) {
      await storage.storage.from(ANIMAL_IMAGES_BUCKET).remove(uploadedPaths)
    }
    console.error("Error completo al registrar animal:", errorAnimal)
    throw new Error(
      `Error Supabase: ${errorAnimal.message} | Código: ${errorAnimal.code} | Detalle: ${errorAnimal.details}`
    )
  }

  const animalId = animal[0].id

  // Insertar inventario
  const { error: errorInventario } = await supabase.from("inventory").insert({
    animal_id: animalId,
    quantity: cantidad,
    location: ubicacion,
    low_stock_threshold: 5,
  })

  if (errorInventario) {
    console.error("Error completo al registrar inventario:", errorInventario)
    throw new Error(
      `Error Supabase inventario: ${errorInventario.message} | Código: ${errorInventario.code} | Detalle: ${errorInventario.details}`
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
            Registrar nuevo animal
          </h1>

          <p className="text-slate-600">
            Complete todos los campos para agregar un nuevo animal a la base de datos. Los campos marcados con * son obligatorios.
          </p>
        </div>

        <form
          action={registrarAnimal}
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
                    required
                    placeholder="Ej: Betta Halfmoon"
                    className="w-full rounded-md border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Nombre científico
                  </label>
                  <input
                    name="nombreCientifico"
                    placeholder="Ej: Betta splendens"
                    className="w-full rounded-md border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Descripción *
                  </label>
                  <textarea
                    name="descripcion"
                    required
                    placeholder="Descripción del animal"
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
                      min="0"
                      step="0.01"
                      required
                      placeholder="₡"
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
                      min="0"
                      step="0.01"
                      required
                      placeholder="₡"
                      className="w-full rounded-md border px-3 py-2"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    name="esFeatured"
                    type="checkbox"
                    value="true"
                    id="featured"
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="featured" className="text-sm font-medium">
                    Marcar como destacado
                  </label>
                </div>
              </div>
            </div>

            {/* Características del animal */}
            <div className="border-b pb-6">
              <h3 className="mb-4 text-lg font-semibold">Características</h3>

              <div className="grid gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Nivel de cuidado
                  </label>
                  <select
                    name="nivelCuidado"
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
                    placeholder="Ej: Omnívoro, Carnívoro"
                    className="w-full rounded-md border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Origen
                  </label>
                  <input
                    name="origen"
                    placeholder="Ej: Sudamérica"
                    className="w-full rounded-md border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Esperanza de vida
                  </label>
                  <input
                    name="esperanzaVida"
                    placeholder="Ej: 3-5 años"
                    className="w-full rounded-md border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Compatibilidad
                  </label>
                  <textarea
                    name="compatibilidad"
                    placeholder="Especies compatibles y restricciones"
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
                    Tamaño mínimo del acuario (litros)
                  </label>
                  <input
                    name="tamanioMinimo"
                    type="number"
                    min="0"
                    placeholder="Ej: 20"
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
                      min="0"
                      step="0.1"
                      placeholder="Ej: 24"
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
                      min="0"
                      step="0.1"
                      placeholder="Ej: 28"
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
                      min="0"
                      max="14"
                      step="0.1"
                      placeholder="Ej: 6.0"
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
                      min="0"
                      max="14"
                      step="0.1"
                      placeholder="Ej: 7.5"
                      className="w-full rounded-md border px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Tamaño máximo del animal (cm)
                  </label>
                  <input
                    name="tamanioMaximo"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Ej: 8"
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
                      min="1"
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
                    Imágenes del animal
                  </label>
                  <input
                    type="file"
                    name="imagenes"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="w-full cursor-pointer rounded-md border px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-[#006f95] file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-[#005f80]"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Puede seleccionar hasta 5 imágenes JPG, PNG o WEBP (máximo 5 MB cada una).
                  </p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-4">
              <a
                href="/dashboard?modulo=inventory"
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-slate-50"
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

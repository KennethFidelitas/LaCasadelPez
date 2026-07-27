import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const BUCKET = "animal-images"
const MAX_IMAGES = 5
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

function extensionFor(file: File) {
  if (file.type === "image/png") return "png"
  if (file.type === "image/webp") return "webp"
  return "jpg"
}

function storagePathFromUrl(url: string) {
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const markerIndex = url.indexOf(marker)
  if (markerIndex === -1) return null
  return decodeURIComponent(url.slice(markerIndex + marker.length))
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: animalId } = await params
  const supabaseUser = await createClient()
  const { data: { user } } = await supabaseUser.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Debe iniciar sesión." }, { status: 401 })
  }

  const formData = await request.formData()
  const images = formData
    .getAll("imagenes")
    .filter((value): value is File => value instanceof File && value.size > 0)

  if (!images.length || images.length > MAX_IMAGES) {
    return NextResponse.json(
      { error: `Seleccione entre 1 y ${MAX_IMAGES} imágenes.` },
      { status: 400 },
    )
  }

  for (const image of images) {
    if (!ALLOWED_TYPES.has(image.type)) {
      return NextResponse.json(
        { error: "Las imágenes deben ser JPG, PNG o WEBP." },
        { status: 400 },
      )
    }
    if (image.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: "Cada imagen puede pesar como máximo 5 MB." },
        { status: 400 },
      )
    }
  }

  const admin = createAdminClient()
  const { data: currentAnimal, error: animalError } = await supabaseUser
    .from("animals")
    .select("images")
    .eq("id", animalId)
    .single()

  if (animalError || !currentAnimal) {
    return NextResponse.json({ error: "Animal no encontrado." }, { status: 404 })
  }

  const uploadedPaths: string[] = []
  const imageUrls: string[] = []

  for (const [index, image] of images.entries()) {
    const path = `${animalId}/${crypto.randomUUID()}-${index}.${extensionFor(image)}`
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, await image.arrayBuffer(), {
        contentType: image.type,
        upsert: false,
      })

    if (uploadError) {
      if (uploadedPaths.length) {
        await admin.storage.from(BUCKET).remove(uploadedPaths)
      }
      return NextResponse.json(
        { error: `No se pudo cargar "${image.name}": ${uploadError.message}` },
        { status: 500 },
      )
    }

    uploadedPaths.push(path)
    const { data } = admin.storage.from(BUCKET).getPublicUrl(path)
    imageUrls.push(data.publicUrl)
  }

  const { error: updateError } = await supabaseUser
    .from("animals")
    .update({ images: imageUrls })
    .eq("id", animalId)

  if (updateError) {
    await admin.storage.from(BUCKET).remove(uploadedPaths)
    return NextResponse.json(
      { error: `No se pudieron guardar las imágenes: ${updateError.message}` },
      { status: 500 },
    )
  }

  const oldPaths = ((currentAnimal.images as string[] | null) ?? [])
    .map(storagePathFromUrl)
    .filter((path): path is string => Boolean(path))

  if (oldPaths.length) {
    await admin.storage.from(BUCKET).remove(oldPaths)
  }

  return NextResponse.json({ images: imageUrls })
}

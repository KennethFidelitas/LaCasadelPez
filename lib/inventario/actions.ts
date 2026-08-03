'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  type EntradaItemValues,
  type RegistroMuerteValues,
  type SalidaProductoValues,
  type ProductoValues,
} from './schemas'

export type RegistrarEntradaInventarioInput = EntradaItemValues & {
  itemType: 'animal' | 'product'
  itemId: string
}

// Reemplaza a la antigua registrarEntradaAnimal (animal-only). Genérica para
// animal_id o product_id — inventory e inventory_entries soportan ambos
// (ver scripts/001_core_schema.sql y scripts/011_inventory_entries_product_support.sql).
export async function registrarEntradaInventario(input: RegistrarEntradaInventarioInput) {
  const supabase = createAdminClient()
  const idColumn = input.itemType === 'animal' ? 'animal_id' : 'product_id'

  // 0. Usuario autenticado, para registered_by (trazabilidad contable)
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  // 1. Obtener el stock actual del ítem
  const { data: inventario, error: errorInventario } = await supabase
    .from('inventory')
    .select('id, quantity')
    .eq(idColumn, input.itemId)
    .single()

  if (errorInventario) {
    throw new Error(`No se encontró el inventario: ${errorInventario.message}`)
  }

  // 2. Registrar la entrada en inventory_entries
  const { data: entradaInsertada, error: errorEntrada } = await supabase
    .from('inventory_entries')
    .insert({
      [idColumn]: input.itemId,
      entry_type: 'entrada',
      quantity: input.quantity,
      purchase_price: input.purchase_price,
      supplier: input.supplier ?? null,
      entry_date: input.entry_date,
      notes: input.notes ?? null,
      registered_by: user?.id ?? null,
    })
    .select('id')
    .single()

  if (errorEntrada || !entradaInsertada) {
    throw new Error(`Error al registrar la entrada: ${errorEntrada?.message}`)
  }

  // 3. Sumar la cantidad al stock actual en inventory.
  //    No hay transacción real (no existe un RPC en Postgres para esto todavía;
  //    sería la forma correcta de garantizar atomicidad real). Como mitigación,
  //    si este update falla se revierte manualmente la entrada recién insertada
  //    para no dejar un movimiento huérfano que no sumó stock.
  const { error: errorUpdate } = await supabase
    .from('inventory')
    .update({ quantity: inventario.quantity + input.quantity })
    .eq('id', inventario.id)

  if (errorUpdate) {
    await supabase.from('inventory_entries').delete().eq('id', entradaInsertada.id)
    throw new Error(`Error al actualizar el stock (la entrada fue revertida): ${errorUpdate.message}`)
  }

  if (input.itemType === 'animal') {
    revalidatePath('/inventario/agregar-animal')
    revalidatePath('/inventario/consultar-animales')
  }
  // No hay páginas de producto todavía (formularios de alta/edición de
  // producto quedaron para un paso posterior) — nada más que revalidar.
}

// ─── RF-INV-006: Registrar muerte de animales ─────────────────────────────────

export async function registrarMuerteAnimal(
  data: RegistroMuerteValues,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // 1. Obtener usuario autenticado
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()

    // 2. Obtener stock actual del animal
    const { data: inventario, error: errorInventario } = await supabase
      .from('inventory')
      .select('id, quantity')
      .eq('animal_id', data.animal_id)
      .single()

    if (errorInventario) {
      return { success: false, error: 'No se encontró el inventario del animal.' }
    }

    // 3. Validar que la cantidad no supere el stock actual
    if (data.quantity > inventario.quantity) {
      return {
        success: false,
        error: `La cantidad ingresada (${data.quantity}) supera el stock actual (${inventario.quantity}).`,
      }
    }

    // 4. Registrar en animal_mortality
    const { error: errorMuerte } = await supabase.from('animal_mortality').insert({
      animal_id: data.animal_id,
      quantity: data.quantity,
      reason: data.reason,
      notes: data.notes ?? null,
      recorded_by: user?.id ?? null,
      recorded_at: data.recorded_at,
    })

    if (errorMuerte) {
      return { success: false, error: `Error al registrar la baja: ${errorMuerte.message}` }
    }

    // 5. Restar la cantidad del stock en inventory
    const { error: errorUpdate } = await supabase
      .from('inventory')
      .update({ quantity: inventario.quantity - data.quantity })
      .eq('id', inventario.id)

    if (errorUpdate) {
      return { success: false, error: `Error al actualizar el stock: ${errorUpdate.message}` }
    }

    // 6. Revalidar rutas afectadas
    revalidatePath('/inventario/consultar-animales')
    revalidatePath('/inventario/registro-muerte')

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

// ─── Salida de productos ──────────────────────────────────────────────────────
// Equivalente de registrarMuerteAnimal para productos, pero sin evento
// biológico: se registra como movimiento en inventory_entries con
// entry_type='salida' (scripts/012_inventory_entries_tipo_movimiento.sql),
// no en animal_mortality.

export async function registrarSalidaProducto(
  data: SalidaProductoValues & { productId: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // 1. Obtener usuario autenticado
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()

    // 2. Obtener stock actual del producto
    const { data: inventario, error: errorInventario } = await supabase
      .from('inventory')
      .select('id, quantity')
      .eq('product_id', data.productId)
      .single()

    if (errorInventario) {
      return { success: false, error: 'No se encontró el inventario del producto.' }
    }

    // 3. Validar que la cantidad no supere el stock actual
    if (data.quantity > inventario.quantity) {
      return {
        success: false,
        error: `La cantidad ingresada (${data.quantity}) supera el stock actual (${inventario.quantity}).`,
      }
    }

    // 4. Registrar la salida en inventory_entries
    const { data: salidaInsertada, error: errorSalida } = await supabase
      .from('inventory_entries')
      .insert({
        product_id: data.productId,
        entry_type: 'salida',
        quantity: data.quantity,
        entry_date: data.recorded_at,
        reason: data.reason,
        notes: data.notes ?? null,
        registered_by: user?.id ?? null,
      })
      .select('id')
      .single()

    if (errorSalida || !salidaInsertada) {
      return { success: false, error: `Error al registrar la salida: ${errorSalida?.message}` }
    }

    // 5. Restar la cantidad del stock en inventory.
    //    Misma mitigación de atomicidad que registrarEntradaInventario: si el
    //    update falla, se revierte la salida recién insertada.
    const { error: errorUpdate } = await supabase
      .from('inventory')
      .update({ quantity: inventario.quantity - data.quantity })
      .eq('id', inventario.id)

    if (errorUpdate) {
      await supabase.from('inventory_entries').delete().eq('id', salidaInsertada.id)
      return { success: false, error: `Error al actualizar el stock (la salida fue revertida): ${errorUpdate.message}` }
    }

    // No hay páginas de producto todavía — nada más que revalidar.

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

// ─── Alta de producto ──────────────────────────────────────────────────────────
// Análoga a la registrarAnimal inline de agregar-animal/page.tsx (mismo patrón
// de slug/sku/imágenes/compensación), pero centralizada acá y genérica para
// llamarse desde un componente cliente con react-hook-form, no desde un
// <form action> nativo. NO toca animals ni agregar-animal/page.tsx.

const PRODUCT_IMAGES_BUCKET = 'product-images'
const MAX_PRODUCT_IMAGES = 5
const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024
const ALLOWED_PRODUCT_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function productImageExtension(file: File) {
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return 'jpg'
}

function slugify(name: string) {
  return `${name}-${Date.now()}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function crearProducto(
  input: ProductoValues,
  images: File[],
): Promise<{ success: boolean; error?: string; productId?: string }> {
  try {
    const supabase = createAdminClient()

    // 1. Validar imágenes (mismas reglas que animal-images)
    if (images.length > MAX_PRODUCT_IMAGES) {
      return { success: false, error: `Puede cargar un máximo de ${MAX_PRODUCT_IMAGES} imágenes.` }
    }
    for (const image of images) {
      if (!ALLOWED_PRODUCT_IMAGE_TYPES.has(image.type)) {
        return { success: false, error: 'Las imágenes deben ser JPG, PNG o WEBP.' }
      }
      if (image.size > MAX_PRODUCT_IMAGE_SIZE) {
        return {
          success: false,
          error: `Cada imagen puede pesar como máximo ${MAX_PRODUCT_IMAGE_SIZE / 1024 / 1024} MB.`,
        }
      }
    }

    const slug = slugify(input.name)
    const sku = `PR-${Date.now()}`
    const uploadedPaths: string[] = []
    const imageUrls: string[] = []

    // 2. Subir imágenes (bucket product-images, se crea si no existe)
    if (images.length) {
      const { data: bucket, error: getBucketError } = await supabase.storage.getBucket(PRODUCT_IMAGES_BUCKET)
      if (getBucketError && !getBucketError.message.toLowerCase().includes('not found')) {
        return {
          success: false,
          error: `No se pudo conectar con el almacenamiento de imágenes: ${getBucketError.message}`,
        }
      }

      if (!bucket) {
        const { error: bucketError } = await supabase.storage.createBucket(PRODUCT_IMAGES_BUCKET, {
          public: true,
          allowedMimeTypes: [...ALLOWED_PRODUCT_IMAGE_TYPES],
          fileSizeLimit: MAX_PRODUCT_IMAGE_SIZE,
        })
        if (bucketError && !bucketError.message.toLowerCase().includes('already exists')) {
          return {
            success: false,
            error: `No se pudo preparar el almacenamiento de imágenes: ${bucketError.message}`,
          }
        }
      }

      for (const [index, image] of images.entries()) {
        const path = `${slug}/${crypto.randomUUID()}-${index}.${productImageExtension(image)}`
        const { error: uploadError } = await supabase.storage
          .from(PRODUCT_IMAGES_BUCKET)
          .upload(path, await image.arrayBuffer(), { contentType: image.type, upsert: false })

        if (uploadError) {
          if (uploadedPaths.length) {
            await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(uploadedPaths)
          }
          return { success: false, error: `No se pudo cargar la imagen "${image.name}": ${uploadError.message}` }
        }

        uploadedPaths.push(path)
        const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path)
        imageUrls.push(data.publicUrl)
      }
    }

    // 3. Insertar el producto
    const { data: producto, error: errorProducto } = await supabase
      .from('products')
      .insert({
        name: input.name,
        slug,
        sku,
        brand: input.brand || null,
        description: input.description,
        category_id: input.category_id,
        price: input.price,
        cost: input.cost,
        images: imageUrls.length ? imageUrls : null,
        is_active: true,
        is_featured: input.is_featured,
      })
      .select('id')
      .single()

    if (errorProducto || !producto) {
      if (uploadedPaths.length) {
        await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(uploadedPaths)
      }
      return { success: false, error: `Error al registrar el producto: ${errorProducto?.message}` }
    }

    // 4. Crear la fila de inventory. Sin transacción real (mismo caso que
    //    registrarEntradaInventario/registrarSalidaProducto) — si falla, se
    //    revierte el producto recién creado y sus imágenes.
    const { error: errorInventario } = await supabase.from('inventory').insert({
      product_id: producto.id,
      quantity: input.quantity,
      location: input.location,
      low_stock_threshold: input.low_stock_threshold ?? 5,
    })

    if (errorInventario) {
      await supabase.from('products').delete().eq('id', producto.id)
      if (uploadedPaths.length) {
        await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(uploadedPaths)
      }
      return {
        success: false,
        error: `Error al crear el inventario (el producto fue revertido): ${errorInventario.message}`,
      }
    }

    return { success: true, productId: producto.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return { success: false, error: message }
  }
}


import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

import { createAdminClient } from '@/lib/supabase/admin'
import { FormularioEditarProducto } from '@/components/inventario/formulario-editar-producto'
import { Skeleton } from '@/components/ui/display/skeleton'

// ─── Carga de datos ───────────────────────────────────────────────────────────

async function cargarProducto(id: string) {
  const supabase = createAdminClient()

  const [productoRes, inventarioRes, categoriasRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, sku, name, brand, description, category_id, price, cost, is_featured, images')
      .eq('id', id)
      .single(),
    supabase
      .from('inventory')
      .select('quantity, location, low_stock_threshold')
      .eq('product_id', id)
      .single(),
    supabase.from('categories').select('id, name').eq('type', 'product').order('name', { ascending: true }),
  ])

  if (productoRes.error || !productoRes.data) return null
  if (inventarioRes.error || !inventarioRes.data) return null

  return {
    producto: productoRes.data,
    inventario: inventarioRes.data,
    categorias: categoriasRes.data ?? [],
  }
}

// ─── Sección con datos (componente async interno) ─────────────────────────────

async function SeccionFormulario({ id }: { id: string }) {
  const datos = await cargarProducto(id)
  if (!datos) notFound()

  return (
    <FormularioEditarProducto
      producto={datos.producto}
      inventario={datos.inventario}
      categorias={datos.categorias}
    />
  )
}

// ─── Skeleton de carga ────────────────────────────────────────────────────────

function FormularioSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border py-6 shadow-sm">
        <div className="px-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="col-span-2 h-20 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </div>
      <div className="rounded-xl border py-6 shadow-sm">
        <div className="px-6 space-y-4">
          <Skeleton className="h-5 w-48" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-36" />
      </div>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav
        aria-label="Ruta de navegación"
        className="mb-4 flex items-center gap-1.5 text-xs text-foreground/50"
      >
        <Link href="/dashboard" className="transition-colors hover:text-foreground">
          Panel admin
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/dashboard?modulo=inventory" className="transition-colors hover:text-foreground">
          Inventario
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Editar producto</span>
      </nav>

      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Editar producto</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Modifique los campos necesarios y guarde los cambios.
        </p>
      </div>

      {/* Formulario con Suspense */}
      <Suspense fallback={<FormularioSkeleton />}>
        <SeccionFormulario id={id} />
      </Suspense>
    </div>
  )
}

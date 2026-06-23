import { Suspense } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { createAdminClient } from '@/lib/supabase/admin'
import { FormularioMuerte } from '@/components/inventario/formulario-muerte'
import { Skeleton } from '@/components/ui/display/skeleton'

// ─── Carga de datos ───────────────────────────────────────────────────────────

async function cargarAnimalesConStock() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('animals')
    .select('id, name, sku, inventory(quantity, location)')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)

  // Solo animales con al menos 1 unidad en inventario
  return (data ?? []).filter(
    (animal) => (animal.inventory?.[0]?.quantity ?? 0) > 0,
  )
}

// ─── Sección con datos (componente async interno) ─────────────────────────────

async function SeccionFormulario() {
  const animales = await cargarAnimalesConStock()
  return <FormularioMuerte animales={animales} />
}

// ─── Skeleton de carga ────────────────────────────────────────────────────────

function FormularioSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border py-6 shadow-sm">
        <div className="px-6 space-y-4">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
      <div className="rounded-xl border py-6 shadow-sm">
        <div className="px-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="col-span-2 h-9 w-full" />
            <Skeleton className="col-span-2 h-20 w-full" />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function RegistroMuertePage() {
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
        <Link
          href="/inventario/consultar-animales"
          className="transition-colors hover:text-foreground"
        >
          Inventario
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Registrar baja</span>
      </nav>

      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Registrar baja de animales</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seleccione el animal, indique la cantidad y la causa de la baja.
          El formulario se limpia automáticamente para registrar múltiples bajas.
        </p>
      </div>

      {/* Formulario con Suspense */}
      <Suspense fallback={<FormularioSkeleton />}>
        <SeccionFormulario />
      </Suspense>
    </div>
  )
}

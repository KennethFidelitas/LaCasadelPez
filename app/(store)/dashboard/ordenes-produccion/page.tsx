import { Suspense } from 'react'
import Link from 'next/link'
import { ChevronRight, Plus } from 'lucide-react'

import { Button } from '@/components/ui/actions/button'
import { TablaOrdenes, TablaOrdenesSkeleton } from '@/components/ordenes-produccion/tabla-ordenes'
import { listarOrdenes } from '@/lib/ordenes-produccion/actions'
import type { ProductionOrder } from '@/lib/types'

interface PageProps {
  searchParams: Promise<{
    status?: string
    payment_status?: string
    buscar?: string
  }>
}

export default async function OrdenesProduccionPage({ searchParams }: PageProps) {
  const params = await searchParams

  let ordenes: ProductionOrder[] = []
  let errorMsg: string | null = null

  try {
    ordenes = await listarOrdenes(params)
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : 'Error desconocido'
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav
        aria-label="Ruta de navegación"
        className="mb-4 flex items-center gap-1.5 text-xs text-foreground/50"
      >
        <Link href="/dashboard" className="transition-colors hover:text-foreground">
          Panel admin
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Órdenes de producción</span>
      </nav>

      {/* Encabezado */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Órdenes de producción</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestión de peceras personalizadas — cotizaciones, fabricación y entregas.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/ordenes-produccion/nueva">
            <Plus className="h-4 w-4" />
            Nueva orden
          </Link>
        </Button>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <strong>Error al cargar órdenes:</strong> {errorMsg}
        </div>
      )}

      <Suspense fallback={<TablaOrdenesSkeleton />}>
        <TablaOrdenes ordenes={ordenes} filtrosActivos={params} />
      </Suspense>
    </div>
  )
}

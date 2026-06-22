import { Suspense } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { getEstadisticasMortalidad } from '@/lib/inventario/actions'
import {
  DashboardMortalidad,
  DashboardMortalidadSkeleton,
} from '@/components/inventario/dashboard-mortalidad'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface SearchParams {
  fechaInicio?: string
  fechaFin?: string
}

// ─── Sección con datos (componente async interno) ─────────────────────────────

async function SeccionDashboard({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  const filtros = {
    fechaInicio: params.fechaInicio,
    fechaFin: params.fechaFin,
  }

  const estadisticas = await getEstadisticasMortalidad(filtros)

  return (
    <DashboardMortalidad estadisticas={estadisticas} filtrosActivos={filtros} />
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function EstadisticasMortalidadPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
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
        <span className="text-foreground">Estadísticas de mortalidad</span>
      </nav>

      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Estadísticas de mortalidad
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Analiza tendencias, causas y especies más afectadas. Por defecto
          muestra los últimos 12 meses; usa el filtro de fechas para acotar el
          período.
        </p>
      </div>

      {/* Dashboard con Suspense */}
      <Suspense fallback={<DashboardMortalidadSkeleton />}>
        <SeccionDashboard searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

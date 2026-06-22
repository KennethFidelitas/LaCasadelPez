import { Suspense } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { getHistorialMuertes } from '@/lib/inventario/actions'
import {
  TablaHistorialMuertes,
  TablaHistorialMuertesSkeleton,
} from '@/components/inventario/tabla-historial-muertes'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface SearchParams {
  fechaInicio?: string
  fechaFin?: string
  nombreAnimal?: string
  causa?: string
  page?: string
}

// ─── Sección con datos (componente async interno) ─────────────────────────────

async function SeccionTabla({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  const filtros = {
    fechaInicio: params.fechaInicio,
    fechaFin: params.fechaFin,
    nombreAnimal: params.nombreAnimal,
    causa: params.causa,
    page: params.page ? parseInt(params.page, 10) : undefined,
  }

  const { data, total } = await getHistorialMuertes(filtros)

  return (
    <TablaHistorialMuertes
      registros={data}
      total={total}
      filtrosActivos={filtros}
    />
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function HistorialMuertesPage({
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
        <span className="text-foreground">Historial de bajas</span>
      </nav>

      {/* Encabezado */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Historial de bajas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulta y filtra todas las bajas de animales registradas. Usa los filtros
            para acotar por fecha, especie o causa, y exporta los resultados a CSV.
          </p>
        </div>
        <Link
          href="/dashboard?modulo=inventory"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver
        </Link>
      </div>

      {/* Tabla con Suspense */}
      <Suspense fallback={<TablaHistorialMuertesSkeleton />}>
        <SeccionTabla searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

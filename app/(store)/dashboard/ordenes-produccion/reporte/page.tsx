import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { ReporteOrdenesProduccion } from '@/components/ordenes-produccion/reporte-ordenes-produccion'
import { obtenerReporteOrdenesProduccion } from '@/lib/ordenes-produccion/actions'
import type { ReporteOrdenesProduccion as ReporteOrdenesProduccionData } from '@/lib/ordenes-produccion/report'

export default async function ReporteOrdenesProduccionPage() {
  let reporte: ReporteOrdenesProduccionData | null = null
  let errorMsg: string | null = null

  try {
    reporte = await obtenerReporteOrdenesProduccion()
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : 'Error desconocido'
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav
        aria-label="Ruta de navegación"
        className="mb-4 flex items-center gap-1.5 text-xs text-foreground/50 print:hidden"
      >
        <Link href="/dashboard" className="transition-colors hover:text-foreground">
          Panel admin
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href="/dashboard/ordenes-produccion"
          className="transition-colors hover:text-foreground"
        >
          Ordenes de produccion
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Reporte</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Reporte de ordenes de produccion</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Resumen operativo para planear fabricacion, entregas y cobros.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <strong>Error al cargar reporte:</strong> {errorMsg}
        </div>
      )}

      {reporte && <ReporteOrdenesProduccion reporte={reporte} />}
    </div>
  )
}

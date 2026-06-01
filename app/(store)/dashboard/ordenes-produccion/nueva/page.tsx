import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { FormularioOrden } from '@/components/ordenes-produccion/formulario-orden'

export default function NuevaOrdenPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
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
          href="/dashboard/ordenes-produccion"
          className="transition-colors hover:text-foreground"
        >
          Órdenes de producción
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Nueva orden</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Nueva orden de producción</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          El número de orden se genera automáticamente al guardar.
        </p>
      </div>

      <FormularioOrden />
    </div>
  )
}

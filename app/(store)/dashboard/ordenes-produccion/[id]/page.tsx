import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Printer } from 'lucide-react'

import { Button } from '@/components/ui/actions/button'
import { FormularioOrden } from '@/components/ordenes-produccion/formulario-orden'
import { BadgeEstado, BadgePago } from '@/components/ordenes-produccion/badge-estado'
import { BotonesAccionOrden } from '@/components/ordenes-produccion/botones-accion-orden'
import { obtenerOrden } from '@/lib/ordenes-produccion/actions'
import { formatOrderNumber, formatDate } from '@/lib/format'
import type { ProductionOrder } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditarOrdenPage({ params }: PageProps) {
  const { id } = await params

  let orden: ProductionOrder | null = null

  try {
    orden = await obtenerOrden(id)
  } catch {
    orden = null
  }

  if (!orden) notFound()

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
        <span className="text-foreground">{formatOrderNumber(orden.order_number)}</span>
      </nav>

      {/* Encabezado */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">
              {formatOrderNumber(orden.order_number)}
            </h1>
            <BadgeEstado status={orden.status} />
            <BadgePago status={orden.payment_status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Creada el {formatDate(orden.created_at)}
            {orden.customer_name ? ` · ${orden.customer_name}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/ordenes-produccion/${id}/imprimir`}>
              <Printer className="h-4 w-4" />
              Imprimir
            </Link>
          </Button>
          <BotonesAccionOrden ordenId={id} orderNumber={orden.order_number} />
        </div>
      </div>

      <FormularioOrden orden={orden} />
    </div>
  )
}

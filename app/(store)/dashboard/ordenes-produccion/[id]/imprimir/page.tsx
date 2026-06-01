import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/actions/button'
import { VistaImpresion } from '@/components/ordenes-produccion/vista-impresion'
import { BotonImprimir } from '@/components/ordenes-produccion/boton-imprimir'
import { obtenerOrden } from '@/lib/ordenes-produccion/actions'
import type { ProductionOrder } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ImprimirOrdenPage({ params }: PageProps) {
  const { id } = await params

  let orden: ProductionOrder | null = null

  try {
    orden = await obtenerOrden(id)
  } catch {
    orden = null
  }

  if (!orden) notFound()

  return (
    <>
      {/* Barra de acción — oculta al imprimir */}
      <div className="print:hidden sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/ordenes-produccion/${id}`}>
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </Button>
          <BotonImprimir />
        </div>
      </div>

      <VistaImpresion orden={orden} />
    </>
  )
}

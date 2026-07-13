'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/actions/button'

export function BackButton() {
  const router = useRouter()

  function handleBack() {
    // El comprobante se abre en pestaña nueva (window.open) desde Apartados,
    // así que ahí no hay historial propio: cerramos la pestaña para volver
    // a la vista de Apartados que quedó abierta. Si no se puede cerrar
    // (pestaña no abierta por script), caemos a router.back().
    if (window.opener || window.history.length <= 1) {
      window.close()
    }
    router.back()
  }

  return (
    <Button variant="outline" onClick={handleBack}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      Volver
    </Button>
  )
}

export function PrintButton() {
  return (
    <Button onClick={() => window.print()}>
      <Printer className="mr-2 h-4 w-4" />
      Imprimir
    </Button>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/actions/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/feedback/alert-dialog'
import { eliminarOrden } from '@/lib/ordenes-produccion/actions'
import { formatOrderNumber } from '@/lib/format'

interface BotonesAccionOrdenProps {
  ordenId: string
  orderNumber: string
}

export function BotonesAccionOrden({ ordenId, orderNumber }: BotonesAccionOrdenProps) {
  const router = useRouter()

  async function handleEliminar() {
    try {
      await eliminarOrden(ordenId)
      toast.success(`Orden ${formatOrderNumber(orderNumber)} eliminada`)
      router.push('/dashboard/ordenes-produccion')
      router.refresh()
    } catch (err) {
      toast.error('No se pudo eliminar la orden')
      console.error(err)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
          Eliminar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar orden de producción?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente la orden{' '}
            <strong>{formatOrderNumber(orderNumber)}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleEliminar}
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

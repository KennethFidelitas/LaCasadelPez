'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition, useCallback } from 'react'
import Link from 'next/link'
import { Search, Pencil, Trash2, Printer, X } from 'lucide-react'
import { toast } from 'sonner'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/display/table'
import { Button } from '@/components/ui/actions/button'
import { Input } from '@/components/ui/forms/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/forms/select'
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
import { Skeleton } from '@/components/ui/display/skeleton'
import { BadgeEstado, BadgePago } from './badge-estado'
import { eliminarOrden } from '@/lib/ordenes-produccion/actions'
import { formatPrice, formatDate, formatOrderNumber } from '@/lib/format'
import { PRODUCTION_STATUSES, PAYMENT_STATUSES, STATUS_LABELS, PAYMENT_LABELS } from '@/lib/ordenes-produccion/schemas'
import type { ProductionOrder } from '@/lib/types'

interface TablaOrdenesProps {
  ordenes: ProductionOrder[]
  filtrosActivos: {
    status?: string
    payment_status?: string
    buscar?: string
  }
}

export function TablaOrdenes({ ordenes, filtrosActivos }: TablaOrdenesProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const actualizarFiltro = useCallback(
    (clave: string, valor: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (valor && valor !== 'todos') {
        params.set(clave, valor)
      } else {
        params.delete(clave)
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, searchParams],
  )

  const hayFiltros =
    !!filtrosActivos.status ||
    !!filtrosActivos.payment_status ||
    !!filtrosActivos.buscar

  function limpiarFiltros() {
    startTransition(() => {
      router.push(pathname)
    })
  }

  async function handleEliminar(id: string, orderNumber: string) {
    try {
      await eliminarOrden(id)
      toast.success(`Orden ${formatOrderNumber(orderNumber)} eliminada`)
      router.refresh()
    } catch (err) {
      toast.error('No se pudo eliminar la orden')
      console.error(err)
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Búsqueda */}
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            defaultValue={filtrosActivos.buscar ?? ''}
            placeholder="Buscar por # orden o cliente…"
            className="pl-9"
            onChange={(e) => {
              const valor = e.target.value
              // Debounce simple: actualizar al dejar de escribir
              const timer = setTimeout(() => actualizarFiltro('buscar', valor || null), 400)
              return () => clearTimeout(timer)
            }}
          />
        </div>

        {/* Filtro de estado */}
        <Select
          value={filtrosActivos.status ?? 'todos'}
          onValueChange={(v) => actualizarFiltro('status', v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado de producción" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {PRODUCTION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro de pago */}
        <Select
          value={filtrosActivos.payment_status ?? 'todos'}
          onValueChange={(v) => actualizarFiltro('payment_status', v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado de pago" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los pagos</SelectItem>
            {PAYMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {PAYMENT_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Limpiar filtros */}
        {hayFiltros && (
          <Button variant="ghost" size="sm" onClick={limpiarFiltros} className="gap-1.5">
            <X className="h-3.5 w-3.5" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Conteo */}
      <p className="text-sm text-muted-foreground">
        {ordenes.length === 0
          ? 'Sin órdenes con estos filtros'
          : `${ordenes.length} orden${ordenes.length !== 1 ? 'es' : ''}`}
        {isPending && ' · actualizando…'}
      </p>

      {/* Tabla */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]"># Orden</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Dimensiones</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Total</TableHead>
              <TableHead className="hidden lg:table-cell">Creada</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordenes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No hay órdenes de producción registradas.
                </TableCell>
              </TableRow>
            ) : (
              ordenes.map((orden) => (
                <TableRow key={orden.id}>
                  {/* Número */}
                  <TableCell className="font-mono text-sm font-medium">
                    {formatOrderNumber(orden.order_number)}
                  </TableCell>

                  {/* Cliente */}
                  <TableCell>
                    <div className="font-medium text-foreground">
                      {orden.customer_name ?? '—'}
                    </div>
                    {orden.customer_phone && (
                      <div className="text-xs text-muted-foreground">{orden.customer_phone}</div>
                    )}
                  </TableCell>

                  {/* Dimensiones */}
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {orden.width && orden.height && orden.depth
                      ? `${orden.width}×${orden.height}×${orden.depth} cm`
                      : <span className="italic">Sin especificar</span>}
                  </TableCell>

                  {/* Estado producción */}
                  <TableCell>
                    <BadgeEstado status={orden.status} />
                  </TableCell>

                  {/* Estado pago */}
                  <TableCell>
                    <BadgePago status={orden.payment_status} />
                  </TableCell>

                  {/* Total */}
                  <TableCell className="hidden lg:table-cell text-right font-medium">
                    {formatPrice(orden.total)}
                  </TableCell>

                  {/* Fecha */}
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {formatDate(orden.created_at)}
                  </TableCell>

                  {/* Acciones */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" asChild title="Imprimir orden">
                        <Link href={`/dashboard/ordenes-produccion/${orden.id}/imprimir`}>
                          <Printer className="h-4 w-4" />
                          <span className="sr-only">Imprimir</span>
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon-sm" asChild title="Editar orden">
                        <Link href={`/dashboard/ordenes-produccion/${orden.id}`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Eliminar orden"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar orden de producción?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente
                              la orden <strong>{formatOrderNumber(orden.order_number)}</strong>
                              {orden.customer_name ? ` de ${orden.customer_name}` : ''}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleEliminar(orden.id, orden.order_number)}
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export function TablaOrdenesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-[180px]" />
        <Skeleton className="h-9 w-[160px]" />
      </div>
      <div className="rounded-lg border">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

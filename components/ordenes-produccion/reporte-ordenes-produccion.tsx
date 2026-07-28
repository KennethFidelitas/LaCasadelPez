import Link from 'next/link'
import type { ComponentType } from 'react'
import { CheckCircle2, ClipboardList, Factory, Wallet } from 'lucide-react'

import { BadgeEstado, BadgePago } from './badge-estado'
import { BotonImprimir } from './boton-imprimir'
import { Button } from '@/components/ui/actions/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/display/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/display/table'
import { formatDate, formatOrderNumber, formatPrice } from '@/lib/format'
import type { OrdenProduccionPlan, ReporteOrdenesProduccion } from '@/lib/ordenes-produccion/report'

type ReporteOrdenesProduccionProps = {
  reporte: ReporteOrdenesProduccion
}

const PRIORIDAD_LABELS: Record<OrdenProduccionPlan['prioridad'], string> = {
  atrasada: 'Atrasada',
  esta_semana: 'Esta semana',
  programada: 'Programada',
  sin_fecha: 'Sin fecha',
}

function formatDimensiones(orden: OrdenProduccionPlan) {
  if (!orden.width || !orden.height || !orden.depth) return 'Sin especificar'
  return `${orden.width}x${orden.height}x${orden.depth} cm`
}

function formatFechaEstimada(orden: OrdenProduccionPlan) {
  if (!orden.fechaEstimadaEntrega) return 'Sin fecha estimada'
  return formatDate(orden.fechaEstimadaEntrega)
}

function formatDiasRestantes(orden: OrdenProduccionPlan) {
  if (orden.diasRestantes === null) return 'Sin estimacion'
  if (orden.diasRestantes < 0) return `${Math.abs(orden.diasRestantes)} dias tarde`
  if (orden.diasRestantes === 0) return 'Hoy'
  return `${orden.diasRestantes} dias`
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string
  value: string
  detail: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <Card className="rounded-lg">
      <CardContent className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardContent>
    </Card>
  )
}

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-8 text-center text-sm text-muted-foreground">
        {message}
      </TableCell>
    </TableRow>
  )
}

function OrdenResumen({ orden }: { orden: OrdenProduccionPlan }) {
  return (
    <div>
      <Link
        href={`/dashboard/ordenes-produccion/${orden.id}`}
        className="font-mono text-sm font-medium hover:underline"
      >
        {formatOrderNumber(orden.order_number)}
      </Link>
      <div className="text-sm text-foreground">{orden.customer_name ?? 'Cliente sin nombre'}</div>
      <div className="text-xs text-muted-foreground">{formatDimensiones(orden)}</div>
    </div>
  )
}

export function ReporteOrdenesProduccion({ reporte }: ReporteOrdenesProduccionProps) {
  const { resumen } = reporte

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-muted-foreground">
          Generado el {formatDate(reporte.generadoEn)}
        </p>
        <div className="flex flex-wrap gap-2">
          <BotonImprimir />
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/ordenes-produccion">Ver ordenes</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Ordenes activas"
          value={String(resumen.activas)}
          detail={`${resumen.confirmadas} confirmadas, ${resumen.enProduccion} en produccion`}
          icon={Factory}
        />
        <MetricCard
          title="Listas para entrega"
          value={String(resumen.listasParaEntrega)}
          detail="Ordenes terminadas que deben coordinarse con cliente."
          icon={CheckCircle2}
        />
        <MetricCard
          title="Ventas activas"
          value={formatPrice(resumen.ventasActivas)}
          detail={`Ticket promedio ${formatPrice(resumen.ticketPromedioActivo)}`}
          icon={ClipboardList}
        />
        <MetricCard
          title="Saldos pendientes"
          value={formatPrice(resumen.saldosPendientes)}
          detail={`${formatPrice(resumen.anticiposRecibidos)} recibidos en anticipos`}
          icon={Wallet}
        />
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Plan de produccion</CardTitle>
            <CardDescription>
              Ordenes confirmadas o en fabricacion ordenadas por fecha estimada de entrega.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Orden</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Entrega estimada</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reporte.planProduccion.length === 0 ? (
                    <EmptyRow colSpan={5} message="No hay ordenes confirmadas o en produccion." />
                  ) : (
                    reporte.planProduccion.map((orden) => (
                      <TableRow key={orden.id}>
                        <TableCell>
                          <OrdenResumen orden={orden} />
                        </TableCell>
                        <TableCell>
                          <BadgeEstado status={orden.status} />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{formatFechaEstimada(orden)}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDiasRestantes(orden)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {PRIORIDAD_LABELS[orden.prioridad]}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(orden.total)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Estado general</CardTitle>
            <CardDescription>Distribucion actual para balancear cotizacion, taller y entrega.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <StatusStat label="Cotizadas" value={resumen.cotizacionesAbiertas} />
              <StatusStat label="Confirmadas" value={resumen.confirmadas} />
              <StatusStat label="En produccion" value={resumen.enProduccion} />
              <StatusStat label="Listas" value={resumen.listasParaEntrega} />
              <StatusStat label="Entregadas" value={resumen.entregadas} />
              <StatusStat label="Canceladas" value={resumen.canceladas} />
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Total historico</p>
              <p className="mt-1 text-2xl font-semibold">{resumen.totalOrdenes}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Pendientes de entrega</CardTitle>
            <CardDescription>Ordenes listas que requieren coordinacion final.</CardDescription>
          </CardHeader>
          <CardContent>
            <MiniOrdenTable
              ordenes={reporte.pendientesEntrega}
              emptyMessage="No hay ordenes listas para entregar."
              secondaryColumn="Saldo"
              renderSecondary={(orden) => formatPrice(orden.saldoPendiente)}
            />
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Cobros pendientes</CardTitle>
            <CardDescription>Saldos abiertos en ordenes activas.</CardDescription>
          </CardHeader>
          <CardContent>
            <MiniOrdenTable
              ordenes={reporte.cobrosPendientes}
              emptyMessage="No hay saldos pendientes en ordenes activas."
              secondaryColumn="Pendiente"
              renderSecondary={(orden) => formatPrice(orden.saldoPendiente)}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function StatusStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function MiniOrdenTable({
  ordenes,
  emptyMessage,
  secondaryColumn,
  renderSecondary,
}: {
  ordenes: OrdenProduccionPlan[]
  emptyMessage: string
  secondaryColumn: string
  renderSecondary: (orden: OrdenProduccionPlan) => string
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Orden</TableHead>
            <TableHead>Pago</TableHead>
            <TableHead className="text-right">{secondaryColumn}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordenes.length === 0 ? (
            <EmptyRow colSpan={3} message={emptyMessage} />
          ) : (
            ordenes.map((orden) => (
              <TableRow key={orden.id}>
                <TableCell>
                  <OrdenResumen orden={orden} />
                </TableCell>
                <TableCell>
                  <BadgePago status={orden.payment_status} />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {renderSecondary(orden)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

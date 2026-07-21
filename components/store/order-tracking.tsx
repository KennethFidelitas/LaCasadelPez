import Link from 'next/link'
import { CheckCircle, Clock, PackageCheck, PackageSearch, Truck } from 'lucide-react'
import { Badge } from '@/components/ui/display/badge'
import { Button } from '@/components/ui/actions/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/display/card'
import { formatDateTime, formatPrice } from '@/lib/format'

export type CustomerOrderItem = {
  id: string
  name: string
  sku: string | null
  quantity: number
  unit_price?: number | null
  total?: number | null
}

export type CustomerOrder = {
  id: string
  order_number: string
  status: string
  payment_status: string
  total: number
  notes: string | null
  source: string | null
  created_at: string
  updated_at: string
  order_items: CustomerOrderItem[]
}

const trackingSteps = [
  { key: 'pendiente', label: 'Recibido', icon: Clock },
  { key: 'confirmado', label: 'Confirmado', icon: CheckCircle },
  { key: 'procesando', label: 'Preparando', icon: PackageSearch },
  { key: 'enviado', label: 'En camino', icon: Truck },
  { key: 'entregado', label: 'Entregado', icon: PackageCheck },
]

const statusLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  procesando: 'Preparando',
  en_proceso: 'Preparando',
  enviado: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  reembolsado: 'Reembolsado',
}

const paymentLabels: Record<string, string> = {
  pendiente: 'Pago pendiente',
  pagado: 'Pagado',
  fallido: 'Pago fallido',
  reembolsado: 'Reembolsado',
}

export function CustomerOrdersSummary({ orders }: { orders: CustomerOrder[] }) {
  return (
    <Card className="rounded-lg lg:col-span-2">
      <CardHeader>
        <CardTitle>Mis pedidos</CardTitle>
        <CardDescription>Rastrea el estado de tus compras y revisa cuándo estarán listas.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {orders.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Todavía no tenés pedidos registrados en esta cuenta.
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="rounded-lg border p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="grid gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono font-semibold">#{order.order_number}</p>
                    <Badge variant={getStatusVariant(order.status)}>{getStatusLabel(order.status)}</Badge>
                    <Badge variant="outline">{getPaymentLabel(order.payment_status)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(order.created_at)} · {order.order_items.length} articulo(s) · {formatPrice(Number(order.total ?? 0))}
                  </p>
                  <p className="text-sm text-muted-foreground">{getArrivalMessage(order.status)}</p>
                </div>
                <Button variant="outline" asChild>
                  <Link href={`/cuenta/pedidos/${order.id}`}>Rastrear pedido</Link>
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export function CustomerOrderTrackingDetail({ order }: { order: CustomerOrder }) {
  return (
    <div className="grid gap-6">
      <Card className="rounded-lg">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Pedido #{order.order_number}</CardTitle>
              <CardDescription>{getArrivalMessage(order.status)}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={getStatusVariant(order.status)}>{getStatusLabel(order.status)}</Badge>
              <Badge variant="outline">{getPaymentLabel(order.payment_status)}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          <OrderTimeline status={order.status} />
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <InfoCell label="Pedido creado" value={formatDateTime(order.created_at)} />
            <InfoCell label="Ultima actualizacion" value={formatDateTime(order.updated_at)} />
            <InfoCell label="Total" value={formatPrice(Number(order.total ?? 0))} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Articulos del pedido</CardTitle>
          <CardDescription>Usa esta lista para confirmar qué viene en camino.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.sku ?? 'SIN-SKU'}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">x{item.quantity}</p>
                <p className="text-sm text-muted-foreground">{formatPrice(Number(item.total ?? 0))}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {order.notes && (
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Notas del pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{order.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function OrderTimeline({ status }: { status: string }) {
  if (status === 'cancelado' || status === 'reembolsado') {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        Este pedido está {getStatusLabel(status).toLowerCase()}. Contactanos si necesitás más información.
      </div>
    )
  }

  const normalizedStatus = status === 'en_proceso' ? 'procesando' : status
  const currentIndex = Math.max(0, trackingSteps.findIndex((step) => step.key === normalizedStatus))

  return (
    <div className="grid gap-3 md:grid-cols-5">
      {trackingSteps.map((step, index) => {
        const Icon = step.icon
        const isDone = index <= currentIndex

        return (
          <div
            key={step.key}
            className={[
              'rounded-lg border p-4',
              isDone ? 'border-primary/40 bg-primary/5 text-foreground' : 'text-muted-foreground',
            ].join(' ')}
          >
            <Icon className={isDone ? 'h-5 w-5 text-primary' : 'h-5 w-5'} />
            <p className="mt-3 text-sm font-medium">{step.label}</p>
          </div>
        )
      })}
    </div>
  )
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  )
}

function getStatusLabel(status: string) {
  return statusLabels[status] ?? status
}

function getPaymentLabel(status: string) {
  return paymentLabels[status] ?? status
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'cancelado' || status === 'reembolsado') return 'destructive'
  if (status === 'pendiente') return 'outline'
  if (status === 'entregado') return 'secondary'
  return 'default'
}

function getArrivalMessage(status: string) {
  if (status === 'pendiente') return 'Recibimos tu pedido y estamos validando el pago.'
  if (status === 'confirmado') return 'Tu pedido está confirmado y entrará a preparación.'
  if (status === 'procesando' || status === 'en_proceso') return 'Estamos preparando tu pedido para entrega o envío.'
  if (status === 'enviado') return 'Tu pedido va en camino. La entrega está próxima.'
  if (status === 'entregado') return 'Tu pedido ya fue entregado.'
  if (status === 'cancelado') return 'Este pedido fue cancelado.'
  if (status === 'reembolsado') return 'Este pedido fue reembolsado.'
  return 'Estamos revisando el estado de tu pedido.'
}

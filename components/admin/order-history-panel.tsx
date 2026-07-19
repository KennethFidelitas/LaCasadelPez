'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateOrderStatus } from '@/lib/pos/actions'
import type { PosSaleRecord, PosSalesSummary } from '@/lib/pos/types'
import { formatDateTime, formatPrice } from '@/lib/format'
import { Badge } from '@/components/ui/display/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/display/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/display/table'

const orderStatusOptions = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'procesando', label: 'En preparacion' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'reembolsado', label: 'Reembolsado' },
] as const

type OrderStatusValue = typeof orderStatusOptions[number]['value']

interface OrderHistoryPanelProps {
  orders: PosSaleRecord[]
  salesError?: string | null
  summary: PosSalesSummary
  onOrderUpdated: (orderId: string, status: OrderStatusValue, statusLabel: PosSaleRecord['status']) => void
}

export function OrderHistoryPanel({
  orders,
  salesError = null,
  summary,
  onOrderUpdated,
}: OrderHistoryPanelProps) {
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleOrderStatusChange(order: PosSaleRecord, status: OrderStatusValue) {
    if (order.rawStatus === status) return

    setUpdatingOrderId(order.id)

    startTransition(() => {
      void (async () => {
        try {
          const updated = await updateOrderStatus({
            orderId: order.id,
            status,
          })

          onOrderUpdated(order.id, updated.status, updated.statusLabel as PosSaleRecord['status'])

          if (order.customerEmail) {
            const response = await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: order.customerEmail,
                subject: `Actualización de tu pedido ${order.orderNumber}`,
                body: `Hola ${order.customer}, tu pedido ${order.orderNumber} ahora está en estado: ${updated.statusLabel}.`,
              }),
            })

            if (!response.ok) {
              toast.warning(`Pedido ${order.orderNumber} actualizado, pero no se pudo notificar al cliente.`)
              return
            }

            toast.success(`Pedido ${order.orderNumber} actualizado y cliente notificado.`)
          } else {
            toast.success(`Pedido ${order.orderNumber} actualizado. No hay correo registrado para notificar.`)
          }
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el estado del pedido')
        } finally {
          setUpdatingOrderId(null)
        }
      })()
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Historial de ventas</CardTitle>
          <CardDescription>Transacciones reales registradas en el sistema por canal y fecha.</CardDescription>
        </CardHeader>
        <CardContent>
          {salesError && (
            <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              No se pudo cargar el historial de ventas. Detalle: {salesError}
            </div>
          )}
          {orders.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Aún no hay ventas registradas para mostrar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-medium">{order.orderNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.transactionNumber ? `Tx ${order.transactionNumber}` : 'Sin transacción POS'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{order.customer}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.customerEmail ?? 'Sin correo para notificar'}
                      </div>
                    </TableCell>
                    <TableCell>{order.channel}</TableCell>
                    <TableCell>{order.paymentMethod}</TableCell>
                    <TableCell>{formatPrice(order.total)}</TableCell>
                    <TableCell>
                      <div className="flex min-w-40 flex-col gap-2">
                        <Badge
                          variant={
                            order.status === 'Cancelado' || order.status === 'Reembolsado'
                              ? 'destructive'
                              : order.status === 'Pendiente'
                                ? 'outline'
                                : 'default'
                          }
                        >
                          {order.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{order.paymentStatus}</span>
                        <select
                          value={order.rawStatus}
                          disabled={updatingOrderId === order.id}
                          onChange={(event) =>
                            handleOrderStatusChange(order, event.target.value as OrderStatusValue)
                          }
                          className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label={`Actualizar estado del pedido ${order.orderNumber}`}
                        >
                          {orderStatusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Analisis rapido</CardTitle>
          <CardDescription>Resumen inmediato para revisar transacciones y comportamiento del dia.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <OrderInsight
            title={`Ticket promedio hoy: ${formatPrice(summary.averageTicketToday)}`}
            detail="Promedio calculado sobre las transacciones pagadas del día."
          />
          <OrderInsight
            title={`Ventas POS hoy: ${summary.posSalesToday}`}
            detail="Mide la actividad de mostrador frente al resto de canales."
          />
          <OrderInsight
            title={`Ventas online hoy: ${summary.onlineSalesToday}`}
            detail="Sirve para comparar el aporte del e-commerce en tiempo real."
          />
          <OrderInsight
            title={`Pendientes por revisar: ${summary.pendingOrders}`}
            detail="Pedidos que todavía no están resueltos o entregados."
          />
        </CardContent>
      </Card>
    </div>
  )
}

function OrderInsight({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  )
}

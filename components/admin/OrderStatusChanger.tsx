'use client'

// RF-OP-006 — Como administrador quiero cambiar el estado de una orden
// y notificar automáticamente.

import { useState } from 'react'
import { CheckCircle, ChevronRight, Loader2, MessageSquare, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/actions/button'
import { Badge } from '@/components/ui/display/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/display/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/overlays/dialog'
import { Textarea } from '@/components/ui/forms/textarea'
import {
  type ProductionOrder,
  type ProductionOrderStatus,
  STATUS_LABELS,
  STATUS_NOTIFICATION_MESSAGES,
  getNextStatus,
  getStatusVariant,
  updateProductionOrderStatus,
} from '@/lib/production-orders'

interface Props {
  order: ProductionOrder
  adminUserId: string
  onStatusChanged?: (order: ProductionOrder) => void
}

export function OrderStatusChanger({ order, adminUserId, onStatusChanged }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [customMessage, setCustomMessage] = useState('')

  const nextStatus = getNextStatus(order.status)
  const canCancel = order.status !== 'cancelado' && order.status !== 'entregado'

  async function handleChangeStatus(newStatus: ProductionOrderStatus) {
    setLoading(true)
    setError(null)

    const { error: err } = await updateProductionOrderStatus(order.id, newStatus, adminUserId)

    setLoading(false)

    if (err) {
      setError(err)
      return
    }

    setSuccess(true)
    onStatusChanged?.({ ...order, status: newStatus })

    setTimeout(() => {
      setSuccess(false)
      setOpen(false)
    }, 1500)
  }

  const notificationPreview =
    nextStatus ? STATUS_NOTIFICATION_MESSAGES[nextStatus] : null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={!nextStatus && !canCancel}>
          Cambiar estado
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cambiar estado de orden</DialogTitle>
          <DialogDescription>
            Orden {order.order_number} · Cliente: {order.customer_name ?? 'Sin nombre'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Estado actual */}
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Estado actual</p>
              <div className="mt-1">
                <Badge variant={getStatusVariant(order.status)}>
                  {STATUS_LABELS[order.status]}
                </Badge>
              </div>
            </div>

            {nextStatus && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Siguiente estado</p>
                  <div className="mt-1">
                    <Badge variant={getStatusVariant(nextStatus)}>
                      {STATUS_LABELS[nextStatus]}
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Vista previa de la notificación automática */}
          {notificationPreview && (
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-start gap-2">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Notificación que recibirá el cliente
                  </p>
                  <p className="mt-1 text-sm text-foreground">{notificationPreview}</p>
                </div>
              </div>
            </div>
          )}

          {/* Nota interna adicional (opcional) */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              Nota interna adicional{' '}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Ej: Se coordinó con el área de producción..."
              rows={3}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
              <XCircle className="h-4 w-4 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-700">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <p className="text-sm">Estado actualizado y notificación registrada.</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {canCancel && order.status !== 'cancelado' && (
            <Button
              variant="destructive"
              onClick={() => handleChangeStatus('cancelado')}
              disabled={loading}
              className="sm:mr-auto"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancelar orden'}
            </Button>
          )}

          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cerrar
          </Button>

          {nextStatus && (
            <Button onClick={() => handleChangeStatus(nextStatus)} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                `Avanzar a "${STATUS_LABELS[nextStatus]}"`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Card de historial de estados ─────────────────────────────────────────────

interface StatusHistoryProps {
  updates: Array<{
    id: string
    status: ProductionOrderStatus | null
    message: string
    created_at: string
  }>
}

export function OrderStatusHistory({ updates }: StatusHistoryProps) {
  if (updates.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Sin historial de actualizaciones.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de estados</CardTitle>
        <CardDescription>Registro de cambios y notificaciones enviadas.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {updates.map((update) => (
          <div key={update.id} className="flex gap-3 rounded-lg border p-3">
            <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
            <div className="flex-1">
              {update.status && (
                <Badge variant={getStatusVariant(update.status)} className="mb-1">
                  {STATUS_LABELS[update.status]}
                </Badge>
              )}
              <p className="text-sm text-foreground">{update.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(update.created_at).toLocaleString('es-CR')}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

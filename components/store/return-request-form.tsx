'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createReturnRequest } from '@/lib/returns/actions'
import type { CustomerReturnRequest } from '@/lib/returns/types'
import type { CustomerOrder } from '@/components/store/order-tracking'
import { Button } from '@/components/ui/actions/button'
import { Badge } from '@/components/ui/display/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/display/card'
import { Textarea } from '@/components/ui/forms/textarea'
import { Label } from '@/components/ui/forms/label'

const reasonOptions = [
  { value: 'no_satisfecho', label: 'No estoy satisfecho' },
  { value: 'producto_danado', label: 'Producto dañado' },
  { value: 'producto_incorrecto', label: 'Producto incorrecto' },
  { value: 'otro', label: 'Otro motivo' },
] as const

const requestStatusLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
}

interface ReturnRequestFormProps {
  order: CustomerOrder
  existingRequest: CustomerReturnRequest | null
}

export function ReturnRequestForm({ order, existingRequest }: ReturnRequestFormProps) {
  const [reason, setReason] = useState<(typeof reasonOptions)[number]['value']>('no_satisfecho')
  const [orderItemId, setOrderItemId] = useState('all')
  const [details, setDetails] = useState('')
  const [isPending, startTransition] = useTransition()

  const canRequest =
    order.payment_status === 'pagado' &&
    !['cancelado', 'reembolsado'].includes(order.status) &&
    !existingRequest

  function handleSubmit() {
    startTransition(() => {
      void (async () => {
        try {
          await createReturnRequest({
            orderId: order.id,
            orderItemId: orderItemId === 'all' ? null : orderItemId,
            reason,
            details,
          })
          toast.success('Solicitud de devolución enviada.')
          setDetails('')
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'No se pudo enviar la solicitud.')
        }
      })()
    })
  }

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>Solicitar devolución</CardTitle>
        <CardDescription>
          Enviá una solicitud para que el equipo revise tu caso y te contacte.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {existingRequest ? (
          <div className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">Solicitud enviada</p>
              <Badge variant={existingRequest.status === 'rechazada' ? 'destructive' : 'outline'}>
                {requestStatusLabels[existingRequest.status] ?? existingRequest.status}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{existingRequest.details}</p>
            {existingRequest.admin_notes && (
              <p className="mt-3 text-sm">Respuesta del equipo: {existingRequest.admin_notes}</p>
            )}
          </div>
        ) : !canRequest ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Este pedido aún no permite solicitar devolución. Debe estar pagado y activo.
          </div>
        ) : (
          <>
            <div className="grid gap-2">
              <Label htmlFor="return-item">Producto</Label>
              <select
                id="return-item"
                value={orderItemId}
                onChange={(event) => setOrderItemId(event.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Pedido completo</option>
                {order.order_items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} x{item.quantity}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="return-reason">Motivo</Label>
              <select
                id="return-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value as typeof reason)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {reasonOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="return-details">Detalle</Label>
              <Textarea
                id="return-details"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="Contanos qué pasó y cómo podemos ayudarte."
                rows={5}
              />
            </div>

            <Button onClick={handleSubmit} disabled={isPending || details.trim().length < 10}>
              {isPending ? 'Enviando...' : 'Enviar solicitud'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

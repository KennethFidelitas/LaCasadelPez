'use client'

// RF-OP-007 — Registrar pago inicial del 50 %
// RF-OP-008 — Registrar pago del saldo restante

import { useState } from 'react'
import { CheckCircle, CreditCard, Loader2, XCircle } from 'lucide-react'
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
import { Input } from '@/components/ui/forms/input'
import { Textarea } from '@/components/ui/forms/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/forms/select'
import {
  type PaymentMethod,
  type ProductionOrder,
  calcBalance,
  calcDeposit,
  registerDepositPayment,
  registerFinalPayment,
} from '@/lib/production-orders'
import { formatPrice } from '@/lib/format'

// ─── Tipos internos ───────────────────────────────────────────────────────────

type PaymentMode = 'deposit' | 'final'

interface Props {
  order: ProductionOrder
  onPaymentRegistered?: (updatedOrder: ProductionOrder) => void
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'sinpe', label: 'SINPE Móvil' },
  { value: 'transferencia', label: 'Transferencia' },
]

// ─── Componente principal ─────────────────────────────────────────────────────

export function RegisterPaymentDialog({ order, onPaymentRegistered }: Props) {
  const deposit = calcDeposit(order.total)
  const balance = calcBalance(order.total, order.deposit_paid)
  const isFullyPaid = order.payment_status === 'pagado'
  const hasDeposit = order.payment_status === 'anticipo' || order.payment_status === 'pagado'

  // El modo se deduce del estado de pago actual
  const defaultMode: PaymentMode = hasDeposit ? 'final' : 'deposit'

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<PaymentMode>(defaultMode)
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function resetForm() {
    setAmount('')
    setPaymentMethod('efectivo')
    setNotes('')
    setError(null)
    setSuccess(false)
    setMode(defaultMode)
  }

  function handleOpenChange(val: boolean) {
    setOpen(val)
    if (!val) resetForm()
  }

  async function handleSubmit() {
    const parsed = parseFloat(amount.replace(/,/g, '.'))
    if (isNaN(parsed) || parsed <= 0) {
      setError('Ingrese un monto válido.')
      return
    }

    setLoading(true)
    setError(null)

    const input = { order_id: order.id, amount: parsed, payment_method: paymentMethod, notes }

    const { error: err } =
      mode === 'deposit'
        ? await registerDepositPayment(input)
        : await registerFinalPayment(input)

    setLoading(false)

    if (err) {
      setError(err)
      return
    }

    setSuccess(true)

    // Actualizar localmente el estado del pedido para reflejar el pago
    const newDepositPaid =
      mode === 'deposit'
        ? Math.min((order.deposit_paid ?? 0) + parsed, order.total)
        : order.total

    onPaymentRegistered?.({
      ...order,
      deposit_paid: newDepositPaid,
      payment_status: newDepositPaid >= order.total ? 'pagado' : 'anticipo',
    })

    setTimeout(() => {
      setSuccess(false)
      setOpen(false)
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={isFullyPaid}>
          <CreditCard className="mr-2 h-4 w-4" />
          {isFullyPaid ? 'Pagado' : 'Registrar pago'}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            Orden {order.order_number} · Total: {formatPrice(order.total)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Resumen financiero */}
          <PaymentSummary order={order} deposit={deposit} balance={balance} />

          {/* Selector de tipo de pago (solo si no se ha pagado nada aún) */}
          {!hasDeposit && !isFullyPaid && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={mode === 'deposit' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setMode('deposit'); setAmount(deposit.toFixed(2)) }}
              >
                Anticipo 50%
              </Button>
              <Button
                variant={mode === 'final' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setMode('final'); setAmount(order.total.toFixed(2)) }}
              >
                Pago completo
              </Button>
            </div>
          )}

          {/* Campo de monto */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              {mode === 'deposit' ? 'Monto del anticipo (50%)' : 'Monto del saldo restante'}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ₡
              </span>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={
                  mode === 'deposit' ? deposit.toFixed(2) : balance.toFixed(2)
                }
                className="pl-7"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {mode === 'deposit'
                ? `El anticipo mínimo es el 50 %: ${formatPrice(deposit)}`
                : `Saldo pendiente: ${formatPrice(balance)}`}
            </p>
          </div>

          {/* Método de pago */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Método de pago</label>
            <Select
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione método" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notas */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              Notas <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Referencia SINPE #1234, número de recibo..."
              rows={2}
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
              <p className="text-sm">Pago registrado exitosamente.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !amount}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrar pago'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Subcomponente: resumen financiero ────────────────────────────────────────

function PaymentSummary({
  order,
  deposit,
  balance,
}: {
  order: ProductionOrder
  deposit: number
  balance: number
}) {
  const paymentStatusLabel: Record<string, string> = {
    pendiente: 'Sin pagos',
    anticipo: 'Anticipo recibido',
    pagado: 'Completamente pagado',
    reembolsado: 'Reembolsado',
  }

  const paymentStatusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pendiente: 'outline',
    anticipo: 'default',
    pagado: 'secondary',
    reembolsado: 'destructive',
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Resumen de pago</p>
        <Badge variant={paymentStatusVariant[order.payment_status]}>
          {paymentStatusLabel[order.payment_status]}
        </Badge>
      </div>

      <div className="grid gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total de la orden</span>
          <span className="font-medium">{formatPrice(order.total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Anticipo requerido (50%)</span>
          <span>{formatPrice(deposit)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pagado hasta ahora</span>
          <span className="text-green-600">{formatPrice(order.deposit_paid ?? 0)}</span>
        </div>
        <div className="flex justify-between border-t pt-2 font-medium">
          <span className="text-foreground">Saldo pendiente</span>
          <span className={balance > 0 ? 'text-destructive' : 'text-green-600'}>
            {formatPrice(balance)}
          </span>
        </div>
      </div>
    </div>
  )
}

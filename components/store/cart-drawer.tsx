'use client'

// RF: Agregar / eliminar / cambiar cantidades en el carrito
// RF: Carrito guardado automáticamente (CartProvider + localStorage)
// RF: Pagar con transferencia bancaria o SINPE Móvil
//     - El cliente sube el comprobante (imagen)
//     - Indica el número de transacción
//     - El admin valida manualmente

import { useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  CheckCircle, ImagePlus, Loader2, Minus,
  Plus, ShoppingBag, Trash2, Upload, X,
} from 'lucide-react'
import { Button } from '@/components/ui/actions/button'
import { Input } from '@/components/ui/forms/input'
import { Textarea } from '@/components/ui/forms/textarea'
import { useCart } from '@/lib/cart-context'
import { formatPrice } from '@/lib/format'

type Step = 'cart' | 'payment' | 'success'
type PaymentMethod = 'sinpe' | 'transferencia'

// ─── Datos bancarios de la tienda ────────────────────────────────────────────
const STORE_BANK_INFO = {
  sinpe: {
    label: 'SINPE Móvil',
    number: '8888-8888',
    name: 'La Casa del Pez S.A.',
  },
  transferencia: {
    label: 'Transferencia bancaria',
    bank: 'Banco Nacional',
    account: '100-01-000-123456-7',
    iban: 'CR21015101001001234567',
    name: 'La Casa del Pez S.A.',
    cedula: '3-101-123456',
  },
}

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, clearCart } = useCart()

  const [step, setStep] = useState<Step>('cart')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('sinpe')
  const [transactionNumber, setTransactionNumber] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function resetPaymentForm() {
    setStep('cart')
    setPaymentMethod('sinpe')
    setTransactionNumber('')
    setCustomerNotes('')
    setProofFile(null)
    setProofPreview(null)
    setError(null)
    setOrderNumber(null)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('El comprobante debe ser una imagen (JPG, PNG, WEBP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar los 5 MB.')
      return
    }
    setError(null)
    setProofFile(file)
    setProofPreview(URL.createObjectURL(file))
  }

  async function handleSubmitPayment() {
    if (!proofFile) { setError('Debés adjuntar el comprobante de pago.'); return }
    if (!transactionNumber.trim()) { setError('Ingresá el número de transacción.'); return }

    setLoading(true)
    setError(null)

    try {
      const fd = new FormData()
      fd.append('items', JSON.stringify(items))
      fd.append('payment_method', paymentMethod)
      fd.append('transaction_number', transactionNumber.trim())
      fd.append('proof_image', proofFile)
      if (customerNotes.trim()) fd.append('customer_notes', customerNotes.trim())

      const res = await fetch('/api/orders', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) { setError(data.error ?? 'No se pudo procesar el pago.'); return }

      setOrderNumber(data.order_number)
      setStep('success')
      clearCart()
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const bankInfo = STORE_BANK_INFO[paymentMethod]

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={closeCart} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 flex w-full max-w-md flex-col bg-background shadow-xl">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">
              {step === 'cart'    && 'Carrito de Compras'}
              {step === 'payment' && 'Completar pago'}
              {step === 'success' && 'Pedido enviado'}
            </h2>
            {step === 'cart' && items.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {step === 'payment' && (
              <button
                onClick={resetPaymentForm}
                className="mr-1 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                ← Volver
              </button>
            )}
            <Button variant="ghost" size="icon" onClick={closeCart}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* ── Contenido ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Step 1: Carrito ───────────────────────────────────── */}
          {step === 'cart' && (
            <div className="px-4 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground/50" />
                  <h3 className="mb-2 text-lg font-medium text-foreground">Tu carrito está vacío</h3>
                  <p className="mb-6 text-sm text-muted-foreground">
                    Explorá nuestra tienda y encontrá productos increíbles
                  </p>
                  <Button onClick={closeCart} asChild>
                    <Link href="/tienda">Ver Productos</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 rounded-lg border border-border bg-card p-3">
                      {/* Imagen */}
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ShoppingBag className="h-7 w-7 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium leading-tight line-clamp-2">{item.name}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {item.type === 'animal' ? 'Pez / Animal' : 'Producto'}
                            </p>
                          </div>
                          {/* Eliminar */}
                          <button
                            onClick={() => removeItem(item.id)}
                            className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive"
                            aria-label={`Eliminar ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          {/* Cambiar cantidad */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="flex h-7 w-7 items-center justify-center rounded border bg-background hover:bg-secondary disabled:opacity-40"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-7 text-center text-sm font-medium tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                              className="flex h-7 w-7 items-center justify-center rounded border bg-background hover:bg-secondary disabled:opacity-40"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                            {item.quantity >= item.stock && (
                              <span className="text-xs text-muted-foreground">máx.</span>
                            )}
                          </div>
                          <p className="text-sm font-semibold tabular-nums">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Formulario de pago ────────────────────────── */}
          {step === 'payment' && (
            <div className="grid gap-5 px-4 py-4">

              {/* Resumen del pedido */}
              <div className="rounded-lg border p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Resumen del pedido
                </p>
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm py-0.5">
                    <span className="text-muted-foreground">{item.name} × {item.quantity}</span>
                    <span className="tabular-nums">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatPrice(subtotal)}</span>
                </div>
              </div>

              {/* Selector de método */}
              <div className="grid gap-2">
                <p className="text-sm font-medium">Método de pago</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['sinpe', 'transferencia'] as PaymentMethod[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                        paymentMethod === m
                          ? 'border-primary bg-primary/5 font-semibold text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {m === 'sinpe' ? '📱 SINPE Móvil' : '🏦 Transferencia'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Datos bancarios de la tienda */}
              <div className="rounded-lg bg-muted/50 p-4 text-sm">
                <p className="mb-2 font-semibold">
                  {paymentMethod === 'sinpe' ? '📱 Enviá el pago por SINPE Móvil:' : '🏦 Realizá la transferencia a:'}
                </p>
                {paymentMethod === 'sinpe' ? (
                  <div className="grid gap-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Número</span>
                      <span className="font-mono font-bold">{STORE_BANK_INFO.sinpe.number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">A nombre de</span>
                      <span className="font-medium">{STORE_BANK_INFO.sinpe.name}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Monto exacto</span>
                      <span className="text-primary tabular-nums">{formatPrice(subtotal)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Banco</span>
                      <span>{STORE_BANK_INFO.transferencia.bank}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cuenta</span>
                      <span className="font-mono">{STORE_BANK_INFO.transferencia.account}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IBAN</span>
                      <span className="font-mono text-xs">{STORE_BANK_INFO.transferencia.iban}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">A nombre de</span>
                      <span>{STORE_BANK_INFO.transferencia.name}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Monto exacto</span>
                      <span className="text-primary tabular-nums">{formatPrice(subtotal)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Número de transacción */}
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Número de comprobante / transacción *
                </label>
                <Input
                  value={transactionNumber}
                  onChange={e => setTransactionNumber(e.target.value)}
                  placeholder={paymentMethod === 'sinpe' ? 'Ej: 1234567890' : 'Ej: TXN-20260717-001'}
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">
                  Encontrás este número en la confirmación del banco o en el SMS de SINPE.
                </p>
              </div>

              {/* Subir comprobante */}
              <div className="grid gap-2">
                <label className="text-sm font-medium">Comprobante de pago (imagen) *</label>

                {proofPreview ? (
                  <div className="relative overflow-hidden rounded-lg border">
                    <img
                      src={proofPreview}
                      alt="Comprobante"
                      className="max-h-48 w-full object-contain"
                    />
                    <button
                      onClick={() => { setProofFile(null); setProofPreview(null) }}
                      className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-foreground hover:bg-background"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-8 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <ImagePlus className="h-8 w-8" />
                    <span className="text-sm font-medium">Tocá para subir la imagen</span>
                    <span className="text-xs">JPG, PNG o WEBP · Máx. 5 MB</span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {!proofPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Seleccionar archivo
                  </Button>
                )}
              </div>

              {/* Notas opcionales */}
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Notas <span className="font-normal text-muted-foreground">(opcional)</span>
                </label>
                <Textarea
                  value={customerNotes}
                  onChange={e => setCustomerNotes(e.target.value)}
                  placeholder="Ej: Pagué el monto exacto desde cuenta Banco Costa Rica..."
                  rows={2}
                />
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Éxito ─────────────────────────────────────── */}
          {step === 'success' && (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-9 w-9 text-green-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">¡Pedido recibido!</h3>
              {orderNumber && (
                <p className="mb-1 font-mono text-sm font-bold text-primary">#{orderNumber}</p>
              )}
              <p className="mb-6 text-sm text-muted-foreground">
                Revisaremos tu comprobante y confirmaremos el pedido en un plazo de <strong>1–2 horas hábiles</strong>.
                Te notificaremos cuando el pago esté verificado.
              </p>
              <Button onClick={() => { closeCart(); resetPaymentForm() }} asChild>
                <Link href="/tienda">Seguir comprando</Link>
              </Button>
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        {step === 'cart' && items.length > 0 && (
          <div className="border-t border-border px-4 py-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {items.reduce((s, i) => s + i.quantity, 0)} artículo(s)
              </span>
              <span className="text-lg font-bold tabular-nums">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex flex-col gap-2">
              <Button className="w-full" onClick={() => { setError(null); setStep('payment') }}>
                Continuar al pago
              </Button>
              <Button variant="outline" className="w-full" onClick={clearCart}>
                Vaciar carrito
              </Button>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div className="border-t border-border px-4 py-4">
            <Button
              className="w-full gap-2"
              onClick={handleSubmitPayment}
              disabled={loading || !proofFile || !transactionNumber.trim()}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Enviando comprobante...</>
              ) : (
                <><Upload className="h-4 w-4" />Enviar comprobante de pago</>
              )}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Tu pedido se confirmará tras la validación manual del pago.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

// components/admin/PaymentProofValidator.tsx
// RF: Administrador valida comprobantes de pago y cambia estado de la orden

import { useEffect, useState } from 'react'
import {
  CheckCircle, Clock, ExternalLink, Loader2,
  Search, XCircle, ZoomIn,
} from 'lucide-react'
import { Button } from '@/components/ui/actions/button'
import { Badge } from '@/components/ui/display/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/display/card'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/overlays/dialog'
import { Input } from '@/components/ui/forms/input'
import { Textarea } from '@/components/ui/forms/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/display/table'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/format'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ValidationStatus = 'pendiente' | 'aprobado' | 'rechazado'
type PaymentMethod = 'sinpe' | 'transferencia'

interface PaymentProof {
  id: string
  order_id: string
  payment_method: PaymentMethod
  transaction_number: string
  proof_image_path: string
  proof_image_url: string | null
  validation_status: ValidationStatus
  validated_by: string | null
  validated_at: string | null
  rejection_reason: string | null
  customer_notes: string | null
  created_at: string
  order: {
    order_number: string
    total: number
    status: string
    user_id: string | null
    customer_name?: string
  } | null
}

const STATUS_LABELS: Record<ValidationStatus, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
}

const STATUS_VARIANT: Record<ValidationStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pendiente: 'outline',
  aprobado: 'secondary',
  rechazado: 'destructive',
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  sinpe: '📱 SINPE Móvil',
  transferencia: '🏦 Transferencia',
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function PaymentProofValidator({ adminUserId }: { adminUserId: string }) {
  const [proofs, setProofs] = useState<PaymentProof[]>([])
  const [loading, setLoading] = useState(true)
  const [buscar, setBuscar] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<ValidationStatus | ''>('pendiente')
  const [selected, setSelected] = useState<PaymentProof | null>(null)

  async function cargar() {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('payment_proofs')
      .select(`
        *,
        order:orders(order_number, total, status, user_id)
      `)
      .order('created_at', { ascending: false })

    if (filtroStatus) query = query.eq('validation_status', filtroStatus)
    if (buscar) {
      query = query.or(
        `transaction_number.ilike.%${buscar}%`
      )
    }

    const { data, error } = await query
    if (!error) setProofs(data as PaymentProof[])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [filtroStatus, buscar])

  const pendingCount = proofs.filter(p => p.validation_status === 'pendiente').length

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Comprobantes de pago</CardTitle>
              <CardDescription>
                Revisá cada comprobante y aprobá o rechazá el pago. Al aprobar, la orden pasa automáticamente a "Confirmado".
              </CardDescription>
            </div>
            {pendingCount > 0 && (
              <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-destructive px-2 text-sm font-bold text-white">
                {pendingCount}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* Filtros */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={buscar}
                onChange={e => setBuscar(e.target.value)}
                placeholder="Buscar por número de transacción..."
                className="pl-9"
              />
            </div>
            <select
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value as ValidationStatus | '')}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="aprobado">Aprobados</option>
              <option value="rechazado">Rechazados</option>
            </select>
          </div>

          {/* Tabla */}
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : proofs.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No hay comprobantes que mostrar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orden</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>N° Transacción</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Recibido</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proofs.map(proof => (
                  <TableRow key={proof.id}>
                    <TableCell className="font-mono font-medium">
                      #{proof.order?.order_number ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {METHOD_LABELS[proof.payment_method]}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {proof.transaction_number}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {proof.order ? formatPrice(proof.order.total) : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(proof.created_at).toLocaleString('es-CR', {
                        day: '2-digit', month: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[proof.validation_status]}>
                        {STATUS_LABELS[proof.validation_status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelected(proof)}
                      >
                        <ZoomIn className="mr-1.5 h-3.5 w-3.5" />
                        Revisar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de revisión */}
      {selected && (
        <ReviewDialog
          proof={selected}
          adminUserId={adminUserId}
          onClose={() => setSelected(null)}
          onResolved={() => { setSelected(null); cargar() }}
        />
      )}
    </div>
  )
}

// ─── Dialog de revisión y validación ─────────────────────────────────────────

function ReviewDialog({
  proof, adminUserId, onClose, onResolved,
}: {
  proof: PaymentProof
  adminUserId: string
  onClose: () => void
  onResolved: () => void
}) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(proof.proof_image_url)

  const isPending = proof.validation_status === 'pendiente'

  // Generar signed URL si la almacenada expiró o no existe
  useEffect(() => {
    if (!imageUrl && proof.proof_image_path) {
      const supabase = createClient()
      supabase.storage
        .from('payment-proofs')
        .createSignedUrl(proof.proof_image_path, 60 * 60)
        .then(({ data }) => { if (data?.signedUrl) setImageUrl(data.signedUrl) })
    }
  }, [proof.proof_image_path])

  async function handleValidate(newStatus: 'aprobado' | 'rechazado') {
    if (newStatus === 'rechazado' && !rejectionReason.trim()) {
      setError('Indicá el motivo del rechazo.')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: err } = await supabase
      .from('payment_proofs')
      .update({
        validation_status: newStatus,
        validated_by: adminUserId,
        validated_at: new Date().toISOString(),
        ...(newStatus === 'rechazado' ? { rejection_reason: rejectionReason.trim() } : {}),
      })
      .eq('id', proof.id)

    setLoading(false)

    if (err) { setError(err.message); return }

    // El trigger SQL en la BD actualiza automáticamente el payment_status de la orden
    onResolved()
  }

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Revisar comprobante</DialogTitle>
          <DialogDescription>
            Orden #{proof.order?.order_number} ·{' '}
            {proof.order ? formatPrice(proof.order.total) : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Info del comprobante */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border p-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Método</p>
              <p className="font-medium">{METHOD_LABELS[proof.payment_method]}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">N° transacción</p>
              <p className="font-mono font-medium">{proof.transaction_number}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total a pagar</p>
              <p className="font-semibold text-primary">
                {proof.order ? formatPrice(proof.order.total) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Recibido</p>
              <p>{new Date(proof.created_at).toLocaleString('es-CR')}</p>
            </div>
            {proof.customer_notes && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Notas del cliente</p>
                <p className="italic">{proof.customer_notes}</p>
              </div>
            )}
          </div>

          {/* Imagen del comprobante */}
          <div className="grid gap-2">
            <p className="text-sm font-medium">Imagen del comprobante</p>
            {imageUrl ? (
              <div className="relative overflow-hidden rounded-lg border bg-muted">
                <img
                  src={imageUrl}
                  alt="Comprobante de pago"
                  className="max-h-72 w-full object-contain"
                />
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-background/80 px-2 py-1 text-xs hover:bg-background"
                >
                  <ExternalLink className="h-3 w-3" />
                  Abrir
                </a>
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando imagen...
              </div>
            )}
          </div>

          {/* Estado actual si ya fue procesado */}
          {!isPending && (
            <div className={`flex items-center gap-3 rounded-lg p-3 ${
              proof.validation_status === 'aprobado'
                ? 'bg-green-50 text-green-700'
                : 'bg-destructive/10 text-destructive'
            }`}>
              {proof.validation_status === 'aprobado'
                ? <CheckCircle className="h-5 w-5 shrink-0" />
                : <XCircle className="h-5 w-5 shrink-0" />
              }
              <div>
                <p className="text-sm font-semibold">
                  {proof.validation_status === 'aprobado' ? 'Pago aprobado' : 'Pago rechazado'}
                </p>
                {proof.rejection_reason && (
                  <p className="text-xs">{proof.rejection_reason}</p>
                )}
                {proof.validated_at && (
                  <p className="text-xs opacity-70">
                    {new Date(proof.validated_at).toLocaleString('es-CR')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Motivo de rechazo (solo si va a rechazar) */}
          {isPending && (
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Motivo de rechazo{' '}
                <span className="font-normal text-muted-foreground">(requerido si rechazás)</span>
              </label>
              <Textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Ej: Número de transacción no coincide, monto incorrecto..."
                rows={2}
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
              <XCircle className="h-4 w-4 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cerrar
          </Button>
          {isPending && (
            <>
              <Button
                variant="destructive"
                onClick={() => handleValidate('rechazado')}
                disabled={loading}
                className="gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Rechazar
              </Button>
              <Button
                onClick={() => handleValidate('aprobado')}
                disabled={loading}
                className="gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Aprobar pago
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

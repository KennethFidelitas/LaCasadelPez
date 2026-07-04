'use client'

// components/admin/GestionApartados.tsx
// RF: Cancelar apartado y liberar inventario
// RF: Ver alertas de apartados próximos a vencer
// RF: Imprimir comprobante de apartado

import { useEffect, useState } from 'react'
import {
  AlertTriangle, Bell, CheckCircle, Loader2, Printer, Search,
  XCircle, Clock, Package,
} from 'lucide-react'
import { Button } from '@/components/ui/actions/button'
import { Badge } from '@/components/ui/display/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/display/card'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/overlays/dialog'
import { Input } from '@/components/ui/forms/input'
import { Textarea } from '@/components/ui/forms/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/display/table'
import {
  type Apartado, type ApartadoAlert, type ApartadoStatus,
  APARTADO_STATUS_LABELS, ALERT_TYPE_LABELS, ALERT_URGENCY,
  listarApartados, listarAlertasPendientes, cancelarApartado, resolverAlerta,
} from '@/lib/apartados/actions'
import { formatPrice, formatDate } from '@/lib/format'

// ─── Panel principal ──────────────────────────────────────────────────────────

export function GestionApartados({ adminUserId }: { adminUserId: string }) {
  const [tab, setTab] = useState<'apartados' | 'alertas'>('alertas')
  const [apartados, setApartados] = useState<Apartado[]>([])
  const [alertas, setAlertas] = useState<ApartadoAlert[]>([])
  const [buscar, setBuscar] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<ApartadoStatus | ''>('')
  const [loading, setLoading] = useState(true)

  async function cargar() {
    setLoading(true)
    try {
      const [apt, alt] = await Promise.all([
        listarApartados({ buscar: buscar || undefined, status: filtroStatus || undefined }),
        listarAlertasPendientes(),
      ])
      setApartados(apt)
      setAlertas(alt)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [buscar, filtroStatus])

  const alertasCriticas = alertas.filter(a => ALERT_URGENCY[a.alert_type] === 'high')
  const alertasMedio = alertas.filter(a => ALERT_URGENCY[a.alert_type] === 'medium')

  return (
    <div className="grid gap-6">
      {/* Resumen de alertas */}
      {alertas.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <AlertSummaryCard
            count={alertas.length}
            label="Alertas pendientes"
            icon={<Bell className="h-5 w-5 text-muted-foreground" />}
            variant="default"
          />
          <AlertSummaryCard
            count={alertasMedio.length}
            label="Vencen mañana"
            icon={<Clock className="h-5 w-5 text-yellow-500" />}
            variant="warning"
          />
          <AlertSummaryCard
            count={alertasCriticas.length}
            label="Ya vencidos"
            icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
            variant="danger"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-1">
        {(['alertas', 'apartados'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={[
              'relative px-4 py-2 text-sm font-medium transition-colors',
              tab === t ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {t === 'alertas' ? 'Alertas' : 'Todos los apartados'}
            {t === 'alertas' && alertas.length > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                {alertas.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab alertas */}
      {tab === 'alertas' && (
        <Card>
          <CardHeader>
            <CardTitle>Alertas de vencimiento</CardTitle>
            <CardDescription>
              Apartados que requieren contacto con el cliente. Resolví cada alerta tras contactarlo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : alertas.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No hay alertas pendientes. ✅
              </div>
            ) : (
              <div className="grid gap-3">
                {alertas.map(alerta => (
                  <AlertaRow
                    key={alerta.id}
                    alerta={alerta}
                    adminUserId={adminUserId}
                    onResolved={cargar}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab apartados */}
      {tab === 'apartados' && (
        <Card>
          <CardHeader>
            <CardTitle>Apartados</CardTitle>
            <CardDescription>Gestión completa de apartados. Cancelá un apartado para liberar el inventario.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {/* Filtros */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={buscar}
                  onChange={e => setBuscar(e.target.value)}
                  placeholder="Buscar por número, nombre o teléfono..."
                  className="pl-9"
                />
              </div>
              <select
                value={filtroStatus}
                onChange={e => setFiltroStatus(e.target.value as ApartadoStatus | '')}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="">Todos los estados</option>
                {(Object.keys(APARTADO_STATUS_LABELS) as ApartadoStatus[]).map(s => (
                  <option key={s} value={s}>{APARTADO_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : apartados.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No se encontraron apartados.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Apartado</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Anticipo</TableHead>
                    <TableHead>Vence</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apartados.map(apt => (
                    <ApartadoRow
                      key={apt.id}
                      apartado={apt}
                      adminUserId={adminUserId}
                      onCancelled={cargar}
                    />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Fila de apartado ─────────────────────────────────────────────────────────

function ApartadoRow({
  apartado, adminUserId, onCancelled,
}: {
  apartado: Apartado
  adminUserId: string
  onCancelled: () => void
}) {
  const isActive = apartado.status === 'activo'
  const daysLeft = Math.ceil(
    (new Date(apartado.expires_at).getTime() - Date.now()) / 86400000,
  )

  const statusVariant: Record<ApartadoStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    activo: 'default',
    pagado: 'secondary',
    cancelado: 'destructive',
    vencido: 'destructive',
  }

  const itemTypeLabel: Record<string, string> = {
    product: 'Producto',
    animal: 'Animal',
    pecera_prediseno: 'Pecera prediseñada',
    pecera_personalizada: 'Pecera personalizada',
  }

  return (
    <TableRow>
      <TableCell className="font-mono font-medium">#{apartado.apartado_number}</TableCell>
      <TableCell>
        <div className="text-sm font-medium">{apartado.customer_name}</div>
        <div className="text-xs text-muted-foreground">{apartado.customer_phone}</div>
      </TableCell>
      <TableCell className="text-sm">{itemTypeLabel[apartado.item_type] ?? apartado.item_type}</TableCell>
      <TableCell>{formatPrice(apartado.total_price)}</TableCell>
      <TableCell className="text-green-600">{formatPrice(apartado.deposit_amount)}</TableCell>
      <TableCell>
        {isActive ? (
          <span className={`text-sm font-medium ${daysLeft <= 1 ? 'text-destructive' : daysLeft <= 3 ? 'text-yellow-600' : 'text-foreground'}`}>
            {daysLeft <= 0 ? 'Hoy' : `${daysLeft}d`}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">{formatDate(apartado.expires_at)}</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={statusVariant[apartado.status]}>
          {APARTADO_STATUS_LABELS[apartado.status]}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {/* Imprimir comprobante */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`/admin/apartados/${apartado.id}/imprimir`, '_blank')}
          >
            <Printer className="h-3.5 w-3.5" />
          </Button>
          {/* Cancelar apartado */}
          {isActive && (
            <CancelarApartadoDialog
              apartado={apartado}
              adminUserId={adminUserId}
              onCancelled={onCancelled}
            />
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

// ─── Dialog de cancelación ────────────────────────────────────────────────────

function CancelarApartadoDialog({
  apartado, adminUserId, onCancelled,
}: {
  apartado: Apartado
  adminUserId: string
  onCancelled: () => void
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const hasInventory = apartado.animal_id || apartado.product_id

  async function handleCancel() {
    if (!reason.trim()) { setError('El motivo de cancelación es obligatorio.'); return }
    setLoading(true)
    setError(null)
    const { error: err } = await cancelarApartado(apartado.id, adminUserId, reason)
    setLoading(false)
    if (err) { setError(err); return }
    setSuccess(true)
    onCancelled()
    setTimeout(() => { setSuccess(false); setOpen(false) }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) { setReason(''); setError(null); setSuccess(false) } }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive">Cancelar</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar apartado</DialogTitle>
          <DialogDescription>
            Apartado #{apartado.apartado_number} · {apartado.customer_name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {/* Advertencia de inventario */}
          {hasInventory && (
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3 text-amber-800">
              <Package className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-sm">
                Al cancelar este apartado, se <strong>liberará automáticamente</strong> el inventario reservado.
              </p>
            </div>
          )}

          {/* Info financiera */}
          <div className="rounded-lg border p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Anticipo pagado</span>
              <span className="font-medium text-green-600">{formatPrice(apartado.deposit_amount)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-muted-foreground">Saldo pendiente</span>
              <span>{formatPrice(apartado.balance)}</span>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Motivo de cancelación *</label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ej: Cliente no completó el pago en el plazo acordado..."
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
              <p className="text-sm">Apartado cancelado e inventario liberado.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cerrar</Button>
          <Button variant="destructive" onClick={handleCancel} disabled={loading || !reason.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar cancelación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Fila de alerta ───────────────────────────────────────────────────────────

function AlertaRow({
  alerta, adminUserId, onResolved,
}: {
  alerta: ApartadoAlert
  adminUserId: string
  onResolved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const urgency = ALERT_URGENCY[alerta.alert_type]
  const apt = alerta.apartado

  const urgencyStyles = {
    low: 'border-l-4 border-l-blue-400',
    medium: 'border-l-4 border-l-yellow-400',
    high: 'border-l-4 border-l-destructive',
  }[urgency]

  async function handleResolve() {
    setLoading(true)
    try {
      await resolverAlerta(alerta.id, adminUserId)
      onResolved()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`rounded-lg border p-4 ${urgencyStyles}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge variant={urgency === 'high' ? 'destructive' : urgency === 'medium' ? 'default' : 'outline'}>
              {ALERT_TYPE_LABELS[alerta.alert_type]}
            </Badge>
            {apt && <span className="font-mono text-sm font-medium">#{apt.apartado_number}</span>}
          </div>
          {apt && (
            <div className="mt-2 grid gap-1 text-sm">
              <span className="font-medium">{apt.customer_name}</span>
              <span className="text-muted-foreground">{apt.customer_phone}{apt.customer_email ? ` · ${apt.customer_email}` : ''}</span>
              <span className="text-muted-foreground">
                Total: {formatPrice(apt.total_price)} · Anticipo: {formatPrice(apt.deposit_amount)} · Vence: {formatDate(apt.expires_at)}
              </span>
            </div>
          )}
          <p className="mt-1 text-xs text-muted-foreground">Alerta generada: {formatDate(alerta.created_at)}</p>
        </div>
        <div className="flex gap-2">
          {apt && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(`/admin/apartados/${apt.id}/imprimir`, '_blank')}
            >
              <Printer className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button size="sm" onClick={handleResolve} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Contactado ✓'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Card de resumen de alerta ────────────────────────────────────────────────

function AlertSummaryCard({
  count, label, icon, variant,
}: {
  count: number
  label: string
  icon: React.ReactNode
  variant: 'default' | 'warning' | 'danger'
}) {
  const bgStyles = { default: '', warning: 'bg-yellow-50', danger: 'bg-red-50' }[variant]
  return (
    <div className={`rounded-lg border p-4 ${bgStyles}`}>
      <div className="flex items-center justify-between">
        {icon}
        <span className="text-2xl font-bold">{count}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

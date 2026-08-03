'use client'

// components/admin/TraceabilityReport.tsx
// RF-CL-0010: Reporte consolidado de trazabilidad de pedidos y pagos de un cliente

import { useState } from 'react'
import { Download, FileText, Loader2, Search, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/actions/button'
import { Badge } from '@/components/ui/display/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/display/card'
import { Input } from '@/components/ui/forms/input'
import { getTraceabilityReport, type TraceabilityReportData } from '@/lib/customers/traceability-report'
import { formatPrice } from '@/lib/format'

const fmt = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' })
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-CR')
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString('es-CR')

export function TraceabilityReport() {
  const [email, setEmail] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<TraceabilityReportData | null>(null)

  async function handleGenerate() {
    if (!email.trim()) { setError('Ingresá el correo del cliente.'); return }
    setLoading(true)
    setError(null)
    setReport(null)

    const { data, error: err } = await getTraceabilityReport({
      customerEmail: email.trim(),
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    })

    setLoading(false)
    if (err) { setError(err); return }
    setReport(data)
  }

  function handleExportPdf() {
    if (!report) return

    const periodLabel = report.filters.dateFrom
      ? `${fmtDate(report.filters.dateFrom)} al ${fmtDate(report.filters.dateTo ?? new Date().toISOString())}`
      : 'Todos los períodos'

    const rows = report.orders.length === 0
      ? `<tr><td colspan="7" style="text-align:center;color:#9ca3af;padding:20px">Sin movimientos comerciales en el período seleccionado.</td></tr>`
      : report.orders.map(o => `
          <tr>
            <td>${o.order_number}</td>
            <td>${fmtDate(o.created_at)}</td>
            <td>${o.source}</td>
            <td>${o.status}</td>
            <td style="text-align:right">${fmt.format(o.total)}</td>
            <td style="text-align:right;color:${o.paid_amount >= o.total ? '#16a34a' : '#dc2626'}">${fmt.format(o.paid_amount)}</td>
            <td style="text-align:right;color:${o.balance > 0 ? '#dc2626' : '#16a34a'}">${fmt.format(o.balance)}</td>
          </tr>`).join('')

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Reporte de Trazabilidad — ${report.customer.name}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;font-size:11px;color:#111;padding:24px}
    h1{font-size:17px;font-weight:700;margin-bottom:2px}
    .subtitle{color:#6b7280;margin-bottom:16px;font-size:11px}
    .section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;margin:16px 0 6px}
    .info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px}
    .info-box{border:1px solid #e5e7eb;border-radius:4px;padding:8px}
    .info-box .label{font-size:10px;color:#9ca3af;margin-bottom:2px}
    .info-box .value{font-weight:700;font-size:13px}
    .metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px}
    .metric{border:1px solid #e5e7eb;border-radius:4px;padding:8px;text-align:center}
    .metric .label{font-size:10px;color:#6b7280}
    .metric .value{font-size:14px;font-weight:700;margin-top:2px}
    table{width:100%;border-collapse:collapse;margin-top:4px}
    th{background:#f9fafb;padding:6px 8px;text-align:left;border-bottom:2px solid #e5e7eb;font-size:10px;color:#6b7280}
    td{padding:5px 8px;border-bottom:1px solid #f3f4f6;font-size:11px}
    tr:nth-child(even) td{background:#fafafa}
    .compliance{font-size:18px;font-weight:700;color:${report.summary.compliance_rate >= 80 ? '#16a34a' : report.summary.compliance_rate >= 50 ? '#d97706' : '#dc2626'}}
    .no-data{text-align:center;color:#9ca3af;padding:20px;font-style:italic}
    .footer{margin-top:20px;font-size:10px;color:#9ca3af;text-align:center;border-top:1px solid #e5e7eb;padding-top:12px}
    @media print{body{padding:0}@page{margin:15mm}}
  </style>
</head>
<body>
  <h1>La Casa del Pez — Reporte de Trazabilidad</h1>
  <p class="subtitle">Generado el ${fmtDateTime(report.generatedAt)} · Período: ${periodLabel}</p>

  <p class="section-title">Datos del cliente</p>
  <div class="info-grid">
    <div class="info-box"><div class="label">Nombre</div><div class="value">${report.customer.name}</div></div>
    <div class="info-box"><div class="label">Correo</div><div class="value">${report.customer.email ?? '—'}</div></div>
    <div class="info-box"><div class="label">Teléfono</div><div class="value">${report.customer.phone ?? '—'}</div></div>
  </div>

  <p class="section-title">Resumen financiero</p>
  <div class="metrics">
    <div class="metric"><div class="label">Órdenes</div><div class="value">${report.summary.total_orders}</div></div>
    <div class="metric"><div class="label">Total facturado</div><div class="value">${fmt.format(report.summary.total_billed)}</div></div>
    <div class="metric"><div class="label">Total pagado</div><div class="value" style="color:#16a34a">${fmt.format(report.summary.total_paid)}</div></div>
    <div class="metric"><div class="label">Saldo pendiente</div><div class="value" style="color:${report.summary.total_pending > 0 ? '#dc2626' : '#16a34a'}">${fmt.format(report.summary.total_pending)}</div></div>
  </div>
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding:10px;border:1px solid #e5e7eb;border-radius:4px">
    <div><div style="font-size:10px;color:#6b7280">Cumplimiento financiero</div>
    <div class="compliance">${report.summary.compliance_rate}%</div></div>
    <div style="font-size:11px;color:#6b7280">${report.summary.cancelled_orders} orden(es) cancelada(s)</div>
  </div>

  <p class="section-title">Historial de pedidos y pagos</p>
  <table>
    <thead>
      <tr>
        <th>Orden</th><th>Fecha</th><th>Canal</th><th>Estado</th>
        <th style="text-align:right">Total</th><th style="text-align:right">Pagado</th><th style="text-align:right">Saldo</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <p class="footer">La Casa del Pez · Reporte de Trazabilidad · ${report.customer.name} · ${fmtDateTime(report.generatedAt)}</p>
</body>
</html>`

    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print() }, 400)
  }

  // ── Badges de estado ─────────────────────────────────────────────────────
  const statusVariant = (s: string) =>
    s === 'cancelado' ? 'destructive' as const
    : s === 'entregado' || s === 'pagado' ? 'secondary' as const
    : s === 'pendiente' ? 'outline' as const
    : 'default' as const

  return (
    <div className="grid gap-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Reporte de trazabilidad</CardTitle>
          <CardDescription>
            Historial consolidado de pedidos y pagos de un cliente. Filtrá por período para evaluar cumplimiento financiero.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Correo del cliente *</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="cliente@email.com"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Desde</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Hasta</label>
              <Input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <XCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleGenerate} disabled={loading} className="gap-2">
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" />Generando...</>
                : <><Search className="h-4 w-4" />Generar reporte</>
              }
            </Button>
            {report && (
              <Button variant="outline" onClick={handleExportPdf} className="gap-2">
                <Download className="h-4 w-4" />
                Exportar PDF
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultado */}
      {report && (
        <>
          {/* Cabecera del cliente */}
          <Card>
            <CardHeader>
              <CardTitle>{report.customer.name}</CardTitle>
              <CardDescription>
                {report.customer.email ?? '—'} · {report.customer.phone ?? 'Sin teléfono'} · Cliente desde {fmtDate(report.customer.created_at)}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricBox label="Órdenes" value={String(report.summary.total_orders)} />
              <MetricBox label="Total facturado" value={formatPrice(report.summary.total_billed)} />
              <MetricBox label="Total pagado" value={formatPrice(report.summary.total_paid)} color="text-green-600" />
              <MetricBox
                label="Cumplimiento"
                value={`${report.summary.compliance_rate}%`}
                color={report.summary.compliance_rate >= 80 ? 'text-green-600' : report.summary.compliance_rate >= 50 ? 'text-yellow-600' : 'text-destructive'}
              />
            </CardContent>
          </Card>

          {/* Tabla de órdenes — Caso 2: sin datos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Historial de pedidos y pagos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.orders.length === 0 ? (
                <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                  Sin movimientos comerciales en el período seleccionado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="pb-2 text-left font-medium">Orden</th>
                        <th className="pb-2 text-left font-medium">Fecha</th>
                        <th className="pb-2 text-left font-medium">Canal</th>
                        <th className="pb-2 text-left font-medium">Estado</th>
                        <th className="pb-2 text-left font-medium">Pago</th>
                        <th className="pb-2 text-right font-medium">Total</th>
                        <th className="pb-2 text-right font-medium">Pagado</th>
                        <th className="pb-2 text-right font-medium">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.orders.map((o, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 font-mono font-medium">{o.order_number}</td>
                          <td className="py-2 text-muted-foreground">{fmtDate(o.created_at)}</td>
                          <td className="py-2 capitalize text-muted-foreground">{o.source}</td>
                          <td className="py-2">
                            <Badge variant={statusVariant(o.status)}>{o.status}</Badge>
                          </td>
                          <td className="py-2">
                            <Badge variant={statusVariant(o.payment_status)}>{o.payment_status}</Badge>
                          </td>
                          <td className="py-2 text-right tabular-nums">{formatPrice(o.total)}</td>
                          <td className="py-2 text-right tabular-nums text-green-600">{formatPrice(o.paid_amount)}</td>
                          <td className={`py-2 text-right tabular-nums font-medium ${o.balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                            {formatPrice(o.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function MetricBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-base font-bold ${color ?? 'text-foreground'}`}>{value}</p>
    </div>
  )
}

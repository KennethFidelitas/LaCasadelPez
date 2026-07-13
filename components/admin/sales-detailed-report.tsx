'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Download, FileText, Printer, Search } from 'lucide-react'
import { Badge } from '@/components/ui/display/badge'
import { Button } from '@/components/ui/actions/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/display/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/display/table'
import { Input } from '@/components/ui/forms/input'
import { Label } from '@/components/ui/forms/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select'
import { formatDateTime, formatPrice } from '@/lib/format'
import type { PosSaleRecord } from '@/lib/pos/types'

type FilterValue = 'all'
type ChannelFilter = PosSaleRecord['channel'] | FilterValue
type StatusFilter = PosSaleRecord['status'] | FilterValue
type PaymentStatusFilter = PosSaleRecord['paymentStatus'] | FilterValue

interface SalesDetailedReportProps {
  sales: PosSaleRecord[]
}

export function SalesDetailedReport({ sales }: SalesDetailedReportProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [channel, setChannel] = useState<ChannelFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusFilter>('all')
  const [paymentMethod, setPaymentMethod] = useState<FilterValue | string>('all')
  const [query, setQuery] = useState('')
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)

  const paymentMethods = useMemo(
    () => Array.from(new Set(sales.map((sale) => sale.paymentMethod).filter(Boolean))).sort(),
    [sales],
  )

  const filteredSales = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null
    const normalizedQuery = query.trim().toLowerCase()

    return sales.filter((sale) => {
      const createdAt = new Date(sale.createdAt)
      if (start && createdAt < start) return false
      if (end && createdAt > end) return false
      if (channel !== 'all' && sale.channel !== channel) return false
      if (status !== 'all' && sale.status !== status) return false
      if (paymentStatus !== 'all' && sale.paymentStatus !== paymentStatus) return false
      if (paymentMethod !== 'all' && sale.paymentMethod !== paymentMethod) return false
      if (!normalizedQuery) return true

      const searchable = [
        sale.orderNumber,
        sale.customer,
        sale.transactionNumber ?? '',
        ...(sale.items ?? []).flatMap((item) => [item.name, item.sku]),
      ].join(' ').toLowerCase()

      return searchable.includes(normalizedQuery)
    })
  }, [channel, endDate, paymentMethod, paymentStatus, query, sales, startDate, status])

  const totals = useMemo(() => {
    const paidSales = filteredSales.filter(
      (sale) => sale.paymentStatus === 'Pagado' && sale.status !== 'Cancelado',
    )
    const grossSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0)
    const confirmedSales = paidSales.reduce((sum, sale) => sum + sale.total, 0)
    const itemCount = filteredSales.reduce(
      (sum, sale) => sum + (sale.items ?? []).reduce((itemSum, item) => itemSum + item.quantity, 0),
      0,
    )

    return {
      grossSales,
      confirmedSales,
      transactions: filteredSales.length,
      averageTicket: paidSales.length > 0 ? confirmedSales / paidSales.length : 0,
      itemCount,
    }
  }, [filteredSales])

  function handleExportCsv() {
    const rows = [
      ['Pedido', 'Fecha', 'Cliente', 'Canal', 'Estado', 'Pago', 'Metodo', 'Producto', 'SKU', 'Cantidad', 'Precio unitario', 'Total linea', 'Total venta'],
      ...filteredSales.flatMap((sale) => {
        const items = sale.items ?? []
        if (items.length === 0) {
          return [[
            sale.orderNumber,
            formatDateTime(sale.createdAt),
            sale.customer,
            sale.channel,
            sale.status,
            sale.paymentStatus,
            sale.paymentMethod,
            'Sin detalle',
            '',
            '0',
            '0',
            '0',
            String(sale.total),
          ]]
        }

        return items.map((item) => [
          sale.orderNumber,
          formatDateTime(sale.createdAt),
          sale.customer,
          sale.channel,
          sale.status,
          sale.paymentStatus,
          sale.paymentMethod,
          item.name,
          item.sku,
          String(item.quantity),
          String(item.unitPrice),
          String(item.total),
          String(sale.total),
        ])
      }),
    ]

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reporte-ventas-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="grid gap-6">
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Reporte detallado de ventas</CardTitle>
          <CardDescription>Filtra, revisa líneas de venta y exporta el desempeño comercial por periodo.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <ReportMetric label="Ventas brutas" value={formatPrice(totals.grossSales)} />
            <ReportMetric label="Ventas pagadas" value={formatPrice(totals.confirmedSales)} />
            <ReportMetric label="Transacciones" value={String(totals.transactions)} />
            <ReportMetric label="Ticket promedio" value={formatPrice(totals.averageTicket)} />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <FilterField label="Desde">
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </FilterField>
            <FilterField label="Hasta">
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </FilterField>
            <FilterField label="Canal">
              <Select value={channel} onValueChange={(value) => setChannel(value as ChannelFilter)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="POS">POS</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Telefono">Telefono</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="Estado">
              <Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Confirmado">Confirmado</SelectItem>
                  <SelectItem value="Preparacion">Preparacion</SelectItem>
                  <SelectItem value="Entregado">Entregado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="Pago">
              <Select value={paymentStatus} onValueChange={(value) => setPaymentStatus(value as PaymentStatusFilter)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Pagado">Pagado</SelectItem>
                  <SelectItem value="Fallido">Fallido</SelectItem>
                  <SelectItem value="Reembolsado">Reembolsado</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="Método">
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="Buscar">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="pl-8"
                  placeholder="Pedido, cliente o producto"
                />
              </div>
            </FilterField>
            <div className="flex items-end gap-2">
              <Button type="button" className="flex-1" onClick={() => setGeneratedAt(new Date().toISOString())}>
                <FileText className="mr-2 h-4 w-4" />
                Generar
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={handleExportCsv} disabled={filteredSales.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => window.print()} disabled={filteredSales.length === 0}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Detalle de ventas</CardTitle>
          <CardDescription>
            {totals.itemCount} unidades incluidas en el periodo seleccionado.
            {generatedAt ? ` Generado el ${formatDateTime(generatedAt)}.` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              No hay ventas que coincidan con los filtros seleccionados.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venta</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="align-top">
                      <div className="font-medium">{sale.orderNumber}</div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(sale.createdAt)}</div>
                      <div className="text-xs text-muted-foreground">{sale.transactionNumber ? `Tx ${sale.transactionNumber}` : 'Sin transacción POS'}</div>
                    </TableCell>
                    <TableCell className="align-top">{sale.customer}</TableCell>
                    <TableCell className="align-top">{sale.channel}</TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-col gap-1">
                        <Badge variant={sale.paymentStatus === 'Pagado' ? 'default' : 'outline'}>{sale.paymentStatus}</Badge>
                        <span className="text-xs text-muted-foreground">{sale.paymentMethod}</span>
                        <span className="text-xs text-muted-foreground">{sale.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[280px] align-top">
                      <div className="grid gap-2">
                        {(sale.items ?? []).length === 0 ? (
                          <span className="text-xs text-muted-foreground">Sin detalle de productos.</span>
                        ) : (
                          (sale.items ?? []).map((item) => (
                            <div key={item.id} className="rounded-md bg-secondary/60 p-2">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-medium text-foreground">{item.name}</span>
                                <span className="font-mono text-xs text-muted-foreground">x{item.quantity}</span>
                              </div>
                              <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                                <span>{item.sku}</span>
                                <span>{formatPrice(item.total)}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-top font-mono font-semibold">{formatPrice(sale.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}

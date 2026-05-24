'use client'

import { useMemo, useState } from 'react'
import { Activity, Bell, CreditCard, FilePenLine, Search, Trash2, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/actions/button'
import { Badge } from '@/components/ui/display/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/display/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/display/table'
import { Input } from '@/components/ui/forms/input'
import { Textarea } from '@/components/ui/forms/textarea'
import { formatDate, formatPrice } from '@/lib/format'

type CreditStatus = 'Activo' | 'Pendiente' | 'Pagado' | 'Vencido'

type CreditItem = {
  id: string
  customer: string
  seller: string
  amount: number
  paid: number
  dueDate: string
  status: CreditStatus
  notes: string
  createdAt: string
}

const customerSuggestions = ['Valeria Mora', 'Luis Chacon', 'Carlos Araya', 'Andrea Coto', 'Hotel Esmeralda']

const initialCredits: CreditItem[] = [
  {
    id: 'CR-001',
    customer: 'Carlos Araya',
    seller: 'Daniela Vargas',
    amount: 185000,
    paid: 100000,
    dueDate: '2026-05-31',
    status: 'Activo',
    notes: 'Credito aprobado para proyecto de pecera 120x50x60.',
    createdAt: '2026-05-18',
  },
  {
    id: 'CR-002',
    customer: 'Andrea Coto',
    seller: 'Luis Chacon',
    amount: 62500,
    paid: 0,
    dueDate: '2026-05-27',
    status: 'Pendiente',
    notes: 'Separacion de equipo con pago total en una cuota.',
    createdAt: '2026-05-20',
  },
  {
    id: 'CR-003',
    customer: 'Hotel Esmeralda',
    seller: 'Daniela Vargas',
    amount: 350000,
    paid: 350000,
    dueDate: '2026-05-15',
    status: 'Pagado',
    notes: 'Credito liquidado y listo para facturacion final.',
    createdAt: '2026-05-02',
  },
]

const initialFormState = {
  customer: customerSuggestions[0],
  seller: 'Daniela Vargas',
  amount: '0',
  paid: '0',
  dueDate: '2026-05-30',
  status: 'Pendiente' as CreditStatus,
  notes: '',
}

export function CreditManagement() {
  const [credits, setCredits] = useState(initialCredits)
  const [creditSearch, setCreditSearch] = useState('')
  const [editingCreditId, setEditingCreditId] = useState<string | null>(null)
  const [creditForm, setCreditForm] = useState(initialFormState)

  const filteredCredits = useMemo(() => {
    const term = creditSearch.toLowerCase()
    return credits.filter(
      (credit) =>
        credit.customer.toLowerCase().includes(term) ||
        credit.id.toLowerCase().includes(term) ||
        credit.seller.toLowerCase().includes(term) ||
        credit.status.toLowerCase().includes(term),
    )
  }, [creditSearch, credits])

  const creditMetrics = useMemo(() => {
    return credits.reduce(
      (acc, credit) => {
        acc.total += credit.amount
        acc.pending += Math.max(credit.amount - credit.paid, 0)
        if (credit.status === 'Activo' || credit.status === 'Pendiente') {
          acc.open += 1
        }
        if (credit.status === 'Vencido') {
          acc.overdue += 1
        }
        return acc
      },
      { total: 0, pending: 0, open: 0, overdue: 0 },
    )
  }, [credits])

  function resetCreditForm() {
    setEditingCreditId(null)
    setCreditForm(initialFormState)
  }

  function handleCreditFieldChange(field: keyof typeof creditForm, value: string) {
    setCreditForm((current) => ({ ...current, [field]: value }))
  }

  function handleCreditSubmit() {
    const amount = Number(creditForm.amount) || 0
    const paid = Number(creditForm.paid) || 0

    if (!creditForm.customer.trim() || !creditForm.seller.trim() || amount <= 0) {
      return
    }

    const payload: CreditItem = {
      id: editingCreditId ?? `CR-${String(credits.length + 1).padStart(3, '0')}`,
      customer: creditForm.customer.trim(),
      seller: creditForm.seller.trim(),
      amount,
      paid: Math.max(0, Math.min(paid, amount)),
      dueDate: creditForm.dueDate,
      status: creditForm.status,
      notes: creditForm.notes.trim(),
      createdAt:
        credits.find((credit) => credit.id === editingCreditId)?.createdAt ?? new Date().toISOString().slice(0, 10),
    }

    setCredits((current) => {
      if (editingCreditId) {
        return current.map((credit) => (credit.id === editingCreditId ? payload : credit))
      }
      return [payload, ...current]
    })

    resetCreditForm()
  }

  function editCredit(credit: CreditItem) {
    setEditingCreditId(credit.id)
    setCreditForm({
      customer: credit.customer,
      seller: credit.seller,
      amount: String(credit.amount),
      paid: String(credit.paid),
      dueDate: credit.dueDate,
      status: credit.status,
      notes: credit.notes,
    })
  }

  function deleteCredit(id: string) {
    setCredits((current) => current.filter((credit) => credit.id !== id))
    if (editingCreditId === id) {
      resetCreditForm()
    }
  }

  return (
    <section className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Creditos registrados"
          value={String(credits.length)}
          icon={Wallet}
          detail="Consulta general del modulo crediticio"
        />
        <MetricCard
          title="Monto colocado"
          value={formatPrice(creditMetrics.total)}
          icon={CreditCard}
          detail="Suma historica de creditos creados"
        />
        <MetricCard
          title="Saldo pendiente"
          value={formatPrice(creditMetrics.pending)}
          icon={Bell}
          detail={`${creditMetrics.open} creditos abiertos en seguimiento`}
        />
        <MetricCard
          title="Vencidos"
          value={String(creditMetrics.overdue)}
          icon={Activity}
          detail="Casos que requieren gestion administrativa"
        />
      </div>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>{editingCreditId ? 'Editar credito' : 'Registrar nuevo credito'}</CardTitle>
            <CardDescription>
              RF-CR-001 y RF-CR-002: alta y actualizacion de creditos para clientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Cliente</label>
                <Input
                  value={creditForm.customer}
                  onChange={(event) => handleCreditFieldChange('customer', event.target.value)}
                  placeholder="Nombre del cliente"
                  list="credit-customers"
                />
                <datalist id="credit-customers">
                  {customerSuggestions.map((customer) => (
                    <option key={customer} value={customer} />
                  ))}
                </datalist>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Vendedor</label>
                <Input
                  value={creditForm.seller}
                  onChange={(event) => handleCreditFieldChange('seller', event.target.value)}
                  placeholder="Responsable del credito"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Monto del credito</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={creditForm.amount}
                  onChange={(event) => handleCreditFieldChange('amount', event.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Monto abonado</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={creditForm.paid}
                  onChange={(event) => handleCreditFieldChange('paid', event.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Fecha limite</label>
                <Input
                  type="date"
                  value={creditForm.dueDate}
                  onChange={(event) => handleCreditFieldChange('dueDate', event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Estado</label>
                <Input
                  value={creditForm.status}
                  onChange={(event) => handleCreditFieldChange('status', event.target.value as CreditStatus)}
                  placeholder="Pendiente"
                  list="credit-statuses"
                />
                <datalist id="credit-statuses">
                  <option value="Pendiente" />
                  <option value="Activo" />
                  <option value="Pagado" />
                  <option value="Vencido" />
                </datalist>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Observaciones</label>
              <Textarea
                value={creditForm.notes}
                onChange={(event) => handleCreditFieldChange('notes', event.target.value)}
                placeholder="Condiciones, cuotas, referencia del proyecto o comentario interno"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleCreditSubmit}>
                {editingCreditId ? 'Guardar cambios' : 'Registrar credito'}
              </Button>
              <Button variant="outline" onClick={resetCreditForm}>
                Limpiar formulario
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Consulta de creditos</CardTitle>
            <CardDescription>
              RF-CR-003 y RF-CR-004: consulta general con acciones para editar o eliminar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-3">
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={creditSearch}
                  onChange={(event) => setCreditSearch(event.target.value)}
                  placeholder="Buscar por cliente, codigo, vendedor o estado"
                  className="pl-9"
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Credito</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Vence</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCredits.map((credit) => {
                  const balance = Math.max(credit.amount - credit.paid, 0)

                  return (
                    <TableRow key={credit.id}>
                      <TableCell>
                        <div className="font-medium">{credit.id}</div>
                        <div className="text-xs text-muted-foreground">{credit.seller}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{credit.customer}</div>
                        <div className="text-xs text-muted-foreground">{formatPrice(credit.amount)}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            credit.status === 'Pagado'
                              ? 'secondary'
                              : credit.status === 'Vencido'
                                ? 'destructive'
                                : 'default'
                          }
                        >
                          {credit.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatPrice(balance)}</TableCell>
                      <TableCell>{formatDate(credit.dueDate)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="icon-sm" variant="outline" onClick={() => editCredit(credit)}>
                            <FilePenLine className="h-4 w-4" />
                          </Button>
                          <Button size="icon-sm" variant="destructive" onClick={() => deleteCredit(credit.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </section>
  )
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string
  value: string
  detail: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardDescription>{title}</CardDescription>
          <CardTitle className="mt-2 text-2xl">{value}</CardTitle>
        </div>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

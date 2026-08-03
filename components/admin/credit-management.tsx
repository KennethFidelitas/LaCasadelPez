'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { Activity, Bell, CreditCard, FilePenLine, Search, Trash2, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/actions/button'
import { Badge } from '@/components/ui/display/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/display/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/display/table'
import { Input } from '@/components/ui/forms/input'
import { Textarea } from '@/components/ui/forms/textarea'
import { formatDate, formatPrice } from '@/lib/format'
import { deleteCredit, getCreditManagementData, saveCredit } from '@/lib/credits/actions'
import type { CreditCustomerOption, CreditItem } from '@/lib/credits/types'

const initialFormState = {
  customerId: '',
  amount: '0',
  paid: '0',
  dueDate: '',
  notes: '',
}

export function CreditManagement() {
  const [credits, setCredits] = useState<CreditItem[]>([])
  const [customers, setCustomers] = useState<CreditCustomerOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [creditSearch, setCreditSearch] = useState('')
  const [editingCreditId, setEditingCreditId] = useState<string | null>(null)
  const [creditForm, setCreditForm] = useState(initialFormState)
  const [isSaving, startSaving] = useTransition()
  const [isDeleting, startDeleting] = useTransition()

  useEffect(() => {
    let cancelled = false

    async function loadCredits() {
      try {
        const data = await getCreditManagementData()
        if (cancelled) return
        setCredits(data.credits)
        setCustomers(data.customers)
        setCreditForm((current) => ({
          ...current,
          customerId: current.customerId || data.customers[0]?.id || '',
        }))
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los créditos.')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadCredits()

    return () => {
      cancelled = true
    }
  }, [])

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
        if (credit.status === 'Activo') {
          acc.open += 1
        }
        if (credit.status === 'Vencido') {
          acc.overdue += 1
          acc.overdueBalance += Math.max(credit.amount - credit.paid, 0)
        }
        return acc
      },
      { total: 0, pending: 0, open: 0, overdue: 0, overdueBalance: 0 },
    )
  }, [credits])

  const riskRatio = creditMetrics.total > 0 ? Math.round((creditMetrics.overdueBalance / creditMetrics.total) * 100) : 0

  function resetCreditForm() {
    setEditingCreditId(null)
    setCreditForm({
      ...initialFormState,
      customerId: customers[0]?.id ?? '',
    })
  }

  function handleCreditFieldChange(field: keyof typeof creditForm, value: string) {
    setCreditForm((current) => ({ ...current, [field]: value }))
  }

  function handleCreditSubmit() {
    const amount = Number(creditForm.amount) || 0
    const paid = Number(creditForm.paid) || 0

    if (!creditForm.customerId || amount <= 0) {
      toast.error('Seleccioná un cliente y digitá un monto válido.')
      return
    }

    startSaving(async () => {
      const result = await saveCredit({
        id: editingCreditId,
        customerId: creditForm.customerId,
        amount,
        paid,
        dueDate: creditForm.dueDate || null,
        notes: creditForm.notes,
      })

      if (!result.ok) {
        toast.error(result.message)
        return
      }

      const data = await getCreditManagementData()
      setCredits(data.credits)
      setCustomers(data.customers)
      toast.success(editingCreditId ? 'Crédito actualizado correctamente.' : 'Crédito registrado correctamente.')
      resetCreditForm()
    })
  }

  function editCredit(credit: CreditItem) {
    setEditingCreditId(credit.id)
    setCreditForm({
      customerId: credit.customerId,
      amount: String(credit.amount),
      paid: String(credit.paid),
      dueDate: credit.dueDate,
      notes: credit.notes,
    })
  }

  function handleDeleteCredit(id: string) {
    startDeleting(async () => {
      const result = await deleteCredit(id)

      if (!result.ok) {
        toast.error(result.message)
        return
      }

      setCredits((current) => current.filter((credit) => credit.id !== id))
      if (editingCreditId === id) resetCreditForm()
      toast.success('Crédito eliminado correctamente.')
    })
  }

  return (
    <section className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
        <MetricCard
          title="Riesgo de cobranza"
          value={`${riskRatio}%`}
          icon={FilePenLine}
          detail="Porcentaje del total en saldo vencido"
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
                <select
                  value={creditForm.customerId}
                  onChange={(event) => handleCreditFieldChange('customerId', event.target.value)}
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  disabled={customers.length === 0}
                >
                  <option value="">Seleccionar cliente</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.label}
                      {customer.email ? ` · ${customer.email}` : ''}
                    </option>
                  ))}
                </select>
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
              <Button onClick={handleCreditSubmit} disabled={isSaving || customers.length === 0}>
                {isSaving ? 'Guardando...' : editingCreditId ? 'Guardar cambios' : 'Registrar credito'}
              </Button>
              <Button variant="outline" onClick={resetCreditForm} disabled={isSaving}>
                Limpiar formulario
              </Button>
            </div>
            {customers.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay perfiles de cliente disponibles. Registrá un cliente con correo para poder asignarle crédito.
              </p>
            )}
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
                  <TableHead>Riesgo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      Cargando créditos...
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && filteredCredits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No hay créditos registrados.
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && filteredCredits.map((credit) => {
                  const balance = credit.balance
                  const riskScore = credit.status === 'Vencido' ? 'Alto' : balance >= credit.amount * 0.5 ? 'Medio' : 'Bajo'

                  return (
                    <TableRow key={credit.id}>
                      <TableCell>
                        <div className="font-medium">CR-{credit.id.slice(0, 8).toUpperCase()}</div>
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
                      <TableCell>{credit.dueDate ? formatDate(credit.dueDate) : 'Sin fecha'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            riskScore === 'Alto'
                              ? 'destructive'
                              : riskScore === 'Medio'
                                ? 'warning'
                                : 'secondary'
                          }
                        >
                          {riskScore}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="icon-sm" variant="outline" onClick={() => editCredit(credit)}>
                            <FilePenLine className="h-4 w-4" />
                          </Button>
                          <Button size="icon-sm" variant="destructive" onClick={() => handleDeleteCredit(credit.id)} disabled={isDeleting}>
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

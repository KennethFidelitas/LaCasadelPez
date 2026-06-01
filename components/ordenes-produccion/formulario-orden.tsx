'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/actions/button'
import { Input } from '@/components/ui/forms/input'
import { Textarea } from '@/components/ui/forms/textarea'
import { Label } from '@/components/ui/forms/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/forms/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/display/card'
import { Separator } from '@/components/ui/layout/separator'
import { crearOrden, actualizarOrden } from '@/lib/ordenes-produccion/actions'
import {
  ordenProduccionSchema,
  PRODUCTION_STATUSES,
  PAYMENT_STATUSES,
  STATUS_LABELS,
  PAYMENT_LABELS,
  type OrdenProduccionValues,
} from '@/lib/ordenes-produccion/schemas'
import { formatPrice } from '@/lib/format'
import type { ProductionOrder } from '@/lib/types'

interface FormularioOrdenProps {
  orden?: ProductionOrder  // presente = modo edición, ausente = modo creación
}

export function FormularioOrden({ orden }: FormularioOrdenProps) {
  const router = useRouter()
  const modoEdicion = !!orden

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<OrdenProduccionValues>({
    resolver: zodResolver(ordenProduccionSchema),
    defaultValues: orden
      ? {
          status: orden.status,
          payment_status: orden.payment_status,
          width: orden.width ?? undefined,
          height: orden.height ?? undefined,
          depth: orden.depth ?? undefined,
          glass_type: orden.glass_type ?? '',
          glass_thickness: orden.glass_thickness ?? undefined,
          materials_cost: orden.materials_cost,
          labor_cost: orden.labor_cost,
          accessories_cost: orden.accessories_cost,
          subtotal: orden.subtotal,
          discount: orden.discount,
          total: orden.total,
          deposit_paid: orden.deposit_paid,
          estimated_days: orden.estimated_days ?? undefined,
          customer_name: orden.customer_name ?? '',
          customer_email: orden.customer_email ?? '',
          customer_phone: orden.customer_phone ?? '',
          notes: orden.notes ?? '',
          internal_notes: orden.internal_notes ?? '',
        }
      : {
          status: 'cotizado',
          payment_status: 'pendiente',
          materials_cost: 0,
          labor_cost: 0,
          accessories_cost: 0,
          subtotal: 0,
          discount: 0,
          total: 0,
          deposit_paid: 0,
        },
  })

  // Cálculo automático de subtotal y total
  const [materialsCost, laborCost, accessoriesCost, discount] = useWatch({
    control,
    name: ['materials_cost', 'labor_cost', 'accessories_cost', 'discount'],
  })

  useEffect(() => {
    const sub = (materialsCost ?? 0) + (laborCost ?? 0) + (accessoriesCost ?? 0)
    const tot = Math.max(0, sub - (discount ?? 0))
    setValue('subtotal', sub, { shouldValidate: false })
    setValue('total', tot, { shouldValidate: false })
  }, [materialsCost, laborCost, accessoriesCost, discount, setValue])

  async function onSubmit(values: OrdenProduccionValues) {
    try {
      if (modoEdicion) {
        await actualizarOrden(orden.id, values)
        toast.success('Orden actualizada correctamente')
      } else {
        await crearOrden(values)
        toast.success('Orden de producción creada')
      }
      router.push('/dashboard/ordenes-produccion')
      router.refresh()
    } catch (err) {
      toast.error(
        modoEdicion ? 'No se pudo actualizar la orden' : 'No se pudo crear la orden',
      )
      console.error(err)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ── Datos del cliente ────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-3 md:col-span-1">
            <Label htmlFor="customer_name">
              Nombre del cliente <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customer_name"
              placeholder="Ej. Carlos Araya"
              {...register('customer_name')}
              aria-invalid={!!errors.customer_name}
            />
            {errors.customer_name && (
              <p className="text-xs text-destructive">{errors.customer_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customer_email">Email</Label>
            <Input
              id="customer_email"
              type="email"
              placeholder="correo@ejemplo.com"
              {...register('customer_email')}
              aria-invalid={!!errors.customer_email}
            />
            {errors.customer_email && (
              <p className="text-xs text-destructive">{errors.customer_email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customer_phone">Teléfono</Label>
            <Input
              id="customer_phone"
              placeholder="+506 8888-1234"
              {...register('customer_phone')}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Especificaciones de la pecera ────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Especificaciones de la pecera</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="width">Ancho (cm)</Label>
            <Input
              id="width"
              type="number"
              step="0.1"
              min="0"
              placeholder="120"
              {...register('width')}
              aria-invalid={!!errors.width}
            />
            {errors.width && (
              <p className="text-xs text-destructive">{errors.width.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="height">Alto (cm)</Label>
            <Input
              id="height"
              type="number"
              step="0.1"
              min="0"
              placeholder="50"
              {...register('height')}
              aria-invalid={!!errors.height}
            />
            {errors.height && (
              <p className="text-xs text-destructive">{errors.height.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="depth">Fondo (cm)</Label>
            <Input
              id="depth"
              type="number"
              step="0.1"
              min="0"
              placeholder="60"
              {...register('depth')}
              aria-invalid={!!errors.depth}
            />
            {errors.depth && (
              <p className="text-xs text-destructive">{errors.depth.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="glass_type">Tipo de vidrio</Label>
            <Input
              id="glass_type"
              placeholder="Ej. Templado 10 mm"
              {...register('glass_type')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="glass_thickness">Grosor del vidrio (mm)</Label>
            <Input
              id="glass_thickness"
              type="number"
              step="0.1"
              min="0"
              placeholder="10"
              {...register('glass_thickness')}
              aria-invalid={!!errors.glass_thickness}
            />
            {errors.glass_thickness && (
              <p className="text-xs text-destructive">{errors.glass_thickness.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="estimated_days">Días estimados de fabricación</Label>
            <Input
              id="estimated_days"
              type="number"
              min="1"
              placeholder="21"
              {...register('estimated_days')}
              aria-invalid={!!errors.estimated_days}
            />
            {errors.estimated_days && (
              <p className="text-xs text-destructive">{errors.estimated_days.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Desglose de precios ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Desglose de precios</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="materials_cost">Costo materiales</Label>
            <Input
              id="materials_cost"
              type="number"
              step="0.01"
              min="0"
              {...register('materials_cost')}
              aria-invalid={!!errors.materials_cost}
            />
            {errors.materials_cost && (
              <p className="text-xs text-destructive">{errors.materials_cost.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="labor_cost">Mano de obra</Label>
            <Input
              id="labor_cost"
              type="number"
              step="0.01"
              min="0"
              {...register('labor_cost')}
              aria-invalid={!!errors.labor_cost}
            />
            {errors.labor_cost && (
              <p className="text-xs text-destructive">{errors.labor_cost.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="accessories_cost">Accesorios</Label>
            <Input
              id="accessories_cost"
              type="number"
              step="0.01"
              min="0"
              {...register('accessories_cost')}
              aria-invalid={!!errors.accessories_cost}
            />
            {errors.accessories_cost && (
              <p className="text-xs text-destructive">{errors.accessories_cost.message}</p>
            )}
          </div>

          <Separator className="sm:col-span-2 md:col-span-3" />

          <div className="space-y-1.5">
            <Label htmlFor="subtotal">
              Subtotal{' '}
              <span className="text-xs text-muted-foreground">(calculado)</span>
            </Label>
            <Input
              id="subtotal"
              type="number"
              step="0.01"
              readOnly
              className="bg-muted/50 cursor-default"
              {...register('subtotal')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="discount">Descuento</Label>
            <Input
              id="discount"
              type="number"
              step="0.01"
              min="0"
              {...register('discount')}
              aria-invalid={!!errors.discount}
            />
            {errors.discount && (
              <p className="text-xs text-destructive">{errors.discount.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="total">
              Total{' '}
              <span className="text-xs text-muted-foreground">(calculado)</span>
            </Label>
            <Input
              id="total"
              type="number"
              step="0.01"
              readOnly
              className="bg-muted/50 cursor-default font-semibold"
              {...register('total')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deposit_paid">Anticipo recibido</Label>
            <Input
              id="deposit_paid"
              type="number"
              step="0.01"
              min="0"
              {...register('deposit_paid')}
              aria-invalid={!!errors.deposit_paid}
            />
            {errors.deposit_paid && (
              <p className="text-xs text-destructive">{errors.deposit_paid.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Estado y pago ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estado y pago</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Estado de producción</Label>
            <Select
              defaultValue={orden?.status ?? 'cotizado'}
              onValueChange={(v) =>
                setValue('status', v as OrdenProduccionValues['status'])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCTION_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Estado de pago</Label>
            <Select
              defaultValue={orden?.payment_status ?? 'pendiente'}
              onValueChange={(v) =>
                setValue('payment_status', v as OrdenProduccionValues['payment_status'])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {PAYMENT_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Notas ────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas para el cliente</Label>
            <Textarea
              id="notes"
              placeholder="Indicaciones visibles para el cliente…"
              rows={3}
              {...register('notes')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="internal_notes">Notas internas</Label>
            <Textarea
              id="internal_notes"
              placeholder="Notas internas del equipo de producción…"
              rows={3}
              {...register('internal_notes')}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Acciones ─────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/ordenes-produccion')}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? modoEdicion
              ? 'Guardando…'
              : 'Creando…'
            : modoEdicion
              ? 'Guardar cambios'
              : 'Crear orden'}
        </Button>
      </div>
    </form>
  )
}

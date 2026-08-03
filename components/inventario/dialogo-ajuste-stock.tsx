'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowDownCircle, ArrowUpCircle, Boxes } from 'lucide-react'

import {
  entradaItemSchema,
  type EntradaItemValues,
  registroMuerteSchema,
  type RegistroMuerteValues,
  CAUSAS_MUERTE,
  CAUSA_MUERTE_LABELS,
  salidaProductoSchema,
  type SalidaProductoValues,
  MOTIVOS_SALIDA_PRODUCTO,
  MOTIVO_SALIDA_PRODUCTO_LABELS,
} from '@/lib/inventario/schemas'
import {
  registrarEntradaInventario,
  registrarMuerteAnimal,
  registrarSalidaProducto,
} from '@/lib/inventario/actions'

import { Button } from '@/components/ui/actions/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/actions/toggle-group'
import { Input } from '@/components/ui/forms/input'
import { Label } from '@/components/ui/forms/label'
import { Textarea } from '@/components/ui/forms/textarea'
import { Card, CardContent } from '@/components/ui/display/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/forms/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/overlays/dialog'

type TipoAjuste = 'entrada' | 'baja'

interface ItemAjustable {
  id: string
  type: 'animal' | 'product'
  name: string
  sku: string
  stock: number
}

interface DialogoAjusteStockProps {
  item: ItemAjustable
  onAjusteRealizado?: () => void
}

export function DialogoAjusteStock({ item, onAjusteRealizado }: DialogoAjusteStockProps) {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<TipoAjuste>('entrada')

  const today = new Date().toLocaleDateString('en-CA')

  const entradaDefaults: EntradaItemValues = {
    quantity: '' as unknown as number,
    purchase_price: '' as unknown as number,
    supplier: '',
    entry_date: today,
    notes: '',
  }

  const bajaDefaults: RegistroMuerteValues = {
    animal_id: item.id,
    quantity: '' as unknown as number,
    recorded_at: today,
    reason: undefined as unknown as RegistroMuerteValues['reason'],
    notes: '',
  }

  const salidaProductoDefaults: SalidaProductoValues = {
    quantity: '' as unknown as number,
    recorded_at: today,
    reason: undefined as unknown as SalidaProductoValues['reason'],
    notes: '',
  }

  const entradaForm = useForm<EntradaItemValues>({
    resolver: zodResolver(entradaItemSchema),
    defaultValues: entradaDefaults,
  })

  const bajaForm = useForm<RegistroMuerteValues>({
    resolver: zodResolver(registroMuerteSchema),
    defaultValues: bajaDefaults,
  })

  const salidaProductoForm = useForm<SalidaProductoValues>({
    resolver: zodResolver(salidaProductoSchema),
    defaultValues: salidaProductoDefaults,
  })

  const cantidadBaja = bajaForm.watch('quantity')
  const cantidadSalidaProducto = salidaProductoForm.watch('quantity')

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setTipo('entrada')
      entradaForm.reset(entradaDefaults)
      bajaForm.reset(bajaDefaults)
      salidaProductoForm.reset(salidaProductoDefaults)
    }
  }

  async function onSubmitEntrada(values: EntradaItemValues) {
    try {
      await registrarEntradaInventario({ ...values, itemType: item.type, itemId: item.id })
      toast.success('Entrada registrada correctamente')
      onAjusteRealizado?.()
      handleOpenChange(false)
    } catch (err) {
      toast.error('No se pudo registrar la entrada')
      console.error(err)
    }
  }

  async function onSubmitBaja(values: RegistroMuerteValues) {
    if (values.quantity > item.stock) {
      bajaForm.setError('quantity', {
        message: `La cantidad no puede superar el stock actual (${item.stock})`,
      })
      return
    }

    const result = await registrarMuerteAnimal(values)

    if (!result.success) {
      toast.error(result.error ?? 'No se pudo registrar la salida')
      return
    }

    toast.success('Salida registrada correctamente')
    onAjusteRealizado?.()
    handleOpenChange(false)
  }

  async function onSubmitSalidaProducto(values: SalidaProductoValues) {
    if (values.quantity > item.stock) {
      salidaProductoForm.setError('quantity', {
        message: `La cantidad no puede superar el stock actual (${item.stock})`,
      })
      return
    }

    const result = await registrarSalidaProducto({ ...values, productId: item.id })

    if (!result.success) {
      toast.error(result.error ?? 'No se pudo registrar la salida')
      return
    }

    toast.success('Salida registrada correctamente')
    onAjusteRealizado?.()
    handleOpenChange(false)
  }

  const isSubmitting =
    entradaForm.formState.isSubmitting ||
    bajaForm.formState.isSubmitting ||
    salidaProductoForm.formState.isSubmitting

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Boxes className="h-4 w-4" />
          Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar stock</DialogTitle>
          <DialogDescription>
            {item.sku} — {item.name}
          </DialogDescription>
        </DialogHeader>

        <Card className="bg-muted/40">
          <CardContent className="py-4 text-center">
            <p className="text-sm text-muted-foreground">Stock actual</p>
            <p className="text-3xl font-bold text-foreground">{item.stock}</p>
            <p className="text-xs text-muted-foreground">unidades</p>
          </CardContent>
        </Card>

        <div className="space-y-1.5">
          <Label>Tipo de ajuste</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={tipo}
            onValueChange={(value) => value && setTipo(value as TipoAjuste)}
            className="w-full gap-3"
          >
            <ToggleGroupItem
              value="entrada"
              className="h-auto flex-col gap-1 rounded-md py-3 data-[variant=outline]:border-l data-[state=on]:border-accent data-[state=on]:bg-accent/10 data-[state=on]:text-accent"
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <ArrowUpCircle className="h-4 w-4" />
                Registrar Entrada
              </span>
              <span className="text-xs font-normal text-muted-foreground">Compra / recepción</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="baja"
              className="h-auto flex-col gap-1 rounded-md py-3 data-[variant=outline]:border-l data-[state=on]:border-accent data-[state=on]:bg-accent/10 data-[state=on]:text-accent"
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <ArrowDownCircle className="h-4 w-4" />
                Registrar Salida
              </span>
              <span className="text-xs font-normal text-muted-foreground">Merma / corrección</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {tipo === 'entrada' ? (
          <form
            id="form-ajuste-stock"
            onSubmit={entradaForm.handleSubmit(onSubmitEntrada)}
            className="grid gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="entrada-quantity">
                  Cantidad <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="entrada-quantity"
                  type="number"
                  min="1"
                  placeholder="Ej: 10"
                  {...entradaForm.register('quantity')}
                  aria-invalid={!!entradaForm.formState.errors.quantity}
                />
                {entradaForm.formState.errors.quantity && (
                  <p className="text-xs text-destructive">
                    {entradaForm.formState.errors.quantity.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="entrada-purchase-price">
                  Precio de compra (₡) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="entrada-purchase-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  {...entradaForm.register('purchase_price')}
                  aria-invalid={!!entradaForm.formState.errors.purchase_price}
                />
                {entradaForm.formState.errors.purchase_price && (
                  <p className="text-xs text-destructive">
                    {entradaForm.formState.errors.purchase_price.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="entrada-supplier">Proveedor</Label>
                <Input
                  id="entrada-supplier"
                  placeholder="Nombre del proveedor"
                  {...entradaForm.register('supplier')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="entrada-entry-date">
                  Fecha de entrada <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="entrada-entry-date"
                  type="date"
                  {...entradaForm.register('entry_date')}
                  aria-invalid={!!entradaForm.formState.errors.entry_date}
                />
                {entradaForm.formState.errors.entry_date && (
                  <p className="text-xs text-destructive">
                    {entradaForm.formState.errors.entry_date.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="entrada-notes">Notas</Label>
              <Textarea
                id="entrada-notes"
                placeholder="Observaciones sobre esta entrada…"
                rows={2}
                {...entradaForm.register('notes')}
              />
            </div>
          </form>
        ) : item.type === 'animal' ? (
          <form
            id="form-ajuste-stock"
            onSubmit={bajaForm.handleSubmit(onSubmitBaja)}
            className="grid gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="baja-quantity">
                  Cantidad <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="baja-quantity"
                  type="number"
                  min="1"
                  max={item.stock}
                  placeholder="Ej: 3"
                  {...bajaForm.register('quantity')}
                  aria-invalid={!!bajaForm.formState.errors.quantity}
                />
                {bajaForm.formState.errors.quantity && (
                  <p className="text-xs text-destructive">
                    {bajaForm.formState.errors.quantity.message}
                  </p>
                )}
                {cantidadBaja > 0 && cantidadBaja > item.stock && (
                  <p className="text-xs text-destructive">
                    No puede superar el stock actual ({item.stock})
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="baja-recorded-at">
                  Fecha <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="baja-recorded-at"
                  type="date"
                  max={today}
                  {...bajaForm.register('recorded_at')}
                  aria-invalid={!!bajaForm.formState.errors.recorded_at}
                />
                {bajaForm.formState.errors.recorded_at && (
                  <p className="text-xs text-destructive">
                    {bajaForm.formState.errors.recorded_at.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>
                Causa <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="reason"
                control={bajaForm.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={!!bajaForm.formState.errors.reason} className="w-full">
                      <SelectValue placeholder="Seleccionar causa…" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAUSAS_MUERTE.map((causa) => (
                        <SelectItem key={causa} value={causa}>
                          {CAUSA_MUERTE_LABELS[causa]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {bajaForm.formState.errors.reason && (
                <p className="text-xs text-destructive">{bajaForm.formState.errors.reason.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="baja-notes">Notas</Label>
              <Textarea
                id="baja-notes"
                placeholder="Observaciones sobre esta salida…"
                rows={2}
                {...bajaForm.register('notes')}
              />
            </div>
          </form>
        ) : (
          <form
            id="form-ajuste-stock"
            onSubmit={salidaProductoForm.handleSubmit(onSubmitSalidaProducto)}
            className="grid gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="salida-producto-quantity">
                  Cantidad <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="salida-producto-quantity"
                  type="number"
                  min="1"
                  max={item.stock}
                  placeholder="Ej: 3"
                  {...salidaProductoForm.register('quantity')}
                  aria-invalid={!!salidaProductoForm.formState.errors.quantity}
                />
                {salidaProductoForm.formState.errors.quantity && (
                  <p className="text-xs text-destructive">
                    {salidaProductoForm.formState.errors.quantity.message}
                  </p>
                )}
                {cantidadSalidaProducto > 0 && cantidadSalidaProducto > item.stock && (
                  <p className="text-xs text-destructive">
                    No puede superar el stock actual ({item.stock})
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="salida-producto-recorded-at">
                  Fecha <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="salida-producto-recorded-at"
                  type="date"
                  max={today}
                  {...salidaProductoForm.register('recorded_at')}
                  aria-invalid={!!salidaProductoForm.formState.errors.recorded_at}
                />
                {salidaProductoForm.formState.errors.recorded_at && (
                  <p className="text-xs text-destructive">
                    {salidaProductoForm.formState.errors.recorded_at.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>
                Motivo <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="reason"
                control={salidaProductoForm.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={!!salidaProductoForm.formState.errors.reason} className="w-full">
                      <SelectValue placeholder="Seleccionar motivo…" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOTIVOS_SALIDA_PRODUCTO.map((motivo) => (
                        <SelectItem key={motivo} value={motivo}>
                          {MOTIVO_SALIDA_PRODUCTO_LABELS[motivo]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {salidaProductoForm.formState.errors.reason && (
                <p className="text-xs text-destructive">
                  {salidaProductoForm.formState.errors.reason.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="salida-producto-notes">Notas</Label>
              <Textarea
                id="salida-producto-notes"
                placeholder="Observaciones sobre esta salida…"
                rows={2}
                {...salidaProductoForm.register('notes')}
              />
            </div>
          </form>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="form-ajuste-stock" disabled={isSubmitting}>
            {isSubmitting
              ? 'Registrando…'
              : tipo === 'entrada'
                ? 'Registrar entrada'
                : 'Registrar salida'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

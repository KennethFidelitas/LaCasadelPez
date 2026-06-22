'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Check, ChevronsUpDown, Package } from 'lucide-react'

import { cn } from '@/lib/utils'
import { registroEntradaSchema, type RegistroEntradaValues } from '@/lib/inventario/schemas'
import { registrarEntradaAnimal } from '@/lib/inventario/actions'

import { Button } from '@/components/ui/actions/button'
import { Input } from '@/components/ui/forms/input'
import { Label } from '@/components/ui/forms/label'
import { Textarea } from '@/components/ui/forms/textarea'
import { Badge } from '@/components/ui/display/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/display/card'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/overlays/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/overlays/popover'

interface AnimalConStock {
  id: string
  name: string
  sku: string
  inventory: { quantity: number; location: string | null }[] | null
}

interface FormularioRegistroProps {
  animales: AnimalConStock[]
}

export function FormularioRegistro({ animales }: FormularioRegistroProps) {
  const router = useRouter()
  const [comboboxAbierto, setComboboxAbierto] = useState(false)

  const today = new Date().toLocaleDateString('en-CA')

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegistroEntradaValues>({
    resolver: zodResolver(registroEntradaSchema),
    defaultValues: {
      animal_id: '',
      purchase_price: 0,
      supplier: '',
      entry_date: today,
      notes: '',
    },
  })

  const animalIdSeleccionado = watch('animal_id')
  const animalSeleccionado = animales.find((a) => a.id === animalIdSeleccionado)
  const stockActual = animalSeleccionado?.inventory?.[0]?.quantity ?? null

  async function onSubmit(values: RegistroEntradaValues) {
    try {
      await registrarEntradaAnimal(values)
      toast.success('Entrada registrada correctamente')
      router.push('/inventario/consultar-animales')
      router.refresh()
    } catch (err) {
      toast.error('No se pudo registrar la entrada')
      console.error(err)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Selección de animal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Animal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>
              Animal <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="animal_id"
              control={control}
              render={({ field }) => (
                <Popover open={comboboxAbierto} onOpenChange={setComboboxAbierto}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboboxAbierto}
                      aria-invalid={!!errors.animal_id}
                      className={cn(
                        'w-full justify-between font-normal',
                        !field.value && 'text-muted-foreground',
                      )}
                    >
                      {field.value
                        ? animales.find((a) => a.id === field.value)?.name
                        : 'Buscar animal…'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput placeholder="Buscar por nombre o SKU…" />
                      <CommandList>
                        <CommandEmpty>No se encontraron animales.</CommandEmpty>
                        <CommandGroup>
                          {animales.map((animal) => (
                            <CommandItem
                              key={animal.id}
                              value={`${animal.name} ${animal.sku}`}
                              onSelect={() => {
                                field.onChange(animal.id)
                                setComboboxAbierto(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  field.value === animal.id ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              <span className="flex-1">{animal.name}</span>
                              <span className="text-xs text-muted-foreground">{animal.sku}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.animal_id && (
              <p className="text-xs text-destructive">{errors.animal_id.message}</p>
            )}
          </div>

          {/* Badge de stock actual — aparece al seleccionar un animal */}
          {animalSeleccionado && (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Stock actual:</span>
              <Badge variant={stockActual !== null && stockActual < 5 ? 'destructive' : 'secondary'}>
                {stockActual ?? 0} unidades
              </Badge>
              {animalSeleccionado.inventory?.[0]?.location && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {animalSeleccionado.inventory[0].location}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalles de la entrada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalles de la entrada</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {/* Cantidad */}
          <div className="space-y-1.5">
            <Label htmlFor="quantity">
              Cantidad <span className="text-destructive">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="Ej: 10"
              {...register('quantity')}
              aria-invalid={!!errors.quantity}
            />
            {errors.quantity && (
              <p className="text-xs text-destructive">{errors.quantity.message}</p>
            )}
          </div>

          {/* Precio de compra */}
          <div className="space-y-1.5">
            <Label htmlFor="purchase_price">
              Precio de compra (₡) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="purchase_price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              {...register('purchase_price')}
              aria-invalid={!!errors.purchase_price}
            />
            {errors.purchase_price && (
              <p className="text-xs text-destructive">{errors.purchase_price.message}</p>
            )}
          </div>

          {/* Proveedor */}
          <div className="space-y-1.5">
            <Label htmlFor="supplier">Proveedor</Label>
            <Input
              id="supplier"
              placeholder="Nombre del proveedor"
              {...register('supplier')}
            />
          </div>

          {/* Fecha de entrada */}
          <div className="space-y-1.5">
            <Label htmlFor="entry_date">
              Fecha de entrada <span className="text-destructive">*</span>
            </Label>
            <Input
              id="entry_date"
              type="date"
              {...register('entry_date')}
              aria-invalid={!!errors.entry_date}
            />
            {errors.entry_date && (
              <p className="text-xs text-destructive">{errors.entry_date.message}</p>
            )}
          </div>

          {/* Notas */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Observaciones sobre esta entrada…"
              rows={3}
              {...register('notes')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/inventario/consultar-animales')}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Registrando…' : 'Registrar entrada'}
        </Button>
      </div>
    </form>
  )
}

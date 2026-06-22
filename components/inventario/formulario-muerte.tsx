'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Check, ChevronsUpDown, Package } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  registroMuerteSchema,
  type RegistroMuerteValues,
  CAUSAS_MUERTE,
  CAUSA_MUERTE_LABELS,
} from '@/lib/inventario/schemas'
import { registrarMuerteAnimal } from '@/lib/inventario/actions'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/forms/select'

interface AnimalConStock {
  id: string
  name: string
  sku: string
  inventory: { quantity: number; location: string | null }[] | null
}

interface FormularioMuerteProps {
  animales: AnimalConStock[]
}

export function FormularioMuerte({ animales }: FormularioMuerteProps) {
  const router = useRouter()
  const [comboboxAbierto, setComboboxAbierto] = useState(false)

  const today = new Date().toLocaleDateString('en-CA')

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegistroMuerteValues>({
    resolver: zodResolver(registroMuerteSchema),
    defaultValues: {
      animal_id: '',
      recorded_at: today,
      notes: '',
    },
  })

  const animalIdSeleccionado = watch('animal_id')
  const cantidadIngresada = watch('quantity')
  const animalSeleccionado = animales.find((a) => a.id === animalIdSeleccionado)
  const stockActual = animalSeleccionado?.inventory?.[0]?.quantity ?? null

  async function onSubmit(values: RegistroMuerteValues) {
    // Guardia cliente: evita round-trip innecesario si ya supera el stock
    if (stockActual !== null && values.quantity > stockActual) {
      toast.error(`La cantidad no puede superar el stock actual (${stockActual})`)
      return
    }

    const result = await registrarMuerteAnimal(values)

    if (!result.success) {
      toast.error(result.error ?? 'No se pudo registrar la baja')
      return
    }

    toast.success(
      `Se registró la baja de ${values.quantity} animal${values.quantity !== 1 ? 'es' : ''}`,
    )

    // Limpiar formulario para registrar otra baja
    reset({
      animal_id: '',
      recorded_at: new Date().toLocaleDateString('en-CA'),
      notes: '',
    })
    router.refresh()
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
                        <CommandEmpty>No se encontraron animales con stock disponible.</CommandEmpty>
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

          {/* Badge de stock actual — visible solo al seleccionar un animal */}
          {animalSeleccionado && (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Stock disponible:</span>
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

      {/* Detalles de la baja */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalles de la baja</CardTitle>
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
              max={stockActual ?? undefined}
              placeholder="Ej: 3"
              {...register('quantity')}
              aria-invalid={!!errors.quantity}
            />
            {errors.quantity && (
              <p className="text-xs text-destructive">{errors.quantity.message}</p>
            )}
            {stockActual !== null &&
              cantidadIngresada > 0 &&
              cantidadIngresada > stockActual && (
                <p className="text-xs text-destructive">
                  No puede superar el stock actual ({stockActual})
                </p>
              )}
          </div>

          {/* Fecha */}
          <div className="space-y-1.5">
            <Label htmlFor="recorded_at">
              Fecha <span className="text-destructive">*</span>
            </Label>
            <Input
              id="recorded_at"
              type="date"
              max={today}
              {...register('recorded_at')}
              aria-invalid={!!errors.recorded_at}
            />
            {errors.recorded_at && (
              <p className="text-xs text-destructive">{errors.recorded_at.message}</p>
            )}
          </div>

          {/* Causa */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>
              Causa <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={!!errors.reason} className="w-full">
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
            {errors.reason && (
              <p className="text-xs text-destructive">{errors.reason.message}</p>
            )}
          </div>

          {/* Notas */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Observaciones sobre esta baja…"
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
          onClick={() => router.push('/dashboard?modulo=inventory')}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Registrando…' : 'Registrar baja'}
        </Button>
      </div>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import {
  productoSchema,
  type ProductoValues,
  UBICACIONES,
  UBICACION_LABELS,
} from '@/lib/inventario/schemas'
import { crearProducto } from '@/lib/inventario/actions'

import { Button } from '@/components/ui/actions/button'
import { Input } from '@/components/ui/forms/input'
import { Label } from '@/components/ui/forms/label'
import { Textarea } from '@/components/ui/forms/textarea'
import { Checkbox } from '@/components/ui/forms/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/display/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/forms/select'

interface CategoriaProducto {
  id: string
  name: string
}

interface FormularioAltaProductoProps {
  categorias: CategoriaProducto[]
}

const MAX_IMAGENES = 5

export function FormularioAltaProducto({ categorias }: FormularioAltaProductoProps) {
  const router = useRouter()
  const [selectedImages, setSelectedImages] = useState<File[]>([])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProductoValues>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      name: '',
      brand: '',
      description: '',
      category_id: '',
      price: '' as unknown as number,
      cost: '' as unknown as number,
      is_featured: false,
      quantity: '' as unknown as number,
      location: undefined as unknown as ProductoValues['location'],
      low_stock_threshold: '' as unknown as number,
      supplier: '',
    },
  })

  function handleImagesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length > MAX_IMAGENES) {
      toast.error(`Puede seleccionar un máximo de ${MAX_IMAGENES} imágenes.`)
      event.target.value = ''
      setSelectedImages([])
      return
    }
    setSelectedImages(files)
  }

  async function onSubmit(values: ProductoValues) {
    const result = await crearProducto(values, selectedImages)

    if (!result.success) {
      toast.error(result.error ?? 'No se pudo registrar el producto')
      return
    }

    toast.success('Producto registrado correctamente')
    router.push('/dashboard?modulo=inventory')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Información básica */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información básica</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Nombre del producto <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Ej: Filtro Canister 1200"
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="brand">Marca</Label>
            <Input id="brand" placeholder="Ej: Sarmiento" {...register('brand')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">
              Descripción <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Descripción del producto"
              rows={3}
              {...register('description')}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>
                Categoría <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="category_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={!!errors.category_id} className="w-full">
                      <SelectValue placeholder="Seleccionar categoría…" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          {categoria.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category_id && (
                <p className="text-xs text-destructive">{errors.category_id.message}</p>
              )}
            </div>

            <div className="flex items-end pb-1.5">
              <div className="flex items-center gap-2">
                <Controller
                  name="is_featured"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="is_featured"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="is_featured" className="font-normal">
                  Marcar como destacado
                </Label>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="price">
                Precio de venta (₡) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                {...register('price')}
                aria-invalid={!!errors.price}
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cost">
                Costo unitario (₡) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                {...register('cost')}
                aria-invalid={!!errors.cost}
              />
              {errors.cost && <p className="text-xs text-destructive">{errors.cost.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventario y logística */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inventario y logística</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
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

            <div className="space-y-1.5">
              <Label>
                Ubicación <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={!!errors.location} className="w-full">
                      <SelectValue placeholder="Seleccionar ubicación…" />
                    </SelectTrigger>
                    <SelectContent>
                      {UBICACIONES.map((ubicacion) => (
                        <SelectItem key={ubicacion} value={ubicacion}>
                          {UBICACION_LABELS[ubicacion]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.location && (
                <p className="text-xs text-destructive">{errors.location.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="low_stock_threshold">Stock mínimo</Label>
              <Input
                id="low_stock_threshold"
                type="number"
                min="0"
                placeholder="Ej: 5"
                {...register('low_stock_threshold')}
                aria-invalid={!!errors.low_stock_threshold}
              />
              {errors.low_stock_threshold && (
                <p className="text-xs text-destructive">{errors.low_stock_threshold.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="supplier">Proveedor</Label>
              <Input id="supplier" placeholder="Nombre del proveedor" {...register('supplier')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="images">Imágenes del producto</Label>
            <Input
              id="images"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImagesChange}
              className="file:mr-4 file:rounded-md file:bg-primary file:px-4 file:text-primary-foreground hover:file:bg-primary/90"
            />
            <p className="text-xs text-muted-foreground">
              Puede seleccionar hasta {MAX_IMAGENES} imágenes JPG, PNG o WEBP (máximo 5 MB cada una).
            </p>
            {selectedImages.length > 0 && (
              <p className="text-sm font-medium text-primary">
                {selectedImages.length} imagen{selectedImages.length === 1 ? '' : 'es'} seleccionada
                {selectedImages.length === 1 ? '' : 's'}.
              </p>
            )}
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
          {isSubmitting ? 'Guardando…' : 'Guardar producto'}
        </Button>
      </div>
    </form>
  )
}

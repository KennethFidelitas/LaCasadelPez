'use client'

import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowRight, X } from 'lucide-react'

import {
  editarProductoSchema,
  type EditarProductoValues,
  UBICACIONES,
  UBICACION_LABELS,
} from '@/lib/inventario/schemas'
import { actualizarProducto } from '@/lib/inventario/actions'
import { useGestionImagenes } from '@/hooks/use-gestion-imagenes'

import { Button } from '@/components/ui/actions/button'
import { Input } from '@/components/ui/forms/input'
import { Label } from '@/components/ui/forms/label'
import { Textarea } from '@/components/ui/forms/textarea'
import { Checkbox } from '@/components/ui/forms/checkbox'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/display/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/forms/select'
import { DialogoAjusteStock } from '@/components/inventario/dialogo-ajuste-stock'

interface CategoriaProducto {
  id: string
  name: string
}

interface ProductoAEditar {
  id: string
  sku: string
  name: string
  brand: string | null
  description: string
  category_id: string | null
  price: number
  cost: number
  is_featured: boolean
  images: string[] | null
}

interface InventarioProducto {
  quantity: number
  location: string
  low_stock_threshold: number
}

interface FormularioEditarProductoProps {
  producto: ProductoAEditar
  inventario: InventarioProducto
  categorias: CategoriaProducto[]
}

export function FormularioEditarProducto({
  producto,
  inventario,
  categorias,
}: FormularioEditarProductoProps) {
  const router = useRouter()
  const {
    keptImages,
    newFiles,
    totalCount,
    maxImages,
    addFiles,
    removeExisting,
    removeNewFile,
  } = useGestionImagenes({ initialImages: producto.images ?? [] })

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EditarProductoValues>({
    resolver: zodResolver(editarProductoSchema),
    defaultValues: {
      name: producto.name,
      brand: producto.brand ?? '',
      description: producto.description,
      category_id: producto.category_id ?? '',
      price: producto.price,
      cost: producto.cost,
      is_featured: producto.is_featured,
      location: inventario.location as EditarProductoValues['location'],
      low_stock_threshold: inventario.low_stock_threshold,
      supplier: '',
    },
  })

function handleImagesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    const errorMsg = addFiles(files)
    if (errorMsg) toast.error(errorMsg)
    event.target.value = ''
  }

  async function onSubmit(values: EditarProductoValues) {
    const result = await actualizarProducto(producto.id, values, keptImages, newFiles)

    if (!result.success) {
      toast.error(result.error ?? 'No se pudo actualizar el producto')
      return
    }

    toast.success('Producto actualizado correctamente')
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
              <Label>Cantidad</Label>
              <div className="flex h-9 items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 text-sm">
                <span className="text-foreground">{inventario.quantity} unidades</span>
                <DialogoAjusteStock
                  item={{
                    id: producto.id,
                    type: 'product',
                    name: producto.name,
                    sku: producto.sku,
                    stock: inventario.quantity,
                  }}
                  onAjusteRealizado={() => router.refresh()}
                  trigger={
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      Ajustar stock
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                La cantidad solo se modifica desde "Ajustar stock"
              </p>
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
            {(keptImages.length > 0 || newFiles.length > 0) && (
              <div className="mt-3 mb-1 flex flex-wrap gap-3">
                {keptImages.map((image, index) => (
                  <div key={image} className="relative h-20 w-20">
                    <img
                      src={image}
                      alt={`Imagen ${index + 1} de ${producto.name}`}
                      className="h-20 w-20 rounded-md border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeExisting(image)}
                      aria-label="Eliminar imagen"
                      className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {newFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="relative h-20 w-20">
                    <div className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed bg-muted/40 p-1 text-center">
                      <span className="line-clamp-2 text-[10px] text-muted-foreground">
                        {file.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNewFile(index)}
                      aria-label="Quitar imagen"
                      className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Input
              id="images"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImagesChange}
              disabled={totalCount >= maxImages}
              className="h-auto py-2 file:mr-4 file:h-auto file:rounded-md file:bg-primary file:px-4 file:py-2 file:text-primary-foreground hover:file:bg-primary/90"
            />
            <p className="text-xs text-muted-foreground">
              {totalCount}/{maxImages} imágenes. JPG, PNG o WEBP, máximo 5 MB cada una.
            </p>
          </div>
        </CardContent>

        {/* Botones de acción */}
        <CardFooter className="justify-end gap-3 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard?modulo=inventory')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}

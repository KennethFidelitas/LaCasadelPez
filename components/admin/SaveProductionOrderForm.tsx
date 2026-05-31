'use client'

// RF-OP-009 — Como vendedor quiero guardar la orden de producción en el sistema.

import { useState } from 'react'
import { CheckCircle, Loader2, Plus, Trash2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/actions/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/display/card'
import { Input } from '@/components/ui/forms/input'
import { Textarea } from '@/components/ui/forms/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/forms/select'
import { type CreateProductionOrderInput, createProductionOrder } from '@/lib/production-orders'
import { formatPrice } from '@/lib/format'

// ─── Constantes ───────────────────────────────────────────────────────────────

const GLASS_TYPES = [
  { value: 'normal', label: 'Normal' },
  { value: 'templado', label: 'Templado' },
  { value: 'laminado', label: 'Laminado' },
  { value: 'low_iron', label: 'Low Iron (ultra claro)' },
]

const ACCESSORIES_CATALOG = [
  { id: 'filtro', name: 'Filtro', defaultPrice: 45000 },
  { id: 'calentador', name: 'Calentador', defaultPrice: 18000 },
  { id: 'iluminacion', name: 'Iluminación LED', defaultPrice: 25000 },
  { id: 'tapa', name: 'Tapa de vidrio', defaultPrice: 12000 },
  { id: 'soporte', name: 'Soporte metálico', defaultPrice: 35000 },
  { id: 'sump', name: 'Sump', defaultPrice: 60000 },
]

// ─── Tipo interno del formulario ──────────────────────────────────────────────

interface AccessoryItem {
  id: string
  name: string
  price: number
}

interface FormState {
  // Cliente
  customer_name: string
  customer_email: string
  customer_phone: string
  // Dimensiones
  width: string
  height: string
  depth: string
  // Vidrio
  glass_type: string
  glass_thickness: string
  // Costos
  materials_cost: string
  labor_cost: string
  discount: string
  // Tiempo estimado
  estimated_days: string
  // Notas
  notes: string
}

const INITIAL_FORM: FormState = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  width: '',
  height: '',
  depth: '',
  glass_type: 'normal',
  glass_thickness: '8',
  materials_cost: '',
  labor_cost: '',
  discount: '0',
  estimated_days: '15',
  notes: '',
}

// ─── Componente ───────────────────────────────────────────────────────────────

interface Props {
  sellerId?: string
  onOrderCreated?: (orderNumber: string) => void
}

export function SaveProductionOrderForm({ sellerId, onOrderCreated }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [accessories, setAccessories] = useState<AccessoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // ─── Cálculos derivados ──────────────────────────────────────────────────

  const materialsN = parseFloat(form.materials_cost) || 0
  const laborN = parseFloat(form.labor_cost) || 0
  const discountN = parseFloat(form.discount) || 0
  const accessoriesCost = accessories.reduce((sum, a) => sum + a.price, 0)
  const subtotal = materialsN + laborN + accessoriesCost
  const total = Math.max(0, subtotal - discountN)
  const deposit = Math.round(total * 0.5 * 100) / 100

  // ─── Helpers de formulario ────────────────────────────────────────────────

  function setField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function addAccessory(item: (typeof ACCESSORIES_CATALOG)[0]) {
    if (accessories.find((a) => a.id === item.id)) return
    setAccessories((prev) => [...prev, { id: item.id, name: item.name, price: item.defaultPrice }])
  }

  function removeAccessory(id: string) {
    setAccessories((prev) => prev.filter((a) => a.id !== id))
  }

  function updateAccessoryPrice(id: string, price: number) {
    setAccessories((prev) => prev.map((a) => (a.id === id ? { ...a, price } : a)))
  }

  // ─── Validación ──────────────────────────────────────────────────────────

  function validate(): string | null {
    if (!form.customer_name.trim()) return 'El nombre del cliente es obligatorio.'
    if (!form.customer_phone.trim()) return 'El teléfono del cliente es obligatorio.'
    if (!form.width || !form.height || !form.depth) return 'Las tres dimensiones son obligatorias.'
    if (parseFloat(form.width) <= 0 || parseFloat(form.height) <= 0 || parseFloat(form.depth) <= 0)
      return 'Las dimensiones deben ser mayores a 0.'
    if (materialsN <= 0) return 'El costo de materiales debe ser mayor a 0.'
    if (laborN < 0) return 'La mano de obra no puede ser negativa.'
    return null
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit() {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)

    const input: CreateProductionOrderInput = {
      customer_name: form.customer_name.trim(),
      customer_email: form.customer_email.trim(),
      customer_phone: form.customer_phone.trim(),
      user_id: sellerId,
      width: parseFloat(form.width),
      height: parseFloat(form.height),
      depth: parseFloat(form.depth),
      glass_type: form.glass_type,
      glass_thickness: parseFloat(form.glass_thickness) || 8,
      accessories: accessories.map(({ id, name, price }) => ({ id, name, price })),
      materials_cost: materialsN,
      labor_cost: laborN,
      accessories_cost: accessoriesCost,
      subtotal,
      discount: discountN,
      total,
      estimated_days: parseInt(form.estimated_days) || 15,
      notes: form.notes.trim() || undefined,
      config: {
        glass_type: form.glass_type,
        dimensions: {
          width: parseFloat(form.width),
          height: parseFloat(form.height),
          depth: parseFloat(form.depth),
        },
      },
    }

    const { data, error: err } = await createProductionOrder(input)

    setLoading(false)

    if (err || !data) {
      setError(err ?? 'Error al guardar la orden.')
      return
    }

    setSuccess(data.order_number)
    onOrderCreated?.(data.order_number)
    setForm(INITIAL_FORM)
    setAccessories([])
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="grid gap-6">
      {/* Datos del cliente */}
      <Card>
        <CardHeader>
          <CardTitle>Datos del cliente</CardTitle>
          <CardDescription>Información de contacto para la orden.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Nombre completo *</label>
            <Input
              value={form.customer_name}
              onChange={(e) => setField('customer_name', e.target.value)}
              placeholder="Ej: Carlos Araya"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Correo electrónico</label>
            <Input
              type="email"
              value={form.customer_email}
              onChange={(e) => setField('customer_email', e.target.value)}
              placeholder="cliente@email.com"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Teléfono *</label>
            <Input
              type="tel"
              value={form.customer_phone}
              onChange={(e) => setField('customer_phone', e.target.value)}
              placeholder="8888-8888"
            />
          </div>
        </CardContent>
      </Card>

      {/* Especificaciones de la pecera */}
      <Card>
        <CardHeader>
          <CardTitle>Especificaciones de la pecera</CardTitle>
          <CardDescription>Dimensiones y tipo de vidrio para producción.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Ancho (cm) *</label>
              <Input
                type="number"
                min={1}
                value={form.width}
                onChange={(e) => setField('width', e.target.value)}
                placeholder="120"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Alto (cm) *</label>
              <Input
                type="number"
                min={1}
                value={form.height}
                onChange={(e) => setField('height', e.target.value)}
                placeholder="60"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Profundidad (cm) *</label>
              <Input
                type="number"
                min={1}
                value={form.depth}
                onChange={(e) => setField('depth', e.target.value)}
                placeholder="50"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tipo de vidrio</label>
              <Select value={form.glass_type} onValueChange={(v) => setField('glass_type', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GLASS_TYPES.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Espesor del vidrio (mm)</label>
              <Input
                type="number"
                min={4}
                max={25}
                value={form.glass_thickness}
                onChange={(e) => setField('glass_thickness', e.target.value)}
                placeholder="8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accesorios */}
      <Card>
        <CardHeader>
          <CardTitle>Accesorios</CardTitle>
          <CardDescription>Agregue los accesorios incluidos en esta orden.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {ACCESSORIES_CATALOG.map((item) => (
              <Button
                key={item.id}
                variant={accessories.find((a) => a.id === item.id) ? 'default' : 'outline'}
                size="sm"
                onClick={() => addAccessory(item)}
              >
                <Plus className="mr-1 h-3 w-3" />
                {item.name}
              </Button>
            ))}
          </div>

          {accessories.length > 0 && (
            <div className="grid gap-2">
              {accessories.map((acc) => (
                <div key={acc.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <span className="flex-1 text-sm font-medium">{acc.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">₡</span>
                    <Input
                      type="number"
                      min={0}
                      value={acc.price}
                      onChange={(e) => updateAccessoryPrice(acc.id, parseFloat(e.target.value) || 0)}
                      className="w-28"
                    />
                  </div>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => removeAccessory(acc.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Costos y tiempos */}
      <Card>
        <CardHeader>
          <CardTitle>Costos y tiempos</CardTitle>
          <CardDescription>Precios y plazo estimado de entrega.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Costo materiales (₡) *</label>
              <Input
                type="number"
                min={0}
                value={form.materials_cost}
                onChange={(e) => setField('materials_cost', e.target.value)}
                placeholder="250000"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Mano de obra (₡)</label>
              <Input
                type="number"
                min={0}
                value={form.labor_cost}
                onChange={(e) => setField('labor_cost', e.target.value)}
                placeholder="80000"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Descuento (₡)</label>
              <Input
                type="number"
                min={0}
                value={form.discount}
                onChange={(e) => setField('discount', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Días estimados</label>
              <Input
                type="number"
                min={1}
                value={form.estimated_days}
                onChange={(e) => setField('estimated_days', e.target.value)}
                placeholder="15"
              />
            </div>
          </div>

          {/* Resumen de costos */}
          <div className="rounded-lg border p-4">
            <p className="mb-3 text-sm font-medium text-foreground">Resumen de la orden</p>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Materiales</span>
                <span>{formatPrice(materialsN)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mano de obra</span>
                <span>{formatPrice(laborN)}</span>
              </div>
              {accessoriesCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accesorios</span>
                  <span>{formatPrice(accessoriesCost)}</span>
                </div>
              )}
              {discountN > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento</span>
                  <span>- {formatPrice(discountN)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Anticipo requerido (50%)</span>
                <span>{formatPrice(deposit)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notas */}
      <Card>
        <CardHeader>
          <CardTitle>Notas adicionales</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
            placeholder="Observaciones especiales, detalles de diseño, instrucciones de entrega..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Errores y éxito */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-destructive">
          <XCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-700">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            Orden <span className="font-semibold">#{success}</span> guardada exitosamente en el
            sistema.
          </p>
        </div>
      )}

      {/* Botón guardar */}
      <div className="flex justify-end">
        <Button size="lg" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar orden de producción'
          )}
        </Button>
      </div>
    </div>
  )
}

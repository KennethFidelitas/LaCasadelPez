import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/actions/button'
import { BotonImprimir } from '@/components/ordenes-produccion/boton-imprimir'
import { requireAdminUser } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDateTime, formatPrice } from '@/lib/format'

interface PageProps {
  params: Promise<{ id: string }>
}

type ShippingAddress = {
  label?: string | null
  street_line_1?: string | null
  street_line_2?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
}

type OrderItem = {
  id: string
  name: string
  sku: string | null
  quantity: number
  unit_price: number
  total: number
}

type OrderProfile = {
  email: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
}

type PrintableOrder = {
  id: string
  order_number: string
  status: string
  payment_status: string
  source: string | null
  total: number
  notes: string | null
  shipping_address: ShippingAddress | null
  created_at: string
  profile: OrderProfile | null
  order_items: OrderItem[]
}

type RawPrintableOrder = Omit<PrintableOrder, 'profile'> & {
  profile: OrderProfile | OrderProfile[] | null
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  procesando: 'En preparacion',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  reembolsado: 'Reembolsado',
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  fallido: 'Fallido',
  reembolsado: 'Reembolsado',
}

export default async function ImprimirPedidoPage({ params }: PageProps) {
  const { id } = await params
  await requireAdminUser('/admin')

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      payment_status,
      source,
      total,
      notes,
      shipping_address,
      created_at,
      profile:profiles(email, first_name, last_name, phone),
      order_items(id, name, sku, quantity, unit_price, total)
    `)
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  const rawOrder = data as unknown as RawPrintableOrder
  const order: PrintableOrder = {
    ...rawOrder,
    profile: Array.isArray(rawOrder.profile) ? rawOrder.profile[0] ?? null : rawOrder.profile,
  }
  const customerName = [order.profile?.first_name, order.profile?.last_name].filter(Boolean).join(' ')
  const addressLines = buildAddressLines(order.shipping_address)
  const itemCount = order.order_items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0)

  return (
    <>
      <div className="print:hidden sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin?modulo=orders">
              <ArrowLeft className="h-4 w-4" />
              Volver a pedidos
            </Link>
          </Button>
          <BotonImprimir />
        </div>
      </div>

      <style>{`
        @media print {
          header, footer, nav, aside,
          [data-slot="store-header"],
          [data-slot="store-footer"],
          [data-slot="cart-drawer"] { display: none !important; }
          body { background: white !important; }
          .print-page { padding: 0 !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <main className="print-page mx-auto max-w-4xl px-6 py-8 text-sm text-foreground">
        <section className="mb-8 flex items-start justify-between gap-6 border-b pb-6">
          <div>
            <h1 className="text-2xl font-bold">La Casa del Pez</h1>
            <p className="text-muted-foreground">Orden de preparación de envío</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Impresa: {formatDateTime(new Date().toISOString())}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Pedido</p>
            <p className="font-mono text-2xl font-bold text-primary">#{order.order_number}</p>
            <p className="mt-1 text-sm text-muted-foreground">Creado: {formatDateTime(order.created_at)}</p>
          </div>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <InfoBox label="Estado del pedido" value={ORDER_STATUS_LABELS[order.status] ?? order.status} />
          <InfoBox label="Estado de pago" value={PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status} />
          <InfoBox label="Canal" value={order.source === 'pos' ? 'POS' : order.source === 'phone' ? 'Telefono' : 'Online'} />
        </section>

        <section className="mb-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cliente</h2>
            <DetailRow label="Nombre" value={customerName || 'Cliente tienda en linea'} />
            <DetailRow label="Correo" value={order.profile?.email ?? 'No registrado'} />
            <DetailRow label="Telefono" value={order.profile?.phone ?? 'No registrado'} />
          </div>

          <div className="rounded-lg border p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entrega</h2>
            {addressLines.length > 0 ? (
              <div className="space-y-1">
                {addressLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Sin dirección registrada. Confirmar retiro o entrega con el cliente.</p>
            )}
          </div>
        </section>

        <section className="mb-6">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Checklist de preparación</h2>
              <p className="mt-1 text-sm text-muted-foreground">{itemCount} unidad(es) en {order.order_items.length} línea(s)</p>
            </div>
            <p className="text-sm font-semibold">Total pedido: {formatPrice(Number(order.total ?? 0))}</p>
          </div>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-y bg-muted/50">
                <th className="w-10 px-3 py-2 text-left">OK</th>
                <th className="px-3 py-2 text-left">Articulo</th>
                <th className="px-3 py-2 text-left">SKU</th>
                <th className="px-3 py-2 text-right">Cantidad</th>
                <th className="px-3 py-2 text-right">Total linea</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="px-3 py-3">
                    <span className="block h-5 w-5 rounded border border-foreground" />
                  </td>
                  <td className="px-3 py-3 font-medium">{item.name}</td>
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{item.sku ?? 'SIN-SKU'}</td>
                  <td className="px-3 py-3 text-right font-semibold">{item.quantity}</td>
                  <td className="px-3 py-3 text-right">{formatPrice(Number(item.total ?? 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {order.notes && (
          <section className="mb-8 rounded-lg border p-4">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notas del pedido</h2>
            <p>{order.notes}</p>
          </section>
        )}

        <section className="mt-12 grid gap-8 md:grid-cols-3">
          <SignatureLine label="Preparado por" />
          <SignatureLine label="Revisado por" />
          <SignatureLine label="Entregado a transportista" />
        </section>
      </main>
    </>
  )
}

function buildAddressLines(address: ShippingAddress | null): string[] {
  if (!address) return []

  return [
    address.label,
    address.street_line_1,
    address.street_line_2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(', '),
    address.country,
  ].filter((line): line is string => Boolean(line))
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[90px_1fr] gap-3 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  )
}

function SignatureLine({ label }: { label: string }) {
  return (
    <div>
      <div className="h-12 border-b border-foreground" />
      <p className="mt-2 text-center text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

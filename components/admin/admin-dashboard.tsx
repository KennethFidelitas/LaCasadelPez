'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Activity,
  Bell,
  Boxes,
  ChevronRight,
  CreditCard,
  Factory,
  FileText,
  LayoutDashboard,
  Minus,
  Plus,
  Receipt,
  Search,
  Settings2,
  ShoppingCart,
  Store,
  Users,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { CreditManagement } from '@/components/admin/credit-management'
import { Button } from '@/components/ui/actions/button'
import { Badge } from '@/components/ui/display/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/display/card'
import { Progress } from '@/components/ui/display/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/display/table'
import { Input } from '@/components/ui/forms/input'
import { Label } from '@/components/ui/forms/label'
import { Textarea } from '@/components/ui/forms/textarea'
import { createCustomerContact } from '@/lib/customers/actions'
import type { CustomerContactRecord } from '@/lib/customers/types'
import { formatDateTime, formatPrice } from '@/lib/format'
import { createPosSale } from '@/lib/pos/actions'
import type { PosCatalogProduct, PosSaleRecord, PosSalesSummary } from '@/lib/pos/types'

type ModuleKey =
  | 'overview'
  | 'pos'
  | 'inventory'
  | 'orders'
  | 'production'
  | 'customers'
  | 'credits'
  | 'reports'
  | 'settings'

type PosProduct = PosCatalogProduct

type CartItem = PosProduct & {
  quantity: number
}

type InventoryItem = {
  id: string
  name: string
  sku: string
  category: string
  stock: number
  min: number
  location: string
  cost: number
}

type ProductionItem = {
  id: string
  client: string
  model: string
  progress: number
  stage: 'Cotizacion' | 'Corte' | 'Pegado' | 'Acabados' | 'Entrega'
}

const modules = [
  { key: 'overview', label: 'Resumen', icon: LayoutDashboard },
  { key: 'pos', label: 'Punto de venta', icon: CreditCard },
  { key: 'inventory', label: 'Inventario', icon: Boxes },
  { key: 'orders', label: 'Pedidos', icon: ShoppingCart },
  { key: 'production', label: 'Produccion', icon: Factory },
  { key: 'customers', label: 'Clientes', icon: Users },
  { key: 'credits', label: 'Creditos', icon: Wallet },
  { key: 'reports', label: 'Reportes', icon: FileText },
  { key: 'settings', label: 'Configuracion', icon: Settings2 },
] as const satisfies ReadonlyArray<{
  key: ModuleKey
  label: string
  icon: React.ComponentType<{ className?: string }>
}>

const initialInventory: InventoryItem[] = [
  { id: 'i1', name: 'Acuario 80L', sku: 'ACU-080', category: 'Peceras', stock: 4, min: 3, location: 'Bodega A', cost: 162000 },
  { id: 'i2', name: 'Filtro Canister 1200', sku: 'FIL-1200', category: 'Filtracion', stock: 7, min: 5, location: 'Bodega B', cost: 89000 },
  { id: 'i3', name: 'Termometro Digital', sku: 'TMP-DIG', category: 'Temperatura', stock: 2, min: 6, location: 'Mostrador', cost: 4500 },
  { id: 'i4', name: 'Betta Halfmoon', sku: 'PZ-BET', category: 'Peces', stock: 3, min: 4, location: 'Area viva', cost: 7000 },
  { id: 'i5', name: 'Alimento Premium', sku: 'ALI-PRM', category: 'Alimento', stock: 15, min: 8, location: 'Bodega C', cost: 8200 },
]

const productionQueue: ProductionItem[] = [
  { id: 'PEC-220', client: 'Carlos Araya', model: 'Pecera 120x50x60', progress: 25, stage: 'Corte' },
  { id: 'PEC-221', client: 'Daniela Vega', model: 'Pecera 90x45x45', progress: 60, stage: 'Pegado' },
  { id: 'PEC-222', client: 'Hotel Esmeralda', model: 'Muro acuatico lobby', progress: 82, stage: 'Acabados' },
  { id: 'PEC-223', client: 'Andrea Coto', model: 'Nano cube 45x45', progress: 10, stage: 'Cotizacion' },
]

interface AdminDashboardProps {
  posCatalog: PosProduct[]
  posCatalogError?: string | null
  sales: PosSaleRecord[]
  salesError?: string | null
  salesSummary: PosSalesSummary
  customers: CustomerContactRecord[]
  customersError?: string | null
}

const initialCustomerForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  notes: '',
}

export function AdminDashboard({
  posCatalog,
  posCatalogError = null,
  sales,
  salesError = null,
  salesSummary,
  customers,
  customersError = null,
}: AdminDashboardProps) {
  const [activeModule, setActiveModule] = useState<ModuleKey>('overview')
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Mixto'>('Efectivo')
  const [cashSessionOpen, setCashSessionOpen] = useState(true)
  const [inventoryItems, setInventoryItems] = useState(initialInventory)
  const [inventorySearch, setInventorySearch] = useState('')
  const [orders, setOrders] = useState(sales)
  const [summary, setSummary] = useState(salesSummary)
  const [customerRecords, setCustomerRecords] = useState(customers)
  const [customerForm, setCustomerForm] = useState(initialCustomerForm)
  const [isPending, startSavingSale] = useTransition()
  const [isSavingCustomer, startSavingCustomer] = useTransition()

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems],
  )
  const total = subtotal - discount

  const filteredInventory = useMemo(() => {
    const term = inventorySearch.toLowerCase()
    return inventoryItems.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.sku.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term),
    )
  }, [inventoryItems, inventorySearch])

  const customerSuggestions = useMemo(
    () => customerRecords.map((customer) => customer.fullName).filter(Boolean),
    [customerRecords],
  )

  function addToCart(product: PosProduct) {
    if (product.stock <= 0) return

    setCartItems((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) return current
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [...current, { ...product, quantity: 1 }]
    })
  }

  function updateCartQuantity(id: string, delta: number) {
    setCartItems((current) =>
      current
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: Math.max(0, Math.min(item.stock, item.quantity + delta)),
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  function handleConfirmSale() {
    if (!cashSessionOpen) {
      toast.error('Debes tener la caja abierta para completar la venta.')
      return
    }

    if (cartItems.length === 0) {
      toast.error('Agrega al menos un producto antes de confirmar la venta.')
      return
    }

    startSavingSale(() => {
      void (async () => {
        try {
          const sale = await createPosSale({
            items: cartItems,
            discount,
            paymentMethod,
          })

          setOrders((current) => [
            {
              id: sale.orderId,
              orderNumber: sale.orderNumber,
              customer: 'Cliente de mostrador',
              channel: 'POS',
              total: sale.total,
              status: 'Confirmado',
              paymentStatus: 'Pagado',
              paymentMethod,
              createdAt: new Date().toISOString(),
              transactionNumber: sale.transactionNumber,
            },
            ...current,
          ])
          setSummary((current) => {
            const transactionsToday = current.transactionsToday + 1
            const totalSalesToday = current.totalSalesToday + sale.total

            return {
              ...current,
              totalSalesToday,
              transactionsToday,
              averageTicketToday: totalSalesToday / transactionsToday,
              posSalesToday: current.posSalesToday + 1,
            }
          })

          setCartItems([])
          setDiscount(0)
          toast.success(`Venta ${sale.transactionNumber} registrada correctamente`)
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'No se pudo registrar la venta')
        }
      })()
    })
  }

  function adjustInventory(id: string, delta: number) {
    setInventoryItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item,
      ),
    )
  }

  function handleCustomerFieldChange(field: keyof typeof initialCustomerForm, value: string) {
    setCustomerForm((current) => ({ ...current, [field]: value }))
  }

  function handleCreateCustomer() {
    startSavingCustomer(() => {
      void (async () => {
        try {
          const customer = await createCustomerContact(customerForm)
          setCustomerRecords((current) => [customer, ...current])
          setCustomerForm(initialCustomerForm)
          toast.success(`Cliente ${customer.fullName} registrado correctamente`)
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'No se pudo registrar el cliente')
        }
      })()
    })
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <div className="mx-auto flex max-w-[1600px] flex-col md:min-h-screen md:flex-row">
        <aside className="border-b bg-background md:w-72 md:border-b-0 md:border-r">
          <div className="px-4 py-5 md:px-5">
            <Badge variant="outline">Administracion</Badge>
            <h1 className="mt-3 text-2xl font-semibold text-foreground">La Casa del Pez</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Panel operativo frontend basado en requerimientos funcionales.
            </p>
          </div>

          <nav className="grid gap-1 px-3 pb-4">
            {modules.map((module) => (
              <button
                key={module.key}
                type="button"
                onClick={() => setActiveModule(module.key)}
                className={[
                  'flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  activeModule === module.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted',
                ].join(' ')}
              >
                <span className="flex items-center gap-3">
                  <module.icon className="h-4 w-4" />
                  {module.label}
                </span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ))}
          </nav>

          <div className="border-t px-4 py-4">
            <Card className="rounded-lg border-none shadow-none">
              <CardContent className="px-0 pb-0 pt-0">
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium text-foreground">Estado de caja</p>
                  <p className="mt-2 text-2xl font-semibold">{cashSessionOpen ? 'Abierta' : 'Cerrada'}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Monto inicial CRC 120.000</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>

        <main className="flex-1">
          <section className="border-b bg-background">
            <div className="flex flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">{getModuleTitle(activeModule)}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{getModuleDescription(activeModule)}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" asChild>
                  <Link href="/tienda">Ver tienda</Link>
                </Button>              
                <Button asChild>
                  <Link href="/auth/login">Acceso</Link>
                </Button>
              </div>
            </div>
          </section>

          <div className="grid gap-6 px-4 py-6 sm:px-6">
            {activeModule === 'overview' && (
              <>
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <OverviewCard
                    title="Ventas hoy"
                    value={formatPrice(summary.totalSalesToday)}
                    icon={Wallet}
                    detail={`${summary.transactionsToday} transacciones pagadas hoy`}
                  />
                  <OverviewCard
                    title="Pendientes"
                    value={String(summary.pendingOrders)}
                    icon={Receipt}
                    detail="Pedidos que requieren seguimiento operativo"
                  />
                  <OverviewCard
                    title="POS hoy"
                    value={String(summary.posSalesToday)}
                    icon={CreditCard}
                    detail="Ventas registradas desde mostrador"
                  />
                  <OverviewCard
                    title="Online hoy"
                    value={String(summary.onlineSalesToday)}
                    icon={Store}
                    detail="Ventas registradas desde e-commerce"
                  />
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                  <Card className="rounded-lg">
                    <CardHeader>
                      <CardTitle>Flujos operativos</CardTitle>
                      <CardDescription>Resumen funcional del sistema administrativo.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <FlowRow
                        icon={CreditCard}
                        title="RF-VEN Punto de venta"
                        description="Abrir caja, armar carrito, aplicar descuento, cobrar y emitir recibo."
                        progress={82}
                      />
                      <FlowRow
                        icon={Boxes}
                        title="RF-INV Inventario"
                        description="Gestionar stock, costos, alertas de minimo y abastecimiento."
                        progress={71}
                      />
                      <FlowRow
                        icon={ShoppingCart}
                        title="RF-ECO Pedidos"
                        description="Monitorear estados, canales y cumplimiento de entregas."
                        progress={76}
                      />
                      <FlowRow
                        icon={Factory}
                        title="RF-PRO Produccion"
                        description="Dar seguimiento a cotizaciones y fabricacion de peceras."
                        progress={58}
                      />
                    </CardContent>
                  </Card>

                  <Card className="rounded-lg">
                    <CardHeader>
                      <CardTitle>Alertas de hoy</CardTitle>
                      <CardDescription>Lo que el administrador deberia revisar primero.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                      <AlertRow title="Caja principal abierta" detail="Cajero: Daniela Vargas · 08:02 a.m." />
                      <AlertRow
                        title={`${summary.pendingOrders} pedidos pendientes`}
                        detail="Revisar pagos, inventario y tiempos de entrega."
                      />
                      <AlertRow
                        title={`${summary.transactionsToday} transacciones confirmadas hoy`}
                        detail="Incluye ventas POS y online con pago registrado."
                      />
                      <AlertRow title="1 pecera lista para entrega" detail="Proyecto PEC-222 en acabados finales." />
                    </CardContent>
                  </Card>
                </section>
              </>
            )}

            {activeModule === 'pos' && (
              <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <Card className="rounded-lg">
                  <CardHeader>
                    <CardTitle>Catalogo rapido POS</CardTitle>
                    <CardDescription>Agregar productos al carrito y simular una venta en mostrador.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                      {posCatalogError && (
                        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                          No se pudo cargar el catálogo POS desde Supabase. Detalle: {posCatalogError}
                        </div>
                      )}
                      {posCatalog.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                          No hay productos activos con inventario disponible para el POS.
                        </div>
                      ) : (
                        posCatalog.map((product) => (
                          <div key={product.id} className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">{product.name}</p>
                                <Badge variant="outline">{product.category}</Badge>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {product.sku} · Stock {product.stock}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="font-semibold">{formatPrice(product.price)}</p>
                              <Button size="sm" onClick={() => addToCart(product)} disabled={product.stock <= 0}>
                                <Plus className="h-4 w-4" />
                                Agregar
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                  </CardContent>
                </Card>

                <Card className="rounded-lg">
                  <CardHeader>
                    <CardTitle>Venta actual</CardTitle>
                    <CardDescription>Carrito, descuentos, caja y formas de pago.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-5">
                    <div className="grid gap-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={cashSessionOpen ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => setCashSessionOpen((current) => !current)}
                        >
                          {cashSessionOpen ? 'Cerrar caja' : 'Abrir caja'}
                        </Button>
                        {(['Efectivo', 'Tarjeta', 'Mixto'] as const).map((method) => (
                          <Button
                            key={method}
                            variant={paymentMethod === method ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPaymentMethod(method)}
                          >
                            {method}
                          </Button>
                        ))}
                      </div>

                      {cartItems.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                          El carrito POS está vacío.
                        </div>
                      ) : (
                        cartItems.map((item) => (
                          <div key={item.id} className="rounded-lg border p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-medium text-foreground">{item.name}</p>
                                <p className="text-sm text-muted-foreground">{formatPrice(item.price)} c/u</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button size="icon-sm" variant="outline" onClick={() => updateCartQuantity(item.id, -1)}>
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                                <Button
                                  size="icon-sm"
                                  variant="outline"
                                  onClick={() => updateCartQuantity(item.id, 1)}
                                  disabled={item.quantity >= item.stock}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-sm text-muted-foreground">Descuento</span>
                        <div className="flex items-center gap-2">
                          <Button size="icon-sm" variant="outline" onClick={() => setDiscount((current) => Math.max(0, current - 5000))}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="min-w-24 text-right text-sm font-medium">{formatPrice(discount)}</span>
                          <Button size="icon-sm" variant="outline" onClick={() => setDiscount((current) => current + 5000)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t pt-4">
                        <span className="font-medium text-foreground">Total</span>
                        <span className="text-xl font-semibold text-foreground">{formatPrice(total)}</span>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Metodo de pago</p>
                        <p className="mt-1 font-semibold">{paymentMethod}</p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Apartado</p>
                        <p className="mt-1 font-semibold">Disponible para anticipo</p>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleConfirmSale}
                      disabled={isPending || cartItems.length === 0 || !cashSessionOpen}
                    >
                      <CreditCard className="h-4 w-4" />
                      {isPending ? 'Guardando venta...' : 'Confirmar venta'}
                    </Button>
                  </CardContent>
                </Card>
              </section>
            )}

            {activeModule === 'inventory' && (
              <section className="grid gap-6">
                <Card className="rounded-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>Control de inventario</CardTitle>
                      <CardDescription>Busqueda, alertas y ajustes rapidos de stock.</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button variant="outline" asChild>
                        <Link href="/inventario/agregar-animal">
                          Agregar Nuevo Animal
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/inventario/modificar-lote">
                          Modificar Lote
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/inventario/consultar-animales">
                          Consultar Inventario
                        </Link>
                      </Button>
                    </div>
                  </div>                  
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="relative w-full max-w-md">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={inventorySearch}
                          onChange={(event) => setInventorySearch(event.target.value)}
                          placeholder="Buscar por nombre, SKU o categoria"
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Articulo</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Ubicacion</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Minimo</TableHead>
                          <TableHead>Costo</TableHead>
                          <TableHead>Ajuste</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInventory.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-xs text-muted-foreground">{item.sku}</div>
                            </TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell>{item.location}</TableCell>
                            <TableCell>
                              <Badge variant={item.stock <= item.min ? 'destructive' : 'secondary'}>
                                {item.stock}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.min}</TableCell>
                            <TableCell>{formatPrice(item.cost)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button size="icon-sm" variant="outline" onClick={() => adjustInventory(item.id, -1)}>
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <Button size="icon-sm" variant="outline" onClick={() => adjustInventory(item.id, 1)}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </section>
            )}

            {activeModule === 'orders' && (
              <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <Card className="rounded-lg">
                  <CardHeader>
                    <CardTitle>Historial de ventas</CardTitle>
                    <CardDescription>Transacciones reales registradas en el sistema por canal y fecha.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {salesError && (
                      <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                        No se pudo cargar el historial de ventas. Detalle: {salesError}
                      </div>
                    )}
                    {orders.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                        Aún no hay ventas registradas para mostrar.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Pedido</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Canal</TableHead>
                            <TableHead>Pago</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Fecha</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell>
                                <div className="font-medium">{order.orderNumber}</div>
                                <div className="text-xs text-muted-foreground">
                                  {order.transactionNumber ? `Tx ${order.transactionNumber}` : 'Sin transacción POS'}
                                </div>
                              </TableCell>
                              <TableCell>{order.customer}</TableCell>
                              <TableCell>{order.channel}</TableCell>
                              <TableCell>{order.paymentMethod}</TableCell>
                              <TableCell>{formatPrice(order.total)}</TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <Badge
                                    variant={
                                      order.status === 'Cancelado'
                                        ? 'destructive'
                                        : order.status === 'Pendiente'
                                          ? 'outline'
                                          : 'default'
                                    }
                                  >
                                    {order.status}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">{order.paymentStatus}</span>
                                </div>
                              </TableCell>
                              <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-lg">
                  <CardHeader>
                    <CardTitle>Analisis rapido</CardTitle>
                    <CardDescription>Resumen inmediato para revisar transacciones y comportamiento del dia.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <AlertRow
                      title={`Ticket promedio hoy: ${formatPrice(summary.averageTicketToday)}`}
                      detail="Promedio calculado sobre las transacciones pagadas del día."
                    />
                    <AlertRow
                      title={`Ventas POS hoy: ${summary.posSalesToday}`}
                      detail="Mide la actividad de mostrador frente al resto de canales."
                    />
                    <AlertRow
                      title={`Ventas online hoy: ${summary.onlineSalesToday}`}
                      detail="Sirve para comparar el aporte del e-commerce en tiempo real."
                    />
                    <AlertRow
                      title={`Pendientes por revisar: ${summary.pendingOrders}`}
                      detail="Pedidos que todavía no están resueltos o entregados."
                    />
                  </CardContent>
                </Card>
              </section>
            )}

            {activeModule === 'production' && (
              <section className="grid gap-6">
                <Card className="rounded-lg">
                  <CardHeader>
                    <CardTitle>Órdenes de producción</CardTitle>
                    <CardDescription>
                      Gestión completa de peceras personalizadas: cotizaciones, fabricación y entregas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">En producción</p>
                        <p className="mt-2 text-2xl font-semibold">—</p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Listas para entrega</p>
                        <p className="mt-2 text-2xl font-semibold">—</p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Cotizaciones abiertas</p>
                        <p className="mt-2 text-2xl font-semibold">—</p>
                      </div>
                    </div>
                    <Button asChild className="w-full sm:w-auto">
                      <Link href="/dashboard/ordenes-produccion">
                        <Factory className="h-4 w-4" />
                        Ver todas las órdenes de producción
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </section>
            )}

            {activeModule === 'customers' && (
              <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <Card className="rounded-lg">
                  <CardHeader>
                    <CardTitle>Clientes</CardTitle>
                    <CardDescription>Base de datos real de clientes registrados desde mostrador o panel interno.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {customersError && (
                      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                        No se pudo cargar la base de clientes. Detalle: {customersError}
                      </div>
                    )}
                    {customerRecords.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                        Aún no hay clientes registrados en la base interna.
                      </div>
                    ) : (
                      customerRecords.map((customer) => (
                        <div key={customer.id} className="rounded-lg border p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-foreground">{customer.fullName}</p>
                            <Badge variant="secondary">Cliente</Badge>
                          </div>
                          <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
                            <p>{customer.email || 'Sin correo registrado'}</p>
                            <p>{customer.phone || 'Sin teléfono registrado'}</p>
                            <p>Creado: {formatDateTime(customer.createdAt)}</p>
                            {customer.notes && <p>Nota: {customer.notes}</p>}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-lg">
                  <CardHeader>
                    <CardTitle>Registrar nuevo cliente</CardTitle>
                    <CardDescription>Captura datos personales y de contacto para futuras ventas y seguimiento.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="customer-first-name">Nombre</Label>
                        <Input
                          id="customer-first-name"
                          value={customerForm.firstName}
                          onChange={(event) => handleCustomerFieldChange('firstName', event.target.value)}
                          placeholder="Adrian"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="customer-last-name">Apellido</Label>
                        <Input
                          id="customer-last-name"
                          value={customerForm.lastName}
                          onChange={(event) => handleCustomerFieldChange('lastName', event.target.value)}
                          placeholder="Avillalobos"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="customer-email">Correo</Label>
                        <Input
                          id="customer-email"
                          type="email"
                          value={customerForm.email}
                          onChange={(event) => handleCustomerFieldChange('email', event.target.value)}
                          placeholder="cliente@ejemplo.com"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="customer-phone">Teléfono</Label>
                        <Input
                          id="customer-phone"
                          value={customerForm.phone}
                          onChange={(event) => handleCustomerFieldChange('phone', event.target.value)}
                          placeholder="8888-8888"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="customer-notes">Notas</Label>
                      <Textarea
                        id="customer-notes"
                        value={customerForm.notes}
                        onChange={(event) => handleCustomerFieldChange('notes', event.target.value)}
                        placeholder="Preferencias, observaciones o contexto comercial..."
                      />
                    </div>
                    {customerSuggestions.length > 0 && (
                      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                        Clientes registrados: {customerSuggestions.slice(0, 4).join(', ')}
                      </div>
                    )}
                    <Button onClick={handleCreateCustomer} disabled={isSavingCustomer}>
                      <Users className="h-4 w-4" />
                      {isSavingCustomer ? 'Guardando cliente...' : 'Guardar ficha de cliente'}
                    </Button>
                    <ActionRow icon={Users} title="Crear ficha de cliente" detail="Registro real desde el panel del vendedor." />
                    <Link href="/credito">
                      <ActionRow
                        icon={Wallet}
                        title="Consultar credito"
                        detail="Buscar cliente y revisar saldo pendiente."
                      />
                    </Link>
                    <ActionRow icon={Store} title="Registrar apartado" detail="Separar producto con anticipo." />
                    <ActionRow icon={Activity} title="Seguimiento" detail="Clientes con cotizacion o recompra." />
                  </CardContent>
                </Card>
              </section>
            )}

            {activeModule === 'credits' && (
              <CreditManagement />
            )}

            {activeModule === 'reports' && (
              <section className="grid gap-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    title="Ventas del día"
                    value={formatPrice(summary.totalSalesToday)}
                    detail={`${summary.transactionsToday} transacciones pagadas`}
                  />
                  <MetricCard
                    title="Ticket promedio"
                    value={formatPrice(summary.averageTicketToday)}
                    detail="Promedio de compra del día"
                  />
                  <MetricCard
                    title="Canal POS"
                    value={String(summary.posSalesToday)}
                    detail="Ventas en mostrador hoy"
                  />
                  <MetricCard
                    title="Canal online"
                    value={String(summary.onlineSalesToday)}
                    detail="Ventas e-commerce hoy"
                  />
                </div>

                <Card className="rounded-lg">
                  <CardHeader>
                    <CardTitle>Indicadores del sistema</CardTitle>
                    <CardDescription>Vista resumida para toma de decisiones administrativas.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    <ReportLine title="Ventas POS vs online" value={`${summary.posSalesToday} / ${summary.onlineSalesToday}`} />
                    <ReportLine title="Pendientes" value={`${summary.pendingOrders} pedidos requieren seguimiento`} />
                    <ReportLine title="Ticket promedio" value={formatPrice(summary.averageTicketToday)} />
                    <ReportLine title="Ventas confirmadas hoy" value={`${summary.transactionsToday} operaciones registradas`} />
                  </CardContent>
                </Card>
              </section>
            )}

            {activeModule === 'settings' && (
              <section className="grid gap-6 lg:grid-cols-2">
                <Card className="rounded-lg">
                  <CardHeader>
                    <CardTitle>Configuracion operativa</CardTitle>
                    <CardDescription>Lo que deberia existir para dejar el sistema listo por sucursal.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <SettingRow title="Formas de pago" detail="Efectivo, tarjeta, SINPE, mixto y credito." />
                    <SettingRow title="Caja y terminales" detail="Montos iniciales, cierres y responsables." />
                    <SettingRow title="Impuestos y descuentos" detail="Reglas para venta directa y e-commerce." />
                    <SettingRow title="Permisos" detail="Administrador, caja, inventario y produccion." />
                  </CardContent>
                </Card>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function getModuleTitle(module: ModuleKey) {
  const titles: Record<ModuleKey, string> = {
    overview: 'Centro de administracion',
    pos: 'Punto de venta',
    inventory: 'Inventario y catalogo',
    orders: 'Pedidos y operacion e-commerce',
    production: 'Produccion de peceras',
    customers: 'Clientes y creditos',
    credits: 'Gestion crediticia',
    reports: 'Reportes y control',
    settings: 'Configuracion del sistema',
  }

  return titles[module]
}

function getModuleDescription(module: ModuleKey) {
  const descriptions: Record<ModuleKey, string> = {
    overview: 'Vista principal del sistema con alertas, prioridades y estado operativo.',
    pos: 'Frontend para caja, carrito del vendedor, descuentos, apartados y pagos.',
    inventory: 'Modulo de control de stock, costos, alertas y ajustes manuales.',
    orders: 'Seguimiento de pedidos por canal, estados y cumplimiento.',
    production: 'Tablero de fabricacion y avances de proyectos personalizados.',
    customers: 'Panel para perfiles, segmentacion, saldos y seguimiento.',
    credits: 'Registro, edicion, eliminacion y consulta de creditos para clientes.',
    reports: 'KPIs y tendencias para decidir rapido.',
    settings: 'Parametros necesarios para convertir esta demo en sistema real.',
  }

  return descriptions[module]
}

function OverviewCard({
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

function MetricCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

function FlowRow({
  icon: Icon,
  title,
  description,
  progress,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  progress: number
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-secondary p-2 text-secondary-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-medium text-foreground">{title}</h3>
            <Badge variant="outline">{progress}%</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          <div className="mt-3">
            <Progress value={progress} />
          </div>
        </div>
      </div>
    </div>
  )
}

function AlertRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  )
}

function ActionRow({
  icon: Icon,
  title,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  detail: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-4">
      <div className="rounded-lg bg-muted p-2 text-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </div>
    </div>
  )
}

function ReportLine({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 font-medium text-foreground">{value}</p>
    </div>
  )
}

function SettingRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  )
}

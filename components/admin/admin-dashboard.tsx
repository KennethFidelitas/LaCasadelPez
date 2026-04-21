'use client'

import { useMemo, useState } from 'react'
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
  Package,
  Plus,
  Receipt,
  Search,
  Settings2,
  ShoppingCart,
  Store,
  Users,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/actions/button'
import { Badge } from '@/components/ui/display/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/display/card'
import { Progress } from '@/components/ui/display/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/display/table'
import { Input } from '@/components/ui/forms/input'
import { formatPrice } from '@/lib/format'

type ModuleKey =
  | 'overview'
  | 'pos'
  | 'inventory'
  | 'orders'
  | 'production'
  | 'customers'
  | 'reports'
  | 'settings'

type PosProduct = {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  category: string
}

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

type OrderItem = {
  id: string
  customer: string
  channel: 'Online' | 'POS' | 'Telefono'
  total: number
  status: 'Pendiente' | 'Confirmado' | 'Preparacion' | 'Entregado'
}

type ProductionItem = {
  id: string
  client: string
  model: string
  progress: number
  stage: 'Cotizacion' | 'Corte' | 'Pegado' | 'Acabados' | 'Entrega'
}

type CustomerItem = {
  id: string
  name: string
  segment: string
  purchases: number
  balance: number
  status: 'Activo' | 'Seguimiento' | 'Credito'
}

const modules = [
  { key: 'overview', label: 'Resumen', icon: LayoutDashboard },
  { key: 'pos', label: 'Punto de venta', icon: CreditCard },
  { key: 'inventory', label: 'Inventario', icon: Boxes },
  { key: 'orders', label: 'Pedidos', icon: ShoppingCart },
  { key: 'production', label: 'Produccion', icon: Factory },
  { key: 'customers', label: 'Clientes', icon: Users },
  { key: 'reports', label: 'Reportes', icon: FileText },
  { key: 'settings', label: 'Configuracion', icon: Settings2 },
] as const satisfies ReadonlyArray<{
  key: ModuleKey
  label: string
  icon: React.ComponentType<{ className?: string }>
}>

const posCatalog: PosProduct[] = [
  { id: 'p1', name: 'Acuario 80L', sku: 'ACU-080', price: 249000, stock: 4, category: 'Peceras' },
  { id: 'p2', name: 'Filtro Canister 1200', sku: 'FIL-1200', price: 119000, stock: 7, category: 'Filtracion' },
  { id: 'p3', name: 'Calentador 200W', sku: 'CAL-200', price: 26900, stock: 11, category: 'Temperatura' },
  { id: 'p4', name: 'Sustrato Volcanico', sku: 'SUS-VOL', price: 18900, stock: 14, category: 'Decoracion' },
  { id: 'p5', name: 'Guppy Cobra', sku: 'PZ-GUP', price: 4500, stock: 23, category: 'Peces' },
]

const initialInventory: InventoryItem[] = [
  { id: 'i1', name: 'Acuario 80L', sku: 'ACU-080', category: 'Peceras', stock: 4, min: 3, location: 'Bodega A', cost: 162000 },
  { id: 'i2', name: 'Filtro Canister 1200', sku: 'FIL-1200', category: 'Filtracion', stock: 7, min: 5, location: 'Bodega B', cost: 89000 },
  { id: 'i3', name: 'Termometro Digital', sku: 'TMP-DIG', category: 'Temperatura', stock: 2, min: 6, location: 'Mostrador', cost: 4500 },
  { id: 'i4', name: 'Betta Halfmoon', sku: 'PZ-BET', category: 'Peces', stock: 3, min: 4, location: 'Area viva', cost: 7000 },
  { id: 'i5', name: 'Alimento Premium', sku: 'ALI-PRM', category: 'Alimento', stock: 15, min: 8, location: 'Bodega C', cost: 8200 },
]

const initialOrders: OrderItem[] = [
  { id: 'ORD-1042', customer: 'Valeria Mora', channel: 'Online', total: 184500, status: 'Pendiente' },
  { id: 'ORD-1041', customer: 'Luis Chacon', channel: 'POS', total: 42900, status: 'Confirmado' },
  { id: 'ORD-1039', customer: 'Marcos Solis', channel: 'Telefono', total: 298000, status: 'Preparacion' },
  { id: 'ORD-1037', customer: 'Natalia Campos', channel: 'Online', total: 62500, status: 'Entregado' },
]

const productionQueue: ProductionItem[] = [
  { id: 'PEC-220', client: 'Carlos Araya', model: 'Pecera 120x50x60', progress: 25, stage: 'Corte' },
  { id: 'PEC-221', client: 'Daniela Vega', model: 'Pecera 90x45x45', progress: 60, stage: 'Pegado' },
  { id: 'PEC-222', client: 'Hotel Esmeralda', model: 'Muro acuatico lobby', progress: 82, stage: 'Acabados' },
  { id: 'PEC-223', client: 'Andrea Coto', model: 'Nano cube 45x45', progress: 10, stage: 'Cotizacion' },
]

const customers: CustomerItem[] = [
  { id: 'c1', name: 'Valeria Mora', segment: 'Frecuente', purchases: 12, balance: 0, status: 'Activo' },
  { id: 'c2', name: 'Luis Chacon', segment: 'POS', purchases: 4, balance: 0, status: 'Activo' },
  { id: 'c3', name: 'Carlos Araya', segment: 'Proyecto', purchases: 2, balance: 85000, status: 'Credito' },
  { id: 'c4', name: 'Andrea Coto', segment: 'Seguimiento', purchases: 1, balance: 0, status: 'Seguimiento' },
]

const reportCards = [
  { title: 'Ventas del dia', value: 'CRC 1.294.300', progress: 74 },
  { title: 'Meta semanal', value: 'CRC 4.980.000', progress: 61 },
  { title: 'Inventario saludable', value: '78%', progress: 78 },
  { title: 'Pedidos entregados', value: '34 / 41', progress: 83 },
]

export function AdminDashboard() {
  const [activeModule, setActiveModule] = useState<ModuleKey>('overview')
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { ...posCatalog[0], quantity: 1 },
    { ...posCatalog[4], quantity: 3 },
  ])
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Mixto'>('Efectivo')
  const [cashSessionOpen, setCashSessionOpen] = useState(true)
  const [inventoryItems, setInventoryItems] = useState(initialInventory)
  const [inventorySearch, setInventorySearch] = useState('')
  const [orders, setOrders] = useState(initialOrders)

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

  function addToCart(product: PosProduct) {
    setCartItems((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
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
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  function adjustInventory(id: string, delta: number) {
    setInventoryItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item,
      ),
    )
  }

  function advanceOrder(id: string) {
    const flow: OrderItem['status'][] = ['Pendiente', 'Confirmado', 'Preparacion', 'Entregado']
    setOrders((current) =>
      current.map((order) => {
        if (order.id !== id) return order
        const nextIndex = Math.min(flow.indexOf(order.status) + 1, flow.length - 1)
        return { ...order, status: flow[nextIndex] }
      }),
    )
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
                  <Link href="/auth/login">Acceso demo</Link>
                </Button>
              </div>
            </div>
          </section>

          <div className="grid gap-6 px-4 py-6 sm:px-6">
            {activeModule === 'overview' && (
              <>
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <OverviewCard title="Ventas hoy" value="CRC 1.294.300" icon={Wallet} detail="13 transacciones registradas" />
                  <OverviewCard title="Pedidos activos" value="12" icon={Receipt} detail="Online, POS y telefono" />
                  <OverviewCard title="Stock critico" value="5" icon={Bell} detail="Productos por debajo del minimo" />
                  <OverviewCard title="Produccion" value="4" icon={Factory} detail="Peceras en proceso" />
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
                      <AlertRow title="2 apartados vencen mañana" detail="Requieren contacto con el cliente." />
                      <AlertRow title="5 articulos con stock critico" detail="Prioridad alta en mostrador y peces." />
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
                    {posCatalog.map((product) => (
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
                          <Button size="sm" onClick={() => addToCart(product)}>
                            <Plus className="h-4 w-4" />
                            Agregar
                          </Button>
                        </div>
                      </div>
                    ))}
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

                      {cartItems.map((item) => (
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
                              <Button size="icon-sm" variant="outline" onClick={() => updateCartQuantity(item.id, 1)}>
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
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

                    <Button className="w-full">
                      <CreditCard className="h-4 w-4" />
                      Confirmar venta demo
                    </Button>
                  </CardContent>
                </Card>
              </section>
            )}

            {activeModule === 'inventory' && (
              <section className="grid gap-6">
                <Card className="rounded-lg">
                  <CardHeader>
                    <CardTitle>Control de inventario</CardTitle>
                    <CardDescription>Busqueda, alertas y ajustes rapidos de stock.</CardDescription>
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
                    <CardTitle>Bandeja de pedidos</CardTitle>
                    <CardDescription>Seguimiento de pedidos del sistema y actualizacion de estados.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pedido</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Canal</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Accion</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.id}</TableCell>
                            <TableCell>{order.customer}</TableCell>
                            <TableCell>{order.channel}</TableCell>
                            <TableCell>{formatPrice(order.total)}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  order.status === 'Entregado'
                                    ? 'secondary'
                                    : order.status === 'Pendiente'
                                      ? 'destructive'
                                      : 'default'
                                }
                              >
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline" onClick={() => advanceOrder(order.id)}>
                                Avanzar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="rounded-lg">
                  <CardHeader>
                    <CardTitle>Vista operacional</CardTitle>
                    <CardDescription>Lo que la administracion ve para priorizar despacho.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <AlertRow title="2 pedidos pendientes" detail="Revisar pago y confirmar inventario." />
                    <AlertRow title="1 pedido por telefono" detail="Requiere validacion manual y recibo." />
                    <AlertRow title="3 pedidos en preparacion" detail="Filtracion, termometros y peces vivos." />
                    <AlertRow title="Pedidos entregados" detail="Listos para historico y reporte del dia." />
                  </CardContent>
                </Card>
              </section>
            )}

            {activeModule === 'production' && (
              <section className="grid gap-6 xl:grid-cols-4">
                {(['Cotizacion', 'Corte', 'Pegado', 'Acabados'] as const).map((stage) => (
                  <Card key={stage} className="rounded-lg">
                    <CardHeader>
                      <CardTitle>{stage}</CardTitle>
                      <CardDescription>
                        {productionQueue.filter((item) => item.stage === stage).length} trabajos en esta fase.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                      {productionQueue
                        .filter((item) => item.stage === stage)
                        .map((item) => (
                          <div key={item.id} className="rounded-lg border p-3">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{item.id}</p>
                              <Badge variant="outline">{item.progress}%</Badge>
                            </div>
                            <p className="mt-2 text-sm text-foreground">{item.model}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{item.client}</p>
                            <div className="mt-3">
                              <Progress value={item.progress} />
                            </div>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                ))}
              </section>
            )}

            {activeModule === 'customers' && (
              <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <Card className="rounded-lg">
                  <CardHeader>
                    <CardTitle>Clientes</CardTitle>
                    <CardDescription>Segmentacion, compras y creditos para seguimiento comercial.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {customers.map((customer) => (
                      <div key={customer.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{customer.name}</p>
                            <Badge variant="outline">{customer.segment}</Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {customer.purchases} compras · saldo {formatPrice(customer.balance)}
                          </p>
                        </div>
                        <Badge
                          variant={
                            customer.status === 'Activo'
                              ? 'secondary'
                              : customer.status === 'Credito'
                                ? 'default'
                                : 'outline'
                          }
                        >
                          {customer.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="rounded-lg">
                  <CardHeader>
                    <CardTitle>Acciones comerciales</CardTitle>
                    <CardDescription>Frontend para fidelizacion, creditos y apartados.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <ActionRow icon={Users} title="Crear ficha de cliente" detail="Registro rapido desde tienda o POS." />
                    <ActionRow icon={Wallet} title="Aplicar credito" detail="Usar saldo a favor o nota interna." />
                    <ActionRow icon={Store} title="Registrar apartado" detail="Separar producto con anticipo." />
                    <ActionRow icon={Activity} title="Seguimiento" detail="Clientes con cotizacion o recompra." />
                  </CardContent>
                </Card>
              </section>
            )}

            {activeModule === 'reports' && (
              <section className="grid gap-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {reportCards.map((card) => (
                    <Card key={card.title} className="rounded-lg">
                      <CardHeader>
                        <CardDescription>{card.title}</CardDescription>
                        <CardTitle className="text-2xl">{card.value}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Progress value={card.progress} />
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="rounded-lg">
                  <CardHeader>
                    <CardTitle>Indicadores del sistema</CardTitle>
                    <CardDescription>Vista resumida para toma de decisiones administrativas.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    <ReportLine title="Ventas POS vs online" value="58% / 42%" />
                    <ReportLine title="Metodos de pago" value="Efectivo 39%, Tarjeta 44%, Mixto 17%" />
                    <ReportLine title="Rotacion de inventario" value="Filtracion y peces vivos lideran el mes" />
                    <ReportLine title="Cierres de caja" value="Sin diferencias mayores en los ultimos 5 dias" />
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

                <Card className="rounded-lg">
                  <CardHeader>
                    <CardTitle>Roadmap frontend</CardTitle>
                    <CardDescription>Subpantallas que seguirian despues de este dashboard.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <SettingRow title="/dashboard/ventas" detail="POS completo con cierre de caja y apartados." />
                    <SettingRow title="/dashboard/inventario" detail="CRUD y movimientos por bodega." />
                    <SettingRow title="/dashboard/pedidos" detail="Seguimiento y linea de tiempo." />
                    <SettingRow title="/dashboard/clientes" detail="Perfil, creditos y recompra." />
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

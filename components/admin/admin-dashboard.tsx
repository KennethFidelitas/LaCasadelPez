'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Activity,
  Bell,
  Boxes,
  CalendarClock,
  CheckCircle,
  ChevronRight,
  CreditCard,
  Factory,
  FileText,
  LayoutDashboard,
  Minus,
  Pencil,
  Plus,
  Printer,
  Receipt,
  Repeat,
  Search,
  Settings2,
  ShoppingCart,
  Store,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { CreditManagement } from '@/components/admin/credit-management'
import { GestionApartados } from '@/components/admin/GestionApartados'
import { PaymentProofValidator } from '@/components/admin/PaymentProofValidator'
import { Button } from '@/components/ui/actions/button'
import { Badge } from '@/components/ui/display/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/display/card'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/overlays/dialog'
import { Progress } from '@/components/ui/display/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/display/table'
import { Input } from '@/components/ui/forms/input'
import { Label } from '@/components/ui/forms/label'
import { Textarea } from '@/components/ui/forms/textarea'
import { createCustomerContact } from '@/lib/customers/actions'
import type { CustomerContactRecord } from '@/lib/customers/types'
import { crearApartado } from '@/lib/apartados/actions'
import { DashboardAlertConfig } from '@/components/admin/DashboardAlertConfig'
import {
  type AlertConfig,
  type AlertKey,
  loadAlertConfig,
} from '@/lib/dashboard-alerts-config'
import { formatDateTime, formatPrice } from '@/lib/format'
import { createPosSale } from '@/lib/pos/actions'
import type { PosCatalogProduct, PosReturnRequest, PosSaleRecord, PosSalesSummary, PosTopProduct } from '@/lib/pos/types'

type ModuleKey =
  | 'overview'
  | 'pos'
  | 'apartados'
  | 'inventory'
  | 'orders'
  | 'production'
  | 'customers'
  | 'credits'
  | 'reports'
  | 'returns'
  | 'settings'

type PosProduct = PosCatalogProduct

type EmailTemplate = {
  id: string
  name: string
  trigger: string
  subject: string
  body: string
  active: boolean
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
  { key: 'apartados', label: 'Apartados', icon: CalendarClock },
  { key: 'inventory', label: 'Inventario', icon: Boxes },
  { key: 'orders', label: 'Pedidos', icon: ShoppingCart },
  { key: 'production', label: 'Produccion', icon: Factory },
  { key: 'customers', label: 'Clientes', icon: Users },
  { key: 'credits', label: 'Creditos', icon: Wallet },
  { key: 'reports', label: 'Reportes', icon: FileText },
  { key: 'returns', label: 'Devoluciones', icon: Repeat },
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
  adminUserId: string
  posCatalog: PosProduct[]
  posCatalogError?: string | null
  sales: PosSaleRecord[]
  salesError?: string | null
  salesSummary: PosSalesSummary
  topProducts: PosTopProduct[]
  returnRequests: PosReturnRequest[]
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

const initialEmailTemplates: EmailTemplate[] = [
  {
    id: 'email-1',
    name: 'Confirmación de compra',
    trigger: 'venta_confirmada',
    subject: 'Gracias por tu compra en La Casa del Pez',
    body: 'Hola {{cliente}}, gracias por tu compra. Tu factura {{factura}} por {{total}} ha sido registrada correctamente.',
    active: true,
  },
  {
    id: 'email-2',
    name: 'Pedido listo',
    trigger: 'pedido_listo',
    subject: 'Tu pedido está listo para retirar',
    body: 'Hola {{cliente}}, tu pedido {{pedido}} ya está listo para retirar en nuestra tienda.',
    active: true,
  },
]

export function AdminDashboard({
  adminUserId,
  posCatalog,
  posCatalogError = null,
  sales,
  salesError = null,
  salesSummary,
  topProducts = [],
  returnRequests = [],
  customers,
  customersError = null,
}: AdminDashboardProps) {
  const [activeModule, setActiveModule] = useState<ModuleKey>('overview')
  const [activeOrdersTab, setActiveOrdersTab] = useState<'comprobantes' | 'historial'>('comprobantes')
  const [alertConfigs, setAlertConfigs] = useState<AlertConfig[]>(() => {
    if (typeof window === 'undefined') return []
    return loadAlertConfig()
  })

  function isAlertEnabled(key: AlertKey): boolean {
    const cfg = alertConfigs.find(c => c.key === key)
    return cfg ? cfg.enabled : true
  }
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('modulo')
    if (param && modules.some((m) => m.key === param)) {
      setActiveModule(param as ModuleKey)
    }
  }, [])

  useEffect(() => {
    type AnimalRow = {
      id: string
      name: string
      sku: string
      cost: number | null
      care_level: string | null
      inventory: { quantity: number; location: string | null; low_stock_threshold: number }[] | null
    }

    async function cargarInventario() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('animals')
          .select('id, name, sku, cost, care_level, inventory(quantity, location, low_stock_threshold)')
          .eq('is_active', true)
          .order('name', { ascending: true })

        if (error) throw error

        const items: InventoryItem[] = ((data ?? []) as AnimalRow[]).map((a) => ({
          id: a.id,
          name: a.name,
          sku: a.sku,
          category: a.care_level ?? '—',
          stock: a.inventory?.[0]?.quantity ?? 0,
          min: a.inventory?.[0]?.low_stock_threshold ?? 5,
          location: a.inventory?.[0]?.location ?? '—',
          cost: a.cost ?? 0,
        }))

        setInventoryItems(items)
      } catch (err) {
        console.error('Error al cargar inventario:', err)
        setInventoryItems(initialInventory)
      } finally {
        setInventarioLoading(false)
      }
    }

    cargarInventario()
  }, [])
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<
  'efectivo' | 'tarjeta' | 'credito' | 'mixto'
>('efectivo')
  const [cashReceived, setCashReceived] = useState(0)
  const [cardAmount, setCardAmount] = useState(0)
  const [creditAmount, setCreditAmount] = useState(0)
  const [cashSessionOpen, setCashSessionOpen] = useState(true)
  const [openingCash, setOpeningCash] = useState(120000)
  const [closingCash, setClosingCash] = useState(0)
  const [cashNotes, setCashNotes] = useState("")
  const [apartarDialogOpen, setApartarDialogOpen] = useState(false)
  const [apartarCustomerName, setApartarCustomerName] = useState('')
  const [apartarCustomerPhone, setApartarCustomerPhone] = useState('')
  const [apartarCustomerEmail, setApartarCustomerEmail] = useState('')
  const [apartarDeposit, setApartarDeposit] = useState(0)
  const [apartarDays, setApartarDays] = useState(7)
  const [apartarError, setApartarError] = useState<string | null>(null)
  const [isApartando, startApartando] = useTransition()
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [inventarioLoading, setInventarioLoading] = useState(true)
  const [inventorySearch, setInventorySearch] = useState('')
  const [orders, setOrders] = useState(sales)
  const [summary, setSummary] = useState(salesSummary)
  const [topSellingProducts, setTopSellingProducts] = useState<PosTopProduct[]>(topProducts ?? [])
  const [returnRequestsList, setReturnRequestsList] = useState<PosReturnRequest[]>(returnRequests ?? [])
  const [customerRecords, setCustomerRecords] = useState(customers)
  const [customerForm, setCustomerForm] = useState(initialCustomerForm)
  const [isPending, startSavingSale] = useTransition()
  const [isSavingCustomer, startSavingCustomer] = useTransition()
  const [emailTemplates, setEmailTemplates] = useState(initialEmailTemplates)
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialEmailTemplates[0].id)

  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateTrigger, setNewTemplateTrigger] = useState('venta_confirmada')
  const [newTemplateSubject, setNewTemplateSubject] = useState('')
  const [newTemplateBody, setNewTemplateBody] = useState('')

  const [testEmail, setTestEmail] = useState('')
  const [emailPreview, setEmailPreview] = useState('')

  const selectedTemplate = emailTemplates.find(
    (template) => template.id === selectedTemplateId,
  )

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems],
  )
  const total = subtotal - discount

  const cashSalesAmount =
    paymentMethod === 'efectivo'
      ? total
      : paymentMethod === 'mixto'
        ? cashReceived
        : 0

  const expectedCash = openingCash + cashSalesAmount

  const cashDifference = closingCash > 0 ? closingCash - expectedCash : 0

  const cashChange =
    paymentMethod === 'efectivo' || paymentMethod === 'mixto'
      ? Math.max(0, cashReceived - total)
      : 0

  const getPaymentMethodLabel = (method: string) => {
    if (method === 'efectivo') return 'Efectivo'
    if (method === 'tarjeta') return 'Tarjeta'
    if (method === 'credito') return 'Crédito'
    if (method === 'mixto') return 'Mixto'
    return method
  }  

  const handleOpenCashSession = () => {
    setCashSessionOpen(true)
    setClosingCash(0)
    setCashNotes("")
  }

  const handleCloseCashSession = () => {
    setCashSessionOpen(false)
  }  
  const filteredInventory = useMemo(() => {
    const term = inventorySearch.toLowerCase()
    return inventoryItems.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.sku.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term),
    )
  }, [inventoryItems, inventorySearch])

  const salesTimeline = useMemo(() => {
    const grouped: Record<string, number> = {}

    sales.forEach((sale) => {
      const date = new Date(sale.createdAt).toLocaleDateString('es-CR', {
        day: '2-digit',
        month: '2-digit',
      })
      grouped[date] = (grouped[date] ?? 0) + sale.total
    })

    return Object.entries(grouped)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([date, total]) => ({ date, total }))
  }, [sales])

  const salesByChannel = useMemo(() => {
    const grouped: Record<string, number> = {}

    sales.forEach((sale) => {
      grouped[sale.channel] = (grouped[sale.channel] ?? 0) + sale.total
    })

    return Object.entries(grouped).map(([channel, total]) => ({ channel, total }))
  }, [sales])

  const customerSuggestions = useMemo(
    () => customerRecords.map((customer) => customer.fullName).filter(Boolean),
    [customerRecords],
  )

  const returnSummary = useMemo(() => {
    const pending = returnRequestsList.filter((request) => request.requestStatus === 'Pendiente').length
    const approved = returnRequestsList.filter((request) => request.requestStatus === 'Aprobada').length
    const rejected = returnRequestsList.filter((request) => request.requestStatus === 'Rechazada').length
    const totalRefund = returnRequestsList.reduce((sum, request) => sum + request.refundAmount, 0)

    return { pending, approved, rejected, totalRefund }
  }, [returnRequestsList])

  function updateReturnRequestStatus(id: string, status: 'Aprobada' | 'Rechazada') {
    setReturnRequestsList((current) =>
      current.map((request) =>
        request.id === id ? { ...request, requestStatus: status } : request,
      ),
    )
  }

  function addToCart(product: PosProduct) {
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

  function handleApartarCart() {
    setApartarError(null)

    if (cartItems.length !== 1) {
      setApartarError('Apartar solo admite un producto por apartado. Vendé o apartá los demás por separado.')
      return
    }
    if (!apartarCustomerName.trim() || !apartarCustomerPhone.trim()) {
      setApartarError('Nombre y teléfono del cliente son obligatorios.')
      return
    }
    if (apartarDeposit <= 0 || apartarDeposit > subtotal) {
      setApartarError('El anticipo debe ser mayor a cero y no puede superar el total.')
      return
    }

    const [item] = cartItems

    startApartando(() => {
      void (async () => {
        try {
          await crearApartado({
            customer_name: apartarCustomerName.trim(),
            customer_phone: apartarCustomerPhone.trim(),
            customer_email: apartarCustomerEmail.trim() || undefined,
            item_type: 'product',
            product_id: item.id,
            quantity: item.quantity,
            total_price: subtotal,
            deposit_amount: apartarDeposit,
            expires_days: apartarDays,
            created_by: adminUserId,
          })

          setCartItems([])
          setApartarDialogOpen(false)
          setApartarCustomerName('')
          setApartarCustomerPhone('')
          setApartarCustomerEmail('')
          setApartarDeposit(0)
          setApartarDays(7)
          toast.success('Apartado creado correctamente')
        } catch (error) {
          setApartarError(error instanceof Error ? error.message : 'No se pudo crear el apartado')
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

function updateEmailTemplate(
  field: keyof EmailTemplate,
  value: string | boolean,
) {
  setEmailTemplates((current) =>
    current.map((template) =>
      template.id === selectedTemplateId
        ? {
            ...template,
            [field]: value,
          }
        : template,
    ),
  )
}

function createEmailTemplate() {
  if (!newTemplateName.trim() || !newTemplateSubject.trim() || !newTemplateBody.trim()) {
    alert('Complete nombre, asunto y mensaje de la plantilla.')
    return
  }

  const newTemplate: EmailTemplate = {
    id: `email-${Date.now()}`,
    name: newTemplateName,
    trigger: newTemplateTrigger,
    subject: newTemplateSubject,
    body: newTemplateBody,
    active: true,
  }

  setEmailTemplates((current) => [...current, newTemplate])
  setSelectedTemplateId(newTemplate.id)

  setNewTemplateName('')
  setNewTemplateTrigger('venta_confirmada')
  setNewTemplateSubject('')
  setNewTemplateBody('')
}

function renderTemplate(templateText: string) {
  return templateText
    .replaceAll('{{cliente}}', 'María Rodríguez')
    .replaceAll('{{factura}}', 'FAC-0002')
    .replaceAll('{{total}}', formatPrice(40000))
    .replaceAll('{{pedido}}', 'ORD-1042')
    .replaceAll('{{saldo}}', formatPrice(85000))
}

function previewSelectedTemplate() {
  if (!selectedTemplate) return

  const preview = `
Asunto: ${renderTemplate(selectedTemplate.subject)}

${renderTemplate(selectedTemplate.body)}
  `.trim()

  setEmailPreview(preview)
}

async function sendTestEmail() {
  if (!selectedTemplate) return

  if (!testEmail.trim()) {
    alert('Digite un correo de prueba.')
    return
  }

  const subject = renderTemplate(selectedTemplate.subject)
  const body = renderTemplate(selectedTemplate.body)

  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: testEmail,
      subject,
      body,
    }),
  })

  if (!response.ok) {
    alert('No se pudo enviar el correo.')
    return
  }

  alert('Correo enviado correctamente.')
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
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle>Alertas de hoy</CardTitle>
                          <CardDescription>Lo que el administrador deberia revisar primero.</CardDescription>
                        </div>
                        <DashboardAlertConfig onConfigChange={setAlertConfigs} />
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                      {isAlertEnabled('caja_abierta') && (
                        <AlertRow title="Caja principal abierta" detail="Cajero: Daniela Vargas · 08:02 a.m." />
                      )}
                      {isAlertEnabled('pedidos_pendientes') && (
                        <AlertRow
                          title={`${summary.pendingOrders} pedidos pendientes`}
                          detail="Revisar pagos, inventario y tiempos de entrega."
                        />
                      )}
                      {isAlertEnabled('transacciones_hoy') && (
                        <AlertRow
                          title={`${summary.transactionsToday} transacciones confirmadas hoy`}
                          detail="Incluye ventas POS y online con pago registrado."
                        />
                      )}
                      {isAlertEnabled('produccion_lista') && (
                        <AlertRow title="1 pecera lista para entrega" detail="Proyecto PEC-222 en acabados finales." />
                      )}
                      {isAlertEnabled('stock_minimo') && (
                        <AlertRow title="Stock bajo mínimo detectado" detail="Revisar inventario de animales y productos." />
                      )}
                      {isAlertEnabled('apartados_vencen') && (
                        <AlertRow title="Apartados próximos a vencer" detail="Revisar el módulo de apartados para contactar clientes." />
                      )}
                      {isAlertEnabled('mortalidad_reciente') && (
                        <AlertRow title="Mortalidad reciente registrada" detail="Revisar el módulo de mortalidad para detalles." />
                      )}
                      {alertConfigs.length > 0 && alertConfigs.every(c => !c.enabled) && (
                        <p className="text-sm text-muted-foreground py-2">
                          Todas las alertas están desactivadas. Configurá cuáles querés ver.
                        </p>
                      )}
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
                      <Button variant="outline" asChild>
                        <Link href="/ventas/imprimir-venta">
                          Imprimir Factura
                      </Link>
                      </Button>
                      <Button
                        variant={cashSessionOpen ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => {
                          if (cashSessionOpen) {
                            handleCloseCashSession()
                          } else {
                            handleOpenCashSession()
                          }
                        }}
                      >
                        {cashSessionOpen ? 'Cerrar caja' : 'Abrir caja'}
                      </Button>
                        {[
                          { value: 'efectivo', label: 'Efectivo' },
                          { value: 'tarjeta', label: 'Tarjeta' },
                          { value: 'credito', label: 'Crédito' },
                          { value: 'mixto', label: 'Mixto' },
                        ].map((method) => (
                          <Button
                            key={method.value}
                            variant={paymentMethod === method.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setPaymentMethod(
                                method.value as 'efectivo' | 'tarjeta' | 'credito' | 'mixto'
                              )
                              setCashReceived(0)
                              setCardAmount(0)
                              setCreditAmount(0)
                            }}
                          >
                            {method.label}
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
                        <p className="text-sm text-muted-foreground">Método de pago</p>
                        <p className="mt-1 font-semibold">
                          {getPaymentMethodLabel(paymentMethod)}
                        </p>
                      </div>

                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Apartado</p>
                        <Dialog
                          open={apartarDialogOpen}
                          onOpenChange={(open) => { setApartarDialogOpen(open); if (!open) setApartarError(null) }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-1"
                              disabled={cartItems.length === 0}
                            >
                              Apartar con anticipo
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Apartar producto</DialogTitle>
                              <DialogDescription>
                                {cartItems.length === 1
                                  ? `${cartItems[0].name} · Total ${formatPrice(subtotal)}`
                                  : 'Apartar solo admite un producto por apartado.'}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-2">
                              <div className="grid gap-2">
                                <label className="text-sm font-medium text-foreground">Nombre del cliente *</label>
                                <Input
                                  value={apartarCustomerName}
                                  onChange={(event) => setApartarCustomerName(event.target.value)}
                                  placeholder="Nombre completo"
                                />
                              </div>
                              <div className="grid gap-2">
                                <label className="text-sm font-medium text-foreground">Teléfono *</label>
                                <Input
                                  value={apartarCustomerPhone}
                                  onChange={(event) => setApartarCustomerPhone(event.target.value)}
                                  placeholder="Ej: 8888-8888"
                                />
                              </div>
                              <div className="grid gap-2">
                                <label className="text-sm font-medium text-foreground">Correo (opcional)</label>
                                <Input
                                  type="email"
                                  value={apartarCustomerEmail}
                                  onChange={(event) => setApartarCustomerEmail(event.target.value)}
                                  placeholder="cliente@correo.com"
                                />
                              </div>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                  <label className="text-sm font-medium text-foreground">Anticipo *</label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={apartarDeposit}
                                    onChange={(event) => setApartarDeposit(Number(event.target.value))}
                                    placeholder="0.00"
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <label className="text-sm font-medium text-foreground">Días de vigencia</label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={apartarDays}
                                    onChange={(event) => setApartarDays(Number(event.target.value))}
                                  />
                                </div>
                              </div>
                              {apartarError && (
                                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                                  {apartarError}
                                </div>
                              )}
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setApartarDialogOpen(false)} disabled={isApartando}>
                                Cancelar
                              </Button>
                              <Button onClick={handleApartarCart} disabled={isApartando}>
                                {isApartando ? 'Guardando...' : 'Confirmar apartado'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    <div className="rounded-lg border p-4">
                      <p className="font-medium text-foreground">Detalle del pago</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Registra el monto según la forma de pago seleccionada.
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {(paymentMethod === 'efectivo' || paymentMethod === 'mixto') && (
                          <>
                            <div>
                              <label className="text-sm text-muted-foreground">
                                Efectivo recibido
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={cashReceived}
                                onChange={(event) => setCashReceived(Number(event.target.value))}
                                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                                placeholder="Ej: 30000"
                              />
                            </div>

                            <div>
                              <p className="text-sm text-muted-foreground">Cambio</p>
                              <p className="mt-2 font-semibold">
                                {formatPrice(cashChange)}
                              </p>
                            </div>
                          </>
                        )}

                        {(paymentMethod === 'tarjeta' || paymentMethod === 'mixto') && (
                          <div>
                            <label className="text-sm text-muted-foreground">
                              Monto tarjeta
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={cardAmount}
                              onChange={(event) => setCardAmount(Number(event.target.value))}
                              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                              placeholder="Ej: 24000"
                            />
                          </div>
                        )}

                        {paymentMethod === 'credito' && (
                          <div>
                            <label className="text-sm text-muted-foreground">
                              Monto crédito
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={creditAmount}
                              onChange={(event) => setCreditAmount(Number(event.target.value))}
                              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                              placeholder="Ej: 25000"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">Gestión de caja</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Controla apertura, efectivo esperado y cierre de caja.
                          </p>
                        </div>

                        <Badge variant={cashSessionOpen ? 'secondary' : 'outline'}>
                          {cashSessionOpen ? 'Caja abierta' : 'Caja cerrada'}
                        </Badge>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-sm text-muted-foreground">
                            Monto inicial
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={openingCash}
                            disabled={cashSessionOpen}
                            onChange={(event) => setOpeningCash(Number(event.target.value))}
                            className="mt-1 w-full rounded-md border px-3 py-2 text-sm disabled:bg-muted"
                            placeholder="Ej: 120000"
                          />
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">Ventas en efectivo</p>
                          <p className="mt-2 font-semibold">
                            {formatPrice(cashSalesAmount)}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">Efectivo esperado</p>
                          <p className="mt-2 font-semibold">
                            {formatPrice(expectedCash)}
                          </p>
                        </div>

                        <div>
                          <label className="text-sm text-muted-foreground">
                            Efectivo contado al cierre
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={closingCash}
                            onChange={(event) => setClosingCash(Number(event.target.value))}
                            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                            placeholder="Ej: 125000"
                          />
                        </div>
                      </div>

                      <div className="mt-4 rounded-md bg-muted p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Diferencia de caja</span>
                          <span
                            className={
                              cashDifference === 0
                                ? 'font-semibold text-foreground'
                                : cashDifference > 0
                                  ? 'font-semibold text-emerald-600'
                                  : 'font-semibold text-red-600'
                            }
                          >
                            {formatPrice(cashDifference)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="text-sm text-muted-foreground">
                          Observaciones
                        </label>
                        <textarea
                          value={cashNotes}
                          onChange={(event) => setCashNotes(event.target.value)}
                          className="mt-1 min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                          placeholder="Ej: Diferencia por cambio pendiente, billete dañado, arqueo correcto..."
                        />
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleConfirmSale}
                      disabled={isPending || !cashSessionOpen || cartItems.length === 0}
                    >
                      <CreditCard className="h-4 w-4" />
                      {isPending ? 'Guardando venta...' : 'Confirmar venta'}
                    </Button>
                    {!cashSessionOpen && (
                      <p className="text-center text-xs text-muted-foreground">
                        Debes abrir la caja antes de confirmar una venta.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}

            {activeModule === 'apartados' && (
              <GestionApartados adminUserId={adminUserId} />
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
                        <Link href="/inventario/consultar-animales">
                          Consultar Inventario
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/mortalidad">Gráficos mortalidad</Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/stock-minimo">Stock mínimo</Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/reporte-mortalidad">Reporte mortalidad</Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/inventario/imprimir-reporte">
                          <Printer className="h-4 w-4" />
                          Imprimir Reporte
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/inventario/registro-entrada">
                          Registrar Entrada
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/inventario/registro-muerte">
                          Registrar Baja
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
                          <TableHead>Editar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventarioLoading ? (
                          <TableRow>
                            <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                              Cargando inventario…
                            </TableCell>
                          </TableRow>
                        ) : filteredInventory.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                              {inventorySearch ? 'Sin resultados para la búsqueda.' : 'No hay animales en inventario.'}
                            </TableCell>
                          </TableRow>
                        ) : filteredInventory.map((item) => (
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
                            <TableCell>
                              <Button size="icon-sm" variant="outline" asChild>
                                <Link href={`/inventario/modificar-lote/${item.id}`}>
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </Button>
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
              <section className="grid gap-6">
                {/* Tabs */}
                <div className="flex gap-2 border-b pb-1">
                  <button
                    type="button"
                    onClick={() => setActiveOrdersTab('comprobantes')}
                    className={[
                      'relative px-4 py-2 text-sm font-medium transition-colors',
                      activeOrdersTab === 'comprobantes'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground',
                    ].join(' ')}
                  >
                    Comprobantes de pago
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveOrdersTab('historial')}
                    className={[
                      'px-4 py-2 text-sm font-medium transition-colors',
                      activeOrdersTab === 'historial'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground',
                    ].join(' ')}
                  >
                    Historial de ventas
                  </button>
                </div>

                {/* Tab: Comprobantes de pago */}
                {activeOrdersTab === 'comprobantes' && (
                  <PaymentProofValidator adminUserId={adminUserId} />
                )}

                {/* Tab: Historial de ventas */}
                {activeOrdersTab === 'historial' && (
                  <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
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
                  </div>
                )}
              </section>
            )}

            {activeModule === 'returns' && (
              <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <Card className="rounded-lg">
                  <CardHeader>
                    <CardTitle>Solicitudes de devolución</CardTitle>
                    <CardDescription>Revisa solicitudes y actualiza el estado de reembolso.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {returnRequestsList.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                        No hay solicitudes de devolución pendientes o aprobadas.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Pedido</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Solicitado</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Pago</TableHead>
                            <TableHead>Acción</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {returnRequestsList.map((request) => (
                            <TableRow key={request.id}>
                              <TableCell>
                                <div className="font-medium">{request.orderNumber}</div>
                                <div className="text-xs text-muted-foreground">{request.customer}</div>
                              </TableCell>
                              <TableCell>{request.customer}</TableCell>
                              <TableCell>{formatDateTime(request.requestedAt)}</TableCell>
                              <TableCell>{formatPrice(request.refundAmount)}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    request.requestStatus === 'Aprobada'
                                      ? 'secondary'
                                      : request.requestStatus === 'Rechazada'
                                        ? 'destructive'
                                        : 'outline'
                                  }
                                >
                                  {request.requestStatus}
                                </Badge>
                              </TableCell>
                              <TableCell>{request.paymentStatus}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-2">
                                  {request.requestStatus === 'Pendiente' && (
                                    <>
                                      <Button size="sm" onClick={() => updateReturnRequestStatus(request.id, 'Aprobada')}>
                                        Aprobar
                                      </Button>
                                      <Button size="sm" variant="destructive" onClick={() => updateReturnRequestStatus(request.id, 'Rechazada')}>
                                        Rechazar
                                      </Button>
                                    </>
                                  )}
                                  {request.requestStatus !== 'Pendiente' && (
                                    <span className="text-xs text-muted-foreground">Sin acciones disponibles</span>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-lg">
                  <CardHeader>
                    <CardTitle>Resumen de devoluciones</CardTitle>
                    <CardDescription>Indicadores de solicitudes por estado y monto de reembolsos.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <OverviewCard
                      title="Pendientes"
                      value={String(returnSummary.pending)}
                      icon={Repeat}
                      detail="Solicitudes que requieren revisión."
                    />
                    <OverviewCard
                      title="Aprobadas"
                      value={String(returnSummary.approved)}
                      icon={CheckCircle}
                      detail="Reembolsos ya procesados."
                    />
                    <OverviewCard
                      title="Rechazadas"
                      value={String(returnSummary.rejected)}
                      icon={XCircle}
                      detail="Solicitudes que no proceden."
                    />
                    <MetricCard
                      title="Total reembolsado"
                      value={formatPrice(returnSummary.totalRefund)}
                      detail="Monto acumulado en devoluciones."
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
                <Card className="rounded-lg">
                  <CardHeader>
                    <CardTitle>Generar reportes</CardTitle>
                    <CardDescription>Accede a reportes importantes de crédito, mortalidad e inventario.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <Button asChild>
                      <Link href="/credito" className="w-full justify-center">
                        <Wallet className="mr-2 h-4 w-4" />
                        Ver reporte de crédito
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/reporte-mortalidad" className="w-full justify-center">
                        <FileText className="mr-2 h-4 w-4" />
                        Reporte mortalidad
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/mortalidad" className="w-full justify-center">
                        <Activity className="mr-2 h-4 w-4" />
                        Gráficos mortalidad
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/inventario/imprimir-reporte" className="w-full justify-center">
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir reporte de inventario
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <div className="grid gap-6 xl:grid-cols-2">
                  <Card className="rounded-lg">
                    <CardHeader>
                      <CardTitle>Ventas por fecha</CardTitle>
                      <CardDescription>Identifica tendencias de ingresos en periodos recientes.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={salesTimeline} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{ borderRadius: 12, borderColor: '#cbd5e1', backgroundColor: '#ffffff' }}
                          />
                          <Line type="monotone" dataKey="total" stroke="#0f766e" strokeWidth={3} dot={{ r: 3, strokeWidth: 2, fill: '#0f766e' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="rounded-lg">
                    <CardHeader>
                      <CardTitle>Ventas por canal</CardTitle>
                      <CardDescription>Distribución de facturación entre POS, online y teléfono.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salesByChannel} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="channel" tick={{ fill: '#64748b', fontSize: 12 }} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{ borderRadius: 12, borderColor: '#cbd5e1', backgroundColor: '#ffffff' }}
                          />
                          <Bar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

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
                    <CardTitle>Productos más vendidos</CardTitle>
                    <CardDescription>Optimiza inventario y promociones con los artículos que más se venden.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {topSellingProducts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No hay datos de productos vendidos.</p>
                    ) : (
                      <div className="space-y-3">
                        {topSellingProducts.map((product, index) => (
                          <div key={product.productId} className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                              <p className="font-medium text-foreground">{index + 1}. {product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.sku}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-foreground">{product.soldQuantity} unidades</p>
                              <p className="text-xs text-muted-foreground">{formatPrice(product.revenue)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
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
                    <CardDescription>
                      Lo que deberia existir para dejar el sistema listo por sucursal.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="grid gap-3">
                    <SettingRow
                      title="Formas de pago"
                      detail="Efectivo, tarjeta, SINPE, mixto y credito."
                    />
                    <SettingRow
                      title="Caja y terminales"
                      detail="Montos iniciales, cierres y responsables."
                    />
                    <SettingRow
                      title="Impuestos y descuentos"
                      detail="Reglas para venta directa y e-commerce."
                    />
                    <SettingRow
                      title="Permisos"
                      detail="Administrador, caja, inventario y produccion."
                    />
                    <div className="pt-2">
                      <Button variant="outline" asChild>
                        <Link href="/admin/marketing">
                          Marketing Digital
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-lg">
                  <CardHeader>
                    <CardTitle>Plantillas de email</CardTitle>
                    <CardDescription>
                      Crea, edita y prueba comunicaciones automaticas para clientes.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="grid gap-5">
                    <div className="rounded-lg border p-4">
                      <p className="font-medium text-foreground">Crear nueva plantilla</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Define una plantilla para automatizar mensajes.
                      </p>

                      <div className="mt-4 grid gap-3">
                        <div>
                          <label className="text-sm text-muted-foreground">
                            Nombre
                          </label>
                          <Input
                            value={newTemplateName}
                            onChange={(event) => setNewTemplateName(event.target.value)}
                            placeholder="Ej: Recordatorio de crédito"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <label className="text-sm text-muted-foreground">
                            Evento
                          </label>
                          <select
                            value={newTemplateTrigger}
                            onChange={(event) => setNewTemplateTrigger(event.target.value)}
                            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                          >
                            <option value="venta_confirmada">Venta confirmada</option>
                            <option value="pedido_listo">Pedido listo</option>
                            <option value="credito_pendiente">Crédito pendiente</option>
                            <option value="apartado_vencido">Apartado vencido</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-sm text-muted-foreground">
                            Asunto
                          </label>
                          <Input
                            value={newTemplateSubject}
                            onChange={(event) => setNewTemplateSubject(event.target.value)}
                            placeholder="Ej: Recordatorio de saldo pendiente"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <label className="text-sm text-muted-foreground">
                            Mensaje
                          </label>
                          <textarea
                            value={newTemplateBody}
                            onChange={(event) => setNewTemplateBody(event.target.value)}
                            placeholder="Hola {{cliente}}, te recordamos que tenés un saldo pendiente de {{saldo}}."
                            className="mt-1 min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                          />
                        </div>

                        <Button onClick={createEmailTemplate}>
                          Crear plantilla
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-lg border p-4">
                      <p className="font-medium text-foreground">Editar plantilla</p>

                      <div className="mt-4 grid gap-3">
                        <div>
                          <label className="text-sm text-muted-foreground">
                            Seleccionar plantilla
                          </label>

                          <select
                            value={selectedTemplateId}
                            onChange={(event) => setSelectedTemplateId(event.target.value)}
                            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                          >
                            {emailTemplates.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {selectedTemplate && (
                          <>
                            <div>
                              <label className="text-sm text-muted-foreground">
                                Nombre
                              </label>
                              <Input
                                value={selectedTemplate.name}
                                onChange={(event) =>
                                  updateEmailTemplate('name', event.target.value)
                                }
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <label className="text-sm text-muted-foreground">
                                Asunto
                              </label>
                              <Input
                                value={selectedTemplate.subject}
                                onChange={(event) =>
                                  updateEmailTemplate('subject', event.target.value)
                                }
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <label className="text-sm text-muted-foreground">
                                Mensaje
                              </label>
                              <textarea
                                value={selectedTemplate.body}
                                onChange={(event) =>
                                  updateEmailTemplate('body', event.target.value)
                                }
                                className="mt-1 min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
                              />
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-4">
                              <div>
                                <p className="font-medium text-foreground">Estado</p>
                                <p className="text-sm text-muted-foreground">
                                  Activa o desactiva esta automatización.
                                </p>
                              </div>

                              <Button
                                variant={selectedTemplate.active ? 'default' : 'outline'}
                                onClick={() =>
                                  updateEmailTemplate('active', !selectedTemplate.active)
                                }
                              >
                                {selectedTemplate.active ? 'Activa' : 'Inactiva'}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border bg-muted/40 p-4">
                      <p className="text-sm font-medium text-foreground">
                        Variables disponibles
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {['{{cliente}}', '{{factura}}', '{{total}}', '{{pedido}}', '{{saldo}}'].map(
                          (variable) => (
                            <Badge key={variable} variant="outline">
                              {variable}
                            </Badge>
                          ),
                        )}
                      </div>

                      <p className="mt-3 text-xs text-muted-foreground">
                        Estas variables se reemplazan con datos reales al enviar el correo.
                      </p>
                    </div>

                    <div className="rounded-lg border p-4">
                      <p className="font-medium text-foreground">Probar envío</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Usa la plantilla seleccionada para generar un correo de prueba.
                      </p>

                      <div className="mt-4 grid gap-3">
                        <div>
                          <label className="text-sm text-muted-foreground">
                            Correo destino
                          </label>
                          <Input
                            value={testEmail}
                            onChange={(event) => setTestEmail(event.target.value)}
                            placeholder="cliente@email.com"
                            className="mt-1"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" onClick={previewSelectedTemplate}>
                            Previsualizar
                          </Button>

                          <Button onClick={sendTestEmail}>
                            Enviar prueba
                          </Button>
                        </div>

                        {emailPreview && (
                          <pre className="whitespace-pre-wrap rounded-md bg-slate-950 p-4 text-xs text-white">
                            {emailPreview}
                          </pre>
                        )}
                      </div>
                    </div>
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
    apartados: 'Apartados',
    inventory: 'Inventario y catalogo',
    orders: 'Pedidos y operacion e-commerce',
    returns: 'Devoluciones y reembolsos',
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
    apartados: 'Crear, consultar, cobrar y cancelar apartados; alertas de vencimiento y comprobantes.',
    inventory: 'Modulo de control de stock, costos, alertas y ajustes manuales.',
    orders: 'Seguimiento de pedidos por canal, estados y cumplimiento.',
    returns: 'Gestiona solicitudes de devolucion y el estado de reembolso.',
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

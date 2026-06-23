import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { PosCatalogProduct, PosSaleRecord, PosSalesSummary } from '@/lib/pos/types'

export async function getPosCatalog(): Promise<PosCatalogProduct[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [{ data: products, error: productsError }, { data: inventories, error: inventoriesError }] =
    await Promise.all([
      supabase
        .from('products')
        .select('id, name, sku, price, category:categories(name)')
        .eq('is_active', true)
        .order('name', { ascending: true }),
      supabase
        .from('inventory')
        .select('product_id, quantity')
        .not('product_id', 'is', null),
    ])

  if (productsError) {
    throw new Error(productsError.message)
  }

  if (inventoriesError) {
    throw new Error(inventoriesError.message)
  }

  const stockByProductId = new Map<string, number>()

  for (const inventory of inventories ?? []) {
    if (!inventory.product_id) continue
    stockByProductId.set(
      inventory.product_id,
      (stockByProductId.get(inventory.product_id) ?? 0) + (inventory.quantity ?? 0),
    )
  }

  return (products ?? []).map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku ?? 'SIN-SKU',
    price: Number(product.price ?? 0),
    stock: stockByProductId.get(product.id) ?? 0,
    category:
      Array.isArray(product.category) && product.category[0]?.name
        ? product.category[0].name
        : 'General',
  }))
}

function mapOrderChannel(source: string | null | undefined): PosSaleRecord['channel'] {
  if (source === 'pos') return 'POS'
  if (source === 'phone') return 'Telefono'
  return 'Online'
}

function mapOrderStatus(status: string | null | undefined): PosSaleRecord['status'] {
  if (status === 'confirmado') return 'Confirmado'
  if (status === 'procesando' || status === 'en_proceso') return 'Preparacion'
  if (status === 'entregado') return 'Entregado'
  if (status === 'cancelado' || status === 'reembolsado') return 'Cancelado'
  return 'Pendiente'
}

function mapPaymentStatus(status: string | null | undefined): PosSaleRecord['paymentStatus'] {
  if (status === 'pagado') return 'Pagado'
  if (status === 'fallido') return 'Fallido'
  if (status === 'reembolsado') return 'Reembolsado'
  return 'Pendiente'
}

function mapPaymentMethod(method: string | null | undefined): string {
  if (method === 'efectivo') return 'Efectivo'
  if (method === 'tarjeta') return 'Tarjeta'
  if (method === 'mixto') return 'Mixto'
  if (method === 'credito') return 'Credito'
  return 'No definido'
}

function isSameLocalDay(dateValue: string): boolean {
  const today = new Date()
  const target = new Date(dateValue)

  return (
    today.getFullYear() === target.getFullYear() &&
    today.getMonth() === target.getMonth() &&
    today.getDate() === target.getDate()
  )
}

export async function getSalesDashboardData(): Promise<{
  sales: PosSaleRecord[]
  summary: PosSalesSummary
}> {
  const supabase = await createServerClient()

  const [{ data: orders, error: ordersError }, { data: transactions, error: transactionsError }] =
    await Promise.all([
      supabase
        .from('orders')
        .select('id, order_number, total, status, payment_status, source, created_at')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('pos_transactions')
        .select('order_id, customer_name, payment_method, transaction_number')
        .order('created_at', { ascending: false })
        .limit(50),
    ])

  if (ordersError) {
    throw new Error(ordersError.message)
  }

  if (transactionsError) {
    throw new Error(transactionsError.message)
  }

  const transactionByOrderId = new Map(
    (transactions ?? [])
      .filter((transaction) => transaction.order_id)
      .map((transaction) => [transaction.order_id as string, transaction]),
  )

  const sales = (orders ?? []).map((order) => {
    const transaction = transactionByOrderId.get(order.id)
    const channel = mapOrderChannel(order.source)

    return {
      id: order.id,
      orderNumber: order.order_number,
      customer:
        transaction?.customer_name ||
        (channel === 'POS'
          ? 'Cliente de mostrador'
          : channel === 'Telefono'
            ? 'Pedido telefonico'
            : 'Cliente tienda en linea'),
      channel,
      total: Number(order.total ?? 0),
      status: mapOrderStatus(order.status),
      paymentStatus: mapPaymentStatus(order.payment_status),
      paymentMethod: mapPaymentMethod(transaction?.payment_method),
      createdAt: order.created_at,
      transactionNumber: transaction?.transaction_number ?? null,
    } satisfies PosSaleRecord
  })

  const todaysSales = sales.filter(
    (sale) => isSameLocalDay(sale.createdAt) && sale.paymentStatus === 'Pagado' && sale.status !== 'Cancelado',
  )

  const totalSalesToday = todaysSales.reduce((sum, sale) => sum + sale.total, 0)
  const transactionsToday = todaysSales.length
  const posSalesToday = todaysSales.filter((sale) => sale.channel === 'POS').length
  const onlineSalesToday = todaysSales.filter((sale) => sale.channel === 'Online').length
  const pendingOrders = sales.filter((sale) => sale.status === 'Pendiente').length

  return {
    sales,
    summary: {
      totalSalesToday,
      transactionsToday,
      averageTicketToday: transactionsToday > 0 ? totalSalesToday / transactionsToday : 0,
      posSalesToday,
      onlineSalesToday,
      pendingOrders,
    },
  }
}

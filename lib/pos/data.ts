import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { PosCatalogProduct, PosReturnRequest, PosSaleRecord, PosSalesSummary, PosTopProduct } from './types'

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
  topProducts: PosTopProduct[]
  returnRequests: PosReturnRequest[]
}> {
  const supabase = await createServerClient()

  const [{ data: orders, error: ordersError }, { data: transactions, error: transactionsError }] =
    await Promise.all([
      supabase
        .from('orders')
        .select('id, order_number, total, status, payment_status, source, created_at, notes')
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

  const { data: orderItems, error: orderItemsError } = await supabase
    .from('order_items')
    .select('product_id, name, sku, quantity, total')
    .not('product_id', 'is', null)

  if (orderItemsError) {
    throw new Error(orderItemsError.message)
  }

  const transactionByOrderId = new Map(
    (transactions ?? [])
      .filter((transaction) => transaction.order_id)
      .map((transaction) => [transaction.order_id as string, transaction]),
  )

  const topProductsMap = new Map<string, PosTopProduct>()
  for (const item of (orderItems ?? []) as Array<{
    product_id: string | null
    name: string | null
    sku: string | null
    quantity: number | null
    total: number | null
  }>) {
    if (!item.product_id) continue

    const current = topProductsMap.get(item.product_id) ?? {
      productId: item.product_id,
      name: item.name ?? 'Producto desconocido',
      sku: item.sku ?? 'SIN-SKU',
      soldQuantity: 0,
      revenue: 0,
    }

    current.soldQuantity += Number(item.quantity ?? 0)
    current.revenue += Number(item.total ?? 0)
    topProductsMap.set(item.product_id, current)
  }

  const topProducts = Array.from(topProductsMap.values())
    .sort((a, b) => b.soldQuantity - a.soldQuantity)
    .slice(0, 8)

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

  const returnRequests = ((orders ?? [])
    .filter(
      (order) =>
        order.status === 'cancelado' ||
        order.status === 'reembolsado' ||
        order.payment_status === 'reembolsado',
    )
    .map((order) => {
      const transaction = transactionByOrderId.get(order.id)
      const channel = mapOrderChannel(order.source)
      const requestStatus: PosReturnRequest['requestStatus'] =
        order.payment_status === 'reembolsado' || order.status === 'reembolsado'
          ? 'Aprobada'
          : 'Pendiente'

      return {
        id: order.id,
        orderId: order.id,
        orderNumber: order.order_number,
        customer:
          transaction?.customer_name ||
          (channel === 'POS'
            ? 'Cliente de mostrador'
            : channel === 'Telefono'
              ? 'Pedido telefonico'
              : 'Cliente tienda en linea'),
        requestedAt: order.created_at,
        requestStatus: requestStatus as PosReturnRequest['requestStatus'],
        paymentStatus: mapPaymentStatus(order.payment_status),
        refundAmount: Number(order.total ?? 0),
        notes: order.notes ?? null,
      }
    }) as PosReturnRequest[]

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
    topProducts,
    returnRequests,
  }
}

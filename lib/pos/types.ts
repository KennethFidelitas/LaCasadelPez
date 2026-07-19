export interface PosCatalogProduct {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  category: string
}

export interface PosSaleRecord {
  id: string
  orderNumber: string
  customer: string
  customerEmail: string | null
  channel: 'POS' | 'Online' | 'Telefono'
  total: number
  status: 'Pendiente' | 'Confirmado' | 'Preparacion' | 'Enviado' | 'Entregado' | 'Cancelado' | 'Reembolsado'
  rawStatus: 'pendiente' | 'confirmado' | 'procesando' | 'enviado' | 'entregado' | 'cancelado' | 'reembolsado'
  paymentStatus: 'Pendiente' | 'Pagado' | 'Fallido' | 'Reembolsado'
  paymentMethod: string
  createdAt: string
  transactionNumber: string | null
  items?: PosSaleLineItem[]
}

export interface PosSaleLineItem {
  id: string
  productId: string | null
  name: string
  sku: string
  quantity: number
  unitPrice: number
  total: number
}

export interface PosTopProduct {
  productId: string
  name: string
  sku: string
  soldQuantity: number
  revenue: number
}

export interface PosReturnRequest {
  id: string
  orderId: string
  orderNumber: string
  customer: string
  requestedAt: string
  requestStatus: 'Pendiente' | 'Aprobada' | 'Rechazada'
  paymentStatus: 'Pendiente' | 'Pagado' | 'Fallido' | 'Reembolsado'
  refundAmount: number
  notes: string | null
}

export interface PosSalesSummary {
  totalSalesToday: number
  transactionsToday: number
  averageTicketToday: number
  posSalesToday: number
  onlineSalesToday: number
  pendingOrders: number
}

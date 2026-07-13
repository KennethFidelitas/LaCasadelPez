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
  channel: 'POS' | 'Online' | 'Telefono'
  total: number
  status: 'Pendiente' | 'Confirmado' | 'Preparacion' | 'Entregado' | 'Cancelado'
  paymentStatus: 'Pendiente' | 'Pagado' | 'Fallido' | 'Reembolsado'
  paymentMethod: string
  createdAt: string
  transactionNumber: string | null
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

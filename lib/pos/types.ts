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

export interface PosSalesSummary {
  totalSalesToday: number
  transactionsToday: number
  averageTicketToday: number
  posSalesToday: number
  onlineSalesToday: number
  pendingOrders: number
}

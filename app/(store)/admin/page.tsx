import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { requireAdminUser } from '@/lib/auth/session'
import { getCustomerContacts } from '@/lib/customers/data'
import type { CustomerContactRecord } from '@/lib/customers/types'
import { getPosCatalog, getSalesDashboardData } from '@/lib/pos/data'
import type { PosCatalogProduct, PosReturnRequest, PosSaleRecord, PosSalesSummary, PosTopProduct } from '@/lib/pos/types'

export default async function AdminPage() {
  await requireAdminUser('/admin')

  let posCatalog: PosCatalogProduct[] = []
  let posCatalogError: string | null = null
  let sales: PosSaleRecord[] = []
  let salesError: string | null = null
  let customers: CustomerContactRecord[] = []
  let customersError: string | null = null
  let salesSummary: PosSalesSummary = {
    totalSalesToday: 0,
    transactionsToday: 0,
    averageTicketToday: 0,
    posSalesToday: 0,
    onlineSalesToday: 0,
    pendingOrders: 0,
  }
  let topProducts: PosTopProduct[] = []
  let returnRequests: PosReturnRequest[] = []

  try {
    posCatalog = await getPosCatalog()
  } catch (error) {
    posCatalogError =
      error instanceof Error ? error.message : 'No se pudo cargar el catálogo del POS.'
  }

  try {
    const salesData = await getSalesDashboardData()
    sales = salesData.sales
    salesSummary = salesData.summary
    topProducts = salesData.topProducts
    returnRequests = salesData.returnRequests
  } catch (error) {
    salesError =
      error instanceof Error ? error.message : 'No se pudo cargar el historial de ventas.'
  }

  try {
    customers = await getCustomerContacts()
  } catch (error) {
    customersError =
      error instanceof Error ? error.message : 'No se pudo cargar la base de clientes.'
  }

  return (
    <AdminDashboard
      posCatalog={posCatalog}
      posCatalogError={posCatalogError}
      sales={sales}
      salesError={salesError}
      salesSummary={salesSummary}
      topProducts={topProducts}
      returnRequests={returnRequests}
      customers={customers}
      customersError={customersError}
    />
  )
}

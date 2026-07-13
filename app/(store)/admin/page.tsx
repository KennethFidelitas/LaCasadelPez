import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { requireAdminUser } from '@/lib/auth/session'
import { getCustomerContacts } from '@/lib/customers/data'
import type { CustomerContactRecord } from '@/lib/customers/types'
import { getPosCatalog, getSalesDashboardData } from '@/lib/pos/data'
import type { PosCatalogProduct, PosSaleRecord, PosSalesSummary } from '@/lib/pos/types'

export default async function AdminPage() {
  const { user } = await requireAdminUser('/admin')

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
      adminUserId={user.id}
      posCatalog={posCatalog}
      posCatalogError={posCatalogError}
      sales={sales}
      salesError={salesError}
      salesSummary={salesSummary}
      customers={customers}
      customersError={customersError}
    />
  )
}

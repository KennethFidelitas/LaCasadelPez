import { requireStaffUser } from '@/lib/auth/session'

export default async function StockMinimoLayout({ children }: { children: React.ReactNode }) {
  await requireStaffUser('/stock-minimo')
  return <>{children}</>
}

import { requireStaffUser } from '@/lib/auth/session'

export default async function VentasLayout({ children }: { children: React.ReactNode }) {
  await requireStaffUser('/ventas')
  return <>{children}</>
}

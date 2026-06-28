import { requireStaffUser } from '@/lib/auth/session'

export default async function InventarioLayout({ children }: { children: React.ReactNode }) {
  await requireStaffUser('/inventario')
  return <>{children}</>
}

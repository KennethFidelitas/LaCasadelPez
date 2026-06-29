import { requireStaffUser } from '@/lib/auth/session'

export default async function ReporteMortalidadLayout({ children }: { children: React.ReactNode }) {
  await requireStaffUser('/reporte-mortalidad')
  return <>{children}</>
}

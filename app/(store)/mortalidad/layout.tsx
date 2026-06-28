import { requireStaffUser } from '@/lib/auth/session'

export default async function MortalidadLayout({ children }: { children: React.ReactNode }) {
  await requireStaffUser('/mortalidad')
  return <>{children}</>
}

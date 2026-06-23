import type { ReactNode } from 'react'
import { requireStaffUser } from '@/lib/auth/session'

type DashboardLayoutProps = {
  children: ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  await requireStaffUser('/dashboard')

  return children
}

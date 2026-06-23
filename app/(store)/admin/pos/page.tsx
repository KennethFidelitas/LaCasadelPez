import { requireAdminUser } from '@/lib/auth/session'
import POSClientPage from './pos-client'

export default async function POSPage() {
  await requireAdminUser('/admin/pos')

  return <POSClientPage />
}

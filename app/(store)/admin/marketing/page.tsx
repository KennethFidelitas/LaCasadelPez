import { requireAdminUser } from '@/lib/auth/session'
import MarketingClientPage from './marketing-client'

export default async function MarketingPage() {
  await requireAdminUser('/admin/marketing')

  return <MarketingClientPage />
}

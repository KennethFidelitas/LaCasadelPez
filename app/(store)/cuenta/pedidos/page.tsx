import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { CustomerOrdersDashboard } from '@/components/store/order-tracking'
import { Button } from '@/components/ui/actions/button'
import { Badge } from '@/components/ui/display/badge'
import { getCustomerOrders } from '@/lib/orders/customer-orders'
import { createClient } from '@/lib/supabase/server'

export default async function CustomerOrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/cuenta/pedidos')
  }

  const orders = await getCustomerOrders(user.id)

  return (
    <div className="bg-muted/20">
      <section className="mx-auto grid min-h-[calc(100vh-9rem)] max-w-5xl gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="outline" className="mb-3">
              Mis pedidos
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">Pedidos realizados</h1>
            <p className="mt-2 text-muted-foreground">
              Consulta tu historial de compras y entra al seguimiento de cada pedido.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/cuenta">
              <ArrowLeft className="h-4 w-4" />
              Volver a mi cuenta
            </Link>
          </Button>
        </div>

        <CustomerOrdersDashboard orders={orders} />
      </section>
    </div>
  )
}

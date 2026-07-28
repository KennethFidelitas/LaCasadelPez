import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CustomerOrderTrackingDetail } from '@/components/store/order-tracking'
import { ReturnRequestForm } from '@/components/store/return-request-form'
import { Button } from '@/components/ui/actions/button'
import { Badge } from '@/components/ui/display/badge'
import { getCustomerOrderById } from '@/lib/orders/customer-orders'
import { getCustomerReturnRequest } from '@/lib/returns/actions'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CustomerOrderTrackingPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?redirect=/cuenta/pedidos/${id}`)
  }

  const order = await getCustomerOrderById(user.id, id)
  if (!order) notFound()
  const returnRequest = await getCustomerReturnRequest(order.id)

  return (
    <div className="bg-muted/20">
      <section className="mx-auto grid min-h-[calc(100vh-9rem)] max-w-5xl gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="outline" className="mb-3">
              Rastreo de pedido
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">Seguimiento del pedido</h1>
            <p className="mt-2 text-muted-foreground">
              Consulta el avance más reciente y los artículos incluidos.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/cuenta/pedidos">
              <ArrowLeft className="h-4 w-4" />
              Volver a mis pedidos
            </Link>
          </Button>
        </div>

        <CustomerOrderTrackingDetail order={order} />
        <ReturnRequestForm order={order} existingRequest={returnRequest} />
      </section>
    </div>
  )
}

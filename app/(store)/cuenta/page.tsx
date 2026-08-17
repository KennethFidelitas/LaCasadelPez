import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Mail, ShieldCheck, User } from 'lucide-react'
import { AccountProfileForm } from '@/components/account/account-profile-form'
import { LogoutButton } from '@/components/auth/logout-button'
import { CustomerOrdersSummary } from '@/components/store/order-tracking'
import { Badge } from '@/components/ui/display/badge'
import { Button } from '@/components/ui/actions/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/display/card'
import { formatDate } from '@/lib/format'
import { getCustomerOrders } from '@/lib/orders/customer-orders'
import { createClient } from '@/lib/supabase/server'

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  employee: 'Colaborador',
  customer: 'Cliente',
}

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/cuenta')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, phone, role, created_at')
    .eq('id', user.id)
    .maybeSingle()

  const firstName = profile?.first_name || user.user_metadata?.first_name || ''
  const lastName = profile?.last_name || user.user_metadata?.last_name || ''
  const displayName =
    [firstName, lastName].filter(Boolean).join(' ') ||
    user.email ||
    'Usuario'
  const email = profile?.email || user.email || 'Sin correo'
  const phone = profile?.phone || user.user_metadata?.phone || ''
  const role = profile?.role || 'customer'
  const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date(user.created_at)
  const orders = await getCustomerOrders(user.id, 8)

  return (
    <div className="bg-muted/20">
      <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="outline" className="mb-3">
              Mi cuenta
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">Hola, {displayName}</h1>
            <p className="mt-2 text-muted-foreground">
              Esta pantalla muestra tu sesión activa y el rol con el que ingresaste.
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Configuración del perfil</CardTitle>
              <CardDescription>Actualizá tus datos personales.</CardDescription>
            </CardHeader>
            <CardContent>
              <AccountProfileForm
                firstName={firstName}
                lastName={lastName}
                email={email}
                phone={phone}
              />
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Información de acceso</CardTitle>
              <CardDescription>Datos reales de tu cuenta en Supabase.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{displayName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Correo</p>
                  <p className="font-medium">{email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rol</p>
                  <p className="font-medium">{roleLabels[role] ?? role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <Card className="rounded-lg lg:col-span-2">
            <CardHeader>
              <CardTitle>Accesos</CardTitle>
              <CardDescription>Navegacion lista para mostrar el flujo al cliente.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Cuenta creada: {formatDate(createdAt)}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/tienda">Ir a tienda</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/cuenta/pedidos">Ver mis pedidos</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Volver al inicio</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <CustomerOrdersSummary orders={orders} />
      </section>
    </div>
  )
}

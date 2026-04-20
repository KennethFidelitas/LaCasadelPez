import Link from 'next/link'
import { Mail, ShieldCheck, User } from 'lucide-react'
import { LogoutButton } from '@/components/auth/logout-button'
import { Badge } from '@/components/ui/display/badge'
import { Button } from '@/components/ui/actions/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/display/card'
import { formatDate } from '@/lib/format'

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  employee: 'Colaborador',
  customer: 'Cliente',
}

export default function AccountPage() {
  const displayName = 'Usuario Demo'
  const email = 'demo@lacasadelpez.test'
  const role = 'customer'
  const createdAt = new Date()

  return (
    <div className="bg-muted/20">
      <section className="mx-auto grid min-h-[calc(100vh-9rem)] max-w-5xl gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="outline" className="mb-3">
              Mi cuenta
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">Hola, {displayName}</h1>
            <p className="mt-2 text-muted-foreground">
              Esta pantalla simula una sesion activa para presentar el flujo de autenticacion.
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Informacion de acceso</CardTitle>
              <CardDescription>Datos de ejemplo para una demostracion sin conexion a Supabase.</CardDescription>
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

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Accesos</CardTitle>
              <CardDescription>Navegacion lista para mostrar el flujo al cliente.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <p className="text-sm text-muted-foreground">
                Cuenta creada: {formatDate(createdAt)}
              </p>
              <Button asChild>
                <Link href="/tienda">Ir a tienda</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Volver al inicio</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/display/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/display/card'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string
  }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams
  const token = params.token ?? ''

  return (
    <div className="bg-muted/20">
      <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-xl items-center px-4 py-10 sm:px-6">
        <Card className="w-full rounded-lg">
          <CardHeader>
            <CardTitle>Crear nueva contraseña</CardTitle>
            <CardDescription>
              Ingresá una nueva contraseña para recuperar el acceso a tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!token ? (
              <Alert variant="destructive">
                <AlertTitle>Enlace inválido</AlertTitle>
                <AlertDescription>
                  Solicitá un nuevo correo para cambiar tu contraseña.
                </AlertDescription>
              </Alert>
            ) : (
              <ResetPasswordForm token={token} />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

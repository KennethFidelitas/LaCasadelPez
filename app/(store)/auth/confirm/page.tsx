import { KeyRound } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/display/alert'
import { Button } from '@/components/ui/actions/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/display/card'
import { confirmPasswordReset } from '@/lib/auth/confirm-reset'

type ConfirmPageProps = {
  searchParams: Promise<{
    token_hash?: string
    next?: string
  }>
}

export default async function ConfirmPasswordResetPage({ searchParams }: ConfirmPageProps) {
  const params = await searchParams
  const tokenHash = params.token_hash ?? ''
  const next = params.next?.startsWith('/') ? params.next : '/auth/reset-password'

  return (
    <div className="bg-muted/20">
      <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-xl items-center px-4 py-10 sm:px-6">
        <Card className="w-full rounded-lg">
          <CardHeader>
            <CardTitle>Confirmar cambio de contraseña</CardTitle>
            <CardDescription>
              Continuá para crear una nueva contraseña para tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!tokenHash ? (
              <Alert variant="destructive">
                <AlertTitle>Enlace inválido</AlertTitle>
                <AlertDescription>
                  Solicitá un nuevo correo para cambiar tu contraseña.
                </AlertDescription>
              </Alert>
            ) : (
              <form action={confirmPasswordReset} className="grid gap-4">
                <input type="hidden" name="token_hash" value={tokenHash} />
                <input type="hidden" name="next" value={next} />
                <Button type="submit" className="w-full">
                  <KeyRound className="h-4 w-4" />
                  Continuar
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

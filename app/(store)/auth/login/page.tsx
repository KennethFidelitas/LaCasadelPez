import { Suspense } from 'react'
import { Fish } from 'lucide-react'
import { AuthForm } from '@/components/auth/auth-form'

export default function LoginPage() {
  return (
    <div className="bg-muted/20">
      <section className="mx-auto grid min-h-[calc(100vh-9rem)] max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Fish className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Acceso para clientes y equipo
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Usa una sola cuenta para comprar, revisar pedidos y entrar a paneles internos cuando tengas permisos.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-muted-foreground">
            <p className="rounded-lg border bg-background p-4">
              Los clientes pueden guardar su informacion y consultar pedidos.
            </p>
            <p className="rounded-lg border bg-background p-4">
              El equipo puede entrar a dashboard y proximamente al punto de venta.
            </p>
          </div>
        </div>
        <div className="w-full max-w-xl justify-self-center lg:justify-self-end">
          <Suspense>
            <AuthForm />
          </Suspense>
        </div>
      </section>
    </div>
  )
}

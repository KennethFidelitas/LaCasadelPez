import Link from 'next/link'
import { Button } from '@/components/ui/actions/button'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h1 className="text-3xl font-bold">Página no encontrada</h1>
      <p className="text-muted-foreground">La dirección que buscás ya no está disponible o cambió.</p>
      <Button asChild><Link href="/">Volver al inicio</Link></Button>
    </main>
  )
}

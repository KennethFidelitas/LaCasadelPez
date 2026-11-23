import Link from 'next/link'
import { Input } from '@/components/ui/forms/input'
import { Button } from '@/components/ui/actions/button'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/format'

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const { q } = await searchParams
  const query = (typeof q === 'string' ? q : q?.[0] ?? '').trim().slice(0, 100)
  const supabase = await createClient()
  const pattern = `%${query.replace(/[\\%_*]/g, '\\$&')}%`
  const catalogs = [
    { table: 'products', path: '/tienda', label: 'Productos' },
    { table: 'animals', path: '/peces', label: 'Peces' },
  ] as const
  const results = query
    ? await Promise.all(catalogs.map(async (catalog) => {
        const { data, error } = await supabase.from(catalog.table)
          .select('id, name, slug, price')
          .eq('is_active', true)
          .ilike('name', pattern)
          .order('name')
          .limit(24)

        if (error) console.error('Error en búsqueda de catálogo:', error)
        return { ...catalog, items: data ?? [], failed: Boolean(error) }
      }))
    : []

  return (
    <section className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold">Buscar en el catálogo</h1>
      <form className="flex max-w-lg gap-2">
        <Input name="q" type="search" aria-label="Nombre del pez o producto" defaultValue={query} required maxLength={100} />
        <Button>Buscar</Button>
      </form>
      {results.some((result) => result.failed) && (
        <p role="alert" className="text-destructive">No se pudieron cargar todos los resultados. Intentá de nuevo.</p>
      )}
      {query && results.every((result) => !result.failed && result.items.length === 0) && (
        <p className="text-muted-foreground">No encontramos resultados para «{query}».</p>
      )}
      {results.filter((result) => result.items.length > 0).map((result) => (
        <section key={result.table} className="space-y-3">
          <h2 className="text-xl font-semibold">{result.label}</h2>
          <ul className="divide-y rounded-lg border">
            {result.items.map((item) => (
              <li key={item.id}>
                <Link href={`${result.path}/${item.slug}`} className="flex justify-between gap-4 p-4 hover:bg-muted">
                  {item.name}
                  <span>{formatPrice(item.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  )
}

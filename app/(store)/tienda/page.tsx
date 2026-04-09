import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ProductGrid } from '@/components/store/product-grid'
import { ProductFilters } from '@/components/store/product-filters'
import { Skeleton } from '@/components/ui/display/skeleton'

interface TiendaPageProps {
  searchParams: Promise<{
    categoria?: string
    buscar?: string
    orden?: string
    pagina?: string
  }>
}

export default async function TiendaPage({ searchParams }: TiendaPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch categories for filters
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  // Build product query
  let query = supabase
    .from('products')
    .select('*, category:categories(*)', { count: 'exact' })
    .eq('is_active', true)

  // Apply category filter
  if (params.categoria) {
    const category = categories?.find(c => c.slug === params.categoria)
    if (category) {
      query = query.eq('category_id', category.id)
    }
  }

  // Apply search filter
  if (params.buscar) {
    query = query.or(`name.ilike.%${params.buscar}%,description.ilike.%${params.buscar}%`)
  }

  // Apply ordering
  switch (params.orden) {
    case 'precio-asc':
      query = query.order('price', { ascending: true })
      break
    case 'precio-desc':
      query = query.order('price', { ascending: false })
      break
    case 'nombre':
      query = query.order('name', { ascending: true })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  // Pagination
  const page = parseInt(params.pagina || '1')
  const limit = 12
  const from = (page - 1) * limit
  const to = from + limit - 1

  query = query.range(from, to)

  const { data: products, count } = await query

  const totalPages = Math.ceil((count || 0) / limit)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Tienda
        </h1>
        <p className="mt-2 text-muted-foreground">
          Explora nuestra amplia seleccion de productos para acuarios
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Filters Sidebar */}
        <aside className="w-full shrink-0 lg:w-64">
          <ProductFilters
            categories={categories || []}
            currentCategory={params.categoria}
            currentSearch={params.buscar}
            currentOrder={params.orden}
          />
        </aside>

        {/* Products Grid */}
        <main className="flex-1">
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductGrid
              products={products || []}
              totalPages={totalPages}
              currentPage={page}
              totalProducts={count || 0}
            />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

function ProductGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border">
          <Skeleton className="aspect-square" />
          <div className="p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
            <Skeleton className="mt-4 h-6 w-1/3" />
            <Skeleton className="mt-3 h-9 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

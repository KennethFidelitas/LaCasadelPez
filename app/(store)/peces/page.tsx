import { createClient } from '@/lib/supabase/server'
import { PecesExplorer } from '@/components/peces/PecesExplorer'
import { PRECIO_MIN, PRECIO_MAX } from '@/components/peces/data'
import type { Animal } from '@/lib/types'
import { withInventoryStock } from '@/lib/catalog/inventory'

export default async function PecesPage() {
  const supabase = await createClient()

  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .eq('type', 'animal')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (categoriesError) {
    console.error('[PecesPage] categories error:', categoriesError)
  }

  const { data: animals, error: animalsError } = await supabase
    .from('animals')
    .select('*, category:categories(*), inventory(quantity, low_stock_threshold)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (animalsError) {
    console.error('[PecesPage] animals error:', animalsError)
  }

  const animalesConStock = (animals ?? []).map((animal) => withInventoryStock<Animal>(animal))

  const precios = animalesConStock.map((a) => a.price)
  const precioMin = precios.length ? Math.min(...precios) : PRECIO_MIN
  const precioMax = precios.length ? Math.max(...precios) : PRECIO_MAX

  return (
    <PecesExplorer
      animales={animalesConStock}
      categorias={categories ?? []}
      precioMin={precioMin}
      precioMax={precioMax}
    />
  )
}

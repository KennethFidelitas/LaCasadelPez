import { createClient } from '@/lib/supabase/server'
import { PecesExplorer } from '@/components/peces/PecesExplorer'
import { PRECIO_MIN, PRECIO_MAX } from '@/components/peces/data'
import type { Animal } from '@/lib/types'

type AnimalInventoryRow = {
  quantity: number | null
  low_stock_threshold: number | null
}

type AnimalWithInventory = Animal & {
  inventory?: AnimalInventoryRow[]
}

// Mismo patrón que addInventoryStock en app/(store)/tienda/page.tsx: stock_quantity
// y low_stock_threshold no son columnas de `animals`, se calculan del join a inventory.
function addInventoryStock(animal: AnimalWithInventory): Animal {
  const { inventory = [], ...animalData } = animal

  return {
    ...animalData,
    stock_quantity: inventory.reduce((total, row) => total + Number(row.quantity ?? 0), 0),
    low_stock_threshold: inventory.length
      ? Math.max(...inventory.map((row) => Number(row.low_stock_threshold ?? 0)))
      : 0,
  }
}

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

  const animalesConStock = ((animals ?? []) as AnimalWithInventory[]).map(addInventoryStock)

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

import { notFound } from 'next/navigation'
import { CatalogDetail } from '@/components/store/catalog-detail'
import { withInventoryStock } from '@/lib/catalog/inventory'
import { createClient } from '@/lib/supabase/server'
import type { Product } from '@/lib/types'

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*), inventory(quantity, low_stock_threshold)')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) notFound()
  return <CatalogDetail type="product" item={withInventoryStock<Product>(data)} />
}

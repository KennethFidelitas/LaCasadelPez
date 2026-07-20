import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

if (!url || !key) {
  throw new Error('Faltan las credenciales administrativas de Supabase.')
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const slug = 'producto-prueba-confirmacion-correo'
const { data: product, error: productError } = await supabase
  .from('products')
  .upsert({
    name: 'Producto de prueba - Confirmacion por correo',
    slug,
    description: 'Articulo temporal para probar el carrito y el envio del respaldo de compra por correo.',
    price: 1000,
    compare_at_price: null,
    cost: 0,
    sku: 'TEST-EMAIL-001',
    images: ['/placeholder.jpg'],
    is_active: true,
    is_featured: false,
    meta: { test_product: true, purpose: 'purchase_confirmation_email' },
  }, { onConflict: 'slug' })
  .select('id, name, slug, price')
  .single()

if (productError) throw productError

const { data: inventoryRows, error: inventoryReadError } = await supabase
  .from('inventory')
  .select('id')
  .eq('product_id', product.id)
  .limit(1)

if (inventoryReadError) throw inventoryReadError

if (inventoryRows?.length) {
  const { error } = await supabase
    .from('inventory')
    .update({ quantity: 20, low_stock_threshold: 2 })
    .eq('id', inventoryRows[0].id)
  if (error) throw error
} else {
  const { error } = await supabase.from('inventory').insert({
    product_id: product.id,
    quantity: 20,
    low_stock_threshold: 2,
    location: 'almacen',
  })
  if (error) throw error
}

console.log(JSON.stringify({ ...product, stock: 20 }))

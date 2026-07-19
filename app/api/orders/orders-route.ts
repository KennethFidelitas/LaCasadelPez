// app/api/orders/route.ts
// RF: Pagar pedido con transferencia/SINPE — crea la orden y sube el comprobante

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { CartItem } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    // ── Extraer campos del FormData ──────────────────────────────────────
    const itemsJson      = formData.get('items') as string
    const paymentMethod  = formData.get('payment_method') as 'sinpe' | 'transferencia'
    const transactionNum = formData.get('transaction_number') as string
    const customerNotes  = formData.get('customer_notes') as string | null
    const proofFile      = formData.get('proof_image') as File | null

    // ── Validaciones básicas ─────────────────────────────────────────────
    if (!itemsJson || !paymentMethod || !transactionNum || !proofFile) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: items, método de pago, número de transacción y comprobante.' },
        { status: 400 },
      )
    }

    if (!['sinpe', 'transferencia'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Método de pago inválido.' }, { status: 400 })
    }

    if (!proofFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'El comprobante debe ser una imagen (JPG, PNG, WEBP).' },
        { status: 400 },
      )
    }

    const items: CartItem[] = JSON.parse(itemsJson)
    if (!items.length) {
      return NextResponse.json({ error: 'El carrito está vacío.' }, { status: 400 })
    }

    // ── Obtener usuario autenticado (puede ser invitado) ─────────────────
    const supabaseUser = await createClient()
    const { data: { user } } = await supabaseUser.auth.getUser()

    const supabase = createAdminClient()

    // ── Calcular totales ─────────────────────────────────────────────────
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    // ── Crear la orden en estado pendiente (pago aún no validado) ────────
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: user?.id ?? null,
        status: 'pendiente',
        payment_status: 'pendiente',
        subtotal,
        discount: 0,
        tax: 0,
        shipping_cost: 0,
        credits_applied: 0,
        total: subtotal,
        source: 'online',
        notes: customerNotes ?? null,
      }])
      .select('id, order_number')
      .single()

    if (orderError || !order) {
      console.error('Error creating order:', orderError)
      return NextResponse.json({ error: 'No se pudo crear la orden.' }, { status: 500 })
    }

    // ── Insertar order_items ─────────────────────────────────────────────
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.type === 'product' ? item.id : null,
      animal_id:  item.type === 'animal'  ? item.id : null,
      name:       item.name,
      sku:        item.sku ?? null,
      quantity:   item.quantity,
      unit_price: item.price,
      total:      item.price * item.quantity,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
    if (itemsError) {
      console.error('Error inserting order_items:', itemsError)
    }

    // ── Subir imagen a Supabase Storage ──────────────────────────────────
    const ext = proofFile.name.split('.').pop() ?? 'jpg'
    const filePath = `${order.id}/${transactionNum.replace(/\s+/g, '_')}.${ext}`
    const fileBuffer = await proofFile.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(filePath, fileBuffer, {
        contentType: proofFile.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading proof:', uploadError)
      return NextResponse.json(
        { error: 'No se pudo subir el comprobante. Intentá de nuevo.' },
        { status: 500 },
      )
    }

    // Obtener URL pública (el bucket es privado, usamos signed URL de 7 días)
    const { data: signedUrlData } = await supabase.storage
      .from('payment-proofs')
      .createSignedUrl(filePath, 60 * 60 * 24 * 7) // 7 días

    // ── Registrar el comprobante en la BD ────────────────────────────────
    const { error: proofError } = await supabase
      .from('payment_proofs')
      .insert([{
        order_id:          order.id,
        payment_method:    paymentMethod,
        transaction_number: transactionNum.trim(),
        proof_image_path:  filePath,
        proof_image_url:   signedUrlData?.signedUrl ?? null,
        customer_notes:    customerNotes ?? null,
        validation_status: 'pendiente',
      }])

    if (proofError) {
      console.error('Error inserting payment_proof:', proofError)
    }

    return NextResponse.json({
      ok: true,
      order_number: order.order_number,
      order_id: order.id,
      message: 'Orden creada. Tu comprobante está siendo revisado por nuestro equipo.',
    })
  } catch (error) {
    console.error('POST /api/orders error:', error)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}

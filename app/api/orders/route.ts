// app/api/orders/route.ts
// RF: Pagar pedido con transferencia/SINPE — crea la orden y sube el comprobante

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import type { CartItem } from '@/lib/types'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatColones(value: number) {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
  }).format(value)
}

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

    const customerEmail = ((formData.get('customer_email') as string | null) || user?.email || '').trim()
    if (!customerEmail || !EMAIL_PATTERN.test(customerEmail)) {
      return NextResponse.json(
        { error: 'Ingresá un correo electrónico válido para recibir la confirmación.' },
        { status: 400 },
      )
    }
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
        customer_email: customerEmail,
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

    const itemRows = items.map(item => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.name)}</td>
        <td style="padding:8px;text-align:center;border-bottom:1px solid #e5e7eb;">${item.quantity}</td>
        <td style="padding:8px 0;text-align:right;border-bottom:1px solid #e5e7eb;">${formatColones(item.price * item.quantity)}</td>
      </tr>
    `).join('')

    let emailSent = false
    {
      const emailSubject = `Confirmación de compra - Pedido #${order.order_number}`
      const emailBody = `
        <div style="font-family:system-ui, sans-serif; color:#111; line-height:1.6;">
          <h1 style="font-size:1.5rem; margin-bottom:0.5rem;">Gracias por tu compra</h1>
          <p>Hemos recibido tu pedido <strong>#${escapeHtml(order.order_number)}</strong> por un total de <strong>${formatColones(subtotal)}</strong>.</p>
          <p>El pago se registró como <strong>pendiente de validación</strong>. Nuestro equipo revisará el comprobante y te avisará cuando se confirme.</p>
          <h2 style="font-size:1.1rem; margin-top:1rem;">Detalles del pedido</h2>
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr><th style="text-align:left;">Artículo</th><th>Cantidad</th><th style="text-align:right;">Total</th></tr></thead>
            <tbody>${itemRows}</tbody>
          </table>
          <p><strong>Total:</strong> ${formatColones(subtotal)}<br />
          <strong>Método de pago:</strong> ${paymentMethod === 'sinpe' ? 'SINPE Móvil' : 'Transferencia bancaria'}</p>
          <p style="margin-top:1rem;">Si necesitas ayuda, responde a este correo o contáctanos desde la sección de contacto.</p>
          <p>Atentamente,<br />El equipo de La Casa del Pez</p>
        </div>
      `

      try {
        const result = await sendEmail({
          to: customerEmail,
          subject: emailSubject,
          html: emailBody,
        })
        emailSent = result.sent
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError)
      }
    }

    return NextResponse.json({
      ok: true,
      order_number: order.order_number,
      order_id: order.id,
      email_sent: emailSent,
      message: 'Orden creada. Tu comprobante está siendo revisado por nuestro equipo.',
    })
  } catch (error) {
    console.error('POST /api/orders error:', error)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}

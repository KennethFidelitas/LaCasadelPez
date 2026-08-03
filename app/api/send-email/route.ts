// app/api/send-email/route.ts
// Endpoint general — delega al SDK de Resend via lib/email/sender.ts

import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import {
  sendLowStockAlert,
  sendOrderCancelledAlert,
  sendCriticalErrorAlert,
  sendWelcomeAccessEmail,
} from '@/lib/email/sender'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type = 'generic' } = body

    // Validar secret para llamadas automáticas desde Supabase triggers
    const internalSecret = request.headers.get('x-internal-secret')
    const expectedSecret = process.env.INTERNAL_EMAIL_SECRET
    const automaticTypes = ['low_stock', 'order_cancelled', 'critical_error']

    if (automaticTypes.includes(type) && expectedSecret && internalSecret !== expectedSecret) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }

    switch (type) {

      // ── RF-ID-010 Alerta 1: Stock bajo ──────────────────────────────────
      case 'low_stock': {
        const { productName, currentStock, threshold, productId, productType } = body
        if (!productName || currentStock === undefined || threshold === undefined) {
          return NextResponse.json({ error: 'Faltan campos: productName, currentStock, threshold.' }, { status: 400 })
        }
        const result = await sendLowStockAlert({ productName, currentStock, threshold, productId, productType: productType ?? 'product' })
        return NextResponse.json(result, { status: result.ok ? 200 : 502 })
      }

      // ── RF-ID-010 Alerta 2: Orden cancelada ─────────────────────────────
      case 'order_cancelled': {
        const { orderNumber, orderId, customerName, customerEmail, total, cancelledBy, reason } = body
        if (!orderNumber || !customerName || total === undefined || !cancelledBy) {
          return NextResponse.json({ error: 'Faltan campos: orderNumber, customerName, total, cancelledBy.' }, { status: 400 })
        }
        const result = await sendOrderCancelledAlert({ orderNumber, orderId, customerName, customerEmail, total, cancelledBy, reason })
        return NextResponse.json(result, { status: result.ok ? 200 : 502 })
      }

      // ── RF-ID-010 Alerta 3: Error crítico ───────────────────────────────
      case 'critical_error': {
        const { errorMessage, errorStack, context, occurredAt } = body
        if (!errorMessage) {
          return NextResponse.json({ error: 'Falta campo: errorMessage.' }, { status: 400 })
        }
        const result = await sendCriticalErrorAlert({
          errorMessage, errorStack, context,
          occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
        })
        return NextResponse.json(result, { status: result.ok ? 200 : 502 })
      }

      // ── RF-CL-002: Bienvenida con acceso ────────────────────────────────
      case 'welcome_access': {
        const { to, firstName } = body
        if (!to || !firstName) {
          return NextResponse.json({ error: 'Faltan campos: to, firstName.' }, { status: 400 })
        }
        const result = await sendWelcomeAccessEmail({ to, firstName })
        return NextResponse.json(result, { status: result.ok ? 200 : 502 })
      }

      // ── Envío genérico (uso manual desde el admin) ───────────────────────
      case 'generic':
      default: {
        const { to, subject, body: emailBody } = body
        if (!to || !subject || !emailBody) {
          return NextResponse.json({ error: 'Faltan datos: to, subject, body.' }, { status: 400 })
        }

        const apiKey = process.env.RESEND_API_KEY
        if (!apiKey) {
          console.log('[Email generic] Sin RESEND_API_KEY:', { to, subject })
          return NextResponse.json({ ok: true, message: 'Correo registrado en consola. Configurá RESEND_API_KEY para envío real.' })
        }

        const resend = new Resend(apiKey)
        const from = process.env.EMAIL_FROM ?? 'La Casa del Pez <notificaciones@lacasadelpez.com>'

        const { error } = await resend.emails.send({ from, to, subject, text: emailBody })

        if (error) {
          console.error('[Email generic] Resend SDK error:', error)
          return NextResponse.json({ error: error.message }, { status: 502 })
        }

        return NextResponse.json({ ok: true, message: 'Correo enviado correctamente.' })
      }
    }
  } catch (error) {
    console.error('[send-email] Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}

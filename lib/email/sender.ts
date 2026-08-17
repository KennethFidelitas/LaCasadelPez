// lib/email/sender.ts
// Módulo central de envío de correos con el SDK oficial de Resend
// RF-ID-010: alertas de stock bajo, orden cancelada, error crítico
// RF-CL-002: credenciales de acceso para clientes

import { Resend } from 'resend'
import { getSiteUrl } from '@/lib/site-url'

const FROM = process.env.EMAIL_FROM ?? 'La Casa del Pez <updates@lacasadelpez.com>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'kgomez90692@ufide.ac.cr'
const SITE_URL = getSiteUrl()

// ─── Singleton del cliente Resend

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[Email] RESEND_API_KEY no configurada. Los correos solo se registrarán en consola.')
    return null
  }
  return new Resend(key)
}

// ─── Tipos 

export interface SendResult {
  ok: boolean
  id?: string
  error?: string
}

// ─── Función base de envío 

async function sendEmail(params: {
  to: string | string[]
  subject: string
  html: string
  text?: string
}): Promise<SendResult> {
  const resend = getResend()

  if (!resend) {
    console.log('[Email] (sin envío real):', { to: params.to, subject: params.subject })
    return { ok: true }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
    })

    if (error) {
      console.error('[Email] Error Resend SDK:', error)
      return { ok: false, error: error.message }
    }

    console.info('[Email] Enviado via Resend:', {
      id: data?.id,
      to: params.to,
      subject: params.subject,
    })

    return { ok: true, id: data?.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[Email] Excepción:', msg)
    return { ok: false, error: msg }
  }
}

// ─── Template HTML base

function baseTemplate(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #f4f4f5; color: #111827; }
    .wrapper { max-width: 560px; margin: 32px auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; }
    .header { background: #0f172a; padding: 24px 32px; }
    .header h1 { color: #ffffff; font-size: 18px; font-weight: 700; }
    .header span { color: #94a3b8; font-size: 13px; }
    .body { padding: 28px 32px; }
    .body p { font-size: 14px; line-height: 1.6; color: #374151; margin-bottom: 12px; }
    .alert-box { border-radius: 6px; padding: 14px 16px; margin: 16px 0; font-size: 13px; }
    .alert-red { background: #fef2f2; border-left: 4px solid #ef4444; color: #7f1d1d; }
    .alert-yellow { background: #fffbeb; border-left: 4px solid #f59e0b; color: #78350f; }
    .alert-blue { background: #eff6ff; border-left: 4px solid #3b82f6; color: #1e3a5f; }
    .alert-green { background: #f0fdf4; border-left: 4px solid #22c55e; color: #14532d; }
    table.data { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    table.data th { background: #f9fafb; text-align: left; padding: 8px 10px; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 600; }
    table.data td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; }
    .btn { display: inline-block; background: #0f172a; color: #ffffff !important; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; margin-top: 16px; }
    .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 16px 32px; font-size: 11px; color: #9ca3af; text-align: center; }
    .mono { font-family: monospace; font-weight: bold; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>La Casa del Pez</h1>
      <span>Sistema de notificaciones</span>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      La Casa del Pez &nbsp;·&nbsp; ${new Date().toLocaleString('es-CR')} &nbsp;·&nbsp; Mensaje automático, no respondas este correo.
    </div>
  </div>
</body>
</html>`
}

// ─── RF-CL-002: Bienvenida con acceso 

export async function sendTemporaryPasswordEmail(params: {
  to: string
  firstName: string
  temporaryPassword: string
}): Promise<SendResult> {
  const html = baseTemplate(`
    <p>Hola <strong>${params.firstName}</strong>,</p>
    <p>Se creó tu cuenta en <strong>La Casa del Pez</strong> con acceso a la plataforma.</p>
    <div class="alert-box alert-blue">
      <strong>Contraseña temporal:</strong> ${params.temporaryPassword}
    </div>
    <p>Ingresa con tu correo y esta contraseña temporal. Luego podrás cambiarla desde la sección de perfil.</p>
    <a href="${SITE_URL}/auth/login" class="btn">Ir al inicio de sesión</a>
  `, 'Acceso temporal a La Casa del Pez')

  return sendEmail({
    to: params.to,
    subject: '🔐 Tu acceso temporal a La Casa del Pez',
    html,
    text: `Hola ${params.firstName}, tu cuenta fue creada. Contraseña temporal: ${params.temporaryPassword}. Ingresá en: ${SITE_URL}/auth/login`,
  })
}

export async function sendWelcomeAccessEmail(params: {
  to: string
  firstName: string
}): Promise<SendResult> {
  const html = baseTemplate(`
    <p>Hola <strong>${params.firstName}</strong>,</p>
    <p>El administrador de <strong>La Casa del Pez</strong> ha creado tu cuenta de acceso a la plataforma.</p>
    <div class="alert-box alert-blue">
      Recibirás en breve un correo separado de Supabase con el enlace para establecer tu contraseña.
      El enlace tiene una validez de <strong>24 horas</strong>.
    </div>
    <p>Una vez que configures tu contraseña, podrás:</p>
    <ul style="margin: 8px 0 12px 20px; font-size: 14px; color: #374151; line-height: 1.8;">
      <li>Consultar el estado de tus pedidos en tiempo real</li>
      <li>Ver el historial de compras</li>
      <li>Gestionar tus datos de contacto</li>
    </ul>
    <a href="${SITE_URL}/auth/login" class="btn">Ir al inicio de sesión</a>
  `, 'Bienvenido a La Casa del Pez')

  return sendEmail({
    to: params.to,
    subject: '🐠 Tu acceso a La Casa del Pez está listo',
    html,
    text: `Hola ${params.firstName}, el administrador ha creado tu cuenta. Recibirás un correo para establecer tu contraseña. Ingresá en: ${SITE_URL}/auth/login`,
  })
}

// ─── Bienvenida para registro autogestionado (auth/auth-form.tsx) 

export async function sendSelfRegistrationWelcomeEmail(params: {
  to: string
  firstName: string
}): Promise<SendResult> {
  const html = baseTemplate(`
    <p>Hola <strong>${params.firstName}</strong>,</p>
    <p>¡Gracias por crear tu cuenta en <strong>La Casa del Pez</strong>!</p>
    <div class="alert-box alert-green">
      Tu registro se completó correctamente. Ya podés iniciar sesión con el correo y la
      contraseña que elegiste.
    </div>
    <p>Desde tu cuenta vas a poder:</p>
    <ul style="margin: 8px 0 12px 20px; font-size: 14px; color: #374151; line-height: 1.8;">
      <li>Consultar el estado de tus pedidos en tiempo real</li>
      <li>Ver el historial de compras</li>
      <li>Gestionar tus datos de contacto</li>
    </ul>
    <a href="${SITE_URL}/auth/login" class="btn">Ir al inicio de sesión</a>
  `, 'Bienvenido a La Casa del Pez')

  return sendEmail({
    to: params.to,
    subject: '🐠 ¡Bienvenido a La Casa del Pez!',
    html,
    text: `Hola ${params.firstName}, gracias por registrarte en La Casa del Pez. Ya podés iniciar sesión en: ${SITE_URL}/auth/login`,
  })
}

export async function sendPasswordResetEmail(params: {
  to: string
  resetUrl: string
}): Promise<SendResult> {
  const html = baseTemplate(`
    <p>Hola,</p>
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>La Casa del Pez</strong>.</p>
    <div class="alert-box alert-blue">
      Este enlace es temporal. Si no solicitaste este cambio, podés ignorar este correo.
    </div>
    <a href="${params.resetUrl}" class="btn">Crear nueva contraseña</a>
  `, 'Restablecer contraseña')

  return sendEmail({
    to: params.to,
    subject: 'Restablecer contraseña - La Casa del Pez',
    html,
    text: `Restablecé tu contraseña en este enlace: ${params.resetUrl}`,
  })
}

// ─── RF-ID-010 Alerta 1: Stock bajo 

export async function sendLowStockAlert(params: {
  productName: string
  currentStock: number
  threshold: number
  productId: string
  productType: 'product' | 'animal'
}): Promise<SendResult> {
  const html = baseTemplate(`
    <p>Se ha detectado <strong>stock bajo</strong> en el inventario.</p>
    <div class="alert-box alert-yellow">
      El stock del siguiente ítem está por debajo del umbral mínimo configurado.
    </div>
    <table class="data">
      <tr><th>Ítem</th><td>${params.productName}</td></tr>
      <tr><th>Tipo</th><td>${params.productType === 'animal' ? 'Animal / Pez' : 'Producto'}</td></tr>
      <tr><th>Stock actual</th><td class="mono" style="color:#ef4444">${params.currentStock} unidades</td></tr>
      <tr><th>Umbral mínimo</th><td class="mono">${params.threshold} unidades</td></tr>
    </table>
    <p>Se recomienda realizar un pedido de reabastecimiento a la brevedad posible.</p>
    <a href="${SITE_URL}/admin?module=inventory" class="btn">Ver inventario</a>
  `, 'Alerta: Stock bajo')

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `Stock bajo: ${params.productName} (${params.currentStock} unidades)`,
    html,
    text: `ALERTA STOCK BAJO\nProducto: ${params.productName}\nStock actual: ${params.currentStock}\nUmbral mínimo: ${params.threshold}`,
  })
}

// ─── RF-ID-010 Alerta 2: Orden cancelada 

export async function sendOrderCancelledAlert(params: {
  orderNumber: string
  orderId: string
  customerName: string
  customerEmail: string | null
  total: number
  cancelledBy: 'customer' | 'admin'
  reason?: string
}): Promise<SendResult> {
  const cancelledByLabel = params.cancelledBy === 'admin' ? 'el administrador' : 'el cliente'
  const totalFormatted = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(params.total)

  const sharedContent = `
    <div class="alert-box alert-red">
      La orden <strong>#${params.orderNumber}</strong> ha sido cancelada por ${cancelledByLabel}.
    </div>
    <table class="data">
      <tr><th>Orden</th><td class="mono">#${params.orderNumber}</td></tr>
      <tr><th>Cliente</th><td>${params.customerName}</td></tr>
      <tr><th>Total</th><td class="mono">${totalFormatted}</td></tr>
      <tr><th>Cancelada por</th><td>${cancelledByLabel}</td></tr>
      ${params.reason ? `<tr><th>Motivo</th><td>${params.reason}</td></tr>` : ''}
    </table>
  `

  const adminResult = await sendEmail({
    to: ADMIN_EMAIL,
    subject: `Orden cancelada: #${params.orderNumber} — ${params.customerName}`,
    html: baseTemplate(`
      <p>Se ha cancelado una orden en el sistema.</p>
      ${sharedContent}
      <a href="${SITE_URL}/admin?module=orders" class="btn">Ver órdenes</a>
    `, 'Orden cancelada'),
    text: `Orden #${params.orderNumber} cancelada. Cliente: ${params.customerName}. Total: ${totalFormatted}.`,
  })

  let clientResult: SendResult = { ok: true }
  if (params.customerEmail) {
    clientResult = await sendEmail({
      to: params.customerEmail,
      subject: `Tu orden #${params.orderNumber} ha sido cancelada`,
      html: baseTemplate(`
        <p>Hola <strong>${params.customerName}</strong>,</p>
        <p>Te informamos que tu orden ha sido cancelada.</p>
        ${sharedContent}
        <p>Si tenés preguntas sobre esta cancelación, contactanos a través de nuestra tienda.</p>
        <a href="${SITE_URL}/cuenta" class="btn">Ver mis pedidos</a>
      `, 'Tu orden fue cancelada'),
      text: `Tu orden #${params.orderNumber} ha sido cancelada. Total: ${totalFormatted}. Contactanos si tenés preguntas.`,
    })
  }

  if (!adminResult.ok) return adminResult
  if (!clientResult.ok) return clientResult
  return { ok: true }
}

// ─── RF-ID-010 Alerta 3: Error crítico 

export async function sendCriticalErrorAlert(params: {
  errorMessage: string
  errorStack?: string
  context?: string
  occurredAt?: Date
}): Promise<SendResult> {
  const timestamp = (params.occurredAt ?? new Date()).toLocaleString('es-CR')

  const html = baseTemplate(`
    <div class="alert-box alert-red">
       Se ha detectado un <strong>error crítico</strong> en el sistema que puede afectar la operación normal.
    </div>
    <table class="data">
      <tr><th>Hora</th><td class="mono">${timestamp}</td></tr>
      ${params.context ? `<tr><th>Contexto</th><td>${params.context}</td></tr>` : ''}
      <tr><th>Error</th><td style="color:#dc2626;font-family:monospace;font-size:12px;word-break:break-all">${params.errorMessage}</td></tr>
    </table>
    ${params.errorStack ? `
    <details style="margin-top:12px">
      <summary style="cursor:pointer;font-size:12px;color:#6b7280">Ver stack trace</summary>
      <pre style="margin-top:8px;padding:12px;background:#f9fafb;border-radius:4px;font-size:11px;overflow-x:auto;white-space:pre-wrap;color:#374151">${params.errorStack}</pre>
    </details>` : ''}
    <p style="margin-top:16px">Revisá los logs del servidor para más detalles.</p>
  `, 'Error crítico del sistema')

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `Error crítico del sistema — ${timestamp}`,
    html,
    text: `ERROR CRÍTICO\nHora: ${timestamp}\nContexto: ${params.context ?? 'No especificado'}\nError: ${params.errorMessage}`,
  })
}

// ─── Helper: reportar errores sin interrumpir el flujo 

export async function reportCriticalError(
  error: unknown,
  context: string,
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error))
  await sendCriticalErrorAlert({
    errorMessage: err.message,
    errorStack: err.stack,
    context,
    occurredAt: new Date(),
  }).catch(console.error)
}

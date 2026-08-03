'use client'

// app/test-emails/client.tsx

import { useState } from 'react'
import { CheckCircle, Loader2, Send, XCircle } from 'lucide-react'

type TestCase = {
  id: string
  label: string
  description: string
  payload: Record<string, unknown>
}

const TEST_CASES: TestCase[] = [
  {
    id: 'welcome_access',
    label: '📧 RF-CL-002 — Bienvenida con acceso',
    description: 'Email que recibe el cliente cuando el admin le crea credenciales.',
    payload: {
      type: 'welcome_access',
      to: '', // se llena con el input
      firstName: 'Carlos',
    },
  },
  {
    id: 'low_stock',
    label: '⚠️ RF-ID-010 — Stock bajo',
    description: 'Alerta al admin cuando un producto cae por debajo del umbral mínimo.',
    payload: {
      type: 'low_stock',
      productName: 'Guppy Tropical (prueba)',
      currentStock: 3,
      threshold: 5,
      productId: 'test-id-001',
      productType: 'animal',
    },
  },
  {
    id: 'order_cancelled_admin',
    label: '🚫 RF-ID-010 — Orden cancelada (solo admin)',
    description: 'Notificación al admin cuando una orden es cancelada sin email de cliente.',
    payload: {
      type: 'order_cancelled',
      orderNumber: 'ORD-2026-TEST',
      orderId: 'test-order-id',
      customerName: 'María Rodríguez',
      customerEmail: null,
      total: 85000,
      cancelledBy: 'admin',
      reason: 'Prueba de cancelación por administrador',
    },
  },
  {
    id: 'order_cancelled_both',
    label: '🚫 RF-ID-010 — Orden cancelada (admin + cliente)',
    description: 'Notificación tanto al admin como al cliente con email.',
    payload: {
      type: 'order_cancelled',
      orderNumber: 'ORD-2026-TEST2',
      orderId: 'test-order-id-2',
      customerName: 'Juan Pérez',
      customerEmail: '', // se llena con el input
      total: 120000,
      cancelledBy: 'customer',
      reason: 'Prueba de cancelación por cliente',
    },
  },
  {
    id: 'critical_error',
    label: '🔴 RF-ID-010 — Error crítico del sistema',
    description: 'Alerta al admin con detalles de un error crítico simulado.',
    payload: {
      type: 'critical_error',
      errorMessage: 'Cannot read properties of undefined (reading "id") — TEST',
      errorStack: 'Error: Cannot read properties of undefined\n  at processOrder (lib/orders.ts:42:15)\n  at POST (app/api/orders/route.ts:28:5)',
      context: 'POST /api/orders — Prueba de alerta de error crítico',
      occurredAt: new Date().toISOString(),
    },
  },
  {
    id: 'generic',
    label: '📨 Genérico — Envío manual',
    description: 'Prueba del envío genérico que usa el admin para mensajes manuales.',
    payload: {
      type: 'generic',
      to: '', // se llena con el input
      subject: 'Prueba de correo genérico — La Casa del Pez',
      body: 'Este es un correo de prueba enviado desde el panel de administración de La Casa del Pez.',
    },
  },
]

type ResultMap = Record<string, { ok: boolean; message: string }>

export function TestEmailsClient() {
  const [testEmail, setTestEmail] = useState('')
  const [results, setResults] = useState<ResultMap>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  async function runTest(test: TestCase) {
    if (!testEmail.trim()) {
      alert('Ingresá un correo de prueba primero.')
      return
    }

    setLoading(prev => ({ ...prev, [test.id]: true }))
    setResults(prev => ({ ...prev, [test.id]: { ok: false, message: '' } }))

    // Inyectar el email de prueba en los campos vacíos
    const payload = { ...test.payload }
    if ('to' in payload && !payload.to) payload.to = testEmail
    if ('customerEmail' in payload && !payload.customerEmail) payload.customerEmail = testEmail

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      setResults(prev => ({
        ...prev,
        [test.id]: {
          ok: res.ok && data.ok !== false,
          message: data.error ?? data.message ?? (res.ok ? 'Enviado ✓' : 'Error desconocido'),
        },
      }))
    } catch (err) {
      setResults(prev => ({
        ...prev,
        [test.id]: { ok: false, message: 'Error de conexión.' },
      }))
    } finally {
      setLoading(prev => ({ ...prev, [test.id]: false }))
    }
  }

  async function runAll() {
    for (const test of TEST_CASES) {
      await runTest(test)
      // Pequeño delay entre envíos para no saturar la API de Resend
      await new Promise(r => setTimeout(r, 600))
    }
  }

  const allDone = TEST_CASES.every(t => results[t.id])
  const allOk = allDone && TEST_CASES.every(t => results[t.id]?.ok)

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6">
        <div className="mb-1 inline-block rounded bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
          Solo en desarrollo
        </div>
        <h1 className="text-2xl font-bold">Prueba de correos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Verificá que cada tipo de email se envíe correctamente con Resend.
          Los correos llegarán a la dirección que indiques abajo.
        </p>
      </div>

      {/* Input del email de prueba */}
      <div className="mb-6 rounded-lg border p-4">
        <label className="mb-1.5 block text-sm font-medium">
          Correo de prueba <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            placeholder="tu@email.com"
            className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button
            onClick={runAll}
            disabled={!testEmail || Object.values(loading).some(Boolean)}
            className="flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Probar todos
          </button>
        </div>
        <p className="mt-1.5 text-xs text-gray-400">
          Este correo recibirá todos los emails de prueba, incluyendo los que normalmente van al admin.
        </p>
      </div>

      {/* Resultado global */}
      {allDone && (
        <div className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-sm ${
          allOk ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {allOk
            ? <><CheckCircle className="h-4 w-4 shrink-0" /> Todos los correos enviados correctamente.</>
            : <><XCircle className="h-4 w-4 shrink-0" /> Algunos correos fallaron. Revisá los detalles abajo.</>
          }
        </div>
      )}

      {/* Lista de tests */}
      <div className="grid gap-3">
        {TEST_CASES.map(test => {
          const result = results[test.id]
          const isLoading = loading[test.id]

          return (
            <div key={test.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold">{test.label}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{test.description}</p>

                  {result && (
                    <div className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${
                      result.ok ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.ok
                        ? <CheckCircle className="h-3.5 w-3.5" />
                        : <XCircle className="h-3.5 w-3.5" />
                      }
                      {result.message}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => runTest(test)}
                  disabled={!testEmail || isLoading}
                  className="flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  {isLoading
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Send className="h-3.5 w-3.5" />
                  }
                  {isLoading ? 'Enviando...' : 'Probar'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-6 text-center text-xs text-gray-400">
        Si <code className="rounded bg-gray-100 px-1">RESEND_API_KEY</code> no está configurada,
        los correos solo se registran en la consola del servidor.
      </p>
    </div>
  )
}

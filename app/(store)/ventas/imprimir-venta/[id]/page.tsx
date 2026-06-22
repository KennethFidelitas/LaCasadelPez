"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/actions/button"
import { Spinner } from "@/components/ui/display/spinner"
import { AlertCircle, ArrowLeft, Printer } from "lucide-react"

interface PosTransaction {
  id: string
  transaction_number: string
  customer_name: string
  customer_id: string
  subtotal: number
  discount: number
  discount_type?: "amount" | "percent" | string
  discount_value?: number
  discount_reason?: string
  tax: number
  total: number
  payment_method: string
  cash_received: number
  cash_change: number
  card_amount: number
  credit_amount: number
  items: Array<{
    name: string
    quantity: number
    price: number
    subtotal: number
  }>
  status: string
  processed_by: string
  created_at: string
  profiles?: {
    first_name?: string
    last_name?: string
    email?: string
  } | null
}

export default function ImprimirVentaPage() {
  const params = useParams()
  const router = useRouter()
  const transactionId = params.id as string

  const [transaction, setTransaction] = useState<PosTransaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cargarTransaccion = async () => {
      try {
        console.log("🔍 Cargando transacción:", transactionId)

        const supabase = createClient()

        const { data, error: err } = await supabase
          .from("pos_transactions")
          .select(`
            *,
            profiles:processed_by (
              first_name,
              last_name,
              email
            )
          `)
          .eq("id", transactionId)
          .single()

        if (err) {
          console.error("❌ Error Supabase:", err)
          setError("No se pudo cargar la transacción")
          return
        }

        console.log("✅ Transacción cargada:", data)
        setTransaction(data as PosTransaction)
      } catch (err) {
        console.error("🔴 Error inesperado:", err)
        setError("Error cargando la factura")
      } finally {
        setLoading(false)
      }
    }

    if (transactionId) {
      cargarTransaccion()
    }
  }, [transactionId])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)

    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatMoney = (amount: number) => {
    return `₡${(amount || 0).toLocaleString()}`
  }

  const getSellerName = () => {
    if (!transaction) return "-"

    const firstName = transaction.profiles?.first_name || ""
    const lastName = transaction.profiles?.last_name || ""
    const fullName = `${firstName} ${lastName}`.trim()

    return fullName || transaction.profiles?.email || "-"
  }

  const getDiscountLabel = () => {
    if (!transaction || !transaction.discount || transaction.discount <= 0) {
      return ""
    }

    if (transaction.discount_type === "percent" && transaction.discount_value) {
      return `Descuento (${transaction.discount_value}%)`
    }

    return "Descuento"
  }

  const getPaymentMethodLabel = (method: string) => {
    if (method === "efectivo") return "Efectivo"
    if (method === "tarjeta") return "Tarjeta"
    if (method === "credito") return "Crédito"
    if (method === "mixto") return "Mixto"

    return method || "-"
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />

            <div>
              <p className="font-medium text-red-800">
                {error || "Factura no encontrada"}
              </p>

              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="mt-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const items = Array.isArray(transaction.items) ? transaction.items : []

  return (
    <>
      {/* Botones - solo visible en pantalla */}
      <div className="sticky top-0 z-10 flex gap-2 bg-white p-4 shadow print:hidden">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <Button onClick={handlePrint} className="ml-auto">
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
      </div>

      {/* Contenido de la factura */}
      <div className="mx-auto max-w-2xl bg-white p-8 print:p-0">
        {/* Encabezado */}
        <div className="mb-8 border-b-2 pb-6 text-center">
          <h1 className="text-2xl font-bold">LA CASA DEL PEZ</h1>
          <p className="text-sm text-slate-600">Tienda de Acuariofilia</p>
          <p className="mt-2 text-xs text-slate-500">
            Teléfono: +506 XXXX-XXXX | info@lacasadelpez.com
          </p>
        </div>

        {/* Info básica */}
        <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-600">Nº Transacción</p>
            <p className="font-semibold">
              {transaction.transaction_number || "-"}
            </p>
          </div>

          <div className="text-right">
            <p className="text-slate-600">Fecha</p>
            <p className="font-semibold">
              {formatDate(transaction.created_at)}
            </p>
          </div>

          <div>
            <p className="text-slate-600">Cliente</p>
            <p className="font-semibold">
              {transaction.customer_name || "Cliente General"}
            </p>
          </div>

          <div className="text-right">
            <p className="text-slate-600">Vendedor</p>
            <p className="font-semibold">{getSellerName()}</p>
          </div>
        </div>

        {/* Aviso de descuento */}
        {transaction.discount > 0 && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">
              Promoción aplicada
            </p>

            <p className="mt-1 text-sm text-emerald-700">
              {getDiscountLabel()}: -{formatMoney(transaction.discount)}
            </p>

            {transaction.discount_reason && (
              <p className="mt-1 text-xs text-emerald-700">
                Motivo: {transaction.discount_reason}
              </p>
            )}
          </div>
        )}

        {/* Tabla de items */}
        <div className="mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2">
                <th className="pb-2 text-left">Producto</th>
                <th className="pb-2 text-center">Cantidad</th>
                <th className="pb-2 text-right">Precio</th>
                <th className="pb-2 text-right">Subtotal</th>
              </tr>
            </thead>

            <tbody>
              {items.length > 0 ? (
                items.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2">{item.name || "-"}</td>
                    <td className="py-2 text-center">{item.quantity || 0}</td>
                    <td className="py-2 text-right">
                      {formatMoney(item.price)}
                    </td>
                    <td className="py-2 text-right">
                      {formatMoney(item.subtotal)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-500">
                    Sin items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="mb-6 space-y-2 border-t-2 pt-4">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>{formatMoney(transaction.subtotal)}</span>
          </div>

          {transaction.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>{getDiscountLabel()}:</span>
              <span>-{formatMoney(transaction.discount)}</span>
            </div>
          )}

          {transaction.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span>Impuesto:</span>
              <span>{formatMoney(transaction.tax)}</span>
            </div>
          )}

          <div className="flex justify-between border-t pt-2 text-lg font-bold">
            <span>Total:</span>
            <span>{formatMoney(transaction.total)}</span>
          </div>
        </div>

        {/* Método de pago */}
        <div className="mb-6 rounded-lg bg-slate-50 p-4">
          <p className="mb-3 font-semibold">Detalles del Pago</p>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Método:</span>
              <span className="font-medium">
                {getPaymentMethodLabel(transaction.payment_method)}
              </span>
            </div>

            {transaction.cash_received > 0 && (
              <>
                <div className="flex justify-between">
                  <span>Efectivo Recibido:</span>
                  <span>{formatMoney(transaction.cash_received)}</span>
                </div>

                {transaction.cash_change > 0 && (
                  <div className="flex justify-between">
                    <span>Cambio:</span>
                    <span>{formatMoney(transaction.cash_change)}</span>
                  </div>
                )}
              </>
            )}

            {transaction.card_amount > 0 && (
              <div className="flex justify-between">
                <span>Tarjeta:</span>
                <span>{formatMoney(transaction.card_amount)}</span>
              </div>
            )}

            {transaction.credit_amount > 0 && (
              <div className="flex justify-between">
                <span>Crédito:</span>
                <span>{formatMoney(transaction.credit_amount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pie */}
        <div className="border-t-2 pt-4 text-center">
          <p className="text-xs text-slate-500">¡Gracias por su compra!</p>

          <p className="mt-2 text-xs text-slate-400">
            Estado:{" "}
            <span className="font-semibold capitalize">
              {transaction.status}
            </span>
          </p>
        </div>
      </div>

      {/* Estilos para impresión */}
      <style>{`
        @media print {
          body {
            background: white;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:p-0 {
            padding: 0 !important;
          }

          * {
            box-shadow: none !important;
          }
        }
      `}</style>
    </>
  )
}
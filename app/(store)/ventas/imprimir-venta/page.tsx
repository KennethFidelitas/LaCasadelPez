"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/actions/button"
import { Spinner } from "@/components/ui/display/spinner"
import { AlertCircle, Printer } from "lucide-react"

interface Transaction {
  id: string
  transaction_number: string
  customer_name: string
  subtotal: number
  discount: number
  total: number
  status: string
  created_at: string
  processed_by: string
  profiles?: {
    first_name?: string
    last_name?: string
    email?: string
  } | null
}

export default function ImprimirVentasPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filtradas, setFiltradas] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const cargarTransacciones = async () => {
      try {
        console.log("🔍 Cargando transacciones...")

        const supabase = createClient()

        const { data, error: err } = await supabase
          .from("pos_transactions")
          .select(`
            id,
            transaction_number,
            customer_name,
            subtotal,
            discount,
            total,
            status,
            created_at,
            processed_by,
            profiles:processed_by (
              first_name,
              last_name,
              email
            )
          `)
          .order("created_at", { ascending: false })
          .limit(50)

        if (err) {
          console.error("❌ Error Supabase:", err)
          setError("No se pudo cargar las transacciones")
          return
        }

        console.log("✅ Transacciones cargadas:", data)

        setTransactions((data || []) as Transaction[])
        setFiltradas((data || []) as Transaction[])
      } catch (err) {
        console.error("🔴 Error inesperado:", err)
        setError("Error cargando transacciones")
      } finally {
        setLoading(false)
      }
    }

    cargarTransacciones()
  }, [])

  useEffect(() => {
    const filtered = transactions.filter((t) => {
      const searchLower = searchTerm.toLowerCase()
      const sellerName = getSellerName(t).toLowerCase()

      return (
        t.transaction_number?.toLowerCase().includes(searchLower) ||
        t.customer_name?.toLowerCase().includes(searchLower) ||
        sellerName.includes(searchLower)
      )
    })

    setFiltradas(filtered)
  }, [searchTerm, transactions])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return "Hoy"
    if (days === 1) return "Ayer"

    return date.toLocaleDateString("es-ES")
  }

  const formatMoney = (amount: number) => {
    return `₡${(amount || 0).toLocaleString()}`
  }

  const getSellerName = (transaction: Transaction) => {
    const firstName = transaction.profiles?.first_name || ""
    const lastName = transaction.profiles?.last_name || ""
    const fullName = `${firstName} ${lastName}`.trim()

    return fullName || transaction.profiles?.email || transaction.processed_by || "-"
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Imprimir Factura</h1>
          <p className="mt-2 text-slate-600">
            Selecciona una venta para imprimir el comprobante del cliente.
          </p>
        </div>

        {/* Búsqueda */}
        <div className="mb-6">
          <input
            placeholder="Buscar por nº transacción, cliente o vendedor"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 md:max-w-md"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Contenido */}
        {filtradas.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-100 p-8 text-center">
            <p className="text-slate-600">
              {transactions.length === 0
                ? "No hay transacciones"
                : "No hay coincidencias"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtradas.map((t) => (
              <div
                key={t.id}
                className="rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  {/* Info venta */}
                  <div className="flex-1">
                    <p className="font-semibold">{t.transaction_number}</p>

                    <p className="text-sm text-slate-600">
                      Cliente: {t.customer_name || "Cliente General"}
                    </p>

                    <p className="text-sm text-slate-600">
                      Vendedor: {getSellerName(t)}
                    </p>

                    {t.discount > 0 && (
                      <p className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                        Descuento aplicado: {formatMoney(t.discount)}
                      </p>
                    )}
                  </div>

                  {/* Montos */}
                  <div className="grid grid-cols-2 gap-4 text-right sm:grid-cols-4 md:flex md:items-center md:gap-6">
                    <div>
                      <p className="text-sm text-slate-600">Subtotal</p>
                      <p className="font-medium">{formatMoney(t.subtotal)}</p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-600">Descuento</p>
                      <p className="font-medium text-emerald-600">
                        -{formatMoney(t.discount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-600">Total</p>
                      <p className="font-semibold">{formatMoney(t.total)}</p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-600">Fecha</p>
                      <p className="text-sm font-medium">
                        {formatDate(t.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Estado e imprimir */}
                  <div className="flex items-center justify-end gap-3">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        t.status === "completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {t.status === "completed" ? "Completado" : t.status}
                    </span>

                    <Link href={`/ventas/imprimir-venta/${t.id}`}>
                      <Button size="sm">
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <p>
            Mostrando las últimas <strong>{transactions.length}</strong>{" "}
            transacciones. Usa la búsqueda para encontrar una factura específica.
          </p>
        </div>
      </div>
    </div>
  )
}
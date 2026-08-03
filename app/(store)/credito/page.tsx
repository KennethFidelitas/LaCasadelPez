"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getCreditManagementData } from "@/lib/credits/actions"
import type { CreditItem } from "@/lib/credits/types"
import { formatPrice } from "@/lib/format"

export default function ConsultarCreditosPage() {
  const [creditos, setCreditos] = useState<CreditItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cargarCreditos = async () => {
      try {
        const data = await getCreditManagementData()
        setCreditos(data.credits)
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron cargar los créditos.")
      } finally {
        setLoading(false)
      }
    }

    cargarCreditos()
  }, [])

  const creditosFiltrados = creditos.filter((credito) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      credito.customer.toLowerCase().includes(searchLower) ||
      credito.seller.toLowerCase().includes(searchLower) ||
      credito.status.toLowerCase().includes(searchLower) ||
      credito.notes.toLowerCase().includes(searchLower) ||
      credito.id.toLowerCase().includes(searchLower)
    )
  })

  const totalCreditos = creditos.length
  const creditosActivos = creditos.filter((credito) => credito.status === "Activo").length
  const saldoTotal = creditos.reduce((total, credito) => total + credito.balance, 0)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES")
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-slate-500">Créditos</p>

            <h1 className="text-2xl font-bold">
              Consulta de créditos
            </h1>

            <p className="text-slate-600">
              Consulte los créditos registrados, el saldo pendiente y el estado
              actual del cliente.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="w-fit rounded-md border px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Volver
          </Link>
        </div>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Créditos registrados</p>
            <p className="mt-2 text-2xl font-bold">{totalCreditos}</p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Créditos activos</p>
            <p className="mt-2 text-2xl font-bold">{creditosActivos}</p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Saldo total pendiente</p>
            <p className="mt-2 text-2xl font-bold">
              {formatPrice(saldoTotal)}
            </p>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Créditos de clientes
              </h2>
              <p className="text-sm text-slate-500">
                Información disponible para el vendedor.
              </p>
            </div>

            <input
              placeholder="Buscar por cliente, vendedor, estado o descripción"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border px-3 py-2 md:max-w-md"
            />
          </div>

          {error ? (
            <div className="py-8 text-center text-red-600">{error}</div>
          ) : loading ? (
            <div className="py-8 text-center text-slate-500">Cargando créditos...</div>
          ) : creditosFiltrados.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              {creditos.length === 0 ? "No hay créditos registrados" : "No se encontraron resultados"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3">Crédito</th>
                    <th className="py-3">Cliente</th>
                    <th className="py-3">Monto</th>
                    <th className="py-3">Saldo</th>
                    <th className="py-3">Descripción</th>
                    <th className="py-3">Estado</th>
                    <th className="py-3">Fecha</th>
                  </tr>
                </thead>

                <tbody>
                  {creditosFiltrados.map((credito) => {
                    const estaActivo = credito.status === "Activo"

                    return (
                      <tr key={credito.id} className="border-b last:border-0">
                        <td className="py-3 font-medium text-xs">CR-{credito.id.slice(0, 8).toUpperCase()}</td>
                        <td className="py-3">{credito.customer}</td>
                        <td className="py-3">{formatPrice(credito.amount)}</td>
                        <td className="py-3 font-medium">
                          {formatPrice(credito.balance)}
                        </td>
                        <td className="py-3 text-slate-500">
                          {credito.notes || "-"}
                        </td>
                        <td className="py-3">
                          <span
                            className={
                              estaActivo
                                ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"
                                : "rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                            }
                          >
                            {credito.status}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500">
                          {formatDate(credito.createdAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

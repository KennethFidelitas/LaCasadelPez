"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function ConsultarCreditosPage() {
  const [creditos, setCreditos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const cargarCreditos = async () => {
      try {
        const supabase = createClient()

        console.log("🔍 Intentando cargar créditos...")

        // Obtener créditos con información del cliente
        const { data, error } = await supabase
          .from("credits")
          .select(`
            id,
            user_id,
            amount,
            balance,
            type,
            description,
            created_at
          `)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("❌ Error de Supabase:", error)
          throw error
        }

        console.log("✅ Créditos cargados:", data)
        setCreditos(data || [])
      } catch (err: any) {
        console.error("🔴 Error completo cargando créditos:", err)
        console.error("Mensaje:", err?.message)
        console.error("Código:", err?.code)
      } finally {
        setLoading(false)
      }
    }

    cargarCreditos()
  }, [])

  const creditosFiltrados = creditos.filter((credito) => {
    const searchLower = searchTerm.toLowerCase()
    const tipo = (credito.type || "").toLowerCase()
    const descripcion = (credito.description || "").toLowerCase()
    return tipo.includes(searchLower) || descripcion.includes(searchLower)
  })

  const totalCreditos = creditos.length
  const creditosActivos = creditos.filter((c) => c.balance > 0).length
  const saldoTotal = creditos.reduce((total, credito) => total + (credito.balance || 0), 0)

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
              ₡{saldoTotal.toLocaleString()}
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
              placeholder="Buscar por tipo o descripción"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border px-3 py-2 md:max-w-md"
            />
          </div>

          {loading ? (
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
                    <th className="py-3">Usuario ID</th>
                    <th className="py-3">Tipo</th>
                    <th className="py-3">Monto</th>
                    <th className="py-3">Saldo</th>
                    <th className="py-3">Descripción</th>
                    <th className="py-3">Estado</th>
                    <th className="py-3">Fecha</th>
                  </tr>
                </thead>

                <tbody>
                  {creditosFiltrados.map((credito) => {
                    const saldo = credito.balance || 0
                    const monto = credito.amount || 0
                    const estaActivo = saldo > 0

                    return (
                      <tr key={credito.id} className="border-b last:border-0">
                        <td className="py-3 font-medium text-xs">{credito.user_id || "-"}</td>
                        <td className="py-3">{credito.type || "-"}</td>
                        <td className="py-3">₡{monto.toLocaleString()}</td>
                        <td className="py-3 font-medium">
                          ₡{saldo.toLocaleString()}
                        </td>
                        <td className="py-3 text-slate-500">
                          {credito.description || "-"}
                        </td>
                        <td className="py-3">
                          <span
                            className={
                              estaActivo
                                ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"
                                : "rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                            }
                          >
                            {estaActivo ? "Activo" : "Cancelado"}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500">
                          {formatDate(credito.created_at)}
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
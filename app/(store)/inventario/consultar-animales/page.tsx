"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function ConsultarInventarioAnimalesPage() {
  const [animales, setAnimales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const cargarAnimales = async () => {
      try {
        const supabase = createClient()

        const { data, error } = await supabase
          .from("animals")
          .select(`
            id,
            name,
            sku,
            cost,
            price,
            is_active,
            updated_at,
            inventory (
              id,
              quantity,
              location,
              low_stock_threshold
            )
          `)
          .eq("is_active", true)
          .order("updated_at", { ascending: false })

        if (error) throw error

        setAnimales(data || [])
      } catch (err) {
        console.error("Error cargando animales:", err)
      } finally {
        setLoading(false)
      }
    }

    cargarAnimales()
  }, [])

  const animalesFiltrados = animales.filter((animal) =>
    animal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    animal.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    animal.inventory?.[0]?.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalAnimales = animales.length
  const totalUnidades = animales.reduce(
    (total, animal) => total + (animal.inventory?.[0]?.quantity || 0),
    0
  )
  const bajoStock = animales.filter(
    (animal) => 
      (animal.inventory?.[0]?.quantity || 0) < (animal.inventory?.[0]?.low_stock_threshold || 5)
  ).length
  const ubicaciones = new Set(
    animales
      .map((animal) => animal.inventory?.[0]?.location)
      .filter(Boolean)
  ).size

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Hoy"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ayer"
    } else {
      return date.toLocaleDateString("es-ES")
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-slate-500">Inventario</p>

            <h1 className="text-2xl font-bold">
              Inventario actual de animales
            </h1>

            <p className="text-slate-600">
              Consulte las existencias actuales de animales, ubicación, costos y
              estado de stock.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="w-fit rounded-md border px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Volver
          </Link>
        </div>

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Tipos de animales</p>
            <p className="mt-2 text-2xl font-bold">{totalAnimales}</p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Unidades disponibles</p>
            <p className="mt-2 text-2xl font-bold">{totalUnidades}</p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Bajo stock</p>
            <p className="mt-2 text-2xl font-bold text-red-600">{bajoStock}</p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Ubicaciones</p>
            <p className="mt-2 text-2xl font-bold">{ubicaciones}</p>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Listado de animales</h2>
              <p className="text-sm text-slate-500">
                Información disponible para vendedores y administradores.
              </p>
            </div>

            <input
              placeholder="Buscar por nombre, SKU o ubicación"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border px-3 py-2 md:max-w-md"
            />
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-500">Cargando animales...</div>
          ) : animalesFiltrados.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              {animales.length === 0 ? "No hay animales registrados" : "No se encontraron resultados"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3">Animal</th>
                    <th className="py-3">SKU</th>
                    <th className="py-3">Cantidad</th>
                    <th className="py-3">Mínimo</th>
                    <th className="py-3">Ubicación</th>
                    <th className="py-3">Costo</th>
                    <th className="py-3">Precio</th>
                    <th className="py-3">Estado</th>
                    <th className="py-3">Actualizado</th>
                  </tr>
                </thead>

                <tbody>
                  {animalesFiltrados.map((animal) => {
                    const inv = animal.inventory?.[0]
                    const cantidad = inv?.quantity || 0
                    const minimo = inv?.low_stock_threshold || 5
                    const estaBajoStock = cantidad < minimo

                    return (
                      <tr key={animal.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{animal.name}</td>
                        <td className="py-3 text-slate-500">{animal.sku}</td>
                        <td className="py-3">
                          <span
                            className={
                              estaBajoStock
                                ? "rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700"
                                : "rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700"
                            }
                          >
                            {cantidad}
                          </span>
                        </td>
                        <td className="py-3">{minimo}</td>
                        <td className="py-3">{inv?.location || "-"}</td>
                        <td className="py-3">₡{animal.cost?.toLocaleString() || "0"}</td>
                        <td className="py-3">₡{animal.price?.toLocaleString() || "0"}</td>
                        <td className="py-3">
                          <span
                            className={
                              estaBajoStock
                                ? "rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
                                : "rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"
                            }
                          >
                            {estaBajoStock ? "Bajo stock" : "Disponible"}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500">{formatDate(animal.updated_at)}</td>
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

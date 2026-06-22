"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function ModificarLotePage() {
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
            price,
            cost,
            is_active,
            inventory (
              quantity,
              location
            )
          `)
          .eq("is_active", true)

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
    animal.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    animal.inventory?.[0]?.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 space-y-2">
          <p className="text-slate-600">Inventario</p>

          <h1 className="text-2xl font-bold">
            Modificar información de animales
          </h1>

          <p className="text-slate-600">
            Busque un animal existente y actualice su información.
          </p>
        </div>

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Animales registrados</h2>
              <p className="text-sm text-slate-500">
                Seleccione el animal que desea modificar.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="rounded-md border px-4 py-2 text-sm font-medium"
            >
              Volver
            </Link>
          </div>

          <div className="mb-6">
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
                    <th className="py-3">Ubicación</th>
                    <th className="py-3">Costo</th>
                    <th className="py-3">Precio</th>
                    <th className="py-3 text-right">Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {animalesFiltrados.map((animal) => (
                    <tr key={animal.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{animal.name}</td>
                      <td className="py-3 text-slate-500">{animal.sku}</td>
                      <td className="py-3">
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                          {animal.inventory?.[0]?.quantity || 0}
                        </span>
                      </td>
                      <td className="py-3">{animal.inventory?.[0]?.location || "-"}</td>
                      <td className="py-3">₡{animal.cost?.toLocaleString() || "0"}</td>
                      <td className="py-3">₡{animal.price?.toLocaleString() || "0"}</td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/inventario/modificar-lote/${animal.id}`}
                          className="rounded-md bg-[#006f95] px-4 py-2 text-sm font-medium text-white hover:bg-[#005f80]"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
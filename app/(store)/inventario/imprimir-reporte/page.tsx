"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, Printer } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/actions/button"

interface AnimalInventario {
  id: string
  name: string
  scientific_name: string | null
  sku: string | null
  cost: number | null
  price: number | null
  care_level: string | null
  inventory: {
    quantity: number
    location: string | null
    low_stock_threshold: number
  }[]
}

type FiltroEstado = "todos" | "disponible" | "bajo_stock"
type FiltroCuidado = "todos" | "facil" | "moderado" | "avanzado"

const CARE_LEVEL_LABEL: Record<string, string> = {
  facil: "Fácil",
  moderado: "Moderado",
  avanzado: "Avanzado",
}

export default function ImprimirReporteInventarioPage() {
  const [animales, setAnimales] = useState<AnimalInventario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos")
  const [filtroCuidado, setFiltroCuidado] = useState<FiltroCuidado>("todos")

  const [fechaGeneracion] = useState(() =>
    new Date().toLocaleDateString("es-CR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  )

  useEffect(() => {
    const cargarAnimales = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("animals")
          .select(`
            id,
            name,
            scientific_name,
            sku,
            cost,
            price,
            care_level,
            inventory (
              quantity,
              location,
              low_stock_threshold
            )
          `)
          .eq("is_active", true)
          .order("name", { ascending: true })

        if (error) throw error
        setAnimales((data as AnimalInventario[]) || [])
      } catch (err) {
        console.error("Error cargando inventario:", err)
        setError("No se pudo cargar el inventario.")
      } finally {
        setLoading(false)
      }
    }

    cargarAnimales()
  }, [])

  const animalesFiltrados = useMemo(() => {
    return animales.filter((animal) => {
      const inv = animal.inventory?.[0]
      const cantidad = inv?.quantity || 0
      const minimo = inv?.low_stock_threshold || 5
      const estaBajoStock = cantidad < minimo

      if (filtroEstado === "disponible" && estaBajoStock) return false
      if (filtroEstado === "bajo_stock" && !estaBajoStock) return false
      if (filtroCuidado !== "todos" && animal.care_level !== filtroCuidado) return false

      return true
    })
  }, [animales, filtroEstado, filtroCuidado])

  const totalTipos = animalesFiltrados.length
  const totalUnidades = animalesFiltrados.reduce(
    (sum, a) => sum + (a.inventory?.[0]?.quantity || 0),
    0
  )
  const valorTotalInventario = animalesFiltrados.reduce(
    (sum, a) => sum + (a.inventory?.[0]?.quantity || 0) * (a.cost || 0),
    0
  )
  const bajoStockCount = animalesFiltrados.filter(
    (a) =>
      (a.inventory?.[0]?.quantity || 0) <
      (a.inventory?.[0]?.low_stock_threshold || 5)
  ).length

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Cargando inventario...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" asChild>
          <Link href="/admin">Volver al panel</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @media print {
          header, footer, nav, aside,
          [data-slot="store-header"],
          [data-slot="store-footer"],
          [data-slot="cart-drawer"] { display: none !important; }
          body { background: white !important; }
          .print-page { padding: 0 !important; }
          table { page-break-inside: auto; border-collapse: collapse; }
          tr { page-break-inside: avoid; }
          thead { display: table-header-group; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* Barra de acciones — oculta al imprimir */}
      <div className="print:hidden sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <label className="font-medium text-muted-foreground">Stock:</label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
                className="rounded-md border bg-background px-2 py-1 text-sm"
              >
                <option value="todos">Todos</option>
                <option value="disponible">Disponible</option>
                <option value="bajo_stock">Bajo stock</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <label className="font-medium text-muted-foreground">Categoría:</label>
              <select
                value={filtroCuidado}
                onChange={(e) => setFiltroCuidado(e.target.value as FiltroCuidado)}
                className="rounded-md border bg-background px-2 py-1 text-sm"
              >
                <option value="todos">Todos</option>
                <option value="facil">Fácil</option>
                <option value="moderado">Moderado</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </div>

            <span className="text-sm text-muted-foreground">
              {totalTipos} de {animales.length} animales
            </span>

            <Button size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido del reporte */}
      <div className="print-page mx-auto max-w-5xl px-6 py-8 text-sm text-foreground">

        {/* Encabezado del documento */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">La Casa del Pez</h1>
            <p className="text-muted-foreground">Acuarios y Peces Tropicales</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">Reporte de Inventario</p>
            <p className="text-muted-foreground">Generado el {fechaGeneracion}</p>
          </div>
        </div>

        <hr className="mb-6 border-border" />

        {/* Tarjetas de resumen */}
        <div className="mb-8 grid grid-cols-4 gap-4">
          <div className="rounded-lg border p-4 text-center">
            <p className="text-xs text-muted-foreground">Tipos de animales</p>
            <p className="mt-1 text-2xl font-bold">{totalTipos}</p>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <p className="text-xs text-muted-foreground">Total unidades</p>
            <p className="mt-1 text-2xl font-bold">{totalUnidades}</p>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <p className="text-xs text-muted-foreground">Bajo stock</p>
            <p className="mt-1 text-2xl font-bold text-destructive">{bajoStockCount}</p>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <p className="text-xs text-muted-foreground">Valor total (costo)</p>
            <p className="mt-1 text-xl font-bold">₡{valorTotalInventario.toLocaleString()}</p>
          </div>
        </div>

        {/* Tabla */}
        {animalesFiltrados.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            No hay animales que coincidan con los filtros seleccionados.
          </p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="py-3 pr-4">Animal</th>
                <th className="py-3 pr-4">Categoría</th>
                <th className="py-3 pr-4">SKU</th>
                <th className="py-3 pr-4 text-right">Cant.</th>
                <th className="py-3 pr-4 text-right">Mín.</th>
                <th className="py-3 pr-4">Ubicación</th>
                <th className="py-3 pr-4 text-right">Costo unit.</th>
                <th className="py-3 pr-4 text-right">Precio venta</th>
                <th className="py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {animalesFiltrados.map((animal) => {
                const inv = animal.inventory?.[0]
                const cantidad = inv?.quantity || 0
                const minimo = inv?.low_stock_threshold || 5
                const estaBajoStock = cantidad < minimo

                return (
                  <tr key={animal.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium">{animal.name}</p>
                      {animal.scientific_name && (
                        <p className="text-xs italic text-muted-foreground">
                          {animal.scientific_name}
                        </p>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {CARE_LEVEL_LABEL[animal.care_level ?? ""] ?? "—"}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                      {animal.sku || "—"}
                    </td>
                    <td className={`py-3 pr-4 text-right font-semibold ${estaBajoStock ? "text-destructive" : ""}`}>
                      {cantidad}
                    </td>
                    <td className="py-3 pr-4 text-right text-muted-foreground">{minimo}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{inv?.location || "—"}</td>
                    <td className="py-3 pr-4 text-right">
                      ₡{animal.cost?.toLocaleString() || "0"}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      ₡{animal.price?.toLocaleString() || "0"}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={
                          estaBajoStock
                            ? "rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"
                            : "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
                        }
                      >
                        {estaBajoStock ? "Bajo stock" : "Disponible"}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Totales finales */}
        <div className="mt-8 rounded-lg border bg-muted/30 px-6 py-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipos de animales</span>
              <span className="font-bold">{totalTipos}</span>
            </div>
            <div className="flex justify-between border-x border-border px-4">
              <span className="text-muted-foreground">Total unidades</span>
              <span className="font-bold">{totalUnidades}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor total del inventario</span>
              <span className="font-bold">₡{valorTotalInventario.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Pie de página */}
        <hr className="mb-4 mt-8 border-border" />
        <p className="text-center text-xs text-muted-foreground">
          La Casa del Pez · Reporte de Inventario · {fechaGeneracion}
        </p>
      </div>
    </>
  )
}

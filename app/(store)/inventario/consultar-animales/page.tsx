import Link from "next/link"

export default function ConsultarInventarioAnimalesPage() {
  const inventarioAnimales = [
    {
      id: 1,
      animal: "Betta Halfmoon",
      sku: "PZ-BET",
      categoria: "Peces",
      cantidad: 3,
      minimo: 4,
      ubicacion: "Área viva",
      costo: 7000,
      estado: "Bajo stock",
      actualizado: "Hoy",
    },
    {
      id: 2,
      animal: "Guppy Fancy",
      sku: "PZ-GUP",
      categoria: "Peces",
      cantidad: 12,
      minimo: 5,
      ubicacion: "Mostrador",
      costo: 2500,
      estado: "Disponible",
      actualizado: "Hoy",
    },
    {
      id: 3,
      animal: "Goldfish",
      sku: "PZ-GOL",
      categoria: "Peces",
      cantidad: 8,
      minimo: 5,
      ubicacion: "Bodega A",
      costo: 3500,
      estado: "Disponible",
      actualizado: "Ayer",
    },
    {
      id: 4,
      animal: "Corydora Panda",
      sku: "PZ-COR",
      categoria: "Peces",
      cantidad: 2,
      minimo: 6,
      ubicacion: "Área viva",
      costo: 4200,
      estado: "Bajo stock",
      actualizado: "Hoy",
    },
  ]

  const totalAnimales = inventarioAnimales.length
  const totalUnidades = inventarioAnimales.reduce(
    (total, item) => total + item.cantidad,
    0
  )
  const bajoStock = inventarioAnimales.filter(
    (item) => item.cantidad < item.minimo
  ).length
  const ubicaciones = new Set(inventarioAnimales.map((item) => item.ubicacion))
    .size

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
              className="w-full rounded-md border px-3 py-2 md:max-w-md"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-3">Animal</th>
                  <th className="py-3">SKU</th>
                  <th className="py-3">Categoría</th>
                  <th className="py-3">Cantidad</th>
                  <th className="py-3">Mínimo</th>
                  <th className="py-3">Ubicación</th>
                  <th className="py-3">Costo</th>
                  <th className="py-3">Estado</th>
                  <th className="py-3">Actualizado</th>
                </tr>
              </thead>

              <tbody>
                {inventarioAnimales.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{item.animal}</td>
                    <td className="py-3 text-slate-500">{item.sku}</td>
                    <td className="py-3">{item.categoria}</td>
                    <td className="py-3">
                      <span
                        className={
                          item.cantidad < item.minimo
                            ? "rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700"
                            : "rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700"
                        }
                      >
                        {item.cantidad}
                      </span>
                    </td>
                    <td className="py-3">{item.minimo}</td>
                    <td className="py-3">{item.ubicacion}</td>
                    <td className="py-3">₡{item.costo.toLocaleString()}</td>
                    <td className="py-3">
                      <span
                        className={
                          item.estado === "Bajo stock"
                            ? "rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
                            : "rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"
                        }
                      >
                        {item.estado}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">{item.actualizado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}
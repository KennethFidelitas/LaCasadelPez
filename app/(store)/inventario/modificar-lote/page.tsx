import Link from "next/link"

export default function ModificarLotePage() {
  const lotes = [
    {
      id: 1,
      animal: "Betta Halfmoon",
      sku: "PZ-BET",
      cantidad: 3,
      ubicacion: "Area viva",
      costo: 7000,
      estado: "Activo",
    },
    {
      id: 2,
      animal: "Guppy Fancy",
      sku: "PZ-GUP",
      cantidad: 12,
      ubicacion: "Mostrador",
      costo: 2500,
      estado: "Activo",
    },
    {
      id: 3,
      animal: "Goldfish",
      sku: "PZ-GOL",
      cantidad: 8,
      ubicacion: "Bodega A",
      costo: 3500,
      estado: "Activo",
    },
  ]

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 space-y-2">
          <p className="text-slate-600">Inventario</p>

          <h1 className="text-2xl font-bold">
            Modificar información de lote de animales
          </h1>

          <p className="text-slate-600">
            Busque un lote existente y actualice su información de inventario.
          </p>
        </div>

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Lotes registrados</h2>
              <p className="text-sm text-slate-500">
                Seleccione el lote que desea modificar.
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
              className="w-full rounded-md border px-3 py-2 md:max-w-md"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-3">Animal</th>
                  <th className="py-3">SKU</th>
                  <th className="py-3">Cantidad</th>
                  <th className="py-3">Ubicación</th>
                  <th className="py-3">Costo</th>
                  <th className="py-3">Estado</th>
                  <th className="py-3 text-right">Acción</th>
                </tr>
              </thead>

              <tbody>
                {lotes.map((lote) => (
                  <tr key={lote.id} className="border-b">
                    <td className="py-3 font-medium">{lote.animal}</td>
                    <td className="py-3 text-slate-500">{lote.sku}</td>
                    <td className="py-3">{lote.cantidad}</td>
                    <td className="py-3">{lote.ubicacion}</td>
                    <td className="py-3">₡{lote.costo.toLocaleString()}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                        {lote.estado}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/inventario/modificar-lote/${lote.id}`}
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
        </section>
      </div>
    </main>
  )
}
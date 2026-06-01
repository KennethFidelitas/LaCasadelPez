import Link from "next/link"

export default function ConsultarCreditosPage() {
  const creditos = [
    {
      id: 1,
      numero: "CR-0001",
      cliente: "Carlos Araya",
      cedula: "1-1234-0567",
      fecha: "2026-05-30",
      montoOriginal: 125000,
      abonos: 40000,
      saldo: 85000,
      estado: "Activo",
      vendedor: "Vendedor Demo",
    },
    {
      id: 2,
      numero: "CR-0002",
      cliente: "Valeria Mora",
      cedula: "2-0456-0789",
      fecha: "2026-05-28",
      montoOriginal: 78000,
      abonos: 78000,
      saldo: 0,
      estado: "Cancelado",
      vendedor: "Vendedor Demo",
    },
    {
      id: 3,
      numero: "CR-0003",
      cliente: "Andrea Coto",
      cedula: "3-0987-0123",
      fecha: "2026-05-25",
      montoOriginal: 95000,
      abonos: 25000,
      saldo: 70000,
      estado: "Activo",
      vendedor: "Vendedor Demo",
    },
  ]

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
            <p className="mt-2 text-2xl font-bold">{creditos.length}</p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Créditos activos</p>
            <p className="mt-2 text-2xl font-bold">
              {creditos.filter((credito) => credito.estado === "Activo").length}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Saldo total pendiente</p>
            <p className="mt-2 text-2xl font-bold">
              ₡
              {creditos
                .reduce((total, credito) => total + credito.saldo, 0)
                .toLocaleString()}
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
              placeholder="Buscar por cliente, cédula o número de crédito"
              className="w-full rounded-md border px-3 py-2 md:max-w-md"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-3">N° Crédito</th>
                  <th className="py-3">Cliente</th>
                  <th className="py-3">Cédula</th>
                  <th className="py-3">Fecha</th>
                  <th className="py-3">Monto original</th>
                  <th className="py-3">Abonos</th>
                  <th className="py-3">Saldo</th>
                  <th className="py-3">Estado</th>
                  <th className="py-3">Vendedor</th>
                </tr>
              </thead>

              <tbody>
                {creditos.map((credito) => (
                  <tr key={credito.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{credito.numero}</td>
                    <td className="py-3">{credito.cliente}</td>
                    <td className="py-3 text-slate-500">{credito.cedula}</td>
                    <td className="py-3">{credito.fecha}</td>
                    <td className="py-3">
                      ₡{credito.montoOriginal.toLocaleString()}
                    </td>
                    <td className="py-3">
                      ₡{credito.abonos.toLocaleString()}
                    </td>
                    <td className="py-3 font-medium">
                      ₡{credito.saldo.toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span
                        className={
                          credito.estado === "Activo"
                            ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"
                            : "rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                        }
                      >
                        {credito.estado}
                      </span>
                    </td>
                    <td className="py-3">{credito.vendedor}</td>
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
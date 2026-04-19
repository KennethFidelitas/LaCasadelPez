"use client";

import { useState } from "react";

type Cliente = {
  id: number;
  nombre: string;
  correo: string;
  estado: "Activo" | "Inactivo" | "Suspendido";
  saldo: number;
  credito: number;
  historial: number[];
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([
    {
      id: 1,
      nombre: "Juan Pérez",
      correo: "juan@email.com",
      estado: "Activo",
      saldo: 50000,
      credito: 100000,
      historial: [20000, -5000]
    },

     {
      id: 2,
      nombre: "Ana Morales",
      correo: "ana@email.com",
      estado: "Activo",
      saldo: 30000,
      credito: 200000,
      historial: [20000, -5000]
    },

      {
      id: 3,
      nombre: "Miguel Mora",
      correo: "miguel@email.com",
      estado: "Activo",
      saldo: 10000,
      credito: 100000,
      historial: [10000, -5000]
    }
    
  ]);

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [editando, setEditando] = useState<number | null>(null);

  // AGREGAR
  const agregarCliente = () => {
    if (!nombre || !correo) return;

    const nuevo: Cliente = {
      id: Date.now(),
      nombre,
      correo,
      estado: "Activo",
      saldo: 0,
      credito: 0,
      historial: []
    };

    setClientes([...clientes, nuevo]);
    setNombre("");
    setCorreo("");
  };

  // ELIMINAR
  const eliminarCliente = (id: number) => {
    setClientes(clientes.filter(c => c.id !== id));
  };

  // EDITAR
  const actualizarCliente = (id: number, campo: string, valor: any) => {
    const nuevos = clientes.map(c =>
      c.id === id ? { ...c, [campo]: valor } : c
    );
    setClientes(nuevos);
  };

  // CRÉDITO
  const agregarCredito = (id: number) => {
    const nuevos = clientes.map(c =>
      c.id === id
        ? {
            ...c,
            credito: c.credito + 10000,
            historial: [...c.historial, 10000]
          }
        : c
    );
    setClientes(nuevos);
  };

  return (
    <div className="max-w-6xl mx-auto p-10">

      <h1 className="text-3xl font-bold mb-6">Gestión de Clientes</h1>

      {/* FORMULARIO */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6 flex gap-3">
        <input
          className="border p-2 rounded w-full"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        <input
          className="border p-2 rounded w-full"
          placeholder="Correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />

        <button
          onClick={agregarCliente}
          className="bg-blue-500 text-white px-5 py-2 rounded hover:bg-blue-600"
        >
          Agregar
        </button>

        <button
          onClick={() => window.print()}
          className="bg-gray-500 text-white px-5 py-2 rounded"
        >
          Imprimir
        </button>
      </div>

      {/* TABLA */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Nombre</th>
              <th className="p-3">Correo</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Saldo</th>
              <th className="p-3">Crédito</th>
              <th className="p-3">Historial</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {clientes.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">

                <td className="p-3">{c.id}</td>

                {/* NOMBRE EDITABLE */}
                <td className="p-3">
                  {editando === c.id ? (
                    <input
                      value={c.nombre}
                      onChange={(e) =>
                        actualizarCliente(c.id, "nombre", e.target.value)
                      }
                      className="border p-1"
                    />
                  ) : (
                    c.nombre
                  )}
                </td>

                {/* CORREO EDITABLE */}
                <td className="p-3">
                  {editando === c.id ? (
                    <input
                      value={c.correo}
                      onChange={(e) =>
                        actualizarCliente(c.id, "correo", e.target.value)
                      }
                      className="border p-1"
                    />
                  ) : (
                    c.correo
                  )}
                </td>

                {/* ESTADO */}
                <td className="p-3">
                  <select
                    value={c.estado}
                    onChange={(e) =>
                      actualizarCliente(c.id, "estado", e.target.value)
                    }
                    className="border p-1"
                  >
                    <option>Activo</option>
                    <option>Inactivo</option>
                    <option>Suspendido</option>
                  </select>

                  {c.estado === "Suspendido" && (
                    <p className="text-red-500 text-xs">
                      ⚠ Suspendido por falta de pago
                    </p>
                  )}
                </td>

                {/* SALDO */}
                <td className="p-3">₡{c.saldo}</td>

                {/* CRÉDITO */}
                <td className="p-3">₡{c.credito}</td>

                {/* HISTORIAL */}
                <td className="p-3 text-xs">
                  {c.historial.join(", ")}
                </td>

                {/* ACCIONES */}
                <td className="p-3 flex gap-2">

                  <button
                    onClick={() =>
                      setEditando(editando === c.id ? null : c.id)
                    }
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                  >
                    {editando === c.id ? "Guardar" : "Editar"}
                  </button>

                  <button
                    onClick={() => eliminarCliente(c.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Eliminar
                  </button>

                  <button
                    onClick={() => agregarCredito(c.id)}
                    className="bg-green-500 text-white px-2 py-1 rounded"
                  >
                    + Crédito
                  </button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
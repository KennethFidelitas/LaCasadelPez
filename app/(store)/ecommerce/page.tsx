"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";

type Producto = {
  id: number;
  nombre: string;
  precio: number;
  descripcion: string;
};

type Pedido = {
  id: number;
  estado: "Pendiente" | "Enviado" | "Entregado";
  total: number;
};

export default function EcommercePage() {
  const { addItem, openCart, items, clearCart, subtotal } = useCart();

  // ================= CATÁLOGO =================
  const [productos, setProductos] = useState<Producto[]>([
    { id: 1, nombre: "Pez Betta", precio: 5000, descripcion: "Colorido" },
    { id: 2, nombre: "Acuario 20L", precio: 30000, descripcion: "Pequeño" },
  ]);

  const [nuevo, setNuevo] = useState({
    nombre: "",
    precio: "",
    descripcion: "",
  });

  const agregarProducto = () => {
    if (!nuevo.nombre || !nuevo.precio) return;

    setProductos([
      ...productos,
      {
        id: Date.now(),
        nombre: nuevo.nombre,
        precio: Number(nuevo.precio),
        descripcion: nuevo.descripcion,
      },
    ]);

    setNuevo({ nombre: "", precio: "", descripcion: "" });
  };

  const eliminarProducto = (id: number) => {
    setProductos(productos.filter((p) => p.id !== id));
  };

  const editarProducto = (id: number, campo: keyof Producto, valor: any) => {
    setProductos(
      productos.map((p) =>
        p.id === id ? { ...p, [campo]: valor } : p
      )
    );
  };

  // ================= PEDIDOS =================
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  const crearPedido = () => {
    if (items.length === 0) return;

    const nuevoPedido: Pedido = {
      id: Date.now(),
      estado: "Pendiente",
      total: subtotal,
    };

    setPedidos([...pedidos, nuevoPedido]);
    clearCart();
    alert("Pedido creado correctamente");
  };

  const cambiarEstado = (id: number, estado: Pedido["estado"]) => {
    setPedidos(
      pedidos.map((p) =>
        p.id === id ? { ...p, estado } : p
      )
    );
  };

  // ================= DEVOLUCIONES =================
  const [devolucion, setDevolucion] = useState("");

  // ================= PAGOS =================
  const pagar = () => {
    alert("Pago realizado con éxito. Confirmación enviada por email.");
  };

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-10">

      <h1 className="text-3xl font-bold">Módulo E-commerce</h1>

      {/* ================= CATÁLOGO ================= */}
      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Gestión de Catálogo</h2>

        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <input
            placeholder="Nombre"
            className="border p-2"
            value={nuevo.nombre}
            onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
          />
          <input
            placeholder="Precio"
            type="number"
            className="border p-2"
            value={nuevo.precio}
            onChange={(e) => setNuevo({ ...nuevo, precio: e.target.value })}
          />
          <input
            placeholder="Descripción"
            className="border p-2"
            value={nuevo.descripcion}
            onChange={(e) =>
              setNuevo({ ...nuevo, descripcion: e.target.value })
            }
          />
        </div>

        <button
          onClick={agregarProducto}
          className="bg-blue-600 text-white px-4 py-2 mb-4"
        >
          Agregar producto
        </button>

        {productos.map((p) => (
          <div key={p.id} className="border p-4 mb-3 rounded">

            <div className="grid md:grid-cols-3 gap-2 mb-2">
              <input
                value={p.nombre}
                onChange={(e) =>
                  editarProducto(p.id, "nombre", e.target.value)
                }
                className="border p-2"
              />
              <input
                type="number"
                value={p.precio}
                onChange={(e) =>
                  editarProducto(p.id, "precio", Number(e.target.value))
                }
                className="border p-2"
              />
              <input
                value={p.descripcion}
                onChange={(e) =>
                  editarProducto(p.id, "descripcion", e.target.value)
                }
                className="border p-2"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  addItem({
                    id: p.id.toString(),
                    name: p.nombre,
                    price: p.precio,
                    image: "/placeholder.png",
                    type: "product",
                    stock: 100,
                    quantity: 1,
                  });
                  openCart();
                }}
                className="bg-green-600 text-white px-3 py-1"
              >
                Agregar al carrito
              </button>

              <button
                onClick={() => eliminarProducto(p.id)}
                className="bg-red-600 text-white px-3 py-1"
              >
                Eliminar
              </button>
            </div>

          </div>
        ))}
      </section>

      {/* ================= PEDIDOS ================= */}
      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Gestión de Pedidos</h2>

        <button
          onClick={crearPedido}
          className="bg-purple-600 text-white px-4 py-2 mb-4"
        >
          Crear Pedido
        </button>

        {pedidos.length === 0 ? (
          <p>No hay pedidos</p>
        ) : (
          pedidos.map((p) => (
            <div key={p.id} className="border p-3 mb-2">
              <p>ID: {p.id}</p>
              <p>Total: ₡{p.total}</p>

              <select
                value={p.estado}
                onChange={(e) =>
                  cambiarEstado(p.id, e.target.value as any)
                }
                className="border p-2 mt-2"
              >
                <option>Pendiente</option>
                <option>Enviado</option>
                <option>Entregado</option>
              </select>

              <button
                onClick={() => window.print()}
                className="ml-2 bg-gray-600 text-white px-3 py-1"
              >
                Imprimir
              </button>

              <p className="mt-2 text-sm text-gray-500">
                Seguimiento: {p.estado}
              </p>
            </div>
          ))
        )}
      </section>

      {/* ================= DEVOLUCIONES ================= */}
      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Devoluciones</h2>

        <p>Política: devoluciones en 7 días.</p>

        <textarea
          className="border w-full p-2 mt-2"
          placeholder="Solicitud de devolución"
          value={devolucion}
          onChange={(e) => setDevolucion(e.target.value)}
        />

        <button
          onClick={() => alert("Devolución procesada")}
          className="bg-orange-600 text-white px-3 py-1 mt-2"
        >
          Procesar devolución
        </button>
      </section>

      {/* ================= PAGOS ================= */}
      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Pagos</h2>

        <p>Total a pagar: ₡{subtotal}</p>

        <button
          onClick={pagar}
          className="bg-emerald-600 text-white px-4 py-2 mt-2"
        >
          Proceder al Pago
        </button>
      </section>

    </div>
  );
}
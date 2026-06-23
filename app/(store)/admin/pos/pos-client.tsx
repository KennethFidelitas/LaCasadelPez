'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ShoppingCart, Search, Plus, Minus, Trash2,
  CheckCircle2, AlertTriangle, X, Fish, Package
} from 'lucide-react'

type ProductItem = {
  id: string
  type: 'animal' | 'product'
  name: string
  sku: string
  price: number
  stock: number
}

type CartEntry = ProductItem & { quantity: number }

type SaleStatus = 'idle' | 'processing' | 'done' | 'error'

export default function POSPage() {
  const [search, setSearch] = useState('')
  const [catalog, setCatalog] = useState<ProductItem[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [cart, setCart] = useState<CartEntry[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'credito' | 'mixto'>('efectivo')
  const [cashReceived, setCashReceived] = useState('')
  const [saleStatus, setSaleStatus] = useState<SaleStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [activeTab, setActiveTab] = useState<'animales' | 'productos'>('animales')

  const supabase = createClient()

  const searchCatalog = useCallback(async () => {
    if (search.trim().length < 1 && catalog.length > 0) return
    setCatalogLoading(true)

    if (activeTab === 'animales') {
      const { data } = await supabase
        .from('animals')
        .select('id, name, sku, price, stock_quantity')
        .eq('is_active', true)
        .ilike('name', `%${search}%`)
        .gt('stock_quantity', 0)
        .order('name')
        .limit(30)

      setCatalog(
        (data ?? []).map(a => ({
          id: a.id,
          type: 'animal' as const,
          name: a.name,
          sku: a.sku ?? '—',
          price: a.price ?? 0,
          stock: a.stock_quantity ?? 0,
        }))
      )
    } else {
      const { data } = await supabase
        .from('products')
        .select('id, name, sku, price, stock_quantity')
        .eq('is_active', true)
        .ilike('name', `%${search}%`)
        .gt('stock_quantity', 0)
        .order('name')
        .limit(30)

      setCatalog(
        (data ?? []).map(p => ({
          id: p.id,
          type: 'product' as const,
          name: p.name,
          sku: p.sku ?? '—',
          price: p.price ?? 0,
          stock: p.stock_quantity ?? 0,
        }))
      )
    }
    setCatalogLoading(false)
  }, [search, activeTab, supabase, catalog.length])

  useEffect(() => { searchCatalog() }, [activeTab])

  useEffect(() => {
    const t = setTimeout(searchCatalog, 300)
    return () => clearTimeout(t)
  }, [search])

  // ── Carrito helpers ──────────────────────────────────────────
  const addToCart = (item: ProductItem) => {
    setCart(prev => {
      const existing = prev.find(e => e.id === item.id)
      if (existing) {
        if (existing.quantity >= item.stock) return prev // RF-INV-012: validación stock
        return prev.map(e => e.id === item.id ? { ...e, quantity: e.quantity + 1 } : e)
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(e => {
          if (e.id !== id) return e
          const next = e.quantity + delta
          if (next <= 0) return { ...e, quantity: 0 }
          if (next > e.stock) return e // no pasar del stock disponible
          return { ...e, quantity: next }
        })
        .filter(e => e.quantity > 0)
    )
  }

  const removeFromCart = (id: string) => setCart(prev => prev.filter(e => e.id !== id))

  const clearCart = () => setCart([])

  // ── Totales ──────────────────────────────────────────────────
  const subtotal = cart.reduce((s, e) => s + e.price * e.quantity, 0)
  const IVA_RATE = 0.13
  const tax = subtotal * IVA_RATE
  const total = subtotal + tax
  const cashNum = parseFloat(cashReceived) || 0
  const change = cashNum - total

  // ── Confirmar venta (RF-VEN-004 + RF-INV-012) ───────────────
  const handleSale = async () => {
    if (cart.length === 0) return
    if (paymentMethod === 'efectivo' && cashNum < total) {
      setErrorMsg('El efectivo recibido es menor al total.')
      return
    }

    setSaleStatus('processing')
    setErrorMsg('')

    const { data: { user } } = await supabase.auth.getUser()

    // Obtener sesión POS abierta
    const { data: session } = await supabase
      .from('pos_sessions')
      .select('id')
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1)
      .single()

    if (!session) {
      setErrorMsg('No hay una sesión de caja abierta. Abra una sesión primero.')
      setSaleStatus('error')
      return
    }

    const items = cart.map(e => ({
      [e.type === 'animal' ? 'animal_id' : 'product_id']: e.id,
      name: e.name,
      sku: e.sku,
      quantity: e.quantity,
      unit_price: e.price,
      total_price: e.price * e.quantity,
    }))

    const { error } = await supabase.from('pos_transactions').insert({
      session_id: session.id,
      customer_name: null,
      subtotal,
      discount: 0,
      tax,
      credits_applied: 0,
      total,
      payment_method: paymentMethod,
      cash_received: paymentMethod === 'efectivo' ? cashNum : null,
      cash_change: paymentMethod === 'efectivo' ? Math.max(change, 0) : null,
      items,           // el trigger reduce stock automáticamente (RF-INV-012)
      status: 'completed',
      processed_by: user?.id,
    })

    if (error) {
      setErrorMsg(error.message)
      setSaleStatus('error')
    } else {
      setSaleStatus('done')
      setCart([])
      setCashReceived('')
    }
  }

  const formatPrice = (n: number) =>
    `₡${n.toLocaleString('es-CR', { minimumFractionDigits: 0 })}`

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="flex h-screen flex-col md:flex-row">

        {/* ── Panel izquierdo: catálogo ── */}
        <div className="flex flex-1 flex-col overflow-hidden border-r bg-white">
          <div className="border-b px-4 py-4">
            <h1 className="text-lg font-bold text-slate-800 mb-3">Punto de Venta</h1>

            {/* Tabs */}
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1 mb-3">
              {(['animales', 'productos'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setCatalog([]); setSearch('') }}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-colors ${
                    activeTab === tab ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'animales' ? <Fish className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Buscar ${activeTab}…`}
                className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006f95]"
              />
            </div>
          </div>

          {/* Lista de productos */}
          <div className="flex-1 overflow-y-auto p-3">
            {catalogLoading ? (
              <p className="py-8 text-center text-sm text-slate-400">Buscando…</p>
            ) : catalog.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                {search ? 'Sin resultados.' : 'Escribe para buscar.'}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                {catalog.map(item => {
                  const inCart = cart.find(e => e.id === item.id)
                  const atMax = inCart && inCart.quantity >= item.stock
                  return (
                    <button
                      key={item.id}
                      onClick={() => addToCart(item)}
                      disabled={!!atMax}
                      className={`relative rounded-xl border p-3 text-left transition-all ${
                        atMax
                          ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-50'
                          : 'border-slate-200 bg-white hover:border-[#006f95] hover:shadow-sm active:scale-95'
                      }`}
                    >
                      {inCart && (
                        <span className="absolute right-2 top-2 rounded-full bg-[#006f95] text-white text-xs font-bold w-5 h-5 flex items-center justify-center">
                          {inCart.quantity}
                        </span>
                      )}
                      <p className="text-xs text-slate-400 mb-0.5">{item.sku}</p>
                      <p className="text-sm font-semibold text-slate-800 leading-tight line-clamp-2">{item.name}</p>
                      <p className="mt-1.5 text-sm font-bold text-[#006f95]">{formatPrice(item.price)}</p>
                      <p className="text-xs text-slate-400">Stock: {item.stock}</p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Panel derecho: carrito ── */}
        <div className="flex w-full flex-col bg-white md:w-96">
          {/* Header carrito */}
          <div className="flex items-center justify-between border-b px-4 py-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-slate-600" />
              <span className="font-semibold text-slate-800">
                Carrito {cart.length > 0 && <span className="text-slate-500 font-normal">({cart.length} ítem{cart.length > 1 ? 's' : ''})</span>}
              </span>
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-700">
                Vaciar
              </button>
            )}
          </div>

          {/* Items del carrito */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
                <ShoppingCart className="h-10 w-10 opacity-30" />
                <p className="text-sm">El carrito está vacío</p>
                <p className="text-xs">Selecciona productos del catálogo</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {cart.map(item => (
                  <li key={item.id} className="rounded-lg border bg-white p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                        <p className="text-xs text-slate-400">{item.sku}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="shrink-0 text-slate-300 hover:text-red-500 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="rounded-md border p-1 hover:bg-slate-50 transition-colors"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          disabled={item.quantity >= item.stock}
                          className="rounded-md border p-1 hover:bg-slate-50 transition-colors disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <span className="ml-1 text-xs text-slate-400">/ {item.stock}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-800">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                    {item.quantity >= item.stock && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-amber-600">
                        <AlertTriangle className="h-3 w-3" /> Stock máximo alcanzado
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Totales + pago */}
          {cart.length > 0 && (
            <div className="border-t bg-slate-50 px-4 py-4 space-y-3">
              {/* Resumen */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>IVA (13%)</span><span>{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-slate-800 pt-1 border-t">
                  <span>Total</span><span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Método de pago */}
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1.5">Método de pago</p>
                <div className="grid grid-cols-2 gap-1">
                  {(['efectivo', 'tarjeta', 'credito', 'mixto'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`rounded-md py-1.5 text-xs font-medium capitalize transition-colors ${
                        paymentMethod === m
                          ? 'bg-[#006f95] text-white'
                          : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Efectivo recibido */}
              {paymentMethod === 'efectivo' && (
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Efectivo recibido</label>
                  <input
                    type="number"
                    min={0}
                    value={cashReceived}
                    onChange={e => setCashReceived(e.target.value)}
                    placeholder="₡0"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006f95]"
                  />
                  {cashNum >= total && (
                    <p className="mt-1 text-xs text-emerald-600 font-medium">
                      Vuelto: {formatPrice(Math.max(change, 0))}
                    </p>
                  )}
                  {cashNum > 0 && cashNum < total && (
                    <p className="mt-1 text-xs text-red-500">
                      Falta: {formatPrice(total - cashNum)}
                    </p>
                  )}
                </div>
              )}

              {/* Feedback */}
              {errorMsg && (
                <div className="flex items-center gap-1.5 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {errorMsg}
                </div>
              )}
              {saleStatus === 'done' && (
                <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  Venta registrada. Stock actualizado automáticamente.
                </div>
              )}

              {/* Botón confirmar */}
              <button
                onClick={handleSale}
                disabled={saleStatus === 'processing' || (paymentMethod === 'efectivo' && cashNum < total && cashReceived !== '')}
                className="w-full rounded-lg bg-[#006f95] py-3 text-sm font-bold text-white hover:bg-[#005f80] disabled:opacity-50 transition-colors"
              >
                {saleStatus === 'processing' ? 'Procesando…' : `Confirmar venta · ${formatPrice(total)}`}
              </button>
              {saleStatus === 'done' && (
                <button
                  onClick={() => setSaleStatus('idle')}
                  className="w-full rounded-lg border py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Nueva venta
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

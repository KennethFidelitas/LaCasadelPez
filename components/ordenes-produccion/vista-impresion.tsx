import { formatPrice, formatDate, formatOrderNumber } from '@/lib/format'
import { STATUS_LABELS, PAYMENT_LABELS } from '@/lib/ordenes-produccion/schemas'
import type { ProductionOrder } from '@/lib/types'

interface VistaImpresionProps {
  orden: ProductionOrder
}

export function VistaImpresion({ orden }: VistaImpresionProps) {
  const pendientePago = Math.max(0, orden.total - orden.deposit_paid)

  return (
    <>
      {/*
        Estilos de impresión: ocultan la UI del sitio y muestran solo este
        componente en tamaño carta / A4.
      */}
      <style>{`
        @media print {
          header, footer, nav, aside,
          [data-slot="store-header"],
          [data-slot="store-footer"],
          [data-slot="cart-drawer"] { display: none !important; }
          body { background: white !important; }
          .print-page { padding: 0 !important; }
        }
      `}</style>

      <div className="print-page mx-auto max-w-3xl px-6 py-8 text-sm text-foreground">

        {/* ── Encabezado del documento ─────────────────────── */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">La Casa del Pez</h1>
            <p className="text-muted-foreground">Acuarios y Peces Tropicales</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">Orden de producción</p>
            <p className="font-mono text-xl font-bold text-primary">
              {formatOrderNumber(orden.order_number)}
            </p>
            <p className="text-muted-foreground">Emitida: {formatDate(orden.created_at)}</p>
          </div>
        </div>

        <hr className="mb-6 border-border" />

        {/* ── Datos del cliente ────────────────────────────── */}
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Datos del cliente
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <Fila label="Nombre" value={orden.customer_name ?? '—'} />
            <Fila label="Teléfono" value={orden.customer_phone ?? '—'} />
            <Fila label="Email" value={orden.customer_email ?? '—'} />
          </div>
        </section>

        {/* ── Especificaciones de la pecera ────────────────── */}
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Especificaciones de la pecera
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <Fila
              label="Dimensiones (An × Al × F)"
              value={
                orden.width && orden.height && orden.depth
                  ? `${orden.width} × ${orden.height} × ${orden.depth} cm`
                  : '—'
              }
            />
            <Fila label="Tipo de vidrio" value={orden.glass_type ?? '—'} />
            <Fila
              label="Grosor del vidrio"
              value={orden.glass_thickness ? `${orden.glass_thickness} mm` : '—'}
            />
            <Fila
              label="Días estimados de fabricación"
              value={orden.estimated_days ? `${orden.estimated_days} días` : '—'}
            />
          </div>
        </section>

        {/* ── Estado ───────────────────────────────────────── */}
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Estado
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <Fila label="Estado de producción" value={STATUS_LABELS[orden.status]} />
            <Fila label="Estado de pago" value={PAYMENT_LABELS[orden.payment_status]} />
            {orden.started_at && (
              <Fila label="Inicio fabricación" value={formatDate(orden.started_at)} />
            )}
            {orden.completed_at && (
              <Fila label="Fabricación completada" value={formatDate(orden.completed_at)} />
            )}
            {orden.delivered_at && (
              <Fila label="Entregado" value={formatDate(orden.delivered_at)} />
            )}
          </div>
        </section>

        {/* ── Desglose de precios ──────────────────────────── */}
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Desglose de precios
          </h2>
          <table className="w-full border-collapse text-sm">
            <tbody>
              <FilaPrecio label="Materiales" valor={orden.materials_cost} />
              <FilaPrecio label="Mano de obra" valor={orden.labor_cost} />
              <FilaPrecio label="Accesorios" valor={orden.accessories_cost} />
              <tr>
                <td colSpan={2}>
                  <hr className="my-1 border-border" />
                </td>
              </tr>
              <FilaPrecio label="Subtotal" valor={orden.subtotal} />
              {orden.discount > 0 && (
                <FilaPrecio label="Descuento" valor={-orden.discount} className="text-destructive" />
              )}
              <FilaPrecio
                label="Total"
                valor={orden.total}
                className="border-t border-border pt-1 font-bold text-base"
              />
              <tr>
                <td colSpan={2}>
                  <hr className="my-1 border-border" />
                </td>
              </tr>
              <FilaPrecio label="Anticipo recibido" valor={orden.deposit_paid} className="text-green-700" />
              <FilaPrecio
                label="Saldo pendiente"
                valor={pendientePago}
                className={pendientePago > 0 ? 'font-semibold' : 'text-muted-foreground'}
              />
            </tbody>
          </table>
        </section>

        {/* ── Notas para el cliente ─────────────────────────── */}
        {orden.notes && (
          <section className="mb-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notas
            </h2>
            <p className="rounded border border-border bg-muted/30 px-3 py-2 text-sm">
              {orden.notes}
            </p>
          </section>
        )}

        {/* ── Pie de página ─────────────────────────────────── */}
        <hr className="mb-4 border-border" />
        <p className="text-center text-xs text-muted-foreground">
          La Casa del Pez · Documento generado el {formatDate(new Date())}
        </p>

        {/* Firma */}
        <div className="mt-12 grid grid-cols-2 gap-12 print:mt-16">
          <div className="border-t border-foreground pt-2 text-center text-xs text-muted-foreground">
            Firma del cliente
          </div>
          <div className="border-t border-foreground pt-2 text-center text-xs text-muted-foreground">
            Firma autorizada · La Casa del Pez
          </div>
        </div>
      </div>
    </>
  )
}

function Fila({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1 py-0.5">
      <span className="min-w-[160px] font-medium text-muted-foreground">{label}:</span>
      <span>{value}</span>
    </div>
  )
}

function FilaPrecio({
  label,
  valor,
  className,
}: {
  label: string
  valor: number
  className?: string
}) {
  return (
    <tr className={className}>
      <td className="py-0.5 text-muted-foreground">{label}</td>
      <td className="py-0.5 text-right tabular-nums">{formatPrice(valor)}</td>
    </tr>
  )
}

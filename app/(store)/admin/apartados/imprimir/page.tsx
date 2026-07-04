// RF: Como vendedor quiero imprimir comprobante de apartado

import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatPrice, formatDate, formatOrderNumber } from '@/lib/format'
import { APARTADO_STATUS_LABELS } from '@/lib/apartados/actions'
import type { Apartado } from '@/lib/apartados/actions'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ImprimirApartadoPage({ params }: PageProps) {
  const { id } = await params

  const supabase = createAdminClient()
  const { data: apartado, error } = await supabase
    .from('apartados')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !apartado) notFound()

  const apt = apartado as Apartado
  const balance = apt.total_price - apt.deposit_amount
  const expiresDate = new Date(apt.expires_at)

  const itemTypeLabel: Record<string, string> = {
    product: 'Producto',
    animal: 'Animal',
    pecera_prediseno: 'Pecera prediseñada',
    pecera_personalizada: 'Pecera personalizada',
  }

  return (
    <>
      {/* Estilos de impresión */}
      <style>{`
        @media print {
          header, footer, nav, aside,
          [data-slot="store-header"],
          [data-slot="store-footer"],
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      {/* Barra de acción — solo pantalla */}
      <div className="no-print sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <span className="text-sm text-muted-foreground">
            Comprobante de apartado #{apt.apartado_number}
          </span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            🖨️ Imprimir
          </button>
        </div>
      </div>

      {/* Comprobante */}
      <div className="mx-auto max-w-3xl px-6 py-8 text-sm text-foreground">

        {/* Encabezado */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">La Casa del Pez</h1>
            <p className="text-muted-foreground">Acuarios y Peces Tropicales</p>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold text-foreground">Comprobante de Apartado</p>
            <p className="font-mono text-xl font-bold text-primary">#{apt.apartado_number}</p>
            <p className="text-muted-foreground">Emitido: {formatDate(apt.created_at)}</p>
          </div>
        </div>

        <hr className="mb-6 border-border" />

        {/* Estado y vigencia */}
        <div className="mb-6 flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</p>
            <p className="mt-1 font-medium">{APARTADO_STATUS_LABELS[apt.status]}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Válido hasta</p>
            <p className={`mt-1 font-medium ${apt.status === 'activo' ? 'text-primary' : 'text-muted-foreground'}`}>
              {formatDate(apt.expires_at)}
            </p>
            {apt.status === 'activo' && (
              <p className="text-xs text-muted-foreground">
                ({Math.max(0, Math.ceil((expiresDate.getTime() - Date.now()) / 86400000))} días restantes)
              </p>
            )}
          </div>
        </div>

        {/* Datos del cliente */}
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Datos del cliente
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <Fila label="Nombre" value={apt.customer_name} />
            <Fila label="Teléfono" value={apt.customer_phone} />
            {apt.customer_email && <Fila label="Correo" value={apt.customer_email} />}
          </div>
        </section>

        {/* Descripción del artículo apartado */}
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Artículo apartado
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <Fila label="Tipo" value={itemTypeLabel[apt.item_type] ?? apt.item_type} />
            {apt.item_type.startsWith('pecera') && apt.aquarium_config && (
              <>
                {(apt.aquarium_config as any).mode === 'prediseno' && (apt.aquarium_config as any).name && (
                  <Fila label="Kit" value={(apt.aquarium_config as any).name} />
                )}
                {(apt.aquarium_config as any).width && (
                  <Fila
                    label="Dimensiones"
                    value={`${(apt.aquarium_config as any).width} × ${(apt.aquarium_config as any).height} × ${(apt.aquarium_config as any).depth} cm`}
                  />
                )}
                {(apt.aquarium_config as any).glass_type && (
                  <Fila label="Tipo de vidrio" value={(apt.aquarium_config as any).glass_type} />
                )}
              </>
            )}
          </div>
          {apt.notes && (
            <div className="mt-3 rounded border border-border bg-muted/30 px-3 py-2 text-sm">
              <span className="font-medium text-muted-foreground">Notas: </span>
              {apt.notes}
            </div>
          )}
        </section>

        {/* Desglose de pago */}
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Detalle de pago
          </h2>
          <table className="w-full border-collapse">
            <tbody>
              <FilaPrecio label="Precio total del artículo" valor={apt.total_price} />
              <tr><td colSpan={2}><hr className="my-1 border-border" /></td></tr>
              <FilaPrecio label="Anticipo cancelado (50%)" valor={apt.deposit_amount} className="text-green-700 font-medium" />
              <FilaPrecio
                label="Saldo pendiente"
                valor={balance}
                className={balance > 0 ? 'font-bold text-base' : 'text-muted-foreground'}
              />
            </tbody>
          </table>
        </section>

        {/* Condiciones */}
        <section className="mb-6 rounded-lg border border-dashed p-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Condiciones del apartado
          </h2>
          <ul className="grid gap-1 text-xs text-muted-foreground">
            <li>• El artículo será reservado hasta el <strong>{formatDate(apt.expires_at)}</strong>.</li>
            <li>• El saldo de <strong>{formatPrice(balance)}</strong> debe cancelarse antes de esa fecha.</li>
            <li>• Si el pago no se completa en el plazo, el apartado se cancelará sin reembolso del anticipo.</li>
            <li>• El anticipo no es reembolsable salvo que el artículo no esté disponible por causas imputables a La Casa del Pez.</li>
          </ul>
        </section>

        {/* Pie */}
        <hr className="mb-4 border-border" />
        <p className="text-center text-xs text-muted-foreground">
          La Casa del Pez · Documento generado el {formatDate(new Date())}
        </p>

        {/* Firmas */}
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

function FilaPrecio({ label, valor, className }: { label: string; valor: number; className?: string }) {
  return (
    <tr className={className}>
      <td className="py-0.5 text-muted-foreground">{label}</td>
      <td className="py-0.5 text-right tabular-nums">{formatPrice(valor)}</td>
    </tr>
  )
}

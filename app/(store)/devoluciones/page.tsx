import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Devoluciones | La Casa del Pez',
  description: 'Consulta nuestras políticas de devolución para comprar con confianza en La Casa del Pez.',
}

export default function DevolucionesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-foreground">Política de devoluciones</h1>
        <p className="mt-4 text-base leading-8 text-muted-foreground">
          En La Casa del Pez queremos que compres con total confianza. Si por alguna razón no estás satisfecho con tu compra,
          aquí te explicamos cómo gestionamos las devoluciones y reembolsos.
        </p>

        <section className="mt-10 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Plazo</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Aceptamos devoluciones dentro de los 15 días naturales siguientes a la recepción del pedido, siempre que el producto
              se encuentre en condiciones originales y en su empaque intacto.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground">Condiciones</h2>
            <ul className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground list-disc list-inside">
              <li>El producto debe llegar en su empaque original, sin daños y con todos los accesorios incluidos.</li>
              <li>No aplican devoluciones para productos abiertos, consumibles o perecederos que hayan sido utilizados.</li>
              <li>Los artículos en promoción pueden tener condiciones especiales, las cuales se indican en la ficha del producto.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground">Excepciones para animales vivos</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Los peces y otros animales vivos no se pueden devolver por motivos generales. Sin embargo, si recibes un ejemplar en
              mal estado o con daño evidente, contáctanos inmediatamente para activar el proceso de cambio o reembolso.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground">Reembolsos</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              El reembolso se realiza normalmente a la misma forma de pago utilizada en la compra. En casos especiales puedes
              solicitar crédito en tienda, el cual podrás usar en futuras compras.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground">Gastos de devolución</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Si la devolución se debe a un error nuestro o a un producto defectuoso, asumimos los costos de envío de la devolución.
              Para cambios por preferencia personal, los gastos de envío de regreso corren por cuenta del cliente.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground">Cómo solicitar una devolución</h2>
            <ol className="mt-3 space-y-3 pl-5 text-sm leading-7 text-muted-foreground list-decimal">
              <li>Contacta a nuestro equipo de atención al cliente indicando tu número de orden.</li>
              <li>Describe el motivo de la devolución y, si es posible, adjunta fotografías del producto.</li>
              <li>Empaqueta el producto con cuidado y envíalo a la dirección que te proporcionemos.</li>
              <li>Cuando recibamos el producto revisaremos su estado y gestionaremos el reembolso o cambio.</li>
            </ol>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground">Compra con confianza</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Nuestra prioridad es tu satisfacción. Si tienes dudas, escríbenos y te orientaremos para que tu compra sea segura y
              estés tranquilo con tu decisión.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

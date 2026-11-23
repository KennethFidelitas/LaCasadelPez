'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/actions/button'
import { useCart } from '@/lib/cart-context'
import { formatPhRange, formatPrice, formatTemperatureRange, translateCareLevel } from '@/lib/format'
import type { Animal, Product } from '@/lib/types'
import { CatalogImage } from './catalog-image'

type CatalogDetailProps = { type: 'product'; item: Product } | { type: 'animal'; item: Animal }

export function CatalogDetail(props: CatalogDetailProps) {
  const { type, item } = props
  const { addItem, openCart } = useCart()
  const images = item.images?.filter(Boolean) ?? []
  const [imageIndex, setImageIndex] = useState(0)
  const animal = type === 'animal' ? props.item : null
  const stock = item.stock_quantity

  function addToCart() {
    addItem({ id: item.id, type, name: item.name, sku: item.sku, price: item.price, stock, image: images[0] })
    openCart()
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link href={animal ? '/peces' : '/tienda'} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" />
        {animal ? 'Volver a peces' : 'Volver a la tienda'}
      </Link>
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
            <CatalogImage src={images[imageIndex]} alt={item.name} sizes="(min-width: 768px) 50vw, 100vw" />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {images.map((src, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Ver imagen ${index + 1}`}
                  aria-pressed={index === imageIndex}
                  onClick={() => setImageIndex(index)}
                  className="relative size-16 overflow-hidden rounded-md border bg-muted aria-pressed:ring-2 aria-pressed:ring-primary"
                >
                  <CatalogImage src={src} alt="" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-5">
          {item.category && <p className="text-sm text-muted-foreground">{item.category.name}</p>}
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{item.name}</h1>
          {animal?.scientific_name && <p className="italic text-muted-foreground">{animal.scientific_name}</p>}
          {item.description && <p className="whitespace-pre-line text-muted-foreground">{item.description}</p>}
          <div>
            <p className="text-2xl font-semibold text-primary">{formatPrice(item.price)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{stock > 0 ? `${stock} disponibles` : 'Agotado'}</p>
          </div>
          <Button onClick={addToCart} disabled={stock <= 0}>
            <ShoppingCart className="size-4" />
            Agregar al carrito
          </Button>
          {animal && (
            <section className="rounded-lg border p-4">
              <h2 className="mb-3 font-semibold">Cuidados</h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {animal.care_level && <><dt>Nivel de cuidado</dt><dd>{translateCareLevel(animal.care_level)}</dd></>}
                {animal.temperament && <><dt>Temperamento</dt><dd>{{ pacifico: 'Pacífico', 'semi-agresivo': 'Semiagresivo', agresivo: 'Agresivo' }[animal.temperament]}</dd></>}
                {animal.min_tank_size != null && <><dt>Pecera mínima</dt><dd>{animal.min_tank_size} L</dd></>}
                {(animal.temperature_min != null || animal.temperature_max != null) && <><dt>Temperatura</dt><dd>{formatTemperatureRange(animal.temperature_min, animal.temperature_max)}</dd></>}
                {(animal.ph_min != null || animal.ph_max != null) && <><dt>pH</dt><dd>{formatPhRange(animal.ph_min, animal.ph_max)}</dd></>}
                {animal.diet && <><dt>Alimentación</dt><dd>{animal.diet}</dd></>}
              </dl>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

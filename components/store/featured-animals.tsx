'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Fish, Droplets, Thermometer } from 'lucide-react'
import { Button } from '@/components/ui/actions/button'
import { useCart } from '@/lib/cart-context'
import { formatPrice, translateCareLevel, translateWaterType } from '@/lib/format'
import type { Animal } from '@/lib/types'

interface FeaturedAnimalsProps {
  animals: Animal[]
}

const careLevelColors = {
  facil: 'bg-green-100 text-green-700',
  moderado: 'bg-yellow-100 text-yellow-700',
  avanzado: 'bg-red-100 text-red-700',
}

export function FeaturedAnimals({ animals }: FeaturedAnimalsProps) {
  const { addItem, openCart } = useCart()

  const handleAddToCart = (animal: Animal) => {
    addItem({
      id: animal.id,
      type: 'animal',
      name: animal.common_name,
      price: animal.price,
      image: animal.images?.[0],
      stock: animal.stock_quantity,
    })
    openCart()
  }

  if (animals.length === 0) {
    return (
      <div className="mt-8 flex items-center justify-center rounded-lg border border-dashed border-border bg-card py-12">
        <p className="text-muted-foreground">No hay peces disponibles</p>
      </div>
    )
  }

  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {animals.map((animal) => (
        <div
          key={animal.id}
          className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg"
        >
          <Link href={`/peces/${animal.slug}`} className="relative aspect-square bg-muted">
            {animal.images?.[0] ? (
              <Image
                src={animal.images[0]}
                alt={animal.common_name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Fish className="h-12 w-12 text-muted-foreground/50" />
              </div>
            )}
            <div className="absolute left-3 top-3 flex flex-col gap-1">
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${careLevelColors[animal.care_level]}`}>
                {translateCareLevel(animal.care_level)}
              </span>
            </div>
          </Link>
          <div className="flex flex-1 flex-col p-4">
            <Link href={`/peces/${animal.slug}`}>
              <h3 className="font-medium text-foreground line-clamp-1 group-hover:text-primary">
                {animal.common_name}
              </h3>
            </Link>
            {animal.scientific_name && (
              <p className="mt-0.5 text-xs italic text-muted-foreground line-clamp-1">
                {animal.scientific_name}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Droplets className="h-3 w-3" />
                {translateWaterType(animal.water_type)}
              </span>
              {animal.max_size && (
                <span className="flex items-center gap-1">
                  <Fish className="h-3 w-3" />
                  {animal.max_size} cm
                </span>
              )}
              {animal.temperature_min && animal.temperature_max && (
                <span className="flex items-center gap-1">
                  <Thermometer className="h-3 w-3" />
                  {animal.temperature_min}-{animal.temperature_max}°C
                </span>
              )}
            </div>
            <div className="mt-auto pt-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-foreground">
                  {formatPrice(animal.price)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {animal.stock_quantity > 0 ? `${animal.stock_quantity} disponibles` : 'Agotado'}
                </span>
              </div>
              <div className="mt-3">
                {animal.stock_quantity > 0 ? (
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => handleAddToCart(animal)}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Agregar al Carrito
                  </Button>
                ) : (
                  <Button className="w-full" size="sm" variant="secondary" disabled>
                    Agotado
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Search, Heart, ShoppingCart, Fish } from 'lucide-react'
import { formatColones } from './data'
import { useCart } from '@/lib/cart-context'
import type { Animal } from '@/lib/types'

const NIVEL_CONFIG: Record<NonNullable<Animal['care_level']>, { label: string; className: string }> = {
  facil: { label: 'Fácil', className: 'bg-accent/20 text-teal' },
  moderado: { label: 'Moderado', className: 'bg-sand/30 text-sand' },
  avanzado: { label: 'Avanzado', className: 'bg-destructive/20 text-destructive' },
}

const TEMPERAMENTO_CONFIG: Record<NonNullable<Animal['temperament']>, { label: string; className: string }> = {
  pacifico: { label: 'Pacífico', className: 'bg-accent/20 text-teal' },
  'semi-agresivo': { label: 'Semi-agresivo', className: 'bg-sand/30 text-sand' },
  agresivo: { label: 'Agresivo', className: 'bg-destructive/20 text-destructive' },
}

interface ProductCardProps {
  animal: Animal
}

export function ProductCard({ animal }: ProductCardProps) {
  const [hovered, setHovered] = useState(false)
  const { addItem, openCart } = useCart()

  const nivel = animal.care_level ? NIVEL_CONFIG[animal.care_level] : null
  const temperamento = animal.temperament ? TEMPERAMENTO_CONFIG[animal.temperament] : null
  const disponible = animal.stock_quantity > 0
  const pocasUnidades = disponible && animal.stock_quantity <= animal.low_stock_threshold
  const imagen = animal.images?.[0]

  function handleAddToCart() {
    addItem({
      id: animal.id,
      type: 'animal',
      name: animal.name,
      price: animal.price,
      image: imagen,
      stock: animal.stock_quantity,
      sku: animal.sku,
    })
    openCart()
  }

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-background transition-all duration-200 hover:border-teal hover:shadow-sm"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Imagen ─────────────────────────────────────────────────────── */}
      <div className="relative aspect-square overflow-hidden bg-secondary rounded-lg">
        {imagen ? (
          <Image
            src={imagen}
            alt={animal.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Fish className="h-12 w-12 text-foreground/20" />
          </div>
        )}

        {/* Íconos de hover */}
        <div
          className={`absolute inset-0 flex items-center justify-center gap-3 bg-foreground/10 transition-opacity duration-200 ${
            hovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            aria-label="Ver detalle"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            aria-label="Añadir a favoritos"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>

        {/* Badge: estado (esquina superior derecha) */}
        {!disponible && (
          <span className="absolute right-2 top-2 rounded-sm bg-destructive/20 px-1.5 py-0.5 text-xs text-destructive">
            Agotado
          </span>
        )}
        {disponible && pocasUnidades && (
          <span className="absolute right-2 top-2 rounded-sm bg-yellow-500/20 px-1.5 py-0.5 text-xs text-yellow-700">
            Pocas unidades
          </span>
        )}
        {disponible && !pocasUnidades && animal.is_featured && (
          <span className="absolute right-2 top-2 rounded-sm bg-sand/30 px-1.5 py-0.5 text-xs text-sand">
            Destacado
          </span>
        )}
      </div>

      {/* ── Contenido ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-foreground leading-snug">
          {animal.name}
        </h3>
        {animal.scientific_name && (
          <p className="text-xs italic text-foreground/50 line-clamp-1">
            {animal.scientific_name}
          </p>
        )}

        {animal.description && (
          <p className="mt-1 line-clamp-2 text-xs text-foreground/60">{animal.description}</p>
        )}

        {/* Badges: categoría, temperamento, nivel de cuidado */}
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {animal.category?.name && (
            <span className="rounded-sm bg-ocean-light/20 px-1.5 py-0.5 text-xs text-ocean">
              {animal.category.name}
            </span>
          )}
          {temperamento && (
            <span className={`rounded-sm px-1.5 py-0.5 text-xs ${temperamento.className}`}>
              {temperamento.label}
            </span>
          )}
          {nivel && (
            <span className={`rounded-sm px-1.5 py-0.5 text-xs ${nivel.className}`}>
              {nivel.label}
            </span>
          )}
        </div>

        {/* Precio */}
        <div className="mt-auto pt-3">
          <p className="font-mono font-medium text-primary">
            {formatColones(animal.price)}{' '}
            <span className="text-xs font-normal text-foreground/50">I.V.A.I.</span>
          </p>
        </div>
      </div>

      {/* ── Botón añadir al carrito (aparece en hover) ─────────────────── */}
      <div
        className={`px-3 pb-3 transition-all duration-200 ${
          hovered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
      >
        <button
          disabled={!disponible}
          onClick={handleAddToCart}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Añadir al carrito
        </button>
      </div>
    </div>
  )
}

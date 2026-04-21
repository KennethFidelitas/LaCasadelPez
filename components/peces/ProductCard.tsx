'use client'

import { useState } from 'react'
import { Search, Heart, ShoppingCart } from 'lucide-react'
import { formatColones } from './data'
import type { Producto } from './types'

const CATEGORIA_LABELS: Record<Producto['categoria'], string> = {
  'pez-dulce': 'Agua Dulce',
  'pez-salado': 'Agua Salada',
  coral: 'Coral',
  invertebrado: 'Invertebrado',
  'planta-acuatica': 'Planta',
}

const NIVEL_CONFIG: Record<
  Producto['nivelCuidado'],
  { label: string; className: string }
> = {
  facil: { label: 'Fácil', className: 'bg-accent/20 text-teal' },
  intermedio: { label: 'Intermedio', className: 'bg-sand/30 text-sand' },
  avanzado: { label: 'Avanzado', className: 'bg-destructive/20 text-destructive' },
}

const TEMPERAMENTO_CONFIG: Record<
  Producto['temperamento'],
  { label: string; className: string }
> = {
  pacifico: { label: 'Pacífico', className: 'bg-accent/20 text-teal' },
  agresivo: { label: 'Agresivo', className: 'bg-destructive/20 text-destructive' },
  solitario: { label: 'Solitario', className: 'bg-ocean-light/30 text-ocean' },
}

interface ProductCardProps {
  producto: Producto
}

export function ProductCard({ producto }: ProductCardProps) {
  const [hovered, setHovered] = useState(false)

  const nivel = NIVEL_CONFIG[producto.nivelCuidado]
  const temperamento = TEMPERAMENTO_CONFIG[producto.temperamento]

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-background transition-all duration-200 hover:border-teal hover:shadow-sm"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Imagen ─────────────────────────────────────────────────────── */}
      <div className="relative aspect-square overflow-hidden bg-secondary rounded-lg">
        <img
          src={producto.imagen}
          alt={producto.nombre}
          className="h-full w-full object-contain"
        />

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
        {!producto.disponible && (
          <span className="absolute right-2 top-2 rounded-sm bg-destructive/20 px-1.5 py-0.5 text-xs text-destructive">
            Agotado
          </span>
        )}
        {producto.disponible && producto.destacado && (
          <span className="absolute right-2 top-2 rounded-sm bg-sand/30 px-1.5 py-0.5 text-xs text-sand">
            Destacado
          </span>
        )}
      </div>

      {/* ── Contenido ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-3">
        <p className="text-xs uppercase tracking-wide text-foreground/50">
          {producto.marca}
        </p>

        <h3 className="mt-0.5 line-clamp-2 text-sm font-medium text-foreground leading-snug">
          {producto.nombre}
        </h3>

        <p className="mt-1 line-clamp-2 text-xs text-foreground/60">
          {producto.descripcion}
        </p>

        {/* Badges: categoría (no-peces), tipo de agua, temperamento, nivel de cuidado */}
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {(producto.categoria === 'invertebrado' ||
            producto.categoria === 'coral' ||
            producto.categoria === 'planta-acuatica') && (
            <span className="rounded-sm bg-ocean-light/20 px-1.5 py-0.5 text-xs text-ocean">
              {CATEGORIA_LABELS[producto.categoria]}
            </span>
          )}
          <span className="rounded-sm bg-accent/20 px-1.5 py-0.5 text-xs text-teal">
            {producto.tipoAgua === 'dulce' ? 'Agua Dulce' : 'Agua Salada'}
          </span>
          <span className={`rounded-sm px-1.5 py-0.5 text-xs ${temperamento.className}`}>
            {temperamento.label}
          </span>
          <span className={`rounded-sm px-1.5 py-0.5 text-xs ${nivel.className}`}>
            {nivel.label}
          </span>
        </div>

        {/* Precio */}
        <div className="mt-auto pt-3">
          <p className="font-mono font-medium text-primary">
            {formatColones(producto.precio)}{' '}
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
          disabled={!producto.disponible}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Añadir al carrito
        </button>
      </div>
    </div>
  )
}

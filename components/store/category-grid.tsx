import Link from 'next/link'
import Image from 'next/image'
import { Package } from 'lucide-react'
import type { Category } from '@/lib/types'

interface CategoryGridProps {
  categories: Category[]
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <div className="mt-8 flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-12">
        <p className="text-muted-foreground">No hay categorias disponibles</p>
      </div>
    )
  }

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/tienda?categoria=${category.slug}`}
          className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg"
        >
          <div className="aspect-[16/9] bg-muted">
            {category.image_url ? (
              <Image
                src={category.image_url}
                alt={category.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-12 w-12 text-muted-foreground/50" />
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-foreground group-hover:text-primary">
              {category.name}
            </h3>
            {category.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {category.description}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}

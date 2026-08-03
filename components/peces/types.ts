import type { Animal } from '@/lib/types'

export type Ordenamiento = 'relevancia' | 'precio-asc' | 'precio-desc' | 'nombre-az'

export interface FiltrosState {
  /** ids de categories (type='animal') */
  categorias: string[]
  nivelCuidado: Array<NonNullable<Animal['care_level']>>
  temperamento: Array<NonNullable<Animal['temperament']>>
  precioMin: number
  precioMax: number
  soloDisponibles: boolean
  ordenar: Ordenamiento
}

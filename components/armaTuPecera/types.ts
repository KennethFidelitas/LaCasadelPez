export type WaterType = 'dulce' | 'salada'

export interface Pecera {
  id: string
  name: string
  litros: number
  dimensions: string
  price: number
  image?: string
}

export interface Filtro {
  id: string
  name: string
  tipo: string
  minLitros: number
  maxLitros: number
  price: number
  image?: string
}

export type FishTemperament = 'pacifico' | 'solitario' | 'agresivo' | 'semiagresivo' | 'predador'

export interface Fish {
  id: string
  name: string
  waterType: WaterType
  temperament: FishTemperament
  maxQuantity: number
  price: number
  description: string
  incompatibleWith: string[]
  image?: string
}

export interface ArmaTuPeceraState {
  waterType: WaterType | null
  selectedPeceraId: string | null
  selectedFiltroId: string | null
  fishQuantities: Record<string, number>
}

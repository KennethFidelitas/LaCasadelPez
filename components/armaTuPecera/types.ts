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


export type AquariumMode = 'prediseno' | 'personalizada'

export interface CustomPeceraDimensions {
  largo: number
  ancho: number
  alto: number
}

export type CustomGlassType = 'claro-6mm' | 'claro-8mm' | 'templado-10mm' | 'templado-12mm'

export interface Iluminacion {
  id: string
  name: string
  tipo: string            // LED, T5, Metal Halide...
  potencia: string        // watts
  cobertura: string       // cm de cobertura
  minLitros: number
  maxLitros: number
  price: number
  descripcion: string
}

export interface AccesorioOpcional {
  id: string
  name: string
  categoria: string       // calefaccion, decoracion, sustrato, co2...
  price: number
  descripcion: string
}

export interface PeceraPrediseno extends Pecera {
  descripcion: string
  incluye: string[]       // qué viene incluido
  waterType: WaterType[]  // compatible con qué tipo de agua
}

// Extiende el estado existente con los nuevos campos
export interface ArmaTuPeceraStateExtended extends ArmaTuPeceraState {
  mode: AquariumMode | null
  selectedIluminacionId: string | null
  accesoriosSeleccionados: Record<string, boolean>  // id -> seleccionado
}

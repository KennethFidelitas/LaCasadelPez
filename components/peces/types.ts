export type Categoria =
  | 'pez-dulce'
  | 'pez-salado'
  | 'coral'
  | 'invertebrado'
  | 'planta-acuatica'

export type TipoAgua = 'dulce' | 'salada'
export type Temperamento = 'pacifico' | 'agresivo' | 'solitario'
export type NivelCuidado = 'facil' | 'intermedio' | 'avanzado'
export type Ordenamiento = 'relevancia' | 'precio-asc' | 'precio-desc' | 'nombre-az'

export interface Producto {
  id: string
  nombre: string
  categoria: Categoria
  tipoAgua: TipoAgua
  precio: number
  imagen: string
  marca: string
  descripcion: string
  disponible: boolean
  temperamento: Temperamento
  nivelCuidado: NivelCuidado
  destacado: boolean
}

export interface FiltrosState {
  tipoAgua: 'todos' | TipoAgua
  categorias: string[]
  nivelCuidado: string[]
  temperamento: string[]
  precioMin: number
  precioMax: number
  soloDisponibles: boolean
  ordenar: Ordenamiento
}

// Fallback solo por si la consulta a animals no trae resultados (tabla vacía) —
// en uso normal, el rango real se calcula en app/(store)/peces/page.tsx a partir
// de los precios de los animales activos.
export const PRECIO_MIN = 1500
export const PRECIO_MAX = 85000

export const formatColones = (precio: number): string =>
  new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0,
  }).format(precio)

/**
 * Format a price in Mexican Pesos
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

/**
 * Format a date in Spanish
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

/**
 * Format a date with time in Spanish
 */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

/**
 * Format a relative date (e.g., "hace 2 dias")
 */
export function formatRelativeDate(date: string | Date): string {
  const now = new Date()
  const target = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000)
  
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
  
  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second')
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return rtf.format(-diffInMinutes, 'minute')
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return rtf.format(-diffInHours, 'hour')
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return rtf.format(-diffInDays, 'day')
  }
  
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return rtf.format(-diffInMonths, 'month')
  }
  
  const diffInYears = Math.floor(diffInMonths / 12)
  return rtf.format(-diffInYears, 'year')
}

/**
 * Format an order number
 */
export function formatOrderNumber(orderNumber: string): string {
  return `#${orderNumber}`
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Format dimensions
 */
export function formatDimensions(
  length: number,
  width: number,
  height: number,
  unit: 'cm' | 'in' = 'cm'
): string {
  return `${length} x ${width} x ${height} ${unit}`
}

/**
 * Format water temperature range
 */
export function formatTemperatureRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return 'N/A'
  if (min === null) return `Hasta ${max}°C`
  if (max === null) return `Desde ${min}°C`
  return `${min}°C - ${max}°C`
}

/**
 * Format pH range
 */
export function formatPhRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return 'N/A'
  if (min === null) return `Hasta ${max}`
  if (max === null) return `Desde ${min}`
  return `${min} - ${max}`
}

/**
 * Translate care level to Spanish
 */
export function translateCareLevel(level: 'facil' | 'moderado' | 'avanzado'): string {
  const translations = {
    facil: 'Facil',
    moderado: 'Moderado',
    avanzado: 'Avanzado',
  }
  return translations[level]
}

/**
 * Translate water type to Spanish
 */
export function translateWaterType(type: 'dulce' | 'salada' | 'salobre'): string {
  const translations = {
    dulce: 'Agua Dulce',
    salada: 'Agua Salada',
    salobre: 'Agua Salobre',
  }
  return translations[type]
}

/**
 * Translate order status to Spanish
 */
export function translateOrderStatus(status: string): string {
  const translations: Record<string, string> = {
    pendiente: 'Pendiente',
    confirmado: 'Confirmado',
    en_proceso: 'En Proceso',
    enviado: 'Enviado',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
  }
  return translations[status] || status
}

/**
 * Translate payment status to Spanish
 */
export function translatePaymentStatus(status: string): string {
  const translations: Record<string, string> = {
    pendiente: 'Pendiente',
    pagado: 'Pagado',
    fallido: 'Fallido',
    reembolsado: 'Reembolsado',
  }
  return translations[status] || status
}

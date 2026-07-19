// lib/dashboard-alerts-config.ts
// RF: Como administrador quiero configurar qué alertas veo en el dashboard

export type AlertKey =
  | 'caja_abierta'
  | 'pedidos_pendientes'
  | 'transacciones_hoy'
  | 'produccion_lista'
  | 'stock_minimo'
  | 'apartados_vencen'
  | 'mortalidad_reciente'

export interface AlertConfig {
  key: AlertKey
  label: string
  description: string
  enabled: boolean
}

export const DEFAULT_ALERT_CONFIGS: AlertConfig[] = [
  {
    key: 'caja_abierta',
    label: 'Caja abierta',
    description: 'Muestra si hay una sesión POS activa y quién la abrió.',
    enabled: true,
  },
  {
    key: 'pedidos_pendientes',
    label: 'Pedidos pendientes',
    description: 'Cantidad de órdenes que requieren atención o seguimiento.',
    enabled: true,
  },
  {
    key: 'transacciones_hoy',
    label: 'Transacciones del día',
    description: 'Número de ventas confirmadas durante el día de hoy.',
    enabled: true,
  },
  {
    key: 'produccion_lista',
    label: 'Producción lista',
    description: 'Órdenes de producción que ya están listas para entrega.',
    enabled: true,
  },
  {
    key: 'stock_minimo',
    label: 'Stock bajo mínimo',
    description: 'Animales o productos por debajo del umbral de stock mínimo.',
    enabled: true,
  },
  {
    key: 'apartados_vencen',
    label: 'Apartados por vencer',
    description: 'Apartados activos que vencen en los próximos 3 días.',
    enabled: true,
  },
  {
    key: 'mortalidad_reciente',
    label: 'Mortalidad reciente',
    description: 'Muertes de animales registradas en las últimas 24 horas.',
    enabled: false,
  },
]

const STORAGE_KEY = 'dashboard-alert-config'

export function loadAlertConfig(): AlertConfig[] {
  if (typeof window === 'undefined') return DEFAULT_ALERT_CONFIGS
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return DEFAULT_ALERT_CONFIGS
    const parsed: Partial<Record<AlertKey, boolean>> = JSON.parse(saved)
    return DEFAULT_ALERT_CONFIGS.map(cfg => ({
      ...cfg,
      enabled: parsed[cfg.key] ?? cfg.enabled,
    }))
  } catch {
    return DEFAULT_ALERT_CONFIGS
  }
}

export function saveAlertConfig(configs: AlertConfig[]): void {
  if (typeof window === 'undefined') return
  const map: Partial<Record<AlertKey, boolean>> = {}
  configs.forEach(c => { map[c.key] = c.enabled })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

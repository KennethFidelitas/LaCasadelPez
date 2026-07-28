import type { ProductionOrder, ProductionPaymentStatus, ProductionStatus } from '@/lib/types'

type EstadoConteo = Record<ProductionStatus, number>
type PagoConteo = Record<ProductionPaymentStatus, number>

export type OrdenProduccionPlan = ProductionOrder & {
  saldoPendiente: number
  diasTranscurridos: number
  diasRestantes: number | null
  fechaEstimadaEntrega: string | null
  prioridad: 'atrasada' | 'esta_semana' | 'programada' | 'sin_fecha'
}

export type ReporteOrdenesProduccion = {
  generadoEn: string
  resumen: {
    totalOrdenes: number
    activas: number
    cotizacionesAbiertas: number
    confirmadas: number
    enProduccion: number
    listasParaEntrega: number
    entregadas: number
    canceladas: number
    ventasActivas: number
    saldosPendientes: number
    anticiposRecibidos: number
    ticketPromedioActivo: number
  }
  porEstado: EstadoConteo
  porPago: PagoConteo
  planProduccion: OrdenProduccionPlan[]
  pendientesEntrega: OrdenProduccionPlan[]
  cobrosPendientes: OrdenProduccionPlan[]
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

const ESTADOS_INICIALES: EstadoConteo = {
  cotizado: 0,
  confirmado: 0,
  en_produccion: 0,
  listo: 0,
  entregado: 0,
  cancelado: 0,
}

const PAGOS_INICIALES: PagoConteo = {
  pendiente: 0,
  anticipo: 0,
  pagado: 0,
  reembolsado: 0,
}

function startOfDay(date: Date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function daysBetween(from: Date, to: Date) {
  return Math.floor((startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_PER_DAY)
}

function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

function getBaseScheduleDate(order: ProductionOrder) {
  return new Date(order.started_at ?? order.created_at)
}

function crearPlanOrden(order: ProductionOrder, today: Date): OrdenProduccionPlan {
  const baseDate = getBaseScheduleDate(order)
  const estimatedDate = order.estimated_days ? addDays(baseDate, order.estimated_days) : null
  const diasRestantes = estimatedDate ? daysBetween(today, estimatedDate) : null

  let prioridad: OrdenProduccionPlan['prioridad'] = 'sin_fecha'
  if (diasRestantes !== null) {
    if (diasRestantes < 0) prioridad = 'atrasada'
    else if (diasRestantes <= 7) prioridad = 'esta_semana'
    else prioridad = 'programada'
  }

  return {
    ...order,
    saldoPendiente: Math.max(0, Number(order.total) - Number(order.deposit_paid)),
    diasTranscurridos: Math.max(0, daysBetween(baseDate, today)),
    diasRestantes,
    fechaEstimadaEntrega: estimatedDate?.toISOString() ?? null,
    prioridad,
  }
}

export function crearReporteOrdenesProduccion(
  ordenes: ProductionOrder[],
  today = new Date(),
): ReporteOrdenesProduccion {
  const porEstado = { ...ESTADOS_INICIALES }
  const porPago = { ...PAGOS_INICIALES }
  const planes = ordenes.map((orden) => {
    porEstado[orden.status] += 1
    porPago[orden.payment_status] += 1
    return crearPlanOrden(orden, today)
  })

  const activas = planes.filter(
    (orden) => orden.status !== 'entregado' && orden.status !== 'cancelado',
  )
  const ventasActivas = activas.reduce((total, orden) => total + Number(orden.total), 0)
  const saldosPendientes = activas.reduce((total, orden) => total + orden.saldoPendiente, 0)
  const anticiposRecibidos = activas.reduce(
    (total, orden) => total + Number(orden.deposit_paid),
    0,
  )

  const planProduccion = planes
    .filter((orden) => orden.status === 'confirmado' || orden.status === 'en_produccion')
    .sort((a, b) => {
      const aTime = a.fechaEstimadaEntrega ? new Date(a.fechaEstimadaEntrega).getTime() : Infinity
      const bTime = b.fechaEstimadaEntrega ? new Date(b.fechaEstimadaEntrega).getTime() : Infinity
      return aTime - bTime
    })

  return {
    generadoEn: today.toISOString(),
    resumen: {
      totalOrdenes: ordenes.length,
      activas: activas.length,
      cotizacionesAbiertas: porEstado.cotizado,
      confirmadas: porEstado.confirmado,
      enProduccion: porEstado.en_produccion,
      listasParaEntrega: porEstado.listo,
      entregadas: porEstado.entregado,
      canceladas: porEstado.cancelado,
      ventasActivas,
      saldosPendientes,
      anticiposRecibidos,
      ticketPromedioActivo: activas.length > 0 ? ventasActivas / activas.length : 0,
    },
    porEstado,
    porPago,
    planProduccion,
    pendientesEntrega: planes
      .filter((orden) => orden.status === 'listo')
      .sort((a, b) => b.saldoPendiente - a.saldoPendiente),
    cobrosPendientes: activas
      .filter((orden) => orden.saldoPendiente > 0)
      .sort((a, b) => b.saldoPendiente - a.saldoPendiente),
  }
}

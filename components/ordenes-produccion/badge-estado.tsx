import { Badge } from '@/components/ui/display/badge'
import { cn } from '@/lib/utils'
import type { ProductionStatus, ProductionPaymentStatus } from '@/lib/types'

const STATUS_CONFIG: Record<
  ProductionStatus,
  { label: string; className: string }
> = {
  cotizado: {
    label: 'Cotizado',
    className: 'border-border bg-[var(--sand)] text-foreground',
  },
  confirmado: {
    label: 'Confirmado',
    className:
      'border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  },
  en_produccion: {
    label: 'En producción',
    className:
      'border-[oklch(0.80_0.06_180)] bg-[oklch(0.90_0.04_180)] text-[oklch(0.30_0.08_180)]',
  },
  listo: {
    label: 'Listo',
    className:
      'border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300',
  },
  entregado: {
    label: 'Entregado',
    className:
      'border-[oklch(0.82_0.03_220)] bg-[oklch(0.93_0.01_220)] text-[oklch(0.40_0.04_220)]',
  },
  cancelado: {
    label: 'Cancelado',
    className:
      'border-destructive/30 bg-destructive/10 text-destructive',
  },
}

const PAYMENT_CONFIG: Record<
  ProductionPaymentStatus,
  { label: string; className: string }
> = {
  pendiente: {
    label: 'Pendiente',
    className: 'border-border bg-[var(--sand)] text-foreground',
  },
  anticipo: {
    label: 'Anticipo',
    className:
      'border-[oklch(0.80_0.06_180)] bg-[oklch(0.90_0.04_180)] text-[oklch(0.30_0.08_180)]',
  },
  pagado: {
    label: 'Pagado',
    className:
      'border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300',
  },
  reembolsado: {
    label: 'Reembolsado',
    className:
      'border-destructive/30 bg-destructive/10 text-destructive',
  },
}

export function BadgeEstado({
  status,
  className,
}: {
  status: ProductionStatus
  className?: string
}) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}

export function BadgePago({
  status,
  className,
}: {
  status: ProductionPaymentStatus
  className?: string
}) {
  const config = PAYMENT_CONFIG[status]
  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}

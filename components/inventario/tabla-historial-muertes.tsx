'use client'

import { useCallback, useRef, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Download, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { MuerteConAnimal } from '@/lib/types'
import { CAUSAS_MUERTE, CAUSA_MUERTE_LABELS } from '@/lib/inventario/schemas'
import { formatDate } from '@/lib/format'

import { Button } from '@/components/ui/actions/button'
import { Input } from '@/components/ui/forms/input'
import { Badge } from '@/components/ui/display/badge'
import { Skeleton } from '@/components/ui/display/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/display/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/forms/select'

// ─── Badge por causa ──────────────────────────────────────────────────────────

type BadgeProps = {
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string
}

function badgePropsPorCausa(reason: string): BadgeProps {
  switch (reason) {
    case 'enfermedad':
      return { variant: 'destructive' }
    case 'parametros_agua':
      return {
        variant: 'outline',
        className:
          'border-yellow-400 bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300',
      }
    case 'traslado':
      return { variant: 'secondary' }
    case 'causa_desconocida':
      return { variant: 'outline' }
    case 'otro':
    default:
      return { variant: 'default' }
  }
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

interface FiltrosActivos {
  fechaInicio?: string
  fechaFin?: string
  nombreAnimal?: string
  causa?: string
  page?: number
}

interface TablaHistorialMuertesProps {
  registros: MuerteConAnimal[]
  total: number
  filtrosActivos: FiltrosActivos
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function TablaHistorialMuertes({
  registros,
  total,
  filtrosActivos,
}: TablaHistorialMuertesProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const busquedaTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const paginaActual = filtrosActivos.page ?? 1
  const totalPaginas = Math.ceil(total / PAGE_SIZE)

  const actualizarFiltro = useCallback(
    (clave: string, valor: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (valor) {
        params.set(clave, valor)
      } else {
        params.delete(clave)
      }
      if (clave !== 'page') {
        params.delete('page')
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, searchParams],
  )

  const hayFiltros =
    !!filtrosActivos.fechaInicio ||
    !!filtrosActivos.fechaFin ||
    !!filtrosActivos.nombreAnimal ||
    !!filtrosActivos.causa

  function limpiarFiltros() {
    startTransition(() => router.push(pathname))
  }

  function exportarCSV() {
    const encabezados = ['Fecha', 'Animal', 'Especie', 'Cantidad', 'Causa', 'Notas']

    const filas = registros.map((r) => [
      r.recorded_at ? formatDate(r.recorded_at) : '—',
      r.animals?.name ?? '—',
      r.animals?.scientific_name ?? '—',
      String(r.quantity),
      CAUSA_MUERTE_LABELS[r.reason as typeof CAUSAS_MUERTE[number]] ?? r.reason,
      r.notes ?? '',
    ])

    const csv = [encabezados, ...filas]
      .map((fila) =>
        fila.map((celda) => `"${celda.replace(/"/g, '""')}"`).join(','),
      )
      .join('\n')

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `historial-bajas-${new Date().toLocaleDateString('en-CA')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* ── Barra de filtros ── */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Nombre del animal */}
        <div className="min-w-[200px] flex-1 space-y-1">
          <span className="text-xs text-muted-foreground">Animal</span>
          <Input
            defaultValue={filtrosActivos.nombreAnimal ?? ''}
            placeholder="Buscar por nombre…"
            onChange={(e) => {
              const valor = e.target.value
              if (busquedaTimer.current) clearTimeout(busquedaTimer.current)
              busquedaTimer.current = setTimeout(
                () => actualizarFiltro('nombreAnimal', valor || null),
                400,
              )
            }}
          />
        </div>

        {/* Fecha inicio */}
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Desde</span>
          <Input
            type="date"
            defaultValue={filtrosActivos.fechaInicio ?? ''}
            onChange={(e) => actualizarFiltro('fechaInicio', e.target.value || null)}
            className="w-[155px]"
          />
        </div>

        {/* Fecha fin */}
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Hasta</span>
          <Input
            type="date"
            defaultValue={filtrosActivos.fechaFin ?? ''}
            onChange={(e) => actualizarFiltro('fechaFin', e.target.value || null)}
            className="w-[155px]"
          />
        </div>

        {/* Causa */}
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Causa</span>
          <Select
            value={filtrosActivos.causa ?? 'todas'}
            onValueChange={(v) =>
              actualizarFiltro('causa', v === 'todas' ? null : v)
            }
          >
            <SelectTrigger className="w-[195px]">
              <SelectValue placeholder="Todas las causas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las causas</SelectItem>
              {CAUSAS_MUERTE.map((causa) => (
                <SelectItem key={causa} value={causa}>
                  {CAUSA_MUERTE_LABELS[causa]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Limpiar */}
        {hayFiltros && (
          <Button
            variant="ghost"
            size="sm"
            onClick={limpiarFiltros}
            className="gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            Limpiar
          </Button>
        )}

        {/* Exportar CSV */}
        <Button
          variant="outline"
          size="sm"
          onClick={exportarCSV}
          disabled={registros.length === 0}
          className={cn('gap-1.5', !hayFiltros && 'ml-auto')}
        >
          <Download className="h-3.5 w-3.5" />
          Exportar CSV
        </Button>
      </div>

      {/* ── Tabla ── */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Animal</TableHead>
              <TableHead className="hidden md:table-cell">Especie</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead>Causa</TableHead>
              <TableHead className="hidden lg:table-cell">Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registros.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  No hay registros de bajas para los filtros seleccionados.
                </TableCell>
              </TableRow>
            ) : (
              registros.map((r) => {
                const badge = badgePropsPorCausa(r.reason)
                const etiquetaCausa =
                  CAUSA_MUERTE_LABELS[r.reason as typeof CAUSAS_MUERTE[number]] ??
                  r.reason

                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">
                      {r.recorded_at ? formatDate(r.recorded_at) : '—'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {r.animals?.name ?? '—'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm italic text-muted-foreground">
                      {r.animals?.scientific_name ?? '—'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {r.quantity}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={badge.variant}
                        className={badge.className}
                      >
                        {etiquetaCausa}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden max-w-[200px] truncate lg:table-cell text-sm text-muted-foreground">
                      {r.notes ?? '—'}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Paginación ── */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total} registro{total !== 1 ? 's' : ''} · Página {paginaActual} de{' '}
            {totalPaginas}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={paginaActual <= 1 || isPending}
              onClick={() =>
                actualizarFiltro('page', String(paginaActual - 1))
              }
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={paginaActual >= totalPaginas || isPending}
              onClick={() =>
                actualizarFiltro('page', String(paginaActual + 1))
              }
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function TablaHistorialMuertesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 min-w-[200px] flex-1" />
        <Skeleton className="h-9 w-[155px]" />
        <Skeleton className="h-9 w-[155px]" />
        <Skeleton className="h-9 w-[195px]" />
        <Skeleton className="ml-auto h-9 w-[120px]" />
      </div>
      <div className="rounded-lg border">
        <div className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

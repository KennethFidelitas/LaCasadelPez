'use client'

import { useCallback, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

import type { EstadisticasMortalidad } from '@/lib/inventario/actions'
import { Button } from '@/components/ui/actions/button'
import { Input } from '@/components/ui/forms/input'
import { Skeleton } from '@/components/ui/display/skeleton'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/display/card'

// ─── Colores por causa ────────────────────────────────────────────────────────

const COLORES_CAUSA: Record<string, string> = {
  enfermedad: '#ef4444',
  parametros_agua: '#eab308',
  traslado: '#6366f1',
  causa_desconocida: '#94a3b8',
  otro: '#10b981',
}

function colorPorCausa(causa: string): string {
  return COLORES_CAUSA[causa] ?? '#cbd5e1'
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface DashboardMortalidadProps {
  estadisticas: EstadisticasMortalidad
  filtrosActivos: { fechaInicio?: string; fechaFin?: string }
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function DashboardMortalidad({
  estadisticas,
  filtrosActivos,
}: DashboardMortalidadProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const actualizarFiltro = useCallback(
    (clave: string, valor: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (valor) {
        params.set(clave, valor)
      } else {
        params.delete(clave)
      }
      startTransition(() => router.push(`${pathname}?${params.toString()}`))
    },
    [router, pathname, searchParams],
  )

  const { totalRegistros, totalAnimales, porCausa, porMes, topAnimales } =
    estadisticas
  const hayDatos = totalRegistros > 0
  const hayFiltros = !!filtrosActivos.fechaInicio || !!filtrosActivos.fechaFin

  return (
    <div className="space-y-6">
      {/* ── Filtro de fechas ── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Desde</span>
          <Input
            type="date"
            defaultValue={filtrosActivos.fechaInicio ?? ''}
            onChange={(e) =>
              actualizarFiltro('fechaInicio', e.target.value || null)
            }
            className="w-[155px]"
          />
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Hasta</span>
          <Input
            type="date"
            defaultValue={filtrosActivos.fechaFin ?? ''}
            onChange={(e) =>
              actualizarFiltro('fechaFin', e.target.value || null)
            }
            className="w-[155px]"
          />
        </div>
        {hayFiltros && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => startTransition(() => router.push(pathname))}
            className="gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            Limpiar
          </Button>
        )}
      </div>

      {/* ── Tarjetas de resumen ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Registros de baja</CardDescription>
            <CardTitle className="text-3xl">{totalRegistros}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Eventos registrados en el período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Animales dados de baja</CardDescription>
            <CardTitle className="text-3xl">{totalAnimales}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Unidades acumuladas en el período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Tendencia mensual ── */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencia mensual</CardTitle>
          <CardDescription>
            Animales dados de baja por mes en el período seleccionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hayDatos ? (
            <GraficaVacia />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={porMes}
                margin={{ top: 4, right: 16, left: -16, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  angle={-35}
                  textAnchor="end"
                  height={52}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => [value, 'Animales']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="cantidad"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#3b82f6' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Por causa + Top animales ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* PieChart — distribución por causa */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por causa</CardTitle>
            <CardDescription>
              Proporción de animales por tipo de baja
            </CardDescription>
          </CardHeader>
          <CardContent>
            {porCausa.length === 0 ? (
              <GraficaVacia />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={porCausa}
                    dataKey="cantidad"
                    nameKey="etiqueta"
                    cx="50%"
                    cy="42%"
                    outerRadius={90}
                    innerRadius={52}
                  >
                    {porCausa.map((entry) => (
                      <Cell
                        key={entry.causa}
                        fill={colorPorCausa(entry.causa)}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [value, 'Animales']}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* BarChart horizontal — top 5 animales */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 animales</CardTitle>
            <CardDescription>
              Especies con mayor número de bajas en el período
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topAnimales.length === 0 ? (
              <GraficaVacia />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={topAnimales}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="nombre"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={115}
                  />
                  <Tooltip
                    formatter={(value) => [value, 'Animales']}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar
                    dataKey="cantidad"
                    fill="#3b82f6"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Empty state para gráficas ────────────────────────────────────────────────

function GraficaVacia() {
  return (
    <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
      Sin datos para el período seleccionado.
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function DashboardMortalidadSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex gap-3">
        <Skeleton className="h-9 w-[155px]" />
        <Skeleton className="h-9 w-[155px]" />
      </div>
      {/* Tarjetas */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
      {/* LineChart */}
      <Skeleton className="h-[332px] w-full rounded-xl" />
      {/* PieChart + BarChart */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[368px] w-full rounded-xl" />
        <Skeleton className="h-[368px] w-full rounded-xl" />
      </div>
    </div>
  )
}

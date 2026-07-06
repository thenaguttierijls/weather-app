import { TrendingUp } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'

import type { NormalizedForecast } from '@/api/types'
import { Tile } from '@/components/tiles/Tile'
import { celsiusToFahrenheit, formatWeekday } from '@/lib/formatters'
import type { TempUnit } from '@/lib/formatters'
import { useUnitStore } from '@/stores/useUnitStore'

interface TrendChartTileProps {
  forecast: NormalizedForecast
  className?: string
}

interface ChartRow {
  day: string
  high: number
  low: number
}

function unitToTemp(unit: 'metric' | 'imperial'): TempUnit {
  return unit === 'imperial' ? 'F' : 'C'
}

function convert(celsius: number, unit: TempUnit): number {
  if (!Number.isFinite(celsius)) return Number.NaN
  const value = unit === 'F' ? celsiusToFahrenheit(celsius) : celsius
  return Math.round(value)
}

function renderTooltip(
  { active, payload, label }: TooltipContentProps,
  unit: TempUnit,
) {
  if (!active || !payload || payload.length === 0) return null
  const high = payload.find((entry) => entry.dataKey === 'high')?.value
  const low = payload.find((entry) => entry.dataKey === 'low')?.value
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-sm">
      <p className="font-medium">{label}</p>
      <p className="mt-1 tabular-nums">
        <span className="text-foreground">High {high ?? '—'}°{unit}</span>
        <span className="mx-2 text-muted-foreground">·</span>
        <span className="text-muted-foreground">Low {low ?? '—'}°{unit}</span>
      </p>
    </div>
  )
}

export function TrendChartTile({ forecast, className }: TrendChartTileProps) {
  const unit = useUnitStore((state) => state.unit)
  const tempUnit = unitToTemp(unit)
  const timezone = forecast.location.timezone
  const rows: ChartRow[] = forecast.daily.slice(0, 5).map((day) => ({
    day: formatWeekday(day.date, timezone),
    high: convert(day.tempMaxC, tempUnit),
    low: convert(day.tempMinC, tempUnit),
  }))

  return (
    <Tile title="5-day trend" icon={TrendingUp} ariaLabel="Five-day temperature trend" className={className}>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Trend data unavailable.</p>
      ) : (
        <div className="h-[180px] w-full text-primary" role="img" aria-label="Five-day high and low temperature trend">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip content={(props) => renderTooltip(props, tempUnit)} cursor={{ stroke: 'hsl(var(--border))' }} />
              <Line
                type="monotone"
                dataKey="high"
                stroke="currentColor"
                strokeWidth={2}
                dot={{ r: 3, fill: 'currentColor' }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="low"
                stroke="currentColor"
                strokeOpacity={0.5}
                strokeWidth={2}
                dot={{ r: 3, fill: 'currentColor', fillOpacity: 0.5 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Tile>
  )
}

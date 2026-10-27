import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts'
import { usePriceHistory, useVendors } from '@/api/queries'
import { Button } from '@/components/ui/button'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { convert, formatPrice } from '@/lib/currency'
import { useSettings } from '@/store/settingsStore'
import type { Currency, Vendor } from '@/types'

const RANGES = [30, 90] as const

/** Color follows the vendor (its position in the full vendor list), never its rank on this chart. */
function seriesColor(vendors: Vendor[], vendorId: string) {
  const slot = vendors.findIndex((v) => v.id === vendorId) + 1
  return `var(--series-${slot})`
}

const dateLabel = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' })
const formatDate = (iso: string) => dateLabel.format(new Date(`${iso}T12:00:00`))

function compactPrice(value: number, currency: Currency) {
  const symbol = currency === 'INR' ? '₹' : '$'
  if (value >= 1000) return `${symbol}${(value / 1000).toFixed(1)}k`
  return `${symbol}${value < 10 ? value.toFixed(2) : Math.round(value)}`
}

type Row = { date: string } & Record<string, number | string>

function HistoryTooltip({ active, payload, label, currency, vendorNames }: TooltipContentProps & { currency: Currency; vendorNames: Map<string, string> }) {
  if (!active || !payload?.length) return null
  const entries = [...payload].sort((a, b) => Number(a.value) - Number(b.value))
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-medium">{formatDate(String(label))}</p>
      <ul className="space-y-1">
        {entries.map((e) => (
          <li key={String(e.dataKey)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-0.5 w-3 rounded-full" style={{ background: e.color }} />
              {vendorNames.get(String(e.dataKey))}
            </span>
            <span className="font-medium tabular-nums">{formatPrice(Number(e.value), currency, currency)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function PriceHistoryChart({ partId }: { partId: string }) {
  const [days, setDays] = useState<(typeof RANGES)[number]>(90)
  const currency = useSettings((s) => s.currency)
  const { data: history, isPending, isError } = usePriceHistory(partId, days)
  const { data: vendors = [] } = useVendors()

  const { rows, vendorIds } = useMemo(() => {
    const byDate = new Map<string, Row>()
    const ids = new Set<string>()
    for (const s of history ?? []) {
      const row: Row = byDate.get(s.date) ?? { date: s.date }
      row[s.vendorId] = Math.round(convert(s.unitPrice, s.currency, currency) * 100) / 100
      byDate.set(s.date, row)
      ids.add(s.vendorId)
    }
    const ordered = vendors.map((v) => v.id).filter((id) => ids.has(id))
    return { rows: [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)), vendorIds: ordered }
  }, [history, currency, vendors])

  const vendorNames = new Map(vendors.map((v) => [v.id, v.name]))

  return (
    <>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Price history</CardTitle>
          <CardDescription>Single-unit price per vendor, in {currency === 'INR' ? 'rupees' : 'US dollars'}</CardDescription>
        </div>
        <div className="flex rounded-lg border p-0.5" role="group" aria-label="Time range">
          {RANGES.map((r) => (
            <Button key={r} size="sm" variant={r === days ? 'default' : 'ghost'} className="h-7" onClick={() => setDays(r)} aria-pressed={r === days}>
              {r}d
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isError ? (
          <p className="py-16 text-center text-sm text-danger">Couldn't load price history.</p>
        ) : isPending ? (
          <Skeleton className="h-64" />
        ) : (
          <>
            <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
              {vendorIds.map((id) => (
                <li key={id} className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 rounded-full" style={{ background: seriesColor(vendors, id) }} />
                  {vendorNames.get(id)}
                </li>
              ))}
            </ul>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--color-border)' }}
                    minTickGap={32}
                  />
                  <YAxis
                    tickFormatter={(v: number) => compactPrice(v, currency)}
                    tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={52}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    cursor={{ stroke: 'var(--color-muted-foreground)', strokeWidth: 1, strokeDasharray: '3 3' }}
                    content={(props) => <HistoryTooltip {...props} currency={currency} vendorNames={vendorNames} />}
                  />
                  {vendorIds.map((id) => (
                    <Line
                      key={id}
                      dataKey={id}
                      name={vendorNames.get(id)}
                      type="stepAfter"
                      stroke={seriesColor(vendors, id)}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--color-card)' }}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </>
  )
}

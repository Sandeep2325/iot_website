import { TrendingDown, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts'
import { useCategories, usePriceIndex } from '@/api/queries'
import { Button } from '@/components/ui/button'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { CategoryId } from '@/types'

const RANGES = [30, 90] as const

const dateLabel = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' })
const formatDate = (iso: string) => dateLabel.format(new Date(`${iso}T12:00:00`))
const signedPct = (index: number) => `${index >= 100 ? '+' : ''}${(index - 100).toFixed(1)}%`

function IndexTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const index = Number(payload[0].value)
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium">{formatDate(String(label))}</p>
      <p className="flex justify-between gap-4">
        <span className="text-muted-foreground">Index</span>
        <span className="font-medium tabular-nums">{index.toFixed(1)}</span>
      </p>
      <p className="flex justify-between gap-4">
        <span className="text-muted-foreground">vs start</span>
        <span className="font-medium tabular-nums">{signedPct(index)}</span>
      </p>
    </div>
  )
}

/** Average price movement across the catalog (or one category), indexed to 100 at the start of the range. */
export function PriceIndexChart() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(90)
  const [category, setCategory] = useState<CategoryId | ''>('')
  const { data: categories } = useCategories()
  const { data, isPending, isError } = usePriceIndex(days, category || undefined)

  const latest = data?.at(-1)?.index
  const Trend = latest != null && latest < 100 ? TrendingDown : TrendingUp

  return (
    <>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Price trend</CardTitle>
          <CardDescription>Average change in each part's lowest price, all vendors (start = 100)</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select className="w-52" value={category} onChange={(e) => setCategory(e.target.value as CategoryId | '')} aria-label="Category">
            <option value="">All categories</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <div className="flex rounded-lg border p-0.5" role="group" aria-label="Time range">
            {RANGES.map((r) => (
              <Button key={r} size="sm" variant={r === days ? 'default' : 'ghost'} className="h-7" onClick={() => setDays(r)} aria-pressed={r === days}>
                {r}d
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isError ? (
          <p className="py-16 text-center text-sm text-danger">Couldn't load the price trend.</p>
        ) : isPending ? (
          <Skeleton className="h-56" />
        ) : (
          <>
            {latest != null && (
              <p className="mb-3 flex items-center gap-2 text-sm">
                <Trend className={latest < 100 ? 'h-4 w-4 text-success' : 'h-4 w-4 text-danger'} aria-hidden />
                <span className="text-xl font-semibold tabular-nums">{signedPct(latest)}</span>
                <span className="text-muted-foreground">
                  over {days} days ({latest < 100 ? 'cheaper' : latest > 100 ? 'pricier' : 'unchanged'})
                </span>
              </p>
            )}
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
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
                    tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                    domain={['auto', 'auto']}
                    tickFormatter={(v: number) => String(Math.round(v * 10) / 10)}
                  />
                  <ReferenceLine y={100} stroke="var(--color-muted-foreground)" strokeDasharray="4 4" />
                  <Tooltip cursor={{ stroke: 'var(--color-muted-foreground)', strokeWidth: 1, strokeDasharray: '3 3' }} content={(props) => <IndexTooltip {...props} />} />
                  <Line
                    dataKey="index"
                    name="Price index"
                    type="monotone"
                    stroke="var(--series-1)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--color-card)' }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </>
  )
}

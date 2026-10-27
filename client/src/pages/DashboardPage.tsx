import { Bell, BellRing, GitCompareArrows, ListChecks, Package, TrendingDown, TrendingUp } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useDashboardSummary } from '@/api/queries'
import { PriceIndexChart } from '@/components/charts/PriceIndexChart'
import { PageHeader } from '@/components/layout/PageHeader'
import { PartImage } from '@/components/parts/PartImage'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice } from '@/lib/currency'
import { useBomPricing } from '@/lib/useBomPricing'
import { useWatchStatus } from '@/lib/useWatchStatus'
import { useCompare } from '@/store/compareStore'
import { useSettings } from '@/store/settingsStore'
import type { PriceMover } from '@/types'

interface StatTileProps {
  to: string
  label: string
  value: ReactNode
  sub: ReactNode
  icon: ReactNode
}

function StatTile({ to, label, value, sub, icon }: StatTileProps) {
  return (
    <Link to={to} className="group rounded-xl focus-visible:outline-2 focus-visible:outline-ring">
      <Card className="h-full transition-colors group-hover:border-primary/50">
        <CardContent className="flex items-start gap-4 p-4 sm:p-5">
          <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground sm:flex">{icon}</span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="truncate text-xl font-semibold tabular-nums sm:text-2xl">{value}</p>
            <p className="truncate text-xs text-muted-foreground">{sub}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function MoverList({ movers }: { movers: PriceMover[] }) {
  const currency = useSettings((s) => s.currency)
  if (!movers.length) return <p className="text-sm text-muted-foreground">No big moves this week.</p>
  return (
    <ul className="divide-y">
      {movers.map((m) => (
        <li key={m.part.id} className="flex items-center justify-between gap-3 py-2.5">
          <Link to={`/parts/${m.part.id}`} className="min-w-0 truncate text-sm hover:underline">
            {m.part.name}
          </Link>
          <div className="flex shrink-0 items-center gap-2 text-sm tabular-nums">
            <span className="hidden text-muted-foreground line-through sm:inline">{formatPrice(m.previousPrice, 'INR', currency)}</span>
            <span className="font-medium">{formatPrice(m.currentPrice, 'INR', currency)}</span>
            <Badge variant={m.changePct < 0 ? 'success' : 'danger'}>
              {m.changePct > 0 ? '+' : ''}
              {m.changePct.toFixed(1)}%
            </Badge>
          </div>
        </li>
      ))}
    </ul>
  )
}

function YourTiles() {
  const currency = useSettings((s) => s.currency)
  const { pricing, itemCount, loading } = useBomPricing()
  const { rows: watchRows, triggeredCount } = useWatchStatus()
  const compareCount = useCompare((s) => s.partIds.length)
  const { data: summary } = useDashboardSummary()

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <StatTile
        to="/bom"
        label="Your parts list"
        icon={<ListChecks className="h-5 w-5" />}
        value={itemCount === 0 ? '—' : loading ? '…' : formatPrice(pricing.mixedTotal, currency, currency)}
        sub={itemCount === 0 ? 'Start a parts list' : `${itemCount} part${itemCount === 1 ? '' : 's'} · cheapest mix`}
      />
      <StatTile
        to="/watchlist"
        label="Watching"
        icon={triggeredCount ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        value={watchRows.length}
        sub={triggeredCount ? `${triggeredCount} at target price` : watchRows.length ? 'No alerts yet' : 'Watch a part for price drops'}
      />
      <StatTile
        to="/compare"
        label="Comparing"
        icon={<GitCompareArrows className="h-5 w-5" />}
        value={compareCount}
        sub={compareCount ? 'Open comparison' : 'Compare up to 4 parts'}
      />
      <StatTile
        to="/search"
        label="Catalog"
        icon={<Package className="h-5 w-5" />}
        value={summary?.partCount ?? '…'}
        sub={summary ? `${summary.offerCount} offers from ${summary.vendorCount} vendors` : 'Loading…'}
      />
    </div>
  )
}

function AlertBanner() {
  const currency = useSettings((s) => s.currency)
  const { rows } = useWatchStatus()
  const hits = rows.filter((r) => r.triggered)
  if (!hits.length) return null
  return (
    <Card className="mb-6 border-success/40 bg-success/5" role="status">
      <CardContent className="pt-5">
        <p className="mb-2 flex items-center gap-2 text-sm font-medium">
          <BellRing className="h-4 w-4 text-success" />
          {hits.length} part{hits.length === 1 ? ' has' : 's have'} reached your target price
        </p>
        <ul className="flex flex-wrap gap-2">
          {hits.map((r) => (
            <li key={r.partId}>
              <Link to={`/parts/${r.partId}`} className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm hover:border-primary/50">
                {r.part.name}
                <span className="font-semibold tabular-nums">{r.currentPriceInr != null && formatPrice(r.currentPriceInr, 'INR', currency)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { data, isPending, isError, error } = useDashboardSummary()
  const currency = useSettings((s) => s.currency)

  return (
    <>
      <PageHeader title="Dashboard" description="Your projects and this week's prices across Indian and global vendors." />

      <AlertBanner />

      {isError && (
        <Card className="mb-6 border-danger/40">
          <CardContent className="pt-5 text-sm text-danger">Couldn't load market data: {error.message}</CardContent>
        </Card>
      )}

      <YourTiles />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <PriceIndexChart />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-success" /> Biggest price drops
            </CardTitle>
            <CardDescription>Lowest price across vendors, vs 7 days ago</CardDescription>
          </CardHeader>
          <CardContent>{isPending ? <Skeleton className="h-40" /> : data && <MoverList movers={data.biggestDrops} />}</CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-danger" /> Biggest price rises
            </CardTitle>
            <CardDescription>Lowest price across vendors, vs 7 days ago</CardDescription>
          </CardHeader>
          <CardContent>{isPending ? <Skeleton className="h-40" /> : data && <MoverList movers={data.biggestRises} />}</CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Trending parts</CardTitle>
            <CardDescription>Popular IoT building blocks</CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-28" />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {data?.trending.map((p) => (
                  <Link key={p.id} to={`/parts/${p.id}`} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted">
                    <PartImage part={p} className="h-11 w-11" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.manufacturer} · {p.offerCount} vendors
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {p.lowestPrice != null ? formatPrice(p.lowestPrice, p.lowestPriceCurrency, currency) : '—'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

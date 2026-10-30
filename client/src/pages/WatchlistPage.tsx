import { Bell, BellRing, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { PartImage } from '@/components/parts/PartImage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { convert, formatPrice } from '@/lib/currency'
import { useWatchStatus, type WatchRow } from '@/lib/useWatchStatus'
import { cn } from '@/lib/utils'
import { useSettings } from '@/store/settingsStore'
import { useWatchlist } from '@/store/watchlistStore'
import type { Currency } from '@/types'

const toDisplay = (inr: number, currency: Currency) => String(Math.round(convert(inr, 'INR', currency) * 100) / 100)

/** Target price input in the display currency; saves (as INR) on blur or Enter. */
function TargetInput({ row, currency }: { row: WatchRow; currency: Currency }) {
  const setTarget = useWatchlist((s) => s.setTarget)
  const synced = toDisplay(row.targetPriceInr, currency)
  const [text, setText] = useState(synced)
  const [lastSynced, setLastSynced] = useState(synced)
  if (synced !== lastSynced) {
    setLastSynced(synced)
    setText(synced)
  }

  function commit() {
    const n = Number(text)
    if (text.trim() !== '' && Number.isFinite(n) && n >= 0) setTarget(row.partId, Math.round(convert(n, currency, 'INR') * 100) / 100)
    else setText(synced)
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">{currency === 'INR' ? '₹' : '$'}</span>
      <Input
        type="number"
        min={0}
        step="any"
        inputMode="decimal"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        aria-label={`Alert price for ${row.part.name}`}
        className="h-8 w-28 pl-6"
      />
    </div>
  )
}

export default function WatchlistPage() {
  const { rows, triggeredCount, isPending } = useWatchStatus()
  const itemCount = useWatchlist((s) => s.items.length)
  const remove = useWatchlist((s) => s.remove)
  const currency = useSettings((s) => s.currency)

  return (
    <>
      <PageHeader
        title="Watchlist"
        description="Set a target price and get an alert here when a part drops to it."
      />

      {itemCount === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Bell className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">You're not watching any parts</p>
            <p className="max-w-sm text-sm text-muted-foreground">Open a part and click “Watch price” to track it here.</p>
            <Link to="/search">
              <Button variant="outline" size="sm">
                Search parts
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : isPending ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (
        <>
          {triggeredCount > 0 && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-success/40 px-4 py-3 text-sm" role="status">
              <BellRing className="h-4 w-4 text-success" />
              {triggeredCount} part{triggeredCount === 1 ? ' is' : 's are'} at or below your target price.
            </div>
          )}
          <Card>
            <ul className="divide-y">
              {rows.map((row) => {
                const gapPct = row.currentPriceInr != null ? ((row.currentPriceInr - row.targetPriceInr) / row.targetPriceInr) * 100 : null
                return (
                  <li key={row.partId} className={cn('flex flex-wrap items-center gap-x-6 gap-y-3 p-4', row.triggered && 'bg-success/5')}>
                    <div className="flex min-w-0 flex-1 basis-60 items-center gap-3">
                      <PartImage part={row.part} className="h-12 w-12" />
                      <div className="min-w-0">
                        <Link to={`/parts/${row.partId}`} className="block truncate font-medium hover:underline">
                          {row.part.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{row.part.mpn}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Lowest now</p>
                      <p className="font-semibold tabular-nums">
                        {row.currentPriceInr != null ? formatPrice(row.currentPriceInr, 'INR', currency) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="mb-0.5 text-xs text-muted-foreground">Alert at or below</p>
                      <TargetInput row={row} currency={currency} />
                    </div>
                    <div className="w-36">
                      {row.triggered ? (
                        <Badge variant="success">
                          <BellRing className="h-3 w-3" /> Target reached
                        </Badge>
                      ) : gapPct != null ? (
                        <Badge variant="muted">{gapPct.toFixed(0)}% above target</Badge>
                      ) : (
                        <Badge variant="muted">No offers</Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(row.partId)} aria-label={`Stop watching ${row.part.name}`}>
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                )
              })}
            </ul>
          </Card>
        </>
      )}
    </>
  )
}

import { Link } from 'react-router'
import { Card } from '@/components/ui/card'
import { formatPrice } from '@/lib/currency'
import { useSettings } from '@/store/settingsStore'
import type { PartSummary } from '@/types'
import { PartImage } from './PartImage'
import { StockBadge } from './StockBadge'

export function PartCard({ part }: { part: PartSummary }) {
  const currency = useSettings((s) => s.currency)

  return (
    <Link to={`/parts/${part.id}`} className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-ring">
      <Card className="flex h-full flex-col p-4 transition-colors group-hover:border-primary/50">
        <PartImage part={part} className="mb-3 aspect-[4/3] w-full" />
        <div className="flex gap-3">
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-medium group-hover:underline">{part.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {part.manufacturer} · {part.mpn}
            </p>
          </div>
        </div>
        <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{part.description}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            <p className="text-xs text-muted-foreground">from</p>
            <p className="text-lg font-semibold tabular-nums">
              {part.lowestPrice != null ? formatPrice(part.lowestPrice, part.lowestPriceCurrency, currency) : '—'}
            </p>
            <p className="text-xs text-muted-foreground">
              {part.offerCount} vendor{part.offerCount === 1 ? '' : 's'}
            </p>
          </div>
          <StockBadge stock={part.totalStock} />
        </div>
      </Card>
    </Link>
  )
}

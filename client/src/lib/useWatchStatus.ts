import { useManyParts } from '@/api/queries'
import { useSettings } from '@/store/settingsStore'
import { useWatchlist, type WatchItem } from '@/store/watchlistStore'
import type { PartDetail } from '@/types'
import { lowestUnitPrice, preferredOffers } from './pricing'

export interface WatchRow extends WatchItem {
  part: PartDetail
  /** Today's lowest single-unit price, in INR. */
  currentPriceInr: number | null
  triggered: boolean
}

/** Watched parts joined with live prices; `triggered` when the price is at or below target. */
export function useWatchStatus() {
  const items = useWatchlist((s) => s.items)
  const preferredVendors = useSettings((s) => s.preferredVendors)
  const { parts, isPending } = useManyParts(items.map((i) => i.partId))

  const rows: WatchRow[] = items.flatMap((item) => {
    const part = parts.find((p) => p.id === item.partId)
    if (!part) return []
    const currentPriceInr = lowestUnitPrice(preferredOffers(part.offers, preferredVendors), 'INR')
    return [{ ...item, part, currentPriceInr, triggered: currentPriceInr != null && currentPriceInr <= item.targetPriceInr }]
  })

  return {
    rows,
    triggeredCount: rows.filter((r) => r.triggered).length,
    isPending: isPending && rows.length < items.length,
  }
}

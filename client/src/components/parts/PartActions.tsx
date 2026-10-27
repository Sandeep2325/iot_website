import { Bell, BellOff, Check, GitCompareArrows, ListPlus } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { lowestUnitPrice, preferredOffers } from '@/lib/pricing'
import { useBom } from '@/store/bomStore'
import { MAX_COMPARE, useCompare } from '@/store/compareStore'
import { useSettings } from '@/store/settingsStore'
import { useWatchlist } from '@/store/watchlistStore'
import type { PartDetail } from '@/types'

/** "Add to parts list", "Watch price" and "Compare" buttons for a part. */
export function PartActions({ part, quantity }: { part: PartDetail; quantity: number }) {
  const bomItem = useBom((s) => s.items.find((i) => i.partId === part.id))
  const addToBom = useBom((s) => s.add)

  const preferredVendors = useSettings((s) => s.preferredVendors)
  const watching = useWatchlist((s) => s.items.some((i) => i.partId === part.id))
  const { add: watch, remove: unwatch } = useWatchlist()

  const compareIds = useCompare((s) => s.partIds)
  const { add: addCompare, remove: removeCompare } = useCompare()
  const comparing = compareIds.includes(part.id)
  const compareFull = !comparing && compareIds.length >= MAX_COMPARE

  function toggleWatch() {
    if (watching) return unwatch(part.id)
    // Default alert: 10% below today's lowest price.
    const lowest = lowestUnitPrice(preferredOffers(part.offers, preferredVendors), 'INR')
    watch(part.id, lowest != null ? Math.round(lowest * 0.9 * 100) / 100 : 0)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => addToBom(part.id, quantity)}>
          <ListPlus className="h-4 w-4" /> Add {quantity > 1 ? `${quantity} ` : ''}to parts list
        </Button>
        <Button variant="outline" onClick={toggleWatch} aria-pressed={watching}>
          {watching ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          {watching ? 'Stop watching' : 'Watch price'}
        </Button>
        <Button
          variant="outline"
          disabled={compareFull}
          onClick={() => (comparing ? removeCompare(part.id) : addCompare(part.id))}
          aria-pressed={comparing}
          title={compareFull ? `You can compare up to ${MAX_COMPARE} parts` : undefined}
        >
          {comparing ? <Check className="h-4 w-4" /> : <GitCompareArrows className="h-4 w-4" />}
          {comparing ? 'In compare' : compareFull ? 'Compare list full' : 'Compare'}
        </Button>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-live="polite">
        {bomItem && (
          <Link to="/bom" className="hover:text-foreground hover:underline">
            {bomItem.quantity} pcs in your parts list →
          </Link>
        )}
        {watching && (
          <Link to="/watchlist" className="hover:text-foreground hover:underline">
            Watching for price drops →
          </Link>
        )}
        {comparing && (
          <Link to="/compare" className="hover:text-foreground hover:underline">
            Comparing {compareIds.length} part{compareIds.length === 1 ? '' : 's'} →
          </Link>
        )}
      </div>
    </div>
  )
}

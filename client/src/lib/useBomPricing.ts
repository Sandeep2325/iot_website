import { useMemo } from 'react'
import { useManyParts } from '@/api/queries'
import { useBom } from '@/store/bomStore'
import { useSettings } from '@/store/settingsStore'
import { preferredOffers, priceBom } from './pricing'

/** The saved parts list priced with live offers, limited to the user's preferred vendors. */
export function useBomPricing() {
  const items = useBom((s) => s.items)
  const currency = useSettings((s) => s.currency)
  const preferredVendors = useSettings((s) => s.preferredVendors)
  const { parts, isPending } = useManyParts(items.map((i) => i.partId))

  const pricing = useMemo(() => {
    const inputs = items.flatMap((i) => {
      const part = parts.find((p) => p.id === i.partId)
      return part ? [{ part: { ...part, offers: preferredOffers(part.offers, preferredVendors) }, quantity: i.quantity }] : []
    })
    return priceBom(inputs, currency)
  }, [items, parts, currency, preferredVendors])

  return { pricing, itemCount: items.length, loading: isPending && pricing.lines.length < items.length }
}

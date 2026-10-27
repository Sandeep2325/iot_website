import { ExternalLink } from 'lucide-react'
import { useVendors } from '@/api/queries'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/currency'
import type { OfferQuote } from '@/lib/pricing'
import { cn } from '@/lib/utils'
import { useSettings } from '@/store/settingsStore'

interface OfferTableProps {
  quotes: OfferQuote[]
  bestOfferId?: string
  isPreferred: (vendorId: string) => boolean
}

export function OfferTable({ quotes, bestOfferId, isPreferred }: OfferTableProps) {
  const currency = useSettings((s) => s.currency)
  const { data: vendors } = useVendors()
  const vendorById = new Map(vendors?.map((v) => [v.id, v]))

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b text-left text-xs whitespace-nowrap text-muted-foreground">
            <th className="py-2 pr-3 font-medium">Vendor</th>
            <th className="py-2 pr-3 font-medium">Stock</th>
            <th className="py-2 pr-3 text-right font-medium">Unit price</th>
            <th className="py-2 pr-3 text-right font-medium">Total</th>
            <th className="py-2 pr-3 font-medium">Bulk pricing</th>
            <th className="py-2 font-medium">
              <span className="sr-only">Link</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {quotes.map((q) => {
            const vendor = vendorById.get(q.offer.vendorId)
            const foreign = q.offer.currency !== currency
            return (
              <tr key={q.offer.id} className={cn((!q.inStock || !isPreferred(q.offer.vendorId)) && 'text-muted-foreground')}>
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{vendor?.name ?? q.offer.vendorId}</span>
                    {q.offer.id === bestOfferId && <Badge variant="success">Best price</Badge>}
                    {!isPreferred(q.offer.vendorId) && <Badge variant="muted">Not a preferred vendor</Badge>}
                    {q.offer.source === 'sample' && (
                      <Badge variant="muted" title="Generated demo price, not from the vendor. Live prices need that vendor's API key on the server.">
                        Sample price
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {vendor?.region === 'IN' ? 'Ships from India' : 'Ships internationally'} · SKU {q.offer.vendorSku}
                  </span>
                </td>
                <td className="py-3 pr-3 whitespace-nowrap">
                  {q.offer.stock > 0 ? q.offer.stock.toLocaleString('en-IN') : <span className="text-danger">Out of stock</span>}
                  {q.offer.moq > 1 && <span className="block text-xs text-muted-foreground">Min. order {q.offer.moq}</span>}
                </td>
                <td className="py-3 pr-3 text-right whitespace-nowrap tabular-nums">
                  {formatPrice(q.unitPrice, q.offer.currency, currency)}
                  {foreign && (
                    <span className="block text-xs text-muted-foreground">
                      {formatPrice(q.unitPrice, q.offer.currency, q.offer.currency)}
                    </span>
                  )}
                </td>
                <td className="py-3 pr-3 text-right font-semibold whitespace-nowrap text-foreground tabular-nums">
                  {formatPrice(q.displayTotal, currency, currency)}
                  <span className="block text-xs font-normal text-muted-foreground">× {q.billableQty}</span>
                </td>
                <td className="py-3 pr-3">
                  <div className="flex flex-wrap gap-1">
                    {q.offer.priceBreaks.map((pb) => (
                      <span key={pb.qty} className="rounded bg-muted px-1.5 py-0.5 text-xs whitespace-nowrap tabular-nums">
                        {pb.qty}+: {formatPrice(pb.unitPrice, q.offer.currency, currency)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 text-right">
                  <a
                    href={q.offer.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap text-primary hover:underline"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

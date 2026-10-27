import { GitCompareArrows, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useCategories, useManyParts } from '@/api/queries'
import { PageHeader } from '@/components/layout/PageHeader'
import { PartImage } from '@/components/parts/PartImage'
import { PartPicker } from '@/components/parts/PartPicker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice } from '@/lib/currency'
import { lowestUnitPrice, preferredOffers } from '@/lib/pricing'
import { MAX_COMPARE, useCompare } from '@/store/compareStore'
import { useSettings } from '@/store/settingsStore'

const EXAMPLE = ['esp32-devkitc', 'esp32-c3-devkitm', 'rpi-pico-w']

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <tr className="divide-x">
      <th scope="row" className="sticky left-0 z-10 bg-card py-2.5 pr-3 text-left text-xs font-medium text-muted-foreground">
        {label}
      </th>
      {children}
    </tr>
  )
}

export default function ComparePage() {
  const { partIds, add, remove, clear } = useCompare()
  const { parts, isPending } = useManyParts(partIds)
  const { data: categories } = useCategories()
  const currency = useSettings((s) => s.currency)

  // Keep the user's order; skip ids that no longer exist in the catalog.
  const ordered = partIds.map((id) => parts.find((p) => p.id === id)).filter((p) => p !== undefined)
  const preferredVendors = useSettings((s) => s.preferredVendors)
  const prices = ordered.map((p) => lowestUnitPrice(preferredOffers(p.offers, preferredVendors), currency))
  const minPrice = Math.min(...prices.filter((p) => p != null))
  const specKeys = [...new Set(ordered.flatMap((p) => Object.keys(p.specs)))]
  const full = partIds.length >= MAX_COMPARE

  return (
    <>
      <PageHeader
        title="Compare"
        description={`Compare up to ${MAX_COMPARE} parts side by side.`}
        actions={
          partIds.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clear}>
              Clear all
            </Button>
          )
        }
      />

      <div className="mb-6 max-w-xl">
        <PartPicker
          onSelect={(p) => add(p.id)}
          excludeIds={partIds}
          disabled={full}
          placeholder={full ? `Compare list is full (${MAX_COMPARE}). Remove a part to add another.` : 'Add a part to compare…'}
        />
      </div>

      {partIds.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <GitCompareArrows className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">Nothing to compare yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Search for parts above, or use the Compare button on any part's page.
            </p>
            <Button variant="outline" size="sm" onClick={() => EXAMPLE.forEach(add)}>
              Try ESP32 vs ESP32-C3 vs Pico W
            </Button>
          </CardContent>
        </Card>
      ) : isPending && ordered.length === 0 ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : (
        <Card>
          <div className="relative overflow-x-auto p-4">
            <table className="w-full min-w-[560px] table-fixed text-sm">
              <colgroup>
                <col className="w-32" />
                {ordered.map((p) => (
                  <col key={p.id} />
                ))}
              </colgroup>
              <thead>
                <tr className="divide-x">
                  <th className="sticky left-0 z-10 bg-card">
                    <span className="sr-only">Part</span>
                  </th>
                  {ordered.map((p) => (
                    <th key={p.id} className="px-3 pb-3 text-left align-top font-normal">
                      <div className="flex items-start justify-between gap-2">
                        <PartImage part={p} className="h-16 w-16" />
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(p.id)} aria-label={`Remove ${p.name}`}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Link to={`/parts/${p.id}`} className="mt-2 block font-medium hover:underline">
                        {p.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{p.mpn}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y border-t">
                <Row label="Lowest price">
                  {ordered.map((p, i) => (
                    <td key={p.id} className="px-3 py-2.5">
                      <span className="font-semibold tabular-nums">{prices[i] != null ? formatPrice(prices[i], currency, currency) : '—'}</span>
                      {ordered.length > 1 && prices[i] === minPrice && (
                        <Badge variant="success" className="ml-2">
                          Lowest
                        </Badge>
                      )}
                    </td>
                  ))}
                </Row>
                <Row label="Vendors">
                  {ordered.map((p) => (
                    <td key={p.id} className="px-3 py-2.5">
                      {p.offers.length}
                    </td>
                  ))}
                </Row>
                <Row label="Total stock">
                  {ordered.map((p) => {
                    const stock = p.offers.reduce((s, o) => s + o.stock, 0)
                    return (
                      <td key={p.id} className={stock ? 'px-3 py-2.5 tabular-nums' : 'px-3 py-2.5 text-danger'}>
                        {stock ? stock.toLocaleString('en-IN') : 'Out of stock'}
                      </td>
                    )
                  })}
                </Row>
                <Row label="Manufacturer">
                  {ordered.map((p) => (
                    <td key={p.id} className="px-3 py-2.5">
                      {p.manufacturer}
                    </td>
                  ))}
                </Row>
                <Row label="Category">
                  {ordered.map((p) => (
                    <td key={p.id} className="px-3 py-2.5">
                      {categories?.find((c) => c.id === p.category)?.name ?? p.category}
                    </td>
                  ))}
                </Row>
                {specKeys.map((key) => (
                  <Row key={key} label={key}>
                    {ordered.map((p) => (
                      <td key={p.id} className="px-3 py-2.5">
                        {p.specs[key] ?? <span className="text-muted-foreground">—</span>}
                      </td>
                    ))}
                  </Row>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )
}

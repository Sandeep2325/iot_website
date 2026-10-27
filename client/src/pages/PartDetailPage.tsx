import { ArrowLeft, FileText } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiError } from '@/api/client'
import { useCategories, usePart } from '@/api/queries'
import { PriceHistoryChart } from '@/components/charts/PriceHistoryChart'
import { PartImage } from '@/components/parts/PartImage'
import { PhotoCredit } from '@/components/parts/PhotoCredit'
import { OfferTable } from '@/components/parts/OfferTable'
import { PartActions } from '@/components/parts/PartActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice } from '@/lib/currency'
import { quoteOffers } from '@/lib/pricing'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { useSettings } from '@/store/settingsStore'

const QUICK_QTYS = [1, 10, 50, 100]

export default function PartDetailPage() {
  const { partId = '' } = useParams()
  const navigate = useNavigate()
  const { data: part, isPending, isError, error } = usePart(partId)
  const { data: categories } = useCategories()
  const currency = useSettings((s) => s.currency)
  const [qtyInput, setQtyInput] = useState('1')
  const qty = Math.max(1, Math.floor(Number(qtyInput)) || 1)

  const preferredVendors = useSettings((s) => s.preferredVendors)
  const isPreferred = (vendorId: string) => !preferredVendors.length || preferredVendors.includes(vendorId)

  // Preferred vendors first; the rest stay listed for reference but never count as "best".
  const quotes = useMemo(() => {
    if (!part) return []
    const all = quoteOffers(part.offers, qty, currency)
    const preferred = (id: string) => !preferredVendors.length || preferredVendors.includes(id)
    return [...all.filter((q) => preferred(q.offer.vendorId)), ...all.filter((q) => !preferred(q.offer.vendorId))]
  }, [part, qty, currency, preferredVendors])
  const best = quotes.find((q) => q.inStock && isPreferred(q.offer.vendorId))
  useDocumentTitle(part?.name ?? (isError ? 'Part not found' : 'Part details'))

  const back = (
    <button onClick={() => navigate(-1)} className="mb-4 inline-flex cursor-pointer items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" /> Back
    </button>
  )

  if (isError) {
    const notFound = error instanceof ApiError && error.status === 404
    return (
      <>
        {back}
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <h1 className="font-medium">{notFound ? 'Part not found' : "Couldn't load this part"}</h1>
            <p className="text-sm text-muted-foreground">{notFound ? 'It may have been removed from the catalog.' : error.message}</p>
            <Link to="/search">
              <Button variant="outline" size="sm">Search parts</Button>
            </Link>
          </CardContent>
        </Card>
      </>
    )
  }

  if (isPending) {
    return (
      <>
        {back}
        <Skeleton className="mb-6 h-24 rounded-xl" />
        <Skeleton className="mb-6 h-64 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </>
    )
  }

  const categoryName = categories?.find((c) => c.id === part.category)?.name ?? part.category

  return (
    <>
      {back}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
        <figure className="shrink-0 sm:w-56">
          <PartImage part={part} className="aspect-[4/3] w-full border" />
          {part.image?.credit && <PhotoCredit credit={part.image.credit} />}
        </figure>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{part.name}</h1>
            <Link to={`/search?category=${part.category}`}>
              <Badge>{categoryName}</Badge>
            </Link>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {part.manufacturer} · MPN <span className="font-mono">{part.mpn}</span>
          </p>
          <p className="mt-2 max-w-2xl text-sm">{part.description}</p>
          <div className="mt-4">
            <PartActions part={part} quantity={qty} />
          </div>
        </div>
        {best && (
          <Card className="shrink-0 sm:w-52">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Best price{qty > 1 ? ` at ${qty} pcs` : ''}</p>
              <p className="text-2xl font-semibold tabular-nums">{formatPrice(best.displayUnitPrice, currency, currency)}</p>
              <p className="text-xs text-muted-foreground">per unit · {quotes.length} vendors</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader className="flex-row flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle>Vendor prices</CardTitle>
            <CardDescription>Bulk-price tiers and minimum orders are applied to your quantity.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="qty" className="text-sm text-muted-foreground">
              Quantity
            </label>
            <Input id="qty" type="number" min={1} value={qtyInput} onChange={(e) => setQtyInput(e.target.value)} className="w-20" />
            <div className="hidden gap-1 sm:flex">
              {QUICK_QTYS.map((q) => (
                <Button key={q} variant={q === qty ? 'default' : 'outline'} size="sm" onClick={() => setQtyInput(String(q))}>
                  {q}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {quotes.length ? (
            <OfferTable quotes={quotes} bestOfferId={best?.offer.id} isPreferred={isPreferred} />
          ) : (
            <p className="text-sm text-muted-foreground">No vendors list this part right now.</p>
          )}
          {preferredVendors.length > 0 && !best && quotes.length > 0 && (
            <p className="mt-3 text-sm text-warning">
              None of your preferred vendors can supply {qty} right now.{' '}
              <Link to="/settings" className="underline">
                Change preferred vendors
              </Link>
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <PriceHistoryChart partId={part.id} />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y text-sm">
              {Object.entries(part.specs).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4 py-2">
                  <dt className="text-muted-foreground">{key}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            {part.datasheetUrl && (
              <a href={part.datasheetUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                <FileText className="h-4 w-4" /> Datasheet
              </a>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

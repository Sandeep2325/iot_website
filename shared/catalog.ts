/**
 * Catalog queries shared by the browser mock API (MSW) and the real server, so both answer
 * every request the same way. Build one with createCatalog() from parts, offers and price history.
 */
import { convert } from './currency'
import type {
  CategoryId,
  DashboardSummary,
  Offer,
  Paginated,
  Part,
  PartDetail,
  PartQuery,
  PartSort,
  PartSummary,
  PriceIndexPoint,
  PriceMover,
  PriceSnapshot,
  Vendor,
} from './types'

export interface CatalogData {
  parts: Part[]
  vendors: Vendor[]
  offers: Offer[]
  history: PriceSnapshot[]
  /** Part ids for the dashboard's "trending" list. */
  trendingPartIds: string[]
}

export type Catalog = ReturnType<typeof createCatalog>

/** Copies only the public Part fields (seed parts carry extra generator-only fields). */
function toPart(p: Part): Part {
  const { id, mpn, name, manufacturer, category, description, specs, image, datasheetUrl } = p
  return { id, mpn, name, manufacturer, category, description, specs, image, datasheetUrl }
}

function isoDaysAgo(days: number, from = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

/** Every search term must match somewhere; whole-word matches in the name or MPN rank highest. */
function relevance(part: Part, q: string): number {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
  const nameWords = `${part.name} ${part.mpn}`.toLowerCase().split(/[^a-z0-9]+/)
  let score = 0
  for (const term of terms) {
    let termScore = 0
    if (part.mpn.toLowerCase().includes(term)) termScore += 5
    if (part.name.toLowerCase().includes(term)) termScore += 4
    if (part.manufacturer.toLowerCase().includes(term)) termScore += 2
    if (part.description.toLowerCase().includes(term)) termScore += 1
    if (Object.values(part.specs).some((v) => v.toLowerCase().includes(term))) termScore += 1
    if (termScore === 0) return 0
    if (nameWords.includes(term)) termScore += 3
    score += termScore
  }
  return score
}

interface ScoredSummary {
  summary: PartSummary
  score: number
}

const price = (r: ScoredSummary) => r.summary.lowestPrice ?? Infinity

const comparators: Record<PartSort, (a: ScoredSummary, b: ScoredSummary) => number> = {
  relevance: (a, b) => b.score - a.score,
  'price-asc': (a, b) => price(a) - price(b),
  'price-desc': (a, b) => price(b) - price(a),
  stock: (a, b) => b.summary.totalStock - a.summary.totalStock,
  name: (a, b) => a.summary.name.localeCompare(b.summary.name),
}

export function createCatalog({ parts, vendors, offers, history, trendingPartIds }: CatalogData) {
  const offersByPart = new Map<string, Offer[]>()
  for (const offer of offers) {
    const list = offersByPart.get(offer.partId) ?? []
    list.push(offer)
    offersByPart.set(offer.partId, list)
  }

  const historyByPart = new Map<string, PriceSnapshot[]>()
  for (const snap of history) {
    const list = historyByPart.get(snap.partId) ?? []
    list.push(snap)
    historyByPart.set(snap.partId, list)
  }

  // Per part: date → lowest single-unit price across vendors, in INR (dates sorted ascending).
  const dailyLowest = new Map<string, Map<string, number>>()
  for (const [partId, snaps] of historyByPart) {
    const byDate = new Map<string, number>()
    for (const s of [...snaps].sort((a, b) => a.date.localeCompare(b.date))) {
      byDate.set(s.date, Math.min(byDate.get(s.date) ?? Infinity, convert(s.unitPrice, s.currency, 'INR')))
    }
    dailyLowest.set(partId, byDate)
  }
  const allDates = [...new Set(history.map((s) => s.date))].sort()

  /** Lowest price on the latest recorded day at or before `date` (history can have gaps). */
  function lowestOnOrBefore(partId: string, date: string): number | null {
    let found: number | null = null
    for (const [d, p] of dailyLowest.get(partId) ?? []) {
      if (d > date) break
      found = p
    }
    return found
  }

  /** Summary of a part's offers, optionally limited to some vendors. Lowest price prefers in-stock offers. */
  function toSummary(part: Part, vendorIds?: string[]): PartSummary {
    const partOffers = (offersByPart.get(part.id) ?? []).filter((o) => !vendorIds?.length || vendorIds.includes(o.vendorId))
    const inStock = partOffers.filter((o) => o.stock > 0)
    const inrPrices = (inStock.length ? inStock : partOffers).map((o) => convert(o.priceBreaks[0].unitPrice, o.currency, 'INR'))
    return {
      ...toPart(part),
      lowestPrice: inrPrices.length ? Math.min(...inrPrices) : null,
      lowestPriceCurrency: 'INR',
      offerCount: partOffers.length,
      totalStock: partOffers.reduce((sum, o) => sum + o.stock, 0),
    }
  }

  function searchParts(query: PartQuery): Paginated<PartSummary> {
    const { q, category, vendor, vendors: vendorList, minPrice, maxPrice, inStock, sort = 'relevance', page = 1, pageSize = 12 } = query
    // A single chosen vendor wins over the preferred-vendor list.
    const vendorIds = vendor ? [vendor] : vendorList ? vendorList.split(',').filter(Boolean) : undefined

    let scored = parts.map((part) => ({ part, score: q ? relevance(part, q) : 0 }))
    if (q) scored = scored.filter((s) => s.score > 0)
    if (category) scored = scored.filter((s) => s.part.category === category)

    let results: ScoredSummary[] = scored.map((s) => ({ summary: toSummary(s.part, vendorIds), score: s.score }))
    if (vendorIds?.length) results = results.filter((r) => r.summary.offerCount > 0)
    if (inStock) results = results.filter((r) => r.summary.totalStock > 0)
    if (minPrice != null) results = results.filter((r) => (r.summary.lowestPrice ?? 0) >= minPrice)
    if (maxPrice != null) results = results.filter((r) => (r.summary.lowestPrice ?? Infinity) <= maxPrice)

    results.sort(comparators[sort])

    const start = (page - 1) * pageSize
    return { items: results.slice(start, start + pageSize).map((r) => r.summary), total: results.length, page, pageSize }
  }

  function getPart(id: string): PartDetail | undefined {
    const part = parts.find((p) => p.id === id)
    return part && { ...toPart(part), offers: offersByPart.get(id) ?? [] }
  }

  /** Matches each reference to a part by id or MPN, ignoring case. */
  function resolvePartRefs(refs: string[]): { ref: string; partId: string | null }[] {
    return refs.map((ref) => {
      const needle = ref.trim().toLowerCase()
      const match = parts.find((p) => p.id === needle || p.mpn.toLowerCase() === needle)
      return { ref, partId: match?.id ?? null }
    })
  }

  function getPriceHistory(id: string, days: number): PriceSnapshot[] {
    const cutoff = isoDaysAgo(days)
    return (historyByPart.get(id) ?? []).filter((s) => s.date > cutoff)
  }

  function getDashboardSummary(): DashboardSummary {
    const today = allDates.at(-1) ?? isoDaysAgo(0)
    const weekAgo = isoDaysAgo(7, new Date(`${today}T12:00:00Z`))
    const movers: PriceMover[] = []
    for (const part of parts) {
      const previousPrice = lowestOnOrBefore(part.id, weekAgo)
      const currentPrice = lowestOnOrBefore(part.id, today)
      if (previousPrice == null || currentPrice == null) continue
      const changePct = ((currentPrice - previousPrice) / previousPrice) * 100
      if (Math.abs(changePct) >= 1) movers.push({ part: toSummary(part), previousPrice, currentPrice, changePct })
    }

    return {
      partCount: parts.length,
      vendorCount: vendors.length,
      offerCount: offers.length,
      biggestDrops: movers.filter((m) => m.changePct < 0).sort((a, b) => a.changePct - b.changePct).slice(0, 5),
      biggestRises: movers.filter((m) => m.changePct > 0).sort((a, b) => b.changePct - a.changePct).slice(0, 5),
      trending: trendingPartIds.flatMap((id) => {
        const part = parts.find((p) => p.id === id)
        return part ? [toSummary(part)] : []
      }),
    }
  }

  /**
   * Average of each part's lowest price relative to the first day of the window (= 100).
   * Above 100 means parts got more expensive on average.
   */
  function getPriceIndex(days: number, category?: CategoryId): PriceIndexPoint[] {
    const inScope = parts.filter((p) => !category || p.category === category)
    const dates = allDates.slice(-days)
    const base = new Map(inScope.map((p) => [p.id, lowestOnOrBefore(p.id, dates[0])]))

    return dates.map((date) => {
      const ratios = inScope.flatMap((p) => {
        const start = base.get(p.id)
        const now = lowestOnOrBefore(p.id, date)
        return start && now ? [now / start] : []
      })
      const avg = ratios.reduce((a, b) => a + b, 0) / (ratios.length || 1)
      return { date, index: Math.round(avg * 1000) / 10 }
    })
  }

  return { searchParts, getPart, resolvePartRefs, getPriceHistory, getDashboardSummary, getPriceIndex, vendors }
}

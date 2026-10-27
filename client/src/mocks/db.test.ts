import { describe, expect, it } from 'vitest'
import { generateMarketData, HISTORY_DAYS } from '@shared/data/generate'
import { seedParts } from '@shared/data/parts'
import { getDashboardSummary, getPart, getPriceHistory, getPriceIndex, resolvePartRefs, searchParts } from './db'

const all = (query: Parameters<typeof searchParts>[0]) => searchParts({ pageSize: 1000, ...query }).items

describe('mock market data', () => {
  it('is identical on every run (seeded)', () => {
    // updatedAt is "now", so it's the one field allowed to differ between runs.
    const strip = (d: ReturnType<typeof generateMarketData>) => d.offers.map(({ updatedAt: _t, ...o }) => o)
    const a = generateMarketData(seedParts)
    const b = generateMarketData(seedParts)
    expect(strip(a)).toEqual(strip(b))
    expect(a.history).toEqual(b.history)
  })

  it('gives every part at least two offers and a full price history', () => {
    for (const p of seedParts) {
      const part = getPart(p.id)!
      expect(part.offers.length).toBeGreaterThanOrEqual(2)
      expect(getPriceHistory(p.id, HISTORY_DAYS)).toHaveLength(part.offers.length * HISTORY_DAYS)
    }
  })

  it('ends each offer history at its current single-unit price', () => {
    const part = getPart('esp32-devkitc')!
    const history = getPriceHistory(part.id, 1)
    for (const offer of part.offers) {
      expect(history.find((s) => s.vendorId === offer.vendorId)?.unitPrice).toBe(offer.priceBreaks[0].unitPrice)
    }
  })
})

describe('searchParts', () => {
  it('requires every search term to match', () => {
    const names = all({ q: 'pico w' }).map((p) => p.id)
    expect(names).toContain('rpi-pico-w')
    expect(names).not.toContain('w5500')
  })

  it('matches MPNs regardless of case', () => {
    expect(all({ q: 'am2302' }).map((p) => p.id)).toEqual(['dht22'])
  })

  it('filters by category, stock and INR price range', () => {
    const results = all({ category: 'sensors', inStock: true, minPrice: 50, maxPrice: 200 })
    expect(results.length).toBeGreaterThan(0)
    for (const p of results) {
      expect(p.category).toBe('sensors')
      expect(p.totalStock).toBeGreaterThan(0)
      expect(p.lowestPrice).toBeGreaterThanOrEqual(50)
      expect(p.lowestPrice).toBeLessThanOrEqual(200)
    }
  })

  it('sorts by price', () => {
    const prices = all({ sort: 'price-asc' }).map((p) => p.lowestPrice ?? Infinity)
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
  })

  it('prices only from the given vendors', () => {
    const indian = all({ vendors: 'robu,robocraze,evelta' })
    const everyone = all({})
    for (const p of indian) {
      const offers = getPart(p.id)!.offers.filter((o) => ['robu', 'robocraze', 'evelta'].includes(o.vendorId))
      expect(p.offerCount).toBe(offers.length)
    }
    // Limiting vendors can only keep or raise the lowest price.
    for (const p of indian) {
      const unrestricted = everyone.find((e) => e.id === p.id)!
      expect(p.lowestPrice!).toBeGreaterThanOrEqual(unrestricted.lowestPrice!)
    }
  })

  it('lets a single vendor filter win over the preferred list', () => {
    for (const p of all({ vendor: 'digikey', vendors: 'robu' })) {
      expect(getPart(p.id)!.offers.some((o) => o.vendorId === 'digikey')).toBe(true)
    }
  })

  it('paginates', () => {
    const page1 = searchParts({ sort: 'name', page: 1, pageSize: 12 })
    const page2 = searchParts({ sort: 'name', page: 2, pageSize: 12 })
    expect(page1.total).toBe(seedParts.length)
    expect(page1.items).toHaveLength(12)
    expect(page1.items.map((p) => p.id)).not.toContain(page2.items[0].id)
  })
})

describe('resolvePartRefs', () => {
  it('matches ids and MPNs, ignoring case and spaces', () => {
    expect(resolvePartRefs([' sc0918 ', 'dht22', 'NOPE'])).toEqual([
      { ref: ' sc0918 ', partId: 'rpi-pico-w' },
      { ref: 'dht22', partId: 'dht22' },
      { ref: 'NOPE', partId: null },
    ])
  })
})

describe('dashboard data', () => {
  it('builds a price index that starts at 100', () => {
    const index = getPriceIndex(30)
    expect(index).toHaveLength(30)
    expect(index[0].index).toBe(100)
    expect(getPriceIndex(30, 'sensors')[0].index).toBe(100)
  })

  it('lists drops as negative and rises as positive, biggest first', () => {
    const { biggestDrops, biggestRises } = getDashboardSummary()
    expect(biggestDrops.every((m) => m.changePct < 0)).toBe(true)
    expect(biggestRises.every((m) => m.changePct > 0)).toBe(true)
    expect(biggestDrops.map((m) => m.changePct)).toEqual([...biggestDrops.map((m) => m.changePct)].sort((a, b) => a - b))
  })
})

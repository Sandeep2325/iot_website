import { describe, expect, it } from 'vitest'
import type { Offer, PartDetail } from '@/types'
import { USD_TO_INR } from './currency'
import { lowestUnitPrice, preferredOffers, priceBom, quoteOffer, quoteOffers, unitPriceForQty } from './pricing'

function offer(overrides: Partial<Offer> & Pick<Offer, 'vendorId'>): Offer {
  return {
    id: `p__${overrides.vendorId}`,
    partId: 'p',
    vendorSku: 'SKU',
    productUrl: 'https://example.com',
    stock: 1000,
    moq: 1,
    currency: 'INR',
    priceBreaks: [{ qty: 1, unitPrice: 100 }],
    updatedAt: '2026-01-01T00:00:00Z',
    source: 'live',
    ...overrides,
  }
}

function part(id: string, offers: Offer[]): PartDetail {
  return { id, mpn: id.toUpperCase(), name: id, manufacturer: 'M', category: 'sensors', description: '', specs: {}, offers }
}

const tiered = offer({
  vendorId: 'robu',
  priceBreaks: [
    { qty: 1, unitPrice: 100 },
    { qty: 10, unitPrice: 90 },
    { qty: 100, unitPrice: 75 },
  ],
})

describe('unitPriceForQty', () => {
  it('uses the largest price break not above the quantity', () => {
    expect(unitPriceForQty(tiered, 1)).toBe(100)
    expect(unitPriceForQty(tiered, 9)).toBe(100)
    expect(unitPriceForQty(tiered, 10)).toBe(90)
    expect(unitPriceForQty(tiered, 99)).toBe(90)
    expect(unitPriceForQty(tiered, 5000)).toBe(75)
  })

  it('does not depend on the order of price breaks', () => {
    const shuffled = { ...tiered, priceBreaks: [...tiered.priceBreaks].reverse() }
    expect(unitPriceForQty(shuffled, 50)).toBe(90)
  })
})

describe('quoteOffer', () => {
  it('raises the billed quantity to the MOQ and prices at that tier', () => {
    const q = quoteOffer({ ...tiered, moq: 10 }, 3, 'INR')
    expect(q.billableQty).toBe(10)
    expect(q.unitPrice).toBe(90)
    expect(q.displayTotal).toBe(900)
  })

  it('converts USD offers to the display currency', () => {
    const q = quoteOffer(offer({ vendorId: 'digikey', currency: 'USD', priceBreaks: [{ qty: 1, unitPrice: 2 }] }), 2, 'INR')
    expect(q.displayUnitPrice).toBe(2 * USD_TO_INR)
    expect(q.displayTotal).toBe(4 * USD_TO_INR)
  })

  it('marks an offer out of stock when stock is below the billed quantity', () => {
    expect(quoteOffer(offer({ vendorId: 'robu', stock: 5 }), 6, 'INR').inStock).toBe(false)
    expect(quoteOffer(offer({ vendorId: 'robu', stock: 5 }), 5, 'INR').inStock).toBe(true)
  })
})

describe('quoteOffers', () => {
  it('sorts by total with offers that cannot fill the order last', () => {
    const cheapButEmpty = offer({ vendorId: 'lcsc', stock: 0, priceBreaks: [{ qty: 1, unitPrice: 10 }] })
    const mid = offer({ vendorId: 'robocraze', priceBreaks: [{ qty: 1, unitPrice: 80 }] })
    const order = quoteOffers([tiered, cheapButEmpty, mid], 1, 'INR').map((q) => q.offer.vendorId)
    expect(order).toEqual(['robocraze', 'robu', 'lcsc'])
  })

  it('accounts for MOQ when comparing totals', () => {
    const lowUnitHighMoq = offer({ vendorId: 'lcsc', moq: 10, priceBreaks: [{ qty: 1, unitPrice: 50 }] })
    // 2 pcs: robu = 200, lcsc must bill 10 × 50 = 500.
    expect(quoteOffers([tiered, lowUnitHighMoq], 2, 'INR')[0].offer.vendorId).toBe('robu')
  })
})

describe('lowestUnitPrice', () => {
  it('returns null when there are no offers', () => {
    expect(lowestUnitPrice([], 'INR')).toBeNull()
  })
})

describe('priceBom', () => {
  const sensor = part('sensor', [
    offer({ vendorId: 'robu', priceBreaks: [{ qty: 1, unitPrice: 100 }] }),
    offer({ vendorId: 'evelta', priceBreaks: [{ qty: 1, unitPrice: 120 }] }),
  ])
  const board = part('board', [
    offer({ vendorId: 'robu', priceBreaks: [{ qty: 1, unitPrice: 600 }] }),
    offer({ vendorId: 'evelta', priceBreaks: [{ qty: 1, unitPrice: 550 }] }),
  ])
  const rare = part('rare', [offer({ vendorId: 'evelta', priceBreaks: [{ qty: 1, unitPrice: 40 }] })])

  it('picks the cheapest vendor per line for the mixed total', () => {
    const result = priceBom([{ part: sensor, quantity: 2 }, { part: board, quantity: 1 }], 'INR')
    expect(result.lines.map((l) => l.best?.offer.vendorId)).toEqual(['robu', 'evelta'])
    expect(result.mixedTotal).toBe(2 * 100 + 550)
  })

  it('finds the cheapest vendor that can fill every line', () => {
    const result = priceBom([{ part: sensor, quantity: 2 }, { part: board, quantity: 1 }, { part: rare, quantity: 1 }], 'INR')
    expect(result.bestSingleVendor?.vendorId).toBe('evelta')
    expect(result.bestSingleVendor?.total).toBe(2 * 120 + 550 + 40)
    const robu = result.vendorTotals.find((v) => v.vendorId === 'robu')
    expect(robu?.coveredLines).toBe(2)
    expect(robu?.missingPartIds).toEqual(['rare'])
  })

  it('excludes lines nobody can fill from the mixed total', () => {
    const empty = part('empty', [offer({ vendorId: 'robu', stock: 0 })])
    const result = priceBom([{ part: sensor, quantity: 1 }, { part: empty, quantity: 1 }], 'INR')
    expect(result.unfillableCount).toBe(1)
    expect(result.mixedTotal).toBe(100)
    expect(result.bestSingleVendor).toBeNull()
  })

  it('handles an empty list', () => {
    const result = priceBom([], 'INR')
    expect(result.mixedTotal).toBe(0)
    expect(result.bestSingleVendor).toBeNull()
  })
})

describe('preferredOffers', () => {
  const offers = [offer({ vendorId: 'robu' }), offer({ vendorId: 'digikey' }), offer({ vendorId: 'evelta' })]
  it('keeps every offer when no vendors are preferred', () => {
    expect(preferredOffers(offers, [])).toHaveLength(3)
  })
  it('keeps only preferred vendors', () => {
    expect(preferredOffers(offers, ['robu', 'evelta']).map((o) => o.vendorId)).toEqual(['robu', 'evelta'])
  })
})

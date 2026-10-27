import type { Currency, Offer, PartDetail } from '@/types'
import { convert } from './currency'

export interface OfferQuote {
  offer: Offer
  /** Quantity actually billed: the requested quantity, raised to the vendor's MOQ. */
  billableQty: number
  /** Unit price at the billable quantity, in the offer's own currency. */
  unitPrice: number
  /** Unit price and total converted to the display currency. */
  displayUnitPrice: number
  displayTotal: number
  inStock: boolean
}

/** Unit price for `qty` pieces: the price break with the largest qty not above it. */
export function unitPriceForQty(offer: Offer, qty: number): number {
  const breaks = [...offer.priceBreaks].sort((a, b) => a.qty - b.qty)
  let price = breaks[0].unitPrice
  for (const pb of breaks) {
    if (pb.qty <= qty) price = pb.unitPrice
  }
  return price
}

export function quoteOffer(offer: Offer, qty: number, display: Currency): OfferQuote {
  const billableQty = Math.max(qty, offer.moq)
  const unitPrice = unitPriceForQty(offer, billableQty)
  const displayUnitPrice = convert(unitPrice, offer.currency, display)
  return {
    offer,
    billableQty,
    unitPrice,
    displayUnitPrice,
    displayTotal: displayUnitPrice * billableQty,
    inStock: offer.stock >= billableQty,
  }
}

/** Quotes every offer for `qty`, cheapest total first, offers that can't fill the order last. */
export function quoteOffers(offers: Offer[], qty: number, display: Currency): OfferQuote[] {
  return offers
    .map((o) => quoteOffer(o, qty, display))
    .sort((a, b) => Number(b.inStock) - Number(a.inStock) || a.displayTotal - b.displayTotal)
}

/** Lowest single-unit price across in-stock offers (or all offers if none are in stock). */
export function lowestUnitPrice(offers: Offer[], display: Currency): number | null {
  const best = quoteOffers(offers, 1, display)[0]
  return best ? best.displayUnitPrice : null
}

export interface BomLineInput {
  part: PartDetail
  quantity: number
}

export interface BomLine extends BomLineInput {
  /** Cheapest offer that can fill the line, or the cheapest overall if none can. */
  best: OfferQuote | null
  fillable: boolean
  offerCount: number
}

export interface VendorTotal {
  vendorId: string
  /** Total for the lines this vendor can fill, in the display currency. */
  total: number
  coveredLines: number
  missingPartIds: string[]
}

export interface BomPricing {
  lines: BomLine[]
  /** Buying each line from its cheapest vendor (fillable lines only). */
  mixedTotal: number
  unfillableCount: number
  /** One entry per vendor that can fill at least one line: full coverage first, then cheapest. */
  vendorTotals: VendorTotal[]
  bestSingleVendor: VendorTotal | null
}

export function priceBom(inputs: BomLineInput[], display: Currency): BomPricing {
  const lines: BomLine[] = inputs.map(({ part, quantity }) => {
    const best = quoteOffers(part.offers, quantity, display)[0] ?? null
    return { part, quantity, best, fillable: !!best?.inStock, offerCount: part.offers.length }
  })

  const byVendor = new Map<string, VendorTotal>()
  for (const { part, quantity } of inputs) {
    for (const offer of part.offers) {
      const quote = quoteOffer(offer, quantity, display)
      if (!quote.inStock) continue
      const entry = byVendor.get(offer.vendorId) ?? { vendorId: offer.vendorId, total: 0, coveredLines: 0, missingPartIds: [] }
      entry.total += quote.displayTotal
      entry.coveredLines += 1
      byVendor.set(offer.vendorId, entry)
    }
  }
  for (const entry of byVendor.values()) {
    entry.missingPartIds = inputs
      .filter(({ part, quantity }) => !part.offers.some((o) => o.vendorId === entry.vendorId && quoteOffer(o, quantity, display).inStock))
      .map(({ part }) => part.id)
  }

  const vendorTotals = [...byVendor.values()].sort((a, b) => b.coveredLines - a.coveredLines || a.total - b.total)
  const fullCoverage = vendorTotals.filter((v) => v.coveredLines === inputs.length && inputs.length > 0)

  return {
    lines,
    mixedTotal: lines.reduce((sum, l) => sum + (l.fillable && l.best ? l.best.displayTotal : 0), 0),
    unfillableCount: lines.filter((l) => !l.fillable).length,
    vendorTotals,
    bestSingleVendor: fullCoverage[0] ?? null,
  }
}

/** Offers from the preferred vendors only; all offers when no preference is set. */
export function preferredOffers(offers: Offer[], preferredVendorIds: string[]): Offer[] {
  return preferredVendorIds.length ? offers.filter((o) => preferredVendorIds.includes(o.vendorId)) : offers
}

import type { Currency, Part, PriceBreak } from '../../../shared/types'

/** One vendor listing for a part, as returned by a provider (before it gets an id and timestamp). */
export interface ProviderOffer {
  vendorId: string
  vendorSku: string
  productUrl: string
  stock: number
  moq: number
  currency: Currency
  priceBreaks: PriceBreak[]
}

/** A source of live prices for one or more vendors (a vendor's own API, or an aggregator like Nexar). */
export interface PriceProvider {
  id: string
  /** Vendors whose offers this provider supplies. Their sample offers are replaced by its results. */
  vendorIds: string[]
  /** Minimum gap between requests, to respect the vendor's rate limit. */
  minIntervalMs: number
  /** How often a full catalog refresh may run against this provider (keeps free-plan quotas safe). */
  refreshEveryHours: number
  /** Offers for this exact part (matched by MPN). An empty list means the vendor doesn't list it. */
  fetchOffers(part: Part): Promise<ProviderOffer[]>
}

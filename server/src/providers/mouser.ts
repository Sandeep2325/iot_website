import type { Part } from '../../../shared/types'
import { cleanBreaks, fetchJson, isSupportedCurrency, parsePrice, sameMpn } from './http'
import type { PriceProvider, ProviderOffer } from './types'

/** The parts of a Mouser Search API v1 part-number response this adapter reads. */
export interface MouserSearchResponse {
  Errors?: { Code?: string; Message?: string }[]
  SearchResults?: {
    Parts?: {
      ManufacturerPartNumber?: string
      MouserPartNumber?: string
      ProductDetailUrl?: string
      Availability?: string
      AvailabilityInStock?: string | null
      Min?: string
      PriceBreaks?: { Quantity?: number; Price?: string; Currency?: string }[]
    }[]
  }
}

/** Turns a Mouser part-number search response into offers for `mpn`. Mouser formats prices as text (e.g. "₹1,234.50"). */
export function parseMouser(data: MouserSearchResponse, mpn: string): ProviderOffer[] {
  if (data.Errors?.length) throw new Error(`Mouser: ${data.Errors.map((e) => e.Message ?? e.Code).join('; ')}`)

  return (data.SearchResults?.Parts ?? []).flatMap((p) => {
    if (!p.ManufacturerPartNumber || !sameMpn(p.ManufacturerPartNumber, mpn) || !p.MouserPartNumber) return []
    const currency = p.PriceBreaks?.[0]?.Currency
    if (!isSupportedCurrency(currency)) return []
    const priceBreaks = cleanBreaks((p.PriceBreaks ?? []).map((b) => ({ qty: b.Quantity ?? 0, unitPrice: parsePrice(b.Price ?? '') ?? 0 })))
    if (!priceBreaks.length) return []
    // "AvailabilityInStock" is a plain number string; older responses only have text like "1,234 In Stock".
    const stock = Number(p.AvailabilityInStock ?? parsePrice(p.Availability?.match(/[\d,]+(?=\s*In Stock)/i)?.[0] ?? '') ?? 0) || 0
    return [
      {
        vendorId: 'mouser',
        vendorSku: p.MouserPartNumber,
        productUrl: p.ProductDetailUrl ?? `https://www.mouser.in/c/?q=${encodeURIComponent(mpn)}`,
        stock,
        moq: Number(p.Min) || priceBreaks[0].qty,
        currency,
        priceBreaks,
      },
    ]
  })
}

/** Mouser Search API (key from mouser.in/api-search). Limits: 30 calls/minute, 1,000/day. */
export function mouserProvider(opts: { apiKey: string }): PriceProvider {
  return {
    id: 'mouser',
    vendorIds: ['mouser'],
    minIntervalMs: 2_100,
    refreshEveryHours: 24,
    async fetchOffers(part: Part) {
      const data = await fetchJson<MouserSearchResponse>(`https://api.mouser.com/api/v1/search/partnumber?apiKey=${encodeURIComponent(opts.apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ SearchByPartRequest: { mouserPartNumber: part.mpn, partSearchOptions: 'Exact' } }),
      })
      return parseMouser(data, part.mpn)
    },
  }
}

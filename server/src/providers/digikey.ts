import type { Currency, Part } from '../../../shared/types'
import { cleanBreaks, fetchJson, isSupportedCurrency, sameMpn, tokenCache } from './http'
import type { PriceProvider, ProviderOffer } from './types'

const API = 'https://api.digikey.com'

/** The parts of a DigiKey Product Information v4 keyword-search response this adapter reads. */
export interface DigiKeySearchResponse {
  Products?: {
    ManufacturerProductNumber?: string
    ProductUrl?: string
    QuantityAvailable?: number
    ProductVariations?: {
      DigiKeyProductNumber?: string
      MinimumOrderQuantity?: number
      QuantityAvailableforPackageType?: number
      StandardPricing?: { BreakQuantity?: number; UnitPrice?: number }[]
    }[]
  }[]
  SearchLocaleUsed?: { Currency?: string }
}

/**
 * Turns a DigiKey search response into offers for `mpn`. Each product has packaging variations
 * (cut tape, reel, …); the one with the smallest minimum order is the one a maker would buy.
 */
export function parseDigiKey(data: DigiKeySearchResponse, mpn: string, fallbackCurrency: Currency): ProviderOffer[] {
  const currency = data.SearchLocaleUsed?.Currency ?? fallbackCurrency
  if (!isSupportedCurrency(currency)) return []

  return (data.Products ?? []).flatMap((product) => {
    if (!product.ManufacturerProductNumber || !sameMpn(product.ManufacturerProductNumber, mpn)) return []
    const variations = (product.ProductVariations ?? []).filter((v) => v.DigiKeyProductNumber && v.StandardPricing?.length)
    const best = variations.sort((a, b) => (a.MinimumOrderQuantity ?? 1) - (b.MinimumOrderQuantity ?? 1))[0]
    if (!best) return []
    const priceBreaks = cleanBreaks(best.StandardPricing!.map((p) => ({ qty: p.BreakQuantity ?? 0, unitPrice: p.UnitPrice ?? 0 })))
    if (!priceBreaks.length) return []
    return [
      {
        vendorId: 'digikey',
        vendorSku: best.DigiKeyProductNumber!,
        productUrl: product.ProductUrl ?? `https://www.digikey.in/en/products/result?keywords=${encodeURIComponent(mpn)}`,
        stock: best.QuantityAvailableforPackageType ?? product.QuantityAvailable ?? 0,
        moq: best.MinimumOrderQuantity ?? priceBreaks[0].qty,
        currency,
        priceBreaks,
      },
    ]
  })
}

/** DigiKey Product Information API v4 (OAuth2 client-credentials app from developer.digikey.com). */
export function digikeyProvider(opts: { clientId: string; clientSecret: string; country: string; currency: Currency }): PriceProvider {
  const getToken = tokenCache(async () => {
    const body = new URLSearchParams({ client_id: opts.clientId, client_secret: opts.clientSecret, grant_type: 'client_credentials' })
    const res = await fetchJson<{ access_token: string; expires_in: number }>(`${API}/v1/oauth2/token`, { method: 'POST', body })
    return { token: res.access_token, expiresInSec: res.expires_in }
  })

  return {
    id: 'digikey',
    vendorIds: ['digikey'],
    minIntervalMs: 500,
    refreshEveryHours: 24,
    async fetchOffers(part: Part) {
      const data = await fetchJson<DigiKeySearchResponse>(`${API}/products/v4/search/keyword`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await getToken()}`,
          'X-DIGIKEY-Client-Id': opts.clientId,
          'X-DIGIKEY-Locale-Site': opts.country,
          'X-DIGIKEY-Locale-Currency': opts.currency,
          'X-DIGIKEY-Locale-Language': 'en',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ Keywords: part.mpn, Limit: 10, Offset: 0 }),
      })
      return parseDigiKey(data, part.mpn, opts.currency)
    },
  }
}

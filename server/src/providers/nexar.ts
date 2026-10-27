import type { Currency, Part } from '../../../shared/types'
import { cleanBreaks, fetchJson, isSupportedCurrency, sameMpn, tokenCache } from './http'
import type { PriceProvider, ProviderOffer } from './types'

/** Nexar seller names → PartScout vendor ids. Sellers not listed here are ignored. */
const SELLERS: [RegExp, string][] = [
  [/digi-?key/i, 'digikey'],
  [/mouser/i, 'mouser'],
  [/lcsc/i, 'lcsc'],
]

const QUERY = `
query PartScoutOffers($q: String!, $country: String!, $currency: String!) {
  supSearchMpn(q: $q, limit: 5, country: $country, currency: $currency) {
    results {
      part {
        mpn
        sellers(includeBrokers: false) {
          company { name }
          offers {
            sku
            clickUrl
            inventoryLevel
            moq
            prices { quantity price currency convertedPrice convertedCurrency }
          }
        }
      }
    }
  }
}`

/** The parts of a Nexar supSearchMpn response this adapter reads. */
export interface NexarResponse {
  errors?: { message?: string }[]
  data?: {
    supSearchMpn?: {
      results?: {
        part?: {
          mpn?: string
          sellers?: {
            company?: { name?: string }
            offers?: {
              sku?: string | null
              clickUrl?: string | null
              inventoryLevel?: number | null
              moq?: number | null
              prices?: { quantity?: number; price?: number; currency?: string; convertedPrice?: number; convertedCurrency?: string }[]
            }[]
          }[]
        }
      }[]
    }
  }
}

/**
 * Turns a Nexar response into offers for `mpn`, keeping only sellers in `vendorIds`.
 * Prices in another currency use Nexar's converted price when that's INR or USD.
 */
export function parseNexar(data: NexarResponse, mpn: string, vendorIds: string[]): ProviderOffer[] {
  if (data.errors?.length) throw new Error(`Nexar: ${data.errors.map((e) => e.message).join('; ')}`)

  const offers: ProviderOffer[] = []
  for (const result of data.data?.supSearchMpn?.results ?? []) {
    const part = result.part
    if (!part?.mpn || !sameMpn(part.mpn, mpn)) continue
    for (const seller of part.sellers ?? []) {
      const vendorId = SELLERS.find(([re]) => re.test(seller.company?.name ?? ''))?.[1]
      if (!vendorId || !vendorIds.includes(vendorId)) continue
      for (const o of seller.offers ?? []) {
        const priced = (o.prices ?? []).flatMap((p) => {
          if (isSupportedCurrency(p.currency) && p.price != null) return [{ qty: p.quantity ?? 0, unitPrice: p.price, currency: p.currency }]
          if (isSupportedCurrency(p.convertedCurrency) && p.convertedPrice != null) return [{ qty: p.quantity ?? 0, unitPrice: p.convertedPrice, currency: p.convertedCurrency }]
          return []
        })
        const currency = priced[0]?.currency
        const priceBreaks = cleanBreaks(priced.filter((p) => p.currency === currency))
        if (!currency || !priceBreaks.length || !o.sku) continue
        offers.push({
          vendorId,
          vendorSku: o.sku,
          productUrl: o.clickUrl ?? `https://octopart.com/search?q=${encodeURIComponent(mpn)}`,
          stock: o.inventoryLevel ?? 0,
          moq: o.moq ?? priceBreaks[0].qty,
          currency,
          priceBreaks,
        })
      }
    }
  }
  return offers
}

/**
 * Nexar (Octopart) Supply API: one query returns many distributors. Only used for vendors that have
 * no direct API key, and refreshed weekly by default because free plans have small monthly quotas.
 */
export function nexarProvider(opts: { clientId: string; clientSecret: string; country: string; currency: Currency; vendorIds: string[]; refreshEveryHours?: number }): PriceProvider {
  const getToken = tokenCache(async () => {
    const body = new URLSearchParams({ grant_type: 'client_credentials', client_id: opts.clientId, client_secret: opts.clientSecret, scope: 'supply.domain' })
    const res = await fetchJson<{ access_token: string; expires_in: number }>('https://identity.nexar.com/connect/token', { method: 'POST', body })
    return { token: res.access_token, expiresInSec: res.expires_in }
  })

  return {
    id: 'nexar',
    vendorIds: opts.vendorIds,
    minIntervalMs: 1_000,
    refreshEveryHours: opts.refreshEveryHours ?? 24 * 7,
    async fetchOffers(part: Part) {
      const data = await fetchJson<NexarResponse>('https://api.nexar.com/graphql', {
        method: 'POST',
        headers: { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: QUERY, variables: { q: part.mpn, country: opts.country, currency: opts.currency } }),
      })
      return parseNexar(data, part.mpn, opts.vendorIds)
    },
  }
}

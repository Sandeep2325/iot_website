import { USD_TO_INR } from '../currency'
import type { Offer, PriceBreak, PriceSnapshot, Vendor } from '../types'
import type { SeedPart } from './parts'
import { vendors } from './vendors'

export const HISTORY_DAYS = 90

/** Small seeded PRNG (mulberry32) so the mock data is identical on every reload. */
function createRng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/** How each vendor prices relative to the INR base price, and how likely it is to stock a part. */
const vendorProfile: Record<string, { factor: number; stockChance: (p: SeedPart) => number }> = {
  robu: { factor: 1.0, stockChance: () => 0.9 },
  robocraze: { factor: 1.06, stockChance: () => 0.8 },
  evelta: { factor: 1.12, stockChance: (p) => (p.global ? 0.85 : 0.55) },
  digikey: { factor: 1.4, stockChance: (p) => (p.global ? 0.95 : 0) },
  mouser: { factor: 1.35, stockChance: (p) => (p.global ? 0.85 : 0) },
  lcsc: { factor: 0.75, stockChance: (p) => (p.global ? 0.4 : 0.6) },
}

function roundPrice(value: number, vendor: Vendor): number {
  return vendor.currency === 'INR' ? Math.max(1, Math.round(value)) : Math.round(value * 1000) / 1000
}

function priceBreaksFor(unitPrice: number, vendor: Vendor): PriceBreak[] {
  const tiers: [number, number][] =
    vendor.region === 'GLOBAL'
      ? [[1, 1], [10, 0.9], [100, 0.78], [1000, 0.68]]
      : [[1, 1], [10, 0.93], [50, 0.86]]
  return tiers.map(([qty, mult]) => ({ qty, unitPrice: roundPrice(unitPrice * mult, vendor) }))
}

function isoDate(daysAgo: number): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

/**
 * Builds a daily qty-1 price series ending at `current`, walking backwards in time.
 * Some series get a recent step change so the dashboard has real price movers.
 */
function priceSeries(current: number, vendor: Vendor, rand: () => number, recentStep: number): number[] {
  const series = new Array<number>(HISTORY_DAYS)
  let price = current
  for (let daysAgo = 0; daysAgo < HISTORY_DAYS; daysAgo++) {
    series[HISTORY_DAYS - 1 - daysAgo] = roundPrice(price, vendor)
    // Undo the recent step when we walk back past it (it happened ~4 days ago).
    if (daysAgo === 4) price /= 1 + recentStep
    // Prices mostly sit still, with occasional small moves.
    const r = rand()
    if (r < 0.08) price *= 1 + (rand() - 0.5) * 0.12
    else if (r < 0.1) price *= 1 + (rand() - 0.5) * 0.3
  }
  return series
}

export interface GeneratedData {
  offers: Offer[]
  history: PriceSnapshot[]
}

export function generateMarketData(parts: SeedPart[]): GeneratedData {
  const offers: Offer[] = []
  const history: PriceSnapshot[] = []
  const today = new Date().toISOString()

  for (const part of parts) {
    const rand = createRng(hashString(part.id))
    // Roughly a quarter of parts get a noticeable price move this week, shared by their vendors.
    const moveRoll = rand()
    const recentStep = moveRoll < 0.15 ? -(0.08 + rand() * 0.15) : moveRoll < 0.25 ? 0.06 + rand() * 0.12 : 0

    let stocked = vendors.filter((v) => rand() < vendorProfile[v.id].stockChance(part))
    // Every part needs at least two offers to be worth comparing.
    if (stocked.length < 2) stocked = vendors.filter((v) => v.id === 'robu' || v.id === 'robocraze')

    for (const vendor of stocked) {
      const jitter = 0.9 + rand() * 0.2
      const inrPrice = part.basePriceInr * vendorProfile[vendor.id].factor * jitter
      const current = vendor.currency === 'INR' ? inrPrice : inrPrice / USD_TO_INR
      const unitPrice = roundPrice(current, vendor)
      const outOfStock = rand() < 0.1

      offers.push({
        id: `${part.id}__${vendor.id}`,
        partId: part.id,
        vendorId: vendor.id,
        vendorSku: `${vendor.id.toUpperCase()}-${part.mpn}`,
        productUrl: `${vendor.website}/search?q=${encodeURIComponent(part.mpn)}`,
        stock: outOfStock ? 0 : Math.round(20 + rand() * (vendor.region === 'GLOBAL' ? 5000 : 800)),
        moq: vendor.id === 'lcsc' && part.basePriceInr < 100 ? 5 : 1,
        currency: vendor.currency,
        priceBreaks: priceBreaksFor(unitPrice, vendor),
        updatedAt: today,
        source: 'sample',
      })

      const series = priceSeries(unitPrice, vendor, rand, recentStep * (0.8 + rand() * 0.4))
      series.forEach((price, i) => {
        history.push({
          partId: part.id,
          vendorId: vendor.id,
          unitPrice: price,
          currency: vendor.currency,
          date: isoDate(HISTORY_DAYS - 1 - i),
        })
      })
    }
  }

  return { offers, history }
}

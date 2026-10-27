import type { Currency, PriceBreak } from '../../../shared/types'

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }

  /** Bad or missing credentials: retrying the remaining parts won't help. */
  get isAuthError() {
    return this.status === 401 || this.status === 403
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** fetch + JSON with a timeout, retrying rate limits (429) and server errors with backoff. */
export async function fetchJson<T>(url: string, init: RequestInit, { timeoutMs = 15_000, retries = 2 } = {}): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
    if (res.ok) return (await res.json()) as T

    const retryable = res.status === 429 || res.status >= 500
    if (retryable && attempt < retries) {
      const retryAfter = Number(res.headers.get('retry-after'))
      await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt)
      continue
    }
    const body = await res.text().catch(() => '')
    throw new HttpError(res.status, `HTTP ${res.status} from ${new URL(url).host}${body ? `: ${body.slice(0, 200)}` : ''}`)
  }
}

/** Caches an OAuth access token until shortly before it expires. */
export function tokenCache(fetchToken: () => Promise<{ token: string; expiresInSec: number }>) {
  let token: string | null = null
  let expiresAt = 0
  return async () => {
    if (!token || Date.now() > expiresAt - 60_000) {
      const fresh = await fetchToken()
      token = fresh.token
      expiresAt = Date.now() + fresh.expiresInSec * 1000
    }
    return token
  }
}

/** Compares MPNs loosely: case, spaces and punctuation are ignored ("ESP32-DevKitC-32E" = "esp32 devkitc 32e"). */
export const sameMpn = (a: string, b: string) => a.replace(/[^a-z0-9]/gi, '').toLowerCase() === b.replace(/[^a-z0-9]/gi, '').toLowerCase()

export const isSupportedCurrency = (c: unknown): c is Currency => c === 'INR' || c === 'USD'

/**
 * Parses a formatted price like "₹1,234.50", "$0.35" or "1.234,50 €" to a number.
 * Returns null when nothing numeric is found.
 */
export function parsePrice(text: string): number | null {
  const cleaned = text.replace(/[^\d.,]/g, '')
  if (!cleaned) return null
  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')
  // Decimal comma: the comma is the last separator and is followed by 1–3 digits that end the string
  // with no dot after it (e.g. "1.234,50" or "0,35"). Otherwise commas are thousands separators.
  const decimalComma = lastComma > lastDot && /,\d{1,3}$/.test(cleaned) && !(lastDot === -1 && /,\d{3}$/.test(cleaned))
  const normalized = decimalComma ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned.replace(/,/g, '')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

/** Sorted, de-duplicated price breaks with positive quantities and prices. */
export function cleanBreaks(breaks: PriceBreak[]): PriceBreak[] {
  const byQty = new Map<number, number>()
  for (const b of breaks) {
    if (b.qty > 0 && b.unitPrice > 0 && !byQty.has(b.qty)) byQty.set(b.qty, b.unitPrice)
  }
  return [...byQty].sort((a, b) => a[0] - b[0]).map(([qty, unitPrice]) => ({ qty, unitPrice }))
}

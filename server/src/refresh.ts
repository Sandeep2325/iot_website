import type { Offer } from '../../shared/types'
import type { PriceProvider } from './providers/types'
import { HttpError } from './providers/http'
import type { Store } from './store'

export interface RefreshResult {
  partsChecked: number
  liveOffers: number
  skippedProviders: string[]
  errors: string[]
}

export interface RefreshOptions {
  /** Ignore each provider's refreshEveryHours (manual refresh). */
  force?: boolean
  now?: () => Date
  sleep?: (ms: number) => Promise<void>
  log?: (msg: string) => void
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

let running: Promise<RefreshResult> | null = null

/**
 * Fetches live offers for every catalog part from each provider, replaces those vendors' offers,
 * then records today's price snapshot for all offers. Only one refresh runs at a time.
 */
export function refreshPrices(store: Store, providers: PriceProvider[], opts: RefreshOptions = {}): Promise<RefreshResult> {
  running ??= runRefresh(store, providers, opts).finally(() => {
    running = null
  })
  return running
}

async function runRefresh(store: Store, providers: PriceProvider[], opts: RefreshOptions): Promise<RefreshResult> {
  const { db } = store
  const now = opts.now ?? (() => new Date())
  const sleep = opts.sleep ?? defaultSleep
  const log = opts.log ?? (() => {})
  const runId = db.startRefreshRun()
  const parts = db.parts()
  const result: RefreshResult = { partsChecked: 0, liveOffers: 0, skippedProviders: [], errors: [] }

  for (const provider of providers) {
    const last = db.providerLastSuccess(provider.id)
    if (!opts.force && last && now().getTime() - last.getTime() < provider.refreshEveryHours * 3_600_000) {
      result.skippedProviders.push(provider.id)
      continue
    }

    log(`Refreshing ${parts.length} parts from ${provider.id}…`)
    let failed = 0
    let aborted = false
    for (const [i, part] of parts.entries()) {
      if (i > 0) await sleep(provider.minIntervalMs)
      try {
        const found = await provider.fetchOffers(part)
        const updatedAt = now().toISOString()
        for (const vendorId of provider.vendorIds) {
          const offers: Offer[] = found
            .filter((o) => o.vendorId === vendorId)
            .map((o) => ({ ...o, id: `${part.id}__${vendorId}__${o.vendorSku}`, partId: part.id, updatedAt, source: 'live' }))
          db.replaceLiveOffers(part.id, vendorId, offers)
          result.liveOffers += offers.length
        }
        result.partsChecked++
      } catch (err) {
        failed++
        result.errors.push(`${provider.id} · ${part.mpn}: ${(err as Error).message}`)
        // Bad credentials fail every call the same way: stop instead of hammering the API.
        if (err instanceof HttpError && err.isAuthError) {
          result.errors.push(`${provider.id}: stopped, check its API key`)
          aborted = true
          break
        }
      }
    }
    // Count the run as done unless most calls failed, so a temporary outage gets retried next time.
    if (!aborted && failed < parts.length / 2) db.setProviderSuccess(provider.id, now())
    log(`${provider.id}: ${failed} error(s)`)
  }

  db.snapshotOffers(now().toISOString().slice(0, 10))
  db.finishRefreshRun(runId, result.partsChecked, result.liveOffers, result.errors)
  store.reload()
  return result
}

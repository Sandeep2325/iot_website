import type { AddressInfo } from 'node:net'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Part } from '../../shared/types'
import { createApp } from './app'
import { Database } from './db'
import { HttpError } from './providers/http'
import type { PriceProvider } from './providers/types'
import { refreshPrices } from './refresh'
import { Store } from './store'

const TODAY = new Date('2030-01-15T06:00:00Z')
const noSleep = async () => {}

function fakeProvider(fetchOffers: PriceProvider['fetchOffers'], overrides: Partial<PriceProvider> = {}): PriceProvider {
  return { id: 'mouser', vendorIds: ['mouser'], minIntervalMs: 0, refreshEveryHours: 24, fetchOffers, ...overrides }
}

let db: Database
let store: Store

beforeEach(() => {
  db = new Database(':memory:')
  db.seedIfEmpty()
  store = new Store(db)
})

afterEach(() => db.close())

describe('database', () => {
  it('seeds the catalog once with sample offers', () => {
    expect(db.seedIfEmpty()).toBe(false)
    expect(db.parts().length).toBeGreaterThan(50)
    expect(db.offers().every((o) => o.source === 'sample')).toBe(true)
  })
})

describe('refreshPrices', () => {
  const livePico = async (part: Part) =>
    part.id === 'rpi-pico-w'
      ? [{ vendorId: 'mouser', vendorSku: '358-SC0918', productUrl: 'https://mouser.in/x', stock: 50, moq: 1, currency: 'INR' as const, priceBreaks: [{ qty: 1, unitPrice: 610 }] }]
      : []

  it("replaces the provider's vendor offers with live ones and keeps other vendors' sample offers", async () => {
    const result = await refreshPrices(store, [fakeProvider(livePico)], { now: () => TODAY, sleep: noSleep })
    expect(result.liveOffers).toBe(1)
    expect(result.errors).toEqual([])

    const pico = store.catalog.getPart('rpi-pico-w')!
    const mouser = pico.offers.filter((o) => o.vendorId === 'mouser')
    expect(mouser).toEqual([expect.objectContaining({ source: 'live', vendorSku: '358-SC0918', updatedAt: TODAY.toISOString() })])
    expect(pico.offers.some((o) => o.vendorId === 'robu' && o.source === 'sample')).toBe(true)

    // Parts Mouser doesn't list lose their made-up Mouser offer.
    expect(store.catalog.getPart('dht22')!.offers.some((o) => o.vendorId === 'mouser')).toBe(false)
  })

  it("drops the vendor's sample history and records today's live price", async () => {
    await refreshPrices(store, [fakeProvider(livePico)], { now: () => TODAY, sleep: noSleep })
    const history = db.history().filter((s) => s.partId === 'rpi-pico-w' && s.vendorId === 'mouser')
    expect(history).toEqual([{ partId: 'rpi-pico-w', vendorId: 'mouser', date: '2030-01-15', unitPrice: 610, currency: 'INR' }])
  })

  it('skips a provider that ran recently unless forced', async () => {
    let calls = 0
    const provider = fakeProvider(async () => {
      calls++
      return []
    })
    await refreshPrices(store, [provider], { now: () => TODAY, sleep: noSleep })
    const afterFirst = calls
    const second = await refreshPrices(store, [provider], { now: () => new Date(TODAY.getTime() + 3_600_000), sleep: noSleep })
    expect(second.skippedProviders).toEqual(['mouser'])
    expect(calls).toBe(afterFirst)
    await refreshPrices(store, [provider], { now: () => TODAY, sleep: noSleep, force: true })
    expect(calls).toBe(afterFirst * 2)
  })

  it('stops at the first bad-credentials error and keeps existing offers', async () => {
    let calls = 0
    const provider = fakeProvider(async () => {
      calls++
      throw new HttpError(401, 'HTTP 401')
    })
    const before = store.catalog.getPart('rpi-pico-w')!.offers.length
    const result = await refreshPrices(store, [provider], { now: () => TODAY, sleep: noSleep })
    expect(calls).toBe(1)
    expect(result.errors.at(-1)).toMatch(/check its API key/)
    expect(store.catalog.getPart('rpi-pico-w')!.offers.length).toBe(before)
    expect(db.providerLastSuccess('mouser')).toBeNull()
  })
})

describe('HTTP API', () => {
  let base: string
  let close: () => void

  async function start(adminToken: string | null) {
    const app = createApp({ store, providers: [], adminToken, refresh: async () => ({ ok: true }) })
    const server = app.listen(0)
    await new Promise((r) => server.once('listening', r))
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`
    close = () => server.close()
  }

  afterEach(() => close?.())

  it('serves the same search results as the shared catalog', async () => {
    await start(null)
    const res = await fetch(`${base}/parts?q=pico%20w&sort=price-asc`)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(store.catalog.searchParts({ q: 'pico w', sort: 'price-asc', page: 1, pageSize: 12 }))
  })

  it('returns 404s for unknown parts and paths', async () => {
    await start(null)
    expect((await fetch(`${base}/parts/nope`)).status).toBe(404)
    expect((await fetch(`${base}/parts/nope/history`)).status).toBe(404)
    expect((await fetch(`${base}/whatever`)).status).toBe(404)
  })

  it('validates the resolve request body', async () => {
    await start(null)
    const post = (body: unknown) => fetch(`${base}/parts/resolve`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    expect((await post({ refs: [1] })).status).toBe(400)
    expect(await (await post({ refs: ['am2302'] })).json()).toEqual([{ ref: 'am2302', partId: 'dht22' }])
  })

  it('protects the admin refresh endpoint', async () => {
    await start('s3cret')
    const call = (auth?: string) => fetch(`${base}/admin/refresh`, { method: 'POST', headers: auth ? { authorization: auth } : {} })
    expect((await call()).status).toBe(401)
    expect((await call('Bearer wrong')).status).toBe(401)
    expect((await call('Bearer s3cret')).status).toBe(200)
  })

  it('hides the admin endpoint when no token is configured', async () => {
    await start(null)
    expect((await fetch(`${base}/admin/refresh`, { method: 'POST' })).status).toBe(404)
  })

  it('reports health with mode "server"', async () => {
    await start(null)
    expect(await (await fetch(`${base}/health`)).json()).toMatchObject({ ok: true, mode: 'server', providers: [] })
  })
})

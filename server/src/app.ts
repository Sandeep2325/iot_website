import { timingSafeEqual } from 'node:crypto'
import express, { type ErrorRequestHandler, type Request } from 'express'
import type { ApiHealth, CategoryId, PartQuery, PartSort } from '../../shared/types'
import type { PriceProvider } from './providers/types'
import type { Store } from './store'

const SORTS: PartSort[] = ['relevance', 'price-asc', 'price-desc', 'stock', 'name']

export interface AppOptions {
  store: Store
  providers: PriceProvider[]
  adminToken: string | null
  /** Runs a price refresh; the admin endpoint calls it. */
  refresh: () => Promise<unknown>
}

/** Constant-time comparison, so response timing doesn't reveal how much of the token was right. */
function tokenMatches(given: string | undefined, expected: string): boolean {
  const a = Buffer.from(given ?? '')
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

function str(req: Request, key: string): string | undefined {
  const v = req.query[key]
  return typeof v === 'string' && v !== '' ? v : undefined
}

function num(req: Request, key: string): number | undefined {
  const v = str(req, key)
  if (v === undefined) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

/** The HTTP API. Same paths and response shapes as the browser mock in client/src/mocks/handlers.ts. */
export function createApp({ store, providers, adminToken, refresh }: AppOptions) {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '100kb' }))

  app.get('/api/health', (_req, res) => {
    const health: ApiHealth = {
      ok: true,
      mode: 'server',
      providers: providers.map((p) => ({ id: p.id, vendors: p.vendorIds })),
      lastRefresh: store.db.lastRefreshRun(),
    }
    res.json(health)
  })

  app.get('/api/parts', (req, res) => {
    const sort = str(req, 'sort') as PartSort | undefined
    const query: PartQuery = {
      q: str(req, 'q'),
      category: str(req, 'category') as CategoryId | undefined,
      vendor: str(req, 'vendor'),
      vendors: str(req, 'vendors'),
      minPrice: num(req, 'minPrice'),
      maxPrice: num(req, 'maxPrice'),
      inStock: str(req, 'inStock') === 'true',
      sort: sort && SORTS.includes(sort) ? sort : undefined,
      page: Math.max(1, Math.floor(num(req, 'page') ?? 1)),
      pageSize: Math.min(100, Math.max(1, Math.floor(num(req, 'pageSize') ?? 12))),
    }
    res.json(store.catalog.searchParts(query))
  })

  app.post('/api/parts/resolve', (req, res) => {
    const refs: unknown = req.body?.refs
    if (!Array.isArray(refs) || refs.length > 1000 || !refs.every((r) => typeof r === 'string')) {
      res.status(400).json({ message: 'Expected { refs: string[] } with at most 1000 entries' })
      return
    }
    res.json(store.catalog.resolvePartRefs(refs))
  })

  app.get('/api/parts/:id', (req, res) => {
    const part = store.catalog.getPart(req.params.id)
    if (!part) {
      res.status(404).json({ message: 'Part not found' })
      return
    }
    res.json(part)
  })

  app.get('/api/parts/:id/history', (req, res) => {
    if (!store.catalog.getPart(req.params.id)) {
      res.status(404).json({ message: 'Part not found' })
      return
    }
    const days = Math.min(365, Math.max(1, num(req, 'days') ?? 90))
    res.json(store.catalog.getPriceHistory(req.params.id, days))
  })

  app.get('/api/categories', (_req, res) => {
    res.json(store.categories)
  })

  app.get('/api/vendors', (_req, res) => {
    res.json(store.catalog.vendors)
  })

  app.get('/api/dashboard/summary', (_req, res) => {
    res.json(store.catalog.getDashboardSummary())
  })

  app.get('/api/dashboard/price-index', (req, res) => {
    const days = Math.min(90, Math.max(2, num(req, 'days') ?? 90))
    res.json(store.catalog.getPriceIndex(days, str(req, 'category') as CategoryId | undefined))
  })

  // Manual refresh, e.g. right after adding a vendor key. Disabled unless ADMIN_TOKEN is set.
  app.post('/api/admin/refresh', async (req, res) => {
    if (!adminToken || !tokenMatches(req.get('authorization'), `Bearer ${adminToken}`)) {
      res.status(adminToken ? 401 : 404).json({ message: adminToken ? 'Unauthorized' : 'Not found' })
      return
    }
    res.json(await refresh())
  })

  app.use('/api', (_req, res) => {
    res.status(404).json({ message: 'Not found' })
  })

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
  app.use(onError)

  return app
}

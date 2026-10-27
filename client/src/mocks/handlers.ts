import { delay, http, HttpResponse } from 'msw'
import type { ApiHealth, CategoryId, PartQuery, PartSort } from '@/types'
import { categories, vendors } from '@shared/data/vendors'
import { getDashboardSummary, getPart, getPriceIndex, getPriceHistory, resolvePartRefs, searchParts } from './db'

/** Simulated network latency so loading states are visible during development. */
const LATENCY_MS = 300

function numberParam(params: URLSearchParams, key: string): number | undefined {
  const raw = params.get(key)
  if (raw == null || raw === '') return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

export const handlers = [
  http.get('/api/parts', async ({ request }) => {
    await delay(LATENCY_MS)
    const params = new URL(request.url).searchParams
    const query: PartQuery = {
      q: params.get('q') ?? undefined,
      category: (params.get('category') as CategoryId) || undefined,
      vendor: params.get('vendor') || undefined,
      vendors: params.get('vendors') || undefined,
      minPrice: numberParam(params, 'minPrice'),
      maxPrice: numberParam(params, 'maxPrice'),
      inStock: params.get('inStock') === 'true',
      sort: (params.get('sort') as PartSort) || undefined,
      page: numberParam(params, 'page'),
      pageSize: numberParam(params, 'pageSize'),
    }
    return HttpResponse.json(searchParts(query))
  }),

  http.post('/api/parts/resolve', async ({ request }) => {
    await delay(LATENCY_MS)
    const body = (await request.json().catch(() => null)) as { refs?: unknown } | null
    if (!Array.isArray(body?.refs) || !body.refs.every((r) => typeof r === 'string')) {
      return HttpResponse.json({ message: 'Expected { refs: string[] }' }, { status: 400 })
    }
    return HttpResponse.json(resolvePartRefs(body.refs))
  }),

  http.get('/api/parts/:id', async ({ params }) => {
    await delay(LATENCY_MS)
    const part = getPart(String(params.id))
    if (!part) return HttpResponse.json({ message: 'Part not found' }, { status: 404 })
    return HttpResponse.json(part)
  }),

  http.get('/api/parts/:id/history', async ({ params, request }) => {
    await delay(LATENCY_MS)
    const id = String(params.id)
    if (!getPart(id)) return HttpResponse.json({ message: 'Part not found' }, { status: 404 })
    const days = numberParam(new URL(request.url).searchParams, 'days') ?? 90
    return HttpResponse.json(getPriceHistory(id, days))
  }),

  http.get('/api/health', () => HttpResponse.json<ApiHealth>({ ok: true, mode: 'mock', providers: [], lastRefresh: null })),

  http.get('/api/categories', () => HttpResponse.json(categories)),

  http.get('/api/vendors', () => HttpResponse.json(vendors)),

  http.get('/api/dashboard/price-index', async ({ request }) => {
    await delay(LATENCY_MS)
    const params = new URL(request.url).searchParams
    const days = Math.min(90, Math.max(2, numberParam(params, 'days') ?? 90))
    return HttpResponse.json(getPriceIndex(days, (params.get('category') as CategoryId) || undefined))
  }),

  http.get('/api/dashboard/summary', async () => {
    await delay(LATENCY_MS)
    return HttpResponse.json(getDashboardSummary())
  }),
]

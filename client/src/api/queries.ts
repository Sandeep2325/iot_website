import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query'
import type {
  ApiHealth,
  Category,
  CategoryId,
  DashboardSummary,
  Paginated,
  PartDetail,
  PartQuery,
  PartSummary,
  PriceIndexPoint,
  PriceSnapshot,
  Vendor,
} from '@/types'
import { apiGet, apiPost } from './client'

export const queryKeys = {
  parts: (query: PartQuery) => ['parts', query] as const,
  part: (id: string) => ['part', id] as const,
  history: (id: string, days: number) => ['part', id, 'history', days] as const,
  categories: ['categories'] as const,
  vendors: ['vendors'] as const,
  dashboard: ['dashboard'] as const,
}

/** Query definition for a parts search, shared by useParts and imperative fetches. */
export function partsQuery(query: PartQuery) {
  return {
    queryKey: queryKeys.parts(query),
    queryFn: () => apiGet<Paginated<PartSummary>>('/parts', { ...query }),
  }
}

export function useParts(query: PartQuery, options?: { enabled?: boolean }) {
  return useQuery({
    ...partsQuery(query),
    placeholderData: keepPreviousData,
    enabled: options?.enabled,
  })
}

export function usePart(id: string) {
  return useQuery({
    queryKey: queryKeys.part(id),
    queryFn: () => apiGet<PartDetail>(`/parts/${encodeURIComponent(id)}`),
  })
}

export function usePriceHistory(id: string, days = 90) {
  return useQuery({
    queryKey: queryKeys.history(id, days),
    queryFn: () => apiGet<PriceSnapshot[]>(`/parts/${encodeURIComponent(id)}/history`, { days }),
  })
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => apiGet<Category[]>('/categories'),
    staleTime: Infinity,
  })
}

export function useVendors() {
  return useQuery({
    queryKey: queryKeys.vendors,
    queryFn: () => apiGet<Vendor[]>('/vendors'),
    staleTime: Infinity,
  })
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => apiGet<DashboardSummary>('/dashboard/summary'),
  })
}

/** Loads full details (with offers) for several parts; shares the cache with usePart. */
export function useManyParts(ids: string[]) {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: queryKeys.part(id),
      queryFn: () => apiGet<PartDetail>(`/parts/${encodeURIComponent(id)}`),
    })),
    combine: (results) => ({
      parts: results.map((r) => r.data).filter((p): p is PartDetail => !!p),
      isPending: results.some((r) => r.isPending),
      isError: results.some((r) => r.isError),
    }),
  })
}

export interface ResolvedRef {
  ref: string
  partId: string | null
}

/** Matches MPNs or part ids (e.g. from an imported CSV) to catalog parts. */
export function resolvePartRefs(refs: string[]) {
  return apiPost<ResolvedRef[]>('/parts/resolve', { refs })
}

export function usePriceIndex(days: number, category?: CategoryId) {
  return useQuery({
    queryKey: ['dashboard', 'price-index', days, category ?? 'all'] as const,
    queryFn: () => apiGet<PriceIndexPoint[]>('/dashboard/price-index', { days, category }),
  })
}

/** Where prices come from (mock demo, server with sample prices, or live vendor APIs). */
export function useApiHealth() {
  return useQuery({
    queryKey: ['health'] as const,
    queryFn: () => apiGet<ApiHealth>('/health'),
    staleTime: 60_000,
  })
}

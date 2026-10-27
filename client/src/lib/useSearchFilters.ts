import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { CategoryId, PartQuery, PartSort } from '@/types'

export const PAGE_SIZE = 12

const SORTS: PartSort[] = ['relevance', 'price-asc', 'price-desc', 'stock', 'name']

function toNumber(raw: string | null): number | undefined {
  if (raw == null || raw === '') return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

/**
 * Search filters stored in the URL query string, so a filtered search can be
 * bookmarked or shared. Prices in the URL are always INR.
 */
export function useSearchFilters() {
  const [params, setParams] = useSearchParams()

  const filters = useMemo<PartQuery>(() => {
    const sort = params.get('sort') as PartSort | null
    return {
      q: params.get('q') || undefined,
      category: (params.get('category') as CategoryId) || undefined,
      vendor: params.get('vendor') || undefined,
      minPrice: toNumber(params.get('minPrice')),
      maxPrice: toNumber(params.get('maxPrice')),
      inStock: params.get('inStock') === 'true',
      sort: sort && SORTS.includes(sort) ? sort : undefined,
      page: Math.max(1, toNumber(params.get('page')) ?? 1),
      pageSize: PAGE_SIZE,
    }
  }, [params])

  /** Merges changes into the URL. Any change other than `page` resets to page 1. */
  const update = useCallback(
    (changes: Partial<Omit<PartQuery, 'pageSize'>>) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(changes)) {
          if (value === undefined || value === '' || value === false || value === null) next.delete(key)
          else next.set(key, String(value))
        }
        if (!('page' in changes)) next.delete('page')
        if (next.get('page') === '1') next.delete('page')
        return next
      })
    },
    [setParams],
  )

  const clear = useCallback(() => {
    setParams((prev) => {
      const next = new URLSearchParams()
      const q = prev.get('q')
      if (q) next.set('q', q)
      return next
    })
  }, [setParams])

  const activeFilterCount = [
    filters.category,
    filters.vendor,
    filters.minPrice,
    filters.maxPrice,
    filters.inStock || undefined,
  ].filter((v) => v !== undefined).length

  return { filters, update, clear, activeFilterCount }
}

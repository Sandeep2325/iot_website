import { SearchX, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useParts } from '@/api/queries'
import { PageHeader } from '@/components/layout/PageHeader'
import { PartCard } from '@/components/parts/PartCard'
import { SearchFilters } from '@/components/parts/SearchFilters'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Pagination } from '@/components/ui/pagination'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useSearchFilters } from '@/lib/useSearchFilters'
import { cn } from '@/lib/utils'
import { useSettings } from '@/store/settingsStore'
import type { PartSort } from '@/types'

const sortOptions: { value: PartSort; label: string }[] = [
  { value: 'relevance', label: 'Best match' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'stock', label: 'Most stock' },
  { value: 'name', label: 'Name (A–Z)' },
]

export default function SearchPage() {
  const { filters, update, clear, activeFilterCount } = useSearchFilters()
  // Without a search term, "relevance" has nothing to rank by, so default to name order.
  const sort = filters.sort ?? (filters.q ? 'relevance' : 'name')
  const preferredVendors = useSettings((s) => s.preferredVendors)
  const { data, isPending, isError, error, isPlaceholderData, refetch } = useParts({
    ...filters,
    sort,
    vendors: preferredVendors.join(',') || undefined,
  })
  const [filtersOpen, setFiltersOpen] = useState(false)

  const pageCount = data ? Math.ceil(data.total / data.pageSize) : 0

  return (
    <>
      <PageHeader
        title={filters.q ? `Results for “${filters.q}”` : 'Search parts'}
        description="Compare prices for IoT components across Indian and global vendors."
      />

      <div className="flex flex-col gap-6 md:flex-row">
        <aside className="md:w-56 md:shrink-0" aria-label="Search filters">
          <Button variant="outline" className="w-full md:hidden" onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen}>
            <SlidersHorizontal className="h-4 w-4" />
            {filtersOpen ? 'Hide filters' : 'Show filters'}
            {activeFilterCount > 0 && ` (${activeFilterCount})`}
          </Button>
          <div className={cn('mt-4 md:mt-0 md:block', filtersOpen ? 'block' : 'hidden')}>
            <SearchFilters filters={filters} onChange={update} onClear={clear} activeFilterCount={activeFilterCount} />
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {data ? `${data.total} part${data.total === 1 ? '' : 's'} found` : 'Searching…'}
            </p>
            <Select
              className="w-48"
              value={sort}
              onChange={(e) => update({ sort: e.target.value as PartSort })}
              aria-label="Sort results"
            >
              {sortOptions
                .filter((o) => o.value !== 'relevance' || filters.q)
                .map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
            </Select>
          </div>

          {isError ? (
            <Card className="border-danger/40">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5 text-sm">
                <span className="text-danger">Couldn't load parts: {error.message}</span>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Try again
                </Button>
              </CardContent>
            </Card>
          ) : isPending ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : data.items.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <SearchX className="h-10 w-10 text-muted-foreground" />
                <p className="font-medium">No parts match your search</p>
                <p className="text-sm text-muted-foreground">Try a different term or remove some filters.</p>
                {activeFilterCount > 0 && (
                  <Button variant="outline" size="sm" onClick={clear}>
                    Clear filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className={cn('flex flex-col gap-6 transition-opacity', isPlaceholderData && 'opacity-60')}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.items.map((part) => (
                  <PartCard key={part.id} part={part} />
                ))}
              </div>
              <Pagination
                page={data.page}
                pageCount={pageCount}
                onPageChange={(page) => {
                  update({ page })
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            </div>
          )}
        </section>
      </div>
    </>
  )
}

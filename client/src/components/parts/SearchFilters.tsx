import { useState, type FormEvent, type ReactNode } from 'react'
import { useCategories, useVendors } from '@/api/queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { convert } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { useSettings } from '@/store/settingsStore'
import type { CategoryId, PartQuery } from '@/types'

interface SearchFiltersProps {
  filters: PartQuery
  onChange: (changes: Partial<PartQuery>) => void
  onClear: () => void
  activeFilterCount: number
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-b pb-4 last:border-b-0">
      <legend className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</legend>
      {children}
    </fieldset>
  )
}

/** Price inputs work in the display currency; the URL always stores INR. */
function PriceRange({ filters, onChange }: Pick<SearchFiltersProps, 'filters' | 'onChange'>) {
  const currency = useSettings((s) => s.currency)
  const toDisplay = (inr?: number) => (inr == null ? '' : String(Math.round(convert(inr, 'INR', currency) * 100) / 100))
  const [min, setMin] = useState(toDisplay(filters.minPrice))
  const [max, setMax] = useState(toDisplay(filters.maxPrice))

  // Re-sync the inputs when the URL or currency changes (e.g. "Clear filters").
  const syncKey = `${filters.minPrice}|${filters.maxPrice}|${currency}`
  const [lastSyncKey, setLastSyncKey] = useState(syncKey)
  if (syncKey !== lastSyncKey) {
    setLastSyncKey(syncKey)
    setMin(toDisplay(filters.minPrice))
    setMax(toDisplay(filters.maxPrice))
  }

  function apply(e: FormEvent) {
    e.preventDefault()
    const toInr = (v: string) => (v.trim() === '' || Number.isNaN(Number(v)) ? undefined : Math.round(convert(Number(v), currency, 'INR') * 100) / 100)
    onChange({ minPrice: toInr(min), maxPrice: toInr(max) })
  }

  const symbol = currency === 'INR' ? '₹' : '$'
  return (
    <form onSubmit={apply} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input type="number" min={0} step="any" inputMode="decimal" placeholder={`${symbol} min`} value={min} onChange={(e) => setMin(e.target.value)} aria-label="Minimum price" />
        <span className="text-muted-foreground">–</span>
        <Input type="number" min={0} step="any" inputMode="decimal" placeholder={`${symbol} max`} value={max} onChange={(e) => setMax(e.target.value)} aria-label="Maximum price" />
      </div>
      <Button type="submit" variant="outline" size="sm">
        Apply price
      </Button>
    </form>
  )
}

export function SearchFilters({ filters, onChange, onClear, activeFilterCount }: SearchFiltersProps) {
  const { data: categories } = useCategories()
  const { data: vendors } = useVendors()

  return (
    <div className="flex flex-col gap-4">
      <Section title="Category">
        <div className="flex flex-col gap-0.5">
          {[{ id: undefined, name: 'All categories' }, ...(categories ?? [])].map((c) => (
            <button
              key={c.id ?? 'all'}
              onClick={() => onChange({ category: c.id as CategoryId | undefined })}
              aria-pressed={filters.category === c.id}
              className={cn(
                'cursor-pointer rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                filters.category === c.id ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Vendor">
        <Select value={filters.vendor ?? ''} onChange={(e) => onChange({ vendor: e.target.value || undefined })} aria-label="Vendor">
          <option value="">All vendors</option>
          {vendors?.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} {v.region === 'IN' ? '(India)' : '(Global)'}
            </option>
          ))}
        </Select>
      </Section>

      <Section title="Price (per unit)">
        <PriceRange filters={filters} onChange={onChange} />
      </Section>

      <Section title="Availability">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!filters.inStock}
            onChange={(e) => onChange({ inStock: e.target.checked })}
            className="h-4 w-4 accent-primary"
          />
          In stock only
        </label>
      </Section>

      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear filters ({activeFilterCount})
        </Button>
      )}
    </div>
  )
}

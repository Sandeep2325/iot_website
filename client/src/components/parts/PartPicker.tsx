import { Plus, Search } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { partsQuery, useParts } from '@/api/queries'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/currency'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { cn } from '@/lib/utils'
import { useSettings } from '@/store/settingsStore'
import type { PartSummary } from '@/types'
import { PartImage } from './PartImage'

const searchQuery = (q: string, vendors: string[]) => ({
  q,
  pageSize: 6,
  sort: 'relevance' as const,
  vendors: vendors.join(',') || undefined,
})

interface PartPickerProps {
  onSelect: (part: PartSummary) => void
  /** Parts already chosen; shown as "Added" and not selectable. */
  excludeIds?: string[]
  placeholder?: string
  disabled?: boolean
}

/** Search-as-you-type combobox for adding a part to a list. */
export function PartPicker({ onSelect, excludeIds = [], placeholder = 'Add a part: search by name or MPN…', disabled }: PartPickerProps) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const q = useDebouncedValue(text.trim(), 200)
  const currency = useSettings((s) => s.currency)
  const preferredVendors = useSettings((s) => s.preferredVendors)
  const listId = useId()

  const queryClient = useQueryClient()
  const latestText = useRef(text)
  useEffect(() => {
    latestText.current = text
  }, [text])

  const { data, isFetching, isPlaceholderData } = useParts(searchQuery(q, preferredVendors), { enabled: q.length >= 2 })
  // Never show (or let Enter pick) results from an earlier search term while the new one loads.
  const stale = q !== text.trim() || isPlaceholderData
  const results = q.length >= 2 && !stale ? (data?.items ?? []) : []
  const showList = open && text.trim().length >= 2

  function choose(part: PartSummary) {
    if (excludeIds.includes(part.id)) return
    onSelect(part)
    setText('')
    setOpen(false)
  }

  /** Enter pressed before results arrived: fetch them now and pick the top one, unless the text changed meanwhile. */
  async function chooseTopResult(term: string) {
    const page = await queryClient.fetchQuery(partsQuery(searchQuery(term, preferredVendors)))
    const first = page.items.find((p) => !excludeIds.includes(p.id))
    if (first && latestText.current.trim() === term) choose(first)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && stale && text.trim().length >= 2) {
      e.preventDefault()
      void chooseTopResult(text.trim())
      return
    }
    if (!showList || !results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(results[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
        value={text}
        disabled={disabled}
        placeholder={placeholder}
        className="pl-9"
        onChange={(e) => {
          setText(e.target.value)
          setOpen(true)
          setActive(0)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
      />
      {showList && (
        <ul id={listId} role="listbox" className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border bg-card shadow-lg">
          {results.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted-foreground">{isFetching || stale ? 'Searching…' : 'No matching parts'}</li>
          ) : (
            results.map((part, i) => {
              const added = excludeIds.includes(part.id)
              return (
                <li
                  key={part.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  aria-disabled={added}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(part)}
                  onMouseEnter={() => setActive(i)}
                  className={cn('flex items-center gap-3 px-3 py-2', added ? 'opacity-60' : 'cursor-pointer', i === active && !added && 'bg-muted')}
                >
                  <PartImage part={part} className="h-9 w-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{part.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {part.mpn} · from {part.lowestPrice != null ? formatPrice(part.lowestPrice, part.lowestPriceCurrency, currency) : '—'}
                    </p>
                  </div>
                  {added ? <span className="text-xs text-muted-foreground">Added</span> : <Plus className="h-4 w-4 text-muted-foreground" />}
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}

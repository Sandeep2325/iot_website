import { ArrowRight, Search } from 'lucide-react'
import { useEffect, useId, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { useParts } from '@/api/queries'
import { PartImage } from '@/components/parts/PartImage'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/currency'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { cn } from '@/lib/utils'
import { useSettings } from '@/store/settingsStore'

const MIN_CHARS = 2
const SUGGESTIONS = 6

/**
 * The top-bar search, live as you type. On the Search page it updates the results (keeping filters);
 * anywhere else it shows a dropdown of the best matches with a link to all results.
 */
export function LiveSearch() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const onSearchPage = pathname === '/search'
  const urlQuery = onSearchPage ? (params.get('q') ?? '') : ''
  const currency = useSettings((s) => s.currency)
  const preferredVendors = useSettings((s) => s.preferredVendors)
  const listId = useId()

  const [text, setText] = useState(urlQuery)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  // Follow the URL when it changes from elsewhere (back button, leaving the Search page, a link).
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery)
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery)
    if (urlQuery !== text.trim()) setText(urlQuery)
  }

  const term = useDebouncedValue(text.trim(), 250)

  /** Shows `q` on the Search page; replaces the history entry so typing doesn't flood the back button. */
  function showResults(q: string, replace: boolean) {
    const next = onSearchPage ? new URLSearchParams(params) : new URLSearchParams()
    if (q) next.set('q', q)
    else next.delete('q')
    next.delete('page')
    const qs = next.toString()
    navigate(`/search${qs ? `?${qs}` : ''}`, { replace })
  }

  // On the Search page, results follow the box as you type.
  useEffect(() => {
    if (onSearchPage && term !== (params.get('q') ?? '')) showResults(term, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the typed term
  }, [term, onSearchPage])

  const dropdownTerm = !onSearchPage && term.length >= MIN_CHARS ? term : ''
  const { data, isFetching, isPlaceholderData } = useParts(
    { q: dropdownTerm, pageSize: SUGGESTIONS, sort: 'relevance', vendors: preferredVendors.join(',') || undefined },
    { enabled: dropdownTerm !== '' },
  )
  const stale = dropdownTerm !== text.trim() || isPlaceholderData
  const results = dropdownTerm && !stale ? (data?.items ?? []) : []
  const showList = open && !onSearchPage && text.trim().length >= MIN_CHARS
  // Rows: each result, then "See all results".
  const rowCount = results.length + 1

  function close() {
    setOpen(false)
    setActive(-1)
  }

  function openPart(id: string) {
    close()
    setText('')
    navigate(`/parts/${id}`)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (active >= 0 && active < results.length) return openPart(results[active].id)
    close()
    showResults(text.trim(), onSearchPage)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') return close()
    if (!showList) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % rowCount)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a <= 0 ? rowCount - 1 : a - 1))
    }
  }

  return (
    <form onSubmit={onSubmit} className="relative max-w-md flex-1" role="search">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setOpen(true)
          setActive(-1)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(close, 150)}
        onKeyDown={onKeyDown}
        placeholder="Search ESP32, DHT22, LoRa…"
        className="pl-9"
        aria-label="Search parts"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          // Phones: span the screen under the top bar (the header is its containing block). Wider: hang under the box.
          className="fixed inset-x-4 top-14 z-30 overflow-hidden rounded-lg border bg-card shadow-lg sm:absolute sm:inset-x-auto sm:top-full sm:left-0 sm:mt-1 sm:w-[26rem]"
        >
          {results.length === 0 && (
            <li className="px-3 py-3 text-sm text-muted-foreground">{isFetching || stale ? 'Searching…' : `No parts match “${text.trim()}”`}</li>
          )}
          {results.map((part, i) => (
            <li
              key={part.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => openPart(part.id)}
              onMouseEnter={() => setActive(i)}
              className={cn('flex cursor-pointer items-center gap-3 px-3 py-2', i === active && 'bg-muted')}
            >
              <PartImage part={part} className="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{part.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {part.mpn} · from {part.lowestPrice != null ? formatPrice(part.lowestPrice, part.lowestPriceCurrency, currency) : '—'}
                </p>
              </div>
            </li>
          ))}
          <li
            id={`${listId}-${results.length}`}
            role="option"
            aria-selected={active === results.length}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              close()
              showResults(text.trim(), false)
            }}
            onMouseEnter={() => setActive(results.length)}
            className={cn(
              'flex cursor-pointer items-center justify-between gap-2 border-t px-3 py-2.5 text-sm font-medium text-primary',
              active === results.length && 'bg-muted',
            )}
          >
            <span className="truncate">
              See all results for “{text.trim()}”{data && !stale ? ` (${data.total})` : ''}
            </span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </li>
        </ul>
      )}
    </form>
  )
}

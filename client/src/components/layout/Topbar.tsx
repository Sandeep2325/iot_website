import { Menu, Monitor, Moon, Search, Sun } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useWatchStatus } from '@/lib/useWatchStatus'
import { useSettings, type Theme } from '@/store/settingsStore'

const nextTheme: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' }
const themeIcon = { light: Sun, dark: Moon, system: Monitor }

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const urlQuery = pathname === '/search' ? (params.get('q') ?? '') : ''
  const [query, setQuery] = useState(urlQuery)

  // Show the current search term while on the search page; clear it elsewhere.
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery)
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery)
    setQuery(urlQuery)
  }
  const { currency, setCurrency, theme, setTheme } = useSettings()
  const ThemeIcon = themeIcon[theme]
  const { triggeredCount } = useWatchStatus()

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        id="menu-button"
        className="relative md:hidden"
        onClick={onMenuClick}
        aria-label={triggeredCount ? `Open menu (${triggeredCount} price alert${triggeredCount === 1 ? '' : 's'})` : 'Open menu'}
      >
        <Menu className="h-5 w-5" />
        {triggeredCount > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-success" />}
      </Button>
      <form onSubmit={handleSearch} className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ESP32, DHT22, LoRa…"
          className="pl-9"
          aria-label="Search parts"
        />
      </form>
      <div className="ml-auto flex items-center gap-2">
        <div className="flex rounded-lg border p-0.5" role="group" aria-label="Currency">
          {(['INR', 'USD'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              aria-pressed={currency === c}
              className={
                'cursor-pointer rounded-md px-2 py-1 text-xs font-medium ' +
                (currency === c ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')
              }
            >
              {c === 'INR' ? '₹ INR' : '$ USD'}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(nextTheme[theme])}
          aria-label={`Theme: ${theme}. Click to change.`}
          title={`Theme: ${theme}`}
        >
          <ThemeIcon className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}

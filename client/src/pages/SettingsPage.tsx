import { Monitor, Moon, Sun } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useVendors } from '@/api/queries'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { USD_TO_INR } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { useBom } from '@/store/bomStore'
import { useCompare } from '@/store/compareStore'
import { useSettings, type Theme } from '@/store/settingsStore'
import { useWatchlist } from '@/store/watchlistStore'
import type { Currency } from '@/types'

interface Option<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: Option<T>[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="inline-flex rounded-lg border p-0.5" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            value === o.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  )
}

function SettingRow({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  )
}

function PreferredVendors() {
  const { data: vendors = [] } = useVendors()
  const { preferredVendors, setPreferredVendors } = useSettings()
  // An empty list means "all vendors".
  const isOn = (id: string) => !preferredVendors.length || preferredVendors.includes(id)
  const onCount = vendors.filter((v) => isOn(v.id)).length

  function toggle(id: string) {
    const current = preferredVendors.length ? preferredVendors : vendors.map((v) => v.id)
    const next = current.includes(id) ? current.filter((v) => v !== id) : [...current, id]
    setPreferredVendors(next.length === vendors.length ? [] : next)
  }

  const indianIds = vendors.filter((v) => v.region === 'IN').map((v) => v.id)
  const indianOnly = preferredVendors.length === indianIds.length && indianIds.every((id) => preferredVendors.includes(id))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferred vendors</CardTitle>
        <CardDescription>
          Best prices, parts-list totals, watchlist alerts and search results only use these vendors. Part pages still list every vendor for reference.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          <Button variant={preferredVendors.length === 0 ? 'default' : 'outline'} size="sm" onClick={() => setPreferredVendors([])}>
            All vendors
          </Button>
          <Button variant={indianOnly ? 'default' : 'outline'} size="sm" onClick={() => setPreferredVendors(indianIds)}>
            Indian vendors only
          </Button>
        </div>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {vendors.map((v) => {
            const on = isOn(v.id)
            const lastOne = on && onCount === 1
            return (
              <li key={v.id}>
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                    on ? 'border-primary/50 bg-accent/40' : 'hover:bg-muted',
                    lastOne && 'cursor-not-allowed',
                  )}
                  title={lastOne ? 'Keep at least one vendor selected' : undefined}
                >
                  <input type="checkbox" checked={on} disabled={lastOne} onChange={() => toggle(v.id)} className="h-4 w-4 accent-primary" />
                  <span className="flex-1 text-sm font-medium">{v.name}</span>
                  <Badge variant="muted">{v.region === 'IN' ? 'India · ₹' : 'Global · $'}</Badge>
                </label>
              </li>
            )
          })}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Tip: global vendors ship from abroad, so customs duty and shipping can add a lot on small orders.
        </p>
      </CardContent>
    </Card>
  )
}

function SavedData() {
  const bomCount = useBom((s) => s.items.length)
  const watchCount = useWatchlist((s) => s.items.length)
  const compareCount = useCompare((s) => s.partIds.length)
  const [confirming, setConfirming] = useState(false)
  const [cleared, setCleared] = useState(false)
  const total = bomCount + watchCount + compareCount

  function clearAll() {
    useBom.getState().clear()
    useCompare.getState().clear()
    useWatchlist.setState({ items: [] })
    setConfirming(false)
    setCleared(true)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your saved data</CardTitle>
        <CardDescription>Saved in this browser only. Clearing your browser data removes it too.</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="mb-4 grid grid-cols-3 gap-3 text-center">
          {[
            ['Parts list', bomCount],
            ['Watchlist', watchCount],
            ['Compare', compareCount],
          ].map(([label, n]) => (
            <div key={label} className="flex flex-col-reverse rounded-lg bg-muted p-3">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-xl font-semibold tabular-nums">{n}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap items-center gap-3" aria-live="polite">
          {confirming ? (
            <>
              <span className="text-sm">Remove your parts list, watchlist and compare list?</span>
              <Button size="sm" className="bg-danger text-white hover:bg-danger/90" onClick={clearAll}>
                Yes, clear everything
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" disabled={total === 0} onClick={() => (setConfirming(true), setCleared(false))}>
                Clear saved data
              </Button>
              {cleared && <span className="text-sm text-muted-foreground">Cleared.</span>}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  const { currency, setCurrency, theme, setTheme } = useSettings()

  return (
    <>
      <PageHeader title="Settings" description="Display options and which vendors to buy from." />
      <div className="flex max-w-3xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Display</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <SettingRow title="Currency" description={`Global vendors' dollar prices are converted at ₹${USD_TO_INR} = $1.`}>
              <Segmented<Currency>
                label="Currency"
                value={currency}
                onChange={setCurrency}
                options={[
                  { value: 'INR', label: '₹ Rupees' },
                  { value: 'USD', label: '$ Dollars' },
                ]}
              />
            </SettingRow>
            <SettingRow title="Theme" description="System follows your device's light or dark setting.">
              <Segmented<Theme>
                label="Theme"
                value={theme}
                onChange={setTheme}
                options={[
                  { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
                  { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
                  { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
                ]}
              />
            </SettingRow>
          </CardContent>
        </Card>
        <PreferredVendors />
        <SavedData />
      </div>
    </>
  )
}

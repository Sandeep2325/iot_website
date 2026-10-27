import { useApiHealth, useVendors } from '@/api/queries'

const updatedFormat = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

/** Sidebar footer saying where prices come from: the in-browser demo, sample data, or live vendor APIs. */
export function DataSourceNote() {
  const { data: health, isError } = useApiHealth()
  const { data: vendors } = useVendors()
  const name = (id: string) => vendors?.find((v) => v.id === id)?.name ?? id

  let text: string
  if (isError) text = 'Price server unreachable'
  else if (!health) text = 'Checking price source…'
  else if (health.mode === 'mock') text = 'Demo mode: sample prices generated in your browser'
  else if (!health.providers.length) text = 'Sample prices. Add vendor API keys on the server for live prices.'
  else {
    const live = [...new Set(health.providers.flatMap((p) => p.vendors))].map(name).join(', ')
    const at = health.lastRefresh?.finishedAt
    text = `Live prices: ${live}${at ? ` · updated ${updatedFormat.format(new Date(at))}` : ' · first update running'}`
  }

  return <p className="border-t p-4 text-xs text-muted-foreground">{text}</p>
}

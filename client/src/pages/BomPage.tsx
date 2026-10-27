import { AlertTriangle, Download, ListChecks, Trash2, Upload, X } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router'
import { resolvePartRefs, useVendors } from '@/api/queries'
import { PageHeader } from '@/components/layout/PageHeader'
import { PartImage } from '@/components/parts/PartImage'
import { PartPicker } from '@/components/parts/PartPicker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { downloadTextFile, parseBomCsv, toCsv } from '@/lib/csv'
import { formatPrice } from '@/lib/currency'
import type { BomLine } from '@/lib/pricing'
import { useBomPricing } from '@/lib/useBomPricing'
import { cn } from '@/lib/utils'
import { useBom, type BomItem } from '@/store/bomStore'
import { useSettings } from '@/store/settingsStore'

const EXAMPLE_PROJECT: BomItem[] = [
  { partId: 'esp32-devkitc', quantity: 1 },
  { partId: 'bme280', quantity: 1 },
  { partId: 'soil-moisture-cap', quantity: 2 },
  { partId: 'ssd1306-096', quantity: 1 },
  { partId: 'tp4056', quantity: 1 },
  { partId: '18650-2600', quantity: 2 },
]

/** Quantity field that lets you clear and retype without snapping back to 1 mid-edit. */
function QtyInput({ value, onCommit, label }: { value: number; onCommit: (q: number) => void; label: string }) {
  const [text, setText] = useState(String(value))
  const [lastValue, setLastValue] = useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    setText(String(value))
  }
  return (
    <Input
      type="number"
      min={1}
      value={text}
      aria-label={label}
      className="h-8 w-16 px-2"
      onChange={(e) => {
        setText(e.target.value)
        const n = Math.floor(Number(e.target.value))
        if (n >= 1) onCommit(n)
      }}
      onBlur={() => setText(String(value))}
    />
  )
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'success' }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn('text-2xl font-semibold tabular-nums', tone === 'success' && 'text-success')}>{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export default function BomPage() {
  const { items, add, setQuantity, remove, replace, clear } = useBom()
  const { pricing, loading } = useBomPricing()
  const { data: vendors } = useVendors()
  const currency = useSettings((s) => s.currency)
  const preferredVendors = useSettings((s) => s.preferredVendors)
  const fileInput = useRef<HTMLInputElement>(null)
  const [importMessage, setImportMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  const vendorName = (id: string) => vendors?.find((v) => v.id === id)?.name ?? id
  const fmt = (amount: number) => formatPrice(amount, currency, currency)

  const { bestSingleVendor, mixedTotal } = pricing
  const savings = bestSingleVendor ? bestSingleVendor.total - mixedTotal : 0

  function exportCsv() {
    const cur = currency
    const rows: (string | number)[][] = [
      ['MPN', 'Part', 'Manufacturer', 'Quantity', 'Best vendor', `Unit price (${cur})`, `Line total (${cur})`],
      ...pricing.lines.map((l) => [
        l.part.mpn,
        l.part.name,
        l.part.manufacturer,
        l.quantity,
        l.fillable && l.best ? vendorName(l.best.offer.vendorId) : 'Not available',
        l.fillable && l.best ? l.best.displayUnitPrice.toFixed(2) : '',
        l.fillable && l.best ? l.best.displayTotal.toFixed(2) : '',
      ]),
      ['', '', '', '', '', 'Total', mixedTotal.toFixed(2)],
    ]
    downloadTextFile(`partscout-bom-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows))
  }

  async function importCsv(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const { rows, error } = parseBomCsv(await file.text())
    if (error) return setImportMessage({ tone: 'error', text: error })
    try {
      const resolved = await resolvePartRefs(rows.map((r) => r.ref))
      const missing: string[] = []
      const foundIds = new Set<string>()
      resolved.forEach((r, i) => {
        if (!r.partId) return missing.push(r.ref)
        add(r.partId, rows[i].quantity)
        foundIds.add(r.partId)
      })
      const found = foundIds.size
      setImportMessage({
        tone: missing.length && !found ? 'error' : 'ok',
        text: `Added ${found} part${found === 1 ? '' : 's'} from ${file.name}.` + (missing.length ? ` Not found in catalog: ${missing.join(', ')}.` : ''),
      })
    } catch (err) {
      setImportMessage({ tone: 'error', text: `Import failed: ${(err as Error).message}` })
    }
  }

  return (
    <>
      <PageHeader
        title="Parts list (BOM)"
        description="Work out what your project costs, and where to buy each part."
        actions={
          <div className="flex flex-wrap gap-2">
            <input ref={fileInput} type="file" accept=".csv,text/csv" className="hidden" onChange={importCsv} />
            <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
              <Upload className="h-4 w-4" /> Import CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!pricing.lines.length}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            {items.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clear}>
                <Trash2 className="h-4 w-4" /> Clear
              </Button>
            )}
          </div>
        }
      />

      {importMessage && (
        <div
          role="status"
          className={cn(
            'mb-4 flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm',
            importMessage.tone === 'error' ? 'border-danger/40 text-danger' : 'border-success/40',
          )}
        >
          <span>{importMessage.text}</span>
          <button onClick={() => setImportMessage(null)} aria-label="Dismiss" className="cursor-pointer text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mb-6 max-w-xl">
        <PartPicker onSelect={(p) => add(p.id)} excludeIds={items.map((i) => i.partId)} />
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <ListChecks className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">Your parts list is empty</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Add parts above, import a CSV with <span className="font-mono">MPN</span> and <span className="font-mono">Quantity</span> columns, or start from an example.
            </p>
            <Button variant="outline" size="sm" onClick={() => replace(EXAMPLE_PROJECT)}>
              Load example: solar weather station
            </Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat label="Cheapest total (mixed vendors)" value={fmt(mixedTotal)} sub={`${pricing.lines.length - pricing.unfillableCount} of ${pricing.lines.length} parts available`} />
            <Stat
              label="Best single vendor"
              value={bestSingleVendor ? fmt(bestSingleVendor.total) : '—'}
              sub={bestSingleVendor ? vendorName(bestSingleVendor.vendorId) : 'No vendor has every part in stock'}
            />
            <Stat
              label="Saved by splitting the order"
              value={bestSingleVendor ? fmt(Math.max(0, savings)) : '—'}
              sub={bestSingleVendor ? 'vs buying everything from one vendor' : undefined}
              tone={savings > 0 ? 'success' : undefined}
            />
          </div>

          {pricing.unfillableCount > 0 && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-warning/50 px-4 py-3 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
              {pricing.unfillableCount} part{pricing.unfillableCount === 1 ? '' : 's'} can't be bought at the quantity you need right now. They're left out of the totals.
            </div>
          )}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Parts</CardTitle>
              <CardDescription>
                Each line uses its cheapest in-stock vendor{preferredVendors.length ? ' from your preferred vendors' : ''}, with bulk pricing and minimum orders applied. Excludes
                shipping and GST.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs whitespace-nowrap text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Part &amp; best vendor</th>
                      <th className="py-2 pr-3 font-medium">Qty</th>
                      <th className="py-2 pr-3 text-right font-medium">Line total</th>
                      <th className="py-2 font-medium">
                        <span className="sr-only">Remove</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pricing.lines.map((line) => (
                      <BomRow
                        key={line.part.id}
                        line={line}
                        vendorName={vendorName}
                        fmt={fmt}
                        onQty={(q) => setQuantity(line.part.id, q)}
                        onRemove={() => remove(line.part.id)}
                      />
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t font-semibold">
                      <td colSpan={2} className="py-3 pr-3 text-right">
                        Total
                      </td>
                      <td className="py-3 pr-3 text-right tabular-nums">{fmt(mixedTotal)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Buying from one vendor</CardTitle>
              <CardDescription>Fewer orders means less shipping. Here's what each vendor can supply.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {pricing.vendorTotals.map((v) => {
                  const complete = v.missingPartIds.length === 0
                  return (
                    <li key={v.vendorId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-medium">
                          {vendorName(v.vendorId)}
                          {v.vendorId === bestSingleVendor?.vendorId && <Badge variant="success">Best single vendor</Badge>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {complete
                            ? `Has all ${v.coveredLines} parts`
                            : `Has ${v.coveredLines} of ${pricing.lines.length}. Missing: ${v.missingPartIds
                                .map((id) => pricing.lines.find((l) => l.part.id === id)?.part.name ?? id)
                                .join(', ')}`}
                        </p>
                      </div>
                      <p className="text-sm font-semibold tabular-nums">
                        {fmt(v.total)}
                        {!complete && <span className="ml-1 text-xs font-normal text-muted-foreground">(partial)</span>}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </>
  )
}

interface BomRowProps {
  line: BomLine
  vendorName: (id: string) => string
  fmt: (amount: number) => string
  onQty: (q: number) => void
  onRemove: () => void
}

function BomRow({ line, vendorName, fmt, onQty, onRemove }: BomRowProps) {
  const { part, quantity, best, fillable } = line
  return (
    <tr className={cn(!fillable && 'text-muted-foreground')}>
      <td className="py-3 pr-3">
        <div className="flex items-start gap-3">
          <PartImage part={part} className="mt-0.5 hidden h-10 w-10 sm:flex" />
          <div className="min-w-0">
            <Link to={`/parts/${part.id}`} className="font-medium wrap-anywhere text-foreground hover:underline">
              {part.name}
            </Link>
            <p className="text-xs text-muted-foreground">
              {part.mpn} ·{' '}
              {fillable && best ? (
                <span className="text-foreground">{vendorName(best.offer.vendorId)}</span>
              ) : (
                <span className="text-danger">Not enough stock anywhere</span>
              )}
            </p>
            {fillable && best && best.billableQty > quantity && (
              <p className="text-xs text-warning">Min. order {best.billableQty}, billed for {best.billableQty}</p>
            )}
          </div>
        </div>
      </td>
      <td className="py-3 pr-3 align-top">
        <QtyInput value={quantity} onCommit={onQty} label={`Quantity of ${part.name}`} />
      </td>
      <td className="py-3 pr-3 text-right align-top whitespace-nowrap tabular-nums">
        {fillable && best ? (
          <>
            <span className="font-medium text-foreground">{fmt(best.displayTotal)}</span>
            <span className="block text-xs text-muted-foreground">
              {best.billableQty} × {fmt(best.displayUnitPrice)}
            </span>
          </>
        ) : (
          '—'
        )}
      </td>
      <td className="py-3 text-right align-top">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRemove} aria-label={`Remove ${part.name}`}>
          <X className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  )
}

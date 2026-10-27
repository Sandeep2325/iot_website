import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { CatalogData } from '../../shared/catalog'
import { generateMarketData } from '../../shared/data/generate'
import { seedParts, trendingPartIds } from '../../shared/data/parts'
import { categories, vendors } from '../../shared/data/vendors'
import type { Category, Currency, Offer, OfferSource, Part, PriceBreak, PriceSnapshot, Vendor } from '../../shared/types'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS parts (
  id TEXT PRIMARY KEY,
  mpn TEXT NOT NULL,
  name TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  specs TEXT NOT NULL,            -- JSON object
  image TEXT,                     -- JSON PartImage
  datasheet_url TEXT
);
CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  currency TEXT NOT NULL,
  website TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS offers (
  id TEXT PRIMARY KEY,
  part_id TEXT NOT NULL REFERENCES parts(id),
  vendor_id TEXT NOT NULL REFERENCES vendors(id),
  vendor_sku TEXT NOT NULL,
  product_url TEXT NOT NULL,
  stock INTEGER NOT NULL,
  moq INTEGER NOT NULL,
  currency TEXT NOT NULL,
  price_breaks TEXT NOT NULL,     -- JSON array of { qty, unitPrice }
  updated_at TEXT NOT NULL,
  source TEXT NOT NULL            -- 'live' | 'sample'
);
CREATE INDEX IF NOT EXISTS offers_part ON offers(part_id);
CREATE TABLE IF NOT EXISTS price_snapshots (
  part_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  date TEXT NOT NULL,             -- YYYY-MM-DD
  unit_price REAL NOT NULL,       -- single-unit price
  currency TEXT NOT NULL,
  source TEXT NOT NULL,
  PRIMARY KEY (part_id, vendor_id, date)
);
CREATE TABLE IF NOT EXISTS refresh_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  parts_checked INTEGER NOT NULL DEFAULT 0,
  live_offers INTEGER NOT NULL DEFAULT 0,
  errors TEXT NOT NULL DEFAULT '[]'   -- JSON array of strings
);
CREATE TABLE IF NOT EXISTS provider_runs (
  provider_id TEXT PRIMARY KEY,
  last_success_at TEXT NOT NULL
);
`

export interface RefreshRun {
  id: number
  startedAt: string
  finishedAt: string | null
  partsChecked: number
  liveOffers: number
  errors: string[]
}

type Row = Record<string, string | number | null>

/** SQLite storage for the catalog, current offers and daily price snapshots. */
export class Database {
  readonly db: DatabaseSync

  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
    this.db = new DatabaseSync(path)
    this.db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;')
    this.db.exec(SCHEMA)
    this.migrate()
  }

  /** Upgrades databases created by older versions. */
  private migrate() {
    const columns = (this.db.prepare('PRAGMA table_info(parts)').all() as Row[]).map((c) => c.name)
    if (!columns.includes('image')) this.db.exec('ALTER TABLE parts ADD COLUMN image TEXT')
  }

  /** Copies the seed catalog's photos (and their credits) onto existing parts, so new photos show up without a reseed. */
  syncSeedImages() {
    const update = this.db.prepare('UPDATE parts SET image = ? WHERE id = ?')
    this.transaction(() => {
      for (const p of seedParts) update.run(p.image ? JSON.stringify(p.image) : null, p.id)
    })
  }

  close() {
    this.db.close()
  }

  private transaction(fn: () => void) {
    this.db.exec('BEGIN')
    try {
      fn()
      this.db.exec('COMMIT')
    } catch (err) {
      this.db.exec('ROLLBACK')
      throw err
    }
  }

  /** First start: load the catalog plus generated sample offers and 90 days of sample history. */
  seedIfEmpty(): boolean {
    const { n } = this.db.prepare('SELECT COUNT(*) AS n FROM parts').get() as { n: number }
    if (n > 0) return false
    const { offers, history } = generateMarketData(seedParts)
    this.transaction(() => {
      const insVendor = this.db.prepare('INSERT INTO vendors VALUES (?, ?, ?, ?, ?)')
      for (const v of vendors) insVendor.run(v.id, v.name, v.region, v.currency, v.website)
      const insCat = this.db.prepare('INSERT INTO categories VALUES (?, ?)')
      for (const c of categories) insCat.run(c.id, c.name)
      const insPart = this.db.prepare(
        'INSERT INTO parts (id, mpn, name, manufacturer, category, description, specs, image, datasheet_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      for (const p of seedParts) {
        insPart.run(p.id, p.mpn, p.name, p.manufacturer, p.category, p.description, JSON.stringify(p.specs), p.image ? JSON.stringify(p.image) : null, p.datasheetUrl ?? null)
      }
      for (const o of offers) this.insertOffer(o)
      const insSnap = this.db.prepare('INSERT INTO price_snapshots VALUES (?, ?, ?, ?, ?, ?)')
      for (const s of history) insSnap.run(s.partId, s.vendorId, s.date, s.unitPrice, s.currency, 'sample')
    })
    return true
  }

  private insertOffer(o: Offer) {
    this.db
      .prepare('INSERT INTO offers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(o.id, o.partId, o.vendorId, o.vendorSku, o.productUrl, o.stock, o.moq, o.currency, JSON.stringify(o.priceBreaks), o.updatedAt, o.source)
  }

  parts(): Part[] {
    return (this.db.prepare('SELECT * FROM parts ORDER BY id').all() as Row[]).map((r) => ({
      id: String(r.id),
      mpn: String(r.mpn),
      name: String(r.name),
      manufacturer: String(r.manufacturer),
      category: String(r.category) as Part['category'],
      description: String(r.description),
      specs: JSON.parse(String(r.specs)),
      image: r.image == null ? undefined : JSON.parse(String(r.image)),
      datasheetUrl: r.datasheet_url == null ? undefined : String(r.datasheet_url),
    }))
  }

  vendors(): Vendor[] {
    return this.db.prepare('SELECT * FROM vendors ORDER BY rowid').all() as unknown as Vendor[]
  }

  categories(): Category[] {
    return this.db.prepare('SELECT * FROM categories ORDER BY rowid').all() as unknown as Category[]
  }

  offers(): Offer[] {
    return (this.db.prepare('SELECT * FROM offers').all() as Row[]).map((r) => ({
      id: String(r.id),
      partId: String(r.part_id),
      vendorId: String(r.vendor_id),
      vendorSku: String(r.vendor_sku),
      productUrl: String(r.product_url),
      stock: Number(r.stock),
      moq: Number(r.moq),
      currency: String(r.currency) as Currency,
      priceBreaks: JSON.parse(String(r.price_breaks)) as PriceBreak[],
      updatedAt: String(r.updated_at),
      source: String(r.source) as OfferSource,
    }))
  }

  history(): PriceSnapshot[] {
    return (this.db.prepare('SELECT * FROM price_snapshots').all() as Row[]).map((r) => ({
      partId: String(r.part_id),
      vendorId: String(r.vendor_id),
      date: String(r.date),
      unitPrice: Number(r.unit_price),
      currency: String(r.currency) as Currency,
    }))
  }

  catalogData(): CatalogData {
    return { parts: this.parts(), vendors: this.vendors(), offers: this.offers(), history: this.history(), trendingPartIds }
  }

  /**
   * Replaces one vendor's offers for a part with fresh live results (possibly none, meaning the vendor
   * doesn't stock it). The first time a vendor goes live for a part, its sample history is dropped so
   * charts never mix made-up and real prices.
   */
  replaceLiveOffers(partId: string, vendorId: string, offers: Offer[]) {
    this.transaction(() => {
      this.db.prepare('DELETE FROM offers WHERE part_id = ? AND vendor_id = ?').run(partId, vendorId)
      this.db.prepare("DELETE FROM price_snapshots WHERE part_id = ? AND vendor_id = ? AND source = 'sample'").run(partId, vendorId)
      for (const o of offers) this.insertOffer(o)
    })
  }

  /** Records today's single-unit price for every current offer (one row per part, vendor and day). */
  snapshotOffers(date: string) {
    this.transaction(() => {
      const upsert = this.db.prepare(
        `INSERT INTO price_snapshots VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (part_id, vendor_id, date) DO UPDATE SET unit_price = excluded.unit_price, currency = excluded.currency, source = excluded.source`,
      )
      // Several offers from one vendor (e.g. different packaging): keep the cheapest single-unit price.
      const best = new Map<string, Offer>()
      for (const o of this.offers()) {
        const key = `${o.partId}|${o.vendorId}`
        const current = best.get(key)
        if (!current || o.priceBreaks[0].unitPrice < current.priceBreaks[0].unitPrice) best.set(key, o)
      }
      for (const o of best.values()) upsert.run(o.partId, o.vendorId, date, o.priceBreaks[0].unitPrice, o.currency, o.source)
    })
  }

  providerLastSuccess(providerId: string): Date | null {
    const r = this.db.prepare('SELECT last_success_at FROM provider_runs WHERE provider_id = ?').get(providerId) as Row | undefined
    return r ? new Date(String(r.last_success_at)) : null
  }

  setProviderSuccess(providerId: string, at: Date) {
    this.db
      .prepare('INSERT INTO provider_runs VALUES (?, ?) ON CONFLICT (provider_id) DO UPDATE SET last_success_at = excluded.last_success_at')
      .run(providerId, at.toISOString())
  }

  startRefreshRun(): number {
    const res = this.db.prepare('INSERT INTO refresh_runs (started_at) VALUES (?)').run(new Date().toISOString())
    return Number(res.lastInsertRowid)
  }

  finishRefreshRun(id: number, partsChecked: number, liveOffers: number, errors: string[]) {
    this.db
      .prepare('UPDATE refresh_runs SET finished_at = ?, parts_checked = ?, live_offers = ?, errors = ? WHERE id = ?')
      .run(new Date().toISOString(), partsChecked, liveOffers, JSON.stringify(errors.slice(0, 50)), id)
  }

  lastRefreshRun(): RefreshRun | null {
    const r = this.db.prepare('SELECT * FROM refresh_runs WHERE finished_at IS NOT NULL ORDER BY id DESC LIMIT 1').get() as Row | undefined
    if (!r) return null
    return {
      id: Number(r.id),
      startedAt: String(r.started_at),
      finishedAt: r.finished_at == null ? null : String(r.finished_at),
      partsChecked: Number(r.parts_checked),
      liveOffers: Number(r.live_offers),
      errors: JSON.parse(String(r.errors)),
    }
  }
}

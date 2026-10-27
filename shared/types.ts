export type Currency = 'INR' | 'USD'

export type CategoryId =
  | 'microcontrollers'
  | 'sensors'
  | 'communication'
  | 'power'
  | 'displays'
  | 'motors'

export interface Category {
  id: CategoryId
  name: string
}

export interface Vendor {
  id: string
  name: string
  region: 'IN' | 'GLOBAL'
  currency: Currency
  website: string
}

export interface Part {
  id: string
  mpn: string
  name: string
  manufacturer: string
  category: CategoryId
  description: string
  specs: Record<string, string>
  image?: PartImage
  datasheetUrl?: string
}

/** A product photo. Freely licensed photos carry the credit their licence requires. */
export interface PartImage {
  /** Path or URL of the photo, e.g. "/images/parts/dht22.jpg". */
  src: string
  credit?: {
    author: string
    license: string
    licenseUrl?: string
    /** Page the photo came from (e.g. its Wikimedia Commons file page). */
    sourceUrl: string
  }
}

export interface PriceBreak {
  qty: number
  unitPrice: number
}

export interface Offer {
  id: string
  partId: string
  vendorId: string
  vendorSku: string
  productUrl: string
  stock: number
  moq: number
  currency: Currency
  priceBreaks: PriceBreak[]
  updatedAt: string
  /** "live" came from a vendor API; "sample" is generated demo data (no API, or no key configured). */
  source: OfferSource
}

export type OfferSource = 'live' | 'sample'

export interface PriceSnapshot {
  partId: string
  vendorId: string
  unitPrice: number
  currency: Currency
  date: string
}

/** A part as returned by the search endpoint: summary info plus its cheapest current offer. */
export interface PartSummary extends Part {
  lowestPrice: number | null
  lowestPriceCurrency: Currency
  offerCount: number
  totalStock: number
}

export interface PartDetail extends Part {
  offers: Offer[]
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export type PartSort = 'relevance' | 'price-asc' | 'price-desc' | 'stock' | 'name'

export interface PartQuery {
  q?: string
  category?: CategoryId
  vendor?: string
  /** Comma-separated vendor ids to price from (the user's preferred vendors). Ignored when `vendor` is set. */
  vendors?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  sort?: PartSort
  page?: number
  pageSize?: number
}

export interface PriceMover {
  part: PartSummary
  /** Lowest price 7 days ago vs today, in INR. */
  previousPrice: number
  currentPrice: number
  changePct: number
}

export interface DashboardSummary {
  partCount: number
  vendorCount: number
  offerCount: number
  biggestDrops: PriceMover[]
  biggestRises: PriceMover[]
  trending: PartSummary[]
}

export interface PriceIndexPoint {
  date: string
  /** 100 = average price on the first day of the window. */
  index: number
}

/** GET /api/health: where prices come from right now. */
export interface ApiHealth {
  ok: boolean
  /** "mock" = in-browser demo API; "server" = the real backend. */
  mode: 'mock' | 'server'
  providers: { id: string; vendors: string[] }[]
  lastRefresh: { finishedAt: string | null; liveOffers: number; errors: string[] } | null
}

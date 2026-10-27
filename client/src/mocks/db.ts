import { createCatalog } from '@shared/catalog'
import { generateMarketData } from '@shared/data/generate'
import { seedParts, trendingPartIds } from '@shared/data/parts'
import { vendors } from '@shared/data/vendors'

/** In-browser catalog over generated sample prices, answering the same queries as the real server. */
export const catalog = createCatalog({ parts: seedParts, vendors, trendingPartIds, ...generateMarketData(seedParts) })

export const { searchParts, getPart, resolvePartRefs, getPriceHistory, getDashboardSummary, getPriceIndex } = catalog

import type { Config } from '../config'
import { digikeyProvider } from './digikey'
import { mouserProvider } from './mouser'
import { nexarProvider } from './nexar'
import type { PriceProvider } from './types'

/** Vendors Nexar can fill in when they have no direct API key. Indian stores have no API at all. */
const NEXAR_VENDORS = ['digikey', 'mouser', 'lcsc']

/** Providers for every vendor key in the config. Direct vendor APIs take priority over Nexar. */
export function createProviders(config: Config): PriceProvider[] {
  const { country, currency } = config
  const providers: PriceProvider[] = []
  if (config.digikey) providers.push(digikeyProvider({ ...config.digikey, country, currency }))
  if (config.mouser) providers.push(mouserProvider(config.mouser))

  if (config.nexar) {
    const covered = new Set(providers.flatMap((p) => p.vendorIds))
    const vendorIds = NEXAR_VENDORS.filter((v) => !covered.has(v))
    if (vendorIds.length) providers.push(nexarProvider({ ...config.nexar, country, currency, vendorIds }))
  }
  return providers
}

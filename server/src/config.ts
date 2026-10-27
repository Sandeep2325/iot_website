import type { Currency } from '../../shared/types'

/** Server settings, read from environment variables (see .env.example). */
export interface Config {
  port: number
  dbPath: string
  country: string
  currency: Currency
  refreshCron: string
  adminToken: string | null
  digikey: { clientId: string; clientSecret: string } | null
  mouser: { apiKey: string } | null
  nexar: { clientId: string; clientSecret: string } | null
}

const str = (env: NodeJS.ProcessEnv, key: string) => env[key]?.trim() || null

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const currency = (str(env, 'CURRENCY') ?? 'INR').toUpperCase()
  if (currency !== 'INR' && currency !== 'USD') throw new Error(`CURRENCY must be INR or USD, got "${currency}"`)

  const digikeyId = str(env, 'DIGIKEY_CLIENT_ID')
  const digikeySecret = str(env, 'DIGIKEY_CLIENT_SECRET')
  const nexarId = str(env, 'NEXAR_CLIENT_ID')
  const nexarSecret = str(env, 'NEXAR_CLIENT_SECRET')
  const mouserKey = str(env, 'MOUSER_API_KEY')

  return {
    port: Number(str(env, 'PORT') ?? 8787),
    dbPath: str(env, 'DB_PATH') ?? 'data/partscout.db',
    country: (str(env, 'COUNTRY') ?? 'IN').toUpperCase(),
    currency,
    refreshCron: str(env, 'REFRESH_CRON') ?? '0 6 * * *',
    adminToken: str(env, 'ADMIN_TOKEN'),
    digikey: digikeyId && digikeySecret ? { clientId: digikeyId, clientSecret: digikeySecret } : null,
    mouser: mouserKey ? { apiKey: mouserKey } : null,
    nexar: nexarId && nexarSecret ? { clientId: nexarId, clientSecret: nexarSecret } : null,
  }
}

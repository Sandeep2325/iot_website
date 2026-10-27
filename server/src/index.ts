import cron from 'node-cron'
import { createApp } from './app'
import { loadConfig } from './config'
import { Database } from './db'
import { createProviders } from './providers'
import { refreshPrices } from './refresh'
import { Store } from './store'

const config = loadConfig()
const db = new Database(config.dbPath)
if (db.seedIfEmpty()) console.log(`Created ${config.dbPath} with the catalog and sample prices`)
db.syncSeedImages()

const store = new Store(db)
const providers = createProviders(config)
const log = (msg: string) => console.log(`[refresh] ${msg}`)
const refresh = (force = false) => refreshPrices(store, providers, { force, log })

if (providers.length) {
  console.log(`Live prices from: ${providers.map((p) => `${p.id} (${p.vendorIds.join(', ')})`).join('; ')}`)
} else {
  console.log('No vendor API keys set: serving sample prices. Add keys to server/.env for live prices.')
}

// Daily refresh. Each provider also skips itself if it ran recently (see refreshEveryHours).
cron.schedule(config.refreshCron, () => {
  refresh().then((r) => log(`done: ${r.liveOffers} live offers, ${r.errors.length} error(s)`)).catch((err) => console.error('[refresh] failed', err))
})

const app = createApp({ store, providers, adminToken: config.adminToken, refresh: () => refresh(true) })
const server = app.listen(config.port, () => {
  console.log(`PartScout API on http://localhost:${config.port}/api`)
  // Catch up on start if any provider is due (e.g. the server was off at the scheduled time).
  if (providers.length) refresh().catch((err) => console.error('[refresh] failed', err))
})

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close()
    db.close()
    process.exit(0)
  })
}

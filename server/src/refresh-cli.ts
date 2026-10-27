// `npm run refresh`: fetch live prices now, ignoring the usual schedule. Prints a summary.
import { loadConfig } from './config'
import { Database } from './db'
import { createProviders } from './providers'
import { refreshPrices } from './refresh'
import { Store } from './store'

const config = loadConfig()
const providers = createProviders(config)
if (!providers.length) {
  console.log('No vendor API keys in server/.env, so there is nothing to refresh. See .env.example.')
  process.exit(0)
}

const db = new Database(config.dbPath)
db.seedIfEmpty()
const result = await refreshPrices(new Store(db), providers, { force: true, log: console.log })
console.log(`Checked ${result.partsChecked} part lookups, saved ${result.liveOffers} live offers.`)
for (const e of result.errors) console.log(`  ! ${e}`)
db.close()

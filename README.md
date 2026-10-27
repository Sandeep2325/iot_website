# PartScout

Compare prices for IoT and electronics parts across Indian stores (Robu.in, Robocraze, Evelta) and global distributors (DigiKey, Mouser, LCSC). Search parts, compare them, price a whole parts list (BOM), and watch for price drops. Prices are shown in rupees by default.

```
client/   React app (Vite + TypeScript + Tailwind)
server/   API server (Express + SQLite) that fetches live prices from vendor APIs
shared/   Types, the part catalog and search/pricing logic used by both
```

## Run it

Needs Node 24 or newer.

**Demo mode** (no server, sample prices generated in the browser):

```bash
npm --prefix client install
npm --prefix client run dev
```

Open http://localhost:5173.

**With the real server:**

```bash
npm --prefix server install
npm --prefix server run dev
```

Then, in a second terminal:

```bash
npm --prefix client run dev:live
```

The server starts on http://localhost:8787 and creates `server/data/partscout.db` with the catalog and sample prices on first run. `dev:live` points the app at it.

## Live prices

Without any API keys the server serves sample prices, and every offer is marked **Sample price** in the app. Add keys to `server/.env` (copy `server/.env.example`) to switch a vendor to live prices:

| Vendor | Key | Where to get it |
| --- | --- | --- |
| DigiKey | `DIGIKEY_CLIENT_ID`, `DIGIKEY_CLIENT_SECRET` | developer.digikey.com — create an app with Product Information v4 |
| Mouser | `MOUSER_API_KEY` | mouser.in/api-search — Search API key |
| LCSC (and DigiKey/Mouser if you have no direct key) | `NEXAR_CLIENT_ID`, `NEXAR_CLIENT_SECRET` | portal.nexar.com — Supply app |

Then fetch prices right away:

```bash
npm --prefix server run refresh
```

After that the server refreshes daily at 06:00 (`REFRESH_CRON`). Things to know:

- **Indian stores have no public API**, so Robu.in, Robocraze and Evelta stay on sample prices.
- **Parts are matched by exact manufacturer part number.** Branded boards and chips (ESP32 DevKits, Raspberry Pi, Arduino, Bosch/TI/Sensirion sensors) are found. Generic modules like "HC-SR04" usually aren't stocked by distributors; their sample offer for that vendor is removed rather than kept as a fake price.
- **Rate limits are respected:** Mouser allows 30 calls/minute and 1,000/day. Nexar's free plan has a small monthly quota, so Nexar refreshes weekly by default.
- **Price history:** when a vendor goes live for a part, its sample history is deleted, so charts never mix sample and real prices. Real history builds up from one snapshot per day.
- **Manual refresh endpoint:** set `ADMIN_TOKEN` to enable `POST /api/admin/refresh` with `Authorization: Bearer <token>`.

## Tests

```bash
npm --prefix client test
npm --prefix server test
```

import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Part } from '../../../shared/types'
import { parseDigiKey, type DigiKeySearchResponse } from './digikey'
import { cleanBreaks, parsePrice, sameMpn } from './http'
import { mouserProvider, parseMouser, type MouserSearchResponse } from './mouser'
import { parseNexar, type NexarResponse } from './nexar'

describe('parsePrice', () => {
  it.each([
    ['₹1,234.50', 1234.5],
    ['$0.35', 0.35],
    ['₹12,500', 12500],
    ['1.234,50 €', 1234.5],
    ['0,35 €', 0.35],
    ['1,234,567', 1234567],
    ['', null],
    ['n/a', null],
  ])('%s → %s', (text, expected) => {
    expect(parsePrice(text)).toBe(expected)
  })
})

describe('helpers', () => {
  it('matches MPNs ignoring case and punctuation', () => {
    expect(sameMpn('ESP32-DEVKITC-32E', 'esp32-DevKitC-32E')).toBe(true)
    expect(sameMpn('SC0918', 'SC0919')).toBe(false)
  })

  it('cleans price breaks: sorted, unique, positive', () => {
    expect(
      cleanBreaks([
        { qty: 10, unitPrice: 9 },
        { qty: 1, unitPrice: 10 },
        { qty: 10, unitPrice: 8 },
        { qty: 0, unitPrice: 5 },
        { qty: 100, unitPrice: 0 },
      ]),
    ).toEqual([
      { qty: 1, unitPrice: 10 },
      { qty: 10, unitPrice: 9 },
    ])
  })
})

describe('parseDigiKey', () => {
  const response: DigiKeySearchResponse = {
    SearchLocaleUsed: { Currency: 'INR' },
    Products: [
      {
        ManufacturerProductNumber: 'SC0918',
        ProductUrl: 'https://www.digikey.in/en/products/detail/raspberry-pi/SC0918/16608263',
        QuantityAvailable: 900,
        ProductVariations: [
          { DigiKeyProductNumber: '2648-SC0918-REEL', MinimumOrderQuantity: 500, StandardPricing: [{ BreakQuantity: 500, UnitPrice: 520 }] },
          {
            DigiKeyProductNumber: '2648-SC0918-ND',
            MinimumOrderQuantity: 1,
            QuantityAvailableforPackageType: 812,
            StandardPricing: [
              { BreakQuantity: 1, UnitPrice: 598.4 },
              { BreakQuantity: 10, UnitPrice: 571.2 },
            ],
          },
        ],
      },
      { ManufacturerProductNumber: 'SC0918-KIT', ProductVariations: [{ DigiKeyProductNumber: 'X', StandardPricing: [{ BreakQuantity: 1, UnitPrice: 1 }] }] },
    ],
  }

  it('picks the exact MPN and its smallest-MOQ packaging', () => {
    expect(parseDigiKey(response, 'SC0918', 'INR')).toEqual([
      {
        vendorId: 'digikey',
        vendorSku: '2648-SC0918-ND',
        productUrl: 'https://www.digikey.in/en/products/detail/raspberry-pi/SC0918/16608263',
        stock: 812,
        moq: 1,
        currency: 'INR',
        priceBreaks: [
          { qty: 1, unitPrice: 598.4 },
          { qty: 10, unitPrice: 571.2 },
        ],
      },
    ])
  })

  it('ignores currencies the app does not support', () => {
    expect(parseDigiKey({ ...response, SearchLocaleUsed: { Currency: 'EUR' } }, 'SC0918', 'INR')).toEqual([])
  })

  it('returns nothing for an empty response', () => {
    expect(parseDigiKey({}, 'SC0918', 'INR')).toEqual([])
  })
})

describe('parseMouser', () => {
  const response: MouserSearchResponse = {
    Errors: [],
    SearchResults: {
      Parts: [
        {
          ManufacturerPartNumber: 'ESP32-DevKitC-32E',
          MouserPartNumber: '356-ESP32-DEVKITC32E',
          ProductDetailUrl: 'https://www.mouser.in/ProductDetail/356-ESP32-DEVKITC32E',
          Availability: '1,234 In Stock',
          AvailabilityInStock: null,
          Min: '1',
          PriceBreaks: [
            { Quantity: 1, Price: '₹874.39', Currency: 'INR' },
            { Quantity: 10, Price: '₹1,810.00', Currency: 'INR' },
          ],
        },
      ],
    },
  }

  it('parses text prices and stock', () => {
    const [offer] = parseMouser(response, 'ESP32-DevKitC-32E')
    expect(offer).toMatchObject({ vendorId: 'mouser', vendorSku: '356-ESP32-DEVKITC32E', stock: 1234, moq: 1, currency: 'INR' })
    expect(offer.priceBreaks).toEqual([
      { qty: 1, unitPrice: 874.39 },
      { qty: 10, unitPrice: 1810 },
    ])
  })

  it('throws on API errors (e.g. invalid key)', () => {
    expect(() => parseMouser({ Errors: [{ Code: 'Invalid', Message: 'Invalid unique identifier.' }] }, 'X')).toThrow(/Invalid unique identifier/)
  })

  it('sends an exact part-number search with the key in the URL', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(response), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const offers = await mouserProvider({ apiKey: 'k e y' }).fetchOffers({ mpn: 'ESP32-DevKitC-32E' } as Part)
    expect(offers).toHaveLength(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.mouser.com/api/v1/search/partnumber?apiKey=k%20e%20y')
    expect(JSON.parse(String(init.body))).toEqual({ SearchByPartRequest: { mouserPartNumber: 'ESP32-DevKitC-32E', partSearchOptions: 'Exact' } })
  })
})

describe('parseNexar', () => {
  const response: NexarResponse = {
    data: {
      supSearchMpn: {
        results: [
          {
            part: {
              mpn: 'AM2302',
              sellers: [
                {
                  company: { name: 'LCSC' },
                  offers: [
                    {
                      sku: 'C2913946',
                      clickUrl: 'https://octopart.com/click/lcsc',
                      inventoryLevel: 4200,
                      moq: 1,
                      prices: [
                        { quantity: 1, price: 2.9, currency: 'USD' },
                        { quantity: 10, price: 2.6, currency: 'USD' },
                      ],
                    },
                  ],
                },
                {
                  company: { name: 'Mouser' },
                  offers: [{ sku: 'M-1', inventoryLevel: 10, prices: [{ quantity: 1, price: 4, currency: 'EUR', convertedPrice: 360, convertedCurrency: 'INR' }] }],
                },
                { company: { name: 'Some Broker' }, offers: [{ sku: 'B', prices: [{ quantity: 1, price: 1, currency: 'USD' }] }] },
              ],
            },
          },
        ],
      },
    },
  }

  it('maps known sellers and uses converted prices for other currencies', () => {
    const offers = parseNexar(response, 'AM2302', ['lcsc', 'mouser'])
    expect(offers.map((o) => [o.vendorId, o.currency, o.priceBreaks[0].unitPrice])).toEqual([
      ['lcsc', 'USD', 2.9],
      ['mouser', 'INR', 360],
    ])
  })

  it('only returns vendors this provider is responsible for', () => {
    expect(parseNexar(response, 'AM2302', ['lcsc']).map((o) => o.vendorId)).toEqual(['lcsc'])
  })

  it('throws on GraphQL errors', () => {
    expect(() => parseNexar({ errors: [{ message: 'Not authorized' }] }, 'X', ['lcsc'])).toThrow(/Not authorized/)
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

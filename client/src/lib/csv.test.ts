import { describe, expect, it } from 'vitest'
import { parseBomCsv, parseCsv, toCsv } from './csv'

describe('parseCsv', () => {
  it('handles quotes, escaped quotes, commas and CRLF', () => {
    const text = 'name,note\r\n"ESP32, DevKit","say ""hi"""\r\nDHT22,plain\r\n'
    expect(parseCsv(text)).toEqual([
      ['name', 'note'],
      ['ESP32, DevKit', 'say "hi"'],
      ['DHT22', 'plain'],
    ])
  })

  it('skips blank lines and keeps a last line without a newline', () => {
    expect(parseCsv('a,b\n\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })
})

describe('toCsv', () => {
  it('round-trips through parseCsv', () => {
    const rows = [['MPN', 'Name'], ['AM2302', 'DHT22 "Temp", Humidity']]
    expect(parseCsv(toCsv(rows))).toEqual(rows)
  })
})

describe('parseBomCsv', () => {
  it('reads MPN and quantity columns in any order and case', () => {
    const { rows, error } = parseBomCsv('﻿Qty,Description,MPN\n3,sensor,AM2302\n1,board, SC0918 \n')
    expect(error).toBeUndefined()
    expect(rows).toEqual([
      { ref: 'AM2302', quantity: 3 },
      { ref: 'SC0918', quantity: 1 },
    ])
  })

  it('defaults bad or missing quantities to 1', () => {
    expect(parseBomCsv('mpn,qty\nA,abc\nB,0\nC,').rows.map((r) => r.quantity)).toEqual([1, 1, 1])
    expect(parseBomCsv('part id\nesp32-devkitc').rows).toEqual([{ ref: 'esp32-devkitc', quantity: 1 }])
  })

  it('reports a missing part-number column', () => {
    expect(parseBomCsv('name,qty\nfoo,1').error).toMatch(/part-number column/)
  })
})

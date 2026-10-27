/** Minimal RFC 4180 CSV parser: quoted fields, escaped quotes ("") and CRLF/LF line endings. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += ch
    }
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  // Drop blank lines.
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

function escapeCell(value: string | number): string {
  const s = String(value)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map(escapeCell).join(',')).join('\r\n')
}

export interface ImportedBomRow {
  /** MPN or PartScout part id, as written in the file. */
  ref: string
  quantity: number
}

const REF_HEADERS = ['mpn', 'part number', 'part', 'part id', 'id', 'sku']
const QTY_HEADERS = ['quantity', 'qty', 'count']

/**
 * Reads a parts list CSV. Needs a header row with a part-number column (MPN or
 * part id) and optionally a quantity column (defaults to 1).
 */
export function parseBomCsv(text: string): { rows: ImportedBomRow[]; error?: string } {
  const table = parseCsv(text.replace(/^﻿/, ''))
  if (table.length < 2) return { rows: [], error: 'The file needs a header row and at least one part.' }

  const header = table[0].map((h) => h.trim().toLowerCase())
  const refCol = header.findIndex((h) => REF_HEADERS.includes(h))
  const qtyCol = header.findIndex((h) => QTY_HEADERS.includes(h))
  if (refCol === -1) return { rows: [], error: 'No part-number column found. Name a column "MPN" or "Part ID".' }

  const rows = table
    .slice(1)
    .map((r) => ({ ref: (r[refCol] ?? '').trim(), quantity: qtyCol === -1 ? 1 : Math.floor(Number(r[qtyCol])) }))
    .filter((r) => r.ref !== '')
    .map((r) => ({ ...r, quantity: Number.isFinite(r.quantity) && r.quantity > 0 ? r.quantity : 1 }))
  return { rows }
}

export function downloadTextFile(filename: string, contents: string, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([contents], { type: `${type};charset=utf-8` }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

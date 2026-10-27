import type { Currency } from './types'

/** Fixed USD→INR rate used to compare prices across vendors. Override on the server with USD_TO_INR. */
export const USD_TO_INR = 84

export function convert(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount
  return from === 'USD' ? amount * USD_TO_INR : amount / USD_TO_INR
}

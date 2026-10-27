import type { Currency } from '@/types'
import { convert } from '@shared/currency'

export { convert, USD_TO_INR } from '@shared/currency'

const formatters: Record<Currency, Intl.NumberFormat> = {
  INR: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }),
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }),
}

export function formatPrice(amount: number, from: Currency, display: Currency): string {
  return formatters[display].format(convert(amount, from, display))
}

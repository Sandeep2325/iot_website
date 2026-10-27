import { Badge } from '@/components/ui/badge'

export function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) return <Badge variant="danger">Out of stock</Badge>
  return <Badge variant="success">{stock.toLocaleString('en-IN')} in stock</Badge>
}

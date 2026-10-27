import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="text-5xl font-semibold text-muted-foreground" aria-hidden>
        404
      </p>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">This page doesn't exist.</p>
      <Link to="/">
        <Button variant="outline">Back to dashboard</Button>
      </Link>
    </div>
  )
}

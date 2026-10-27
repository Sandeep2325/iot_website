import { AlertTriangle } from 'lucide-react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

/** Shown when a page crashes while rendering, instead of React Router's default error screen. */
export function RouteError() {
  const error = useRouteError()
  useDocumentTitle('Something went wrong')
  const detail = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : String(error)

  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <AlertTriangle className="h-10 w-10 text-warning" aria-hidden />
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">This page hit an unexpected error. Your parts list and watchlist are safe.</p>
      <p className="max-w-full truncate rounded-md bg-muted px-3 py-1.5 font-mono text-xs text-muted-foreground">{detail}</p>
      <div className="flex gap-2">
        <Button onClick={() => window.location.reload()}>Reload page</Button>
        <Link to="/">
          <Button variant="outline">Go to dashboard</Button>
        </Link>
      </div>
    </div>
  )
}

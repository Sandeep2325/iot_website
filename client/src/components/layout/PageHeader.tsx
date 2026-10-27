import type { ReactNode } from 'react'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

/** Page heading; also sets the browser tab title to match. */
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  useDocumentTitle(title)
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  )
}

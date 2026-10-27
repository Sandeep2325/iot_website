import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from './PageHeader'

interface ComingSoonProps {
  title: string
  description: string
  phase: number
  features: string[]
}

/** Placeholder for pages built in later phases. */
export function ComingSoon({ title, description, phase, features }: ComingSoonProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="pt-5">
          <p className="text-sm font-medium">Coming in Phase {phase}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  )
}

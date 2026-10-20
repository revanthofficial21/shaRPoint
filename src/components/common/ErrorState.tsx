import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <Card className="border-destructive/30 bg-destructive/[0.03]">
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="ring-hairline grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
        </span>
        <p className="pt-1 text-base font-medium">{title}</p>
        {description && (
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
        {onRetry && (
          <Button variant="outline" className="mt-1" onClick={onRetry}>
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

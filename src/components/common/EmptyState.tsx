import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Empty states get an accent-tinted medallion rather than a bare grey icon —
 * an empty screen should look intentional, not unfinished.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <Card className="border-dashed bg-card/60">
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        {Icon && (
          <span className="ring-hairline grid h-14 w-14 place-items-center rounded-2xl bg-primary/10">
            <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
          </span>
        )}
        <p className="pt-1 text-base font-medium">{title}</p>
        {description && (
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
        {action && <div className="mt-1">{action}</div>}
      </CardContent>
    </Card>
  )
}

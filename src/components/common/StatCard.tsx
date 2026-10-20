import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type Tone = 'primary' | 'success' | 'warning' | 'destructive' | 'muted'

const TONES: Record<Tone, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/20 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  muted: 'bg-muted text-muted-foreground',
}

/**
 * One number per tile, with a tinted medallion so the figures are scannable
 * rather than a wall of identical cards. `tabular-nums` stops the digits
 * jittering as counts change.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = 'primary',
  isLoading,
}: {
  label: string
  value: number | string | undefined
  icon: LucideIcon
  hint?: string
  tone?: Tone
  isLoading?: boolean
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-start justify-between gap-3 pt-6">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-14" />
          ) : (
            <p className="text-3xl font-semibold tabular-nums tracking-tight">{value ?? 0}</p>
          )}
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>

        <span
          className={cn(
            'ring-hairline grid h-10 w-10 shrink-0 place-items-center rounded-xl',
            TONES[tone],
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  )
}

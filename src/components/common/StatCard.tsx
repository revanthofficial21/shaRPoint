import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * Tile hues are independent of the accent preset — a dashboard where every icon
 * wears the brand colour is unreadable. These are the six saturated tones from
 * the design reference.
 */
export type TileTone = 'blue' | 'violet' | 'green' | 'orange' | 'pink' | 'teal'

const TONES: Record<TileTone, string> = {
  blue: 'bg-tile-blue/15 text-tile-blue',
  violet: 'bg-tile-violet/15 text-tile-violet',
  green: 'bg-tile-green/15 text-tile-green',
  orange: 'bg-tile-orange/15 text-tile-orange',
  pink: 'bg-tile-pink/15 text-tile-pink',
  teal: 'bg-tile-teal/15 text-tile-teal',
}

/**
 * One figure per tile, with a saturated medallion so a row of statistics is
 * scannable at a glance. `tabular-nums` stops digits jittering as counts change.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = 'blue',
  isLoading,
}: {
  label: string
  value: number | string | undefined
  icon: LucideIcon
  hint?: string
  tone?: TileTone
  isLoading?: boolean
}) {
  return (
    <Card className="overflow-hidden transition-colors hover:border-primary/40">
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
            'ring-hairline grid h-11 w-11 shrink-0 place-items-center rounded-xl',
            TONES[tone],
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  )
}

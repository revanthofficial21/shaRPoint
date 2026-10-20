import { cn } from '@/lib/utils'

/**
 * A sweeping shimmer rather than a pulse — it reads as "loading" instead of
 * "something is broken", and it is a single background-position animation.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-shimmer rounded-lg bg-muted', className)}
      aria-hidden="true"
      {...props}
    />
  )
}

export { Skeleton }

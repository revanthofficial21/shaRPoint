import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CartoonAvatar } from './CartoonAvatar'
import { cn } from '@/lib/utils'

/**
 * The one place avatars are rendered.
 *
 * Prefers a real uploaded image; falls back to the generated cartoon face, so a
 * user who never uploads anything still looks like a person rather than a pair
 * of initials.
 */
export function UserAvatar({
  name,
  src,
  size = 40,
  className,
}: {
  name: string | null | undefined
  src?: string | null
  size?: number
  className?: string
}) {
  const label = name?.trim() || 'Member'

  return (
    <Avatar className={cn('shrink-0', className)} style={{ width: size, height: size }}>
      {src ? <AvatarImage src={src} alt={label} /> : null}
      <AvatarFallback className="bg-transparent p-0">
        <CartoonAvatar name={label} className="h-full w-full" title={`${label}'s avatar`} />
      </AvatarFallback>
    </Avatar>
  )
}

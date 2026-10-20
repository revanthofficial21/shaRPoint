import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/features/auth/auth-context'
import { relativeTime } from '@/lib/utils'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from './hooks'

export function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const notifications = useNotifications(20)
  const unread = useUnreadNotificationCount()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  // Realtime: a notification row for this user arriving anywhere in the app
  // updates the badge immediately.
  useEffect(() => {
    if (!user?.id) return
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
          queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, queryClient])

  const count = unread.data ?? 0

  function open(notificationId: string, link: string | null) {
    markRead.mutate(notificationId)
    if (link) navigate(link)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-sm font-medium">Notifications</p>
          {count > 0 && (
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAll.mutate()}
            >
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="my-0" />

        <div className="max-h-80 overflow-y-auto">
          {notifications.isLoading && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">Loading…</p>
          )}

          {!notifications.isLoading && (notifications.data ?? []).length === 0 && (
            <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
              <Inbox className="h-5 w-5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">You're all caught up.</p>
            </div>
          )}

          {(notifications.data ?? []).map((notification) => (
            <button
              key={notification.id}
              onClick={() => open(notification.id, notification.link)}
              className={
                notification.is_read
                  ? 'block w-full border-b px-3 py-2.5 text-left last:border-b-0 hover:bg-muted/60'
                  : 'block w-full border-b bg-primary/5 px-3 py-2.5 text-left last:border-b-0 hover:bg-muted/60'
              }
            >
              <div className="flex items-start gap-2">
                {!notification.is_read && (
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{notification.title}</p>
                  {notification.body && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{notification.body}</p>
                  )}
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {relativeTime(notification.created_at)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

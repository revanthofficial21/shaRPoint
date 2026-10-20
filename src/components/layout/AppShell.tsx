import { useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ChevronLeft, LogOut, Menu, Settings, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/features/auth/auth-context'
import { useSessionContext } from '@/features/profiles/hooks'
import { ROLE_LABEL } from '@/lib/permissions'
import { navForRole } from './nav-config'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn, initials } from '@/lib/utils'
import { NotificationBell } from '@/features/notifications/NotificationBell'
import { GlobalSearch } from '@/features/search/GlobalSearch'
import { ThemeToggle } from '@/components/common/ThemeToggle'

/**
 * Authenticated shell: collapsible sidebar, glass top bar, routed content.
 *
 * Navigation is derived from the user's roles, so the sidebar a teacher sees is
 * never the one a student sees.
 */
export function AppShell() {
  const { signOut } = useAuth()
  const { profile, roles } = useSessionContext()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const primaryRole = roles[0] ?? 'student'
  const items = useMemo(() => navForRole[primaryRole] ?? navForRole.student, [primaryRole])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Keyboard users can jump past the sidebar instead of tabbing through it. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/* ── sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border/60 bg-card transition-[width,transform] duration-200',
          collapsed ? 'w-[68px]' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border/60 px-4">
          <Link to="/" className="flex items-center gap-2 overflow-hidden">
            <span className="bg-brand-gradient shadow-brand grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-bold text-primary-foreground">
              S
            </span>
            {!collapsed && <span className="truncate font-semibold tracking-tight">SHARPOINT</span>}
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/app' || item.to === '/teacher' || item.to === '/admin'}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-gradient text-primary-foreground shadow-brand'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 border-t border-border/60 p-3">
          {!collapsed && roles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1 px-1">
              {roles.slice(0, 2).map((role) => (
                <Badge key={role} variant="muted" className="text-[10px]">
                  {ROLE_LABEL[role]}
                </Badge>
              ))}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-muted-foreground"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed((c) => !c)}
          >
            <ChevronLeft
              className={cn('h-4 w-4 transition-transform duration-200', collapsed && 'rotate-180')}
              aria-hidden="true"
            />
            {!collapsed && <span>Collapse</span>}
          </Button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          role="presentation"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── main ─────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex flex-1 flex-col transition-[padding] duration-200',
          collapsed ? 'lg:pl-[68px]' : 'lg:pl-64',
        )}
      >
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="hidden flex-1 md:block">
            <GlobalSearch />
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="ml-1 rounded-full ring-offset-2 ring-offset-background transition-shadow hover:ring-2 hover:ring-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Account menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.full_name ?? ''} />
                    <AvatarFallback>{initials(profile?.full_name)}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="space-y-1">
                    <p className="truncate text-sm font-semibold">{profile?.full_name || 'Account'}</p>
                    <p className="truncate text-xs font-normal text-muted-foreground">
                      {profile?.email}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {roles.map((role) => (
                        <Badge key={role} variant="muted" className="text-[10px]">
                          {ROLE_LABEL[role]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/app/profile')}>
                  <UserIcon className="h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/app/settings')}>
                  <Settings className="h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="relative flex-1 p-4 focus:outline-none md:p-6 lg:p-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

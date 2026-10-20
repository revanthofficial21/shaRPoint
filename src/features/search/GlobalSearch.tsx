import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Briefcase, FolderOpen, Search, Users } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { supabase } from '@/integrations/supabase/client'
import { useSessionContext } from '@/features/profiles/hooks'
import { initials } from '@/lib/utils'

interface Hit {
  id: string
  label: string
  sublabel?: string
  group: 'Courses' | 'Resources' | 'Opportunities' | 'People'
  to: string
}

const GROUP_ICON = {
  Courses: BookOpen,
  Resources: FolderOpen,
  Opportunities: Briefcase,
  People: Users,
} as const

export function GlobalSearch() {
  const navigate = useNavigate()
  const { capabilities } = useSessionContext()
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const [debounced, setDebounced] = useState('')

  // ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(term.trim()), 220)
    return () => clearTimeout(handle)
  }, [term])

  const results = useQuery({
    queryKey: ['global-search', debounced],
    enabled: open && debounced.length >= 2,
    queryFn: async (): Promise<Hit[]> => {
      const like = `%${debounced}%`

      const [courses, resources, opportunities, people] = await Promise.all([
        supabase.from('courses').select('id, title, code').ilike('title', like).limit(6),
        supabase.from('resources').select('id, title, resource_type').ilike('title', like).limit(6),
        supabase
          .from('opportunities')
          .select('id, title, company')
          .or(`title.ilike.${like},company.ilike.${like}`)
          .limit(6),
        supabase.from('profiles').select('id, full_name, email').ilike('full_name', like).limit(6),
      ])

      const hits: Hit[] = []

      for (const row of courses.data ?? []) {
        hits.push({
          id: `course-${row.id}`,
          label: row.title,
          sublabel: row.code ?? undefined,
          group: 'Courses',
          to: `/app/courses/${row.id}`,
        })
      }
      for (const row of resources.data ?? []) {
        hits.push({
          id: `resource-${row.id}`,
          label: row.title,
          sublabel: row.resource_type,
          group: 'Resources',
          to: '/app/resources',
        })
      }
      for (const row of opportunities.data ?? []) {
        hits.push({
          id: `opportunity-${row.id}`,
          label: row.title,
          sublabel: row.company,
          group: 'Opportunities',
          to: '/app/opportunities',
        })
      }
      for (const row of people.data ?? []) {
        hits.push({
          id: `person-${row.id}`,
          label: row.full_name,
          sublabel: row.email,
          group: 'People',
          to: '/app/messages',
        })
      }

      return hits
    },
  })

  const grouped = useMemo(() => {
    const map = new Map<string, Hit[]>()
    for (const hit of results.data ?? []) {
      map.set(hit.group, [...(map.get(hit.group) ?? []), hit])
    }
    return [...map.entries()]
  }, [results.data])

  function go(hit: Hit) {
    setOpen(false)
    setTerm('')
    navigate(hit.to)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-xs items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl gap-0 p-0">
          <DialogTitle className="sr-only">Search SHARPOINT</DialogTitle>

          <div className="flex items-center gap-2 border-b px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search courses, resources, opportunities and people…"
              className="border-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {debounced.length < 2 && (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                Type at least two characters to search.
              </p>
            )}

            {debounced.length >= 2 && results.isLoading && (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">Searching…</p>
            )}

            {debounced.length >= 2 && !results.isLoading && grouped.length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                No results for “{debounced}”.
              </p>
            )}

            {grouped.map(([group, hits]) => {
              const Icon = GROUP_ICON[group as keyof typeof GROUP_ICON] ?? Search
              return (
                <div key={group} className="mb-2">
                  <p className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {group}
                  </p>
                  {hits.map((hit) => (
                    <button
                      key={hit.id}
                      onClick={() => go(hit)}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted"
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{hit.label}</span>
                        {hit.sublabel && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {hit.sublabel}
                          </span>
                        )}
                      </span>
                      {group === 'People' && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {initials(hit.label)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )
            })}

            {debounced.length >= 2 && capabilities.isAdmin && (
              <p className="px-3 pb-2 pt-1 text-[11px] text-muted-foreground">
                Tip: administrators can also search from the Users page.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

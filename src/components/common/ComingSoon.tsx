import { Construction } from 'lucide-react'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

/**
 * Honest placeholder for routes whose feature work lands in a later phase.
 * These pages are wired into routing and authorization, but their feature is
 * not implemented yet — this is stated plainly rather than faked.
 */
export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">This area is part of the build roadmap.</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Construction className="h-8 w-8 text-muted-foreground" />
          <CardTitle className="text-base">Not implemented yet</CardTitle>
          <CardDescription className="max-w-md">
            Routing and permissions for this page are in place. The feature itself is scheduled for{' '}
            <strong>{phase}</strong>.
          </CardDescription>
          <Badge variant="muted">{phase}</Badge>
        </CardContent>
      </Card>
    </div>
  )
}

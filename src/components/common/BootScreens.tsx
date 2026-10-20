import React from 'react'
import { AlertTriangle, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Boot-time screens. These render when the app cannot start normally, so the
 * user always sees an explanation instead of a blank page.
 */

const shell =
  'flex min-h-screen items-center justify-center bg-background p-6 text-foreground'

export function ConfigScreen({ missing }: { missing: string[] }) {
  return (
    <div className={shell}>
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 shadow-sm">
        <Wrench className="mb-3 h-8 w-8 text-primary" />
        <h1 className="text-xl font-semibold">Configuration required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          SHARPOINT loaded, but it can&apos;t reach its backend without these environment
          variables. Set them in your host (Vercel / Netlify → Settings → Environment Variables)
          and redeploy:
        </p>
        <ul className="mt-4 space-y-2">
          {missing.map((name) => (
            <li key={name}>
              <code className="rounded bg-muted px-2 py-1 text-sm font-medium text-primary">
                {name}
              </code>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          Both values come from Supabase → <strong>Settings → API</strong>. Locally, copy{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env.example</code> to{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env</code>.
        </p>
      </div>
    </div>
  )
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[sharpoint] render error:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className={shell}>
        <div className="w-full max-w-xl rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
          <AlertTriangle className="mb-3 h-8 w-8 text-red-600" />
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-red-50 p-3 text-xs text-red-800">
            {this.state.error.message}
          </pre>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </div>
    )
  }
}

import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-12 text-amber-50 lg:flex">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-amber-500/25 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-orange-600/25 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            S
          </span>
          SHARPOINT
        </Link>

        <div className="relative space-y-4">
          <h2 className="text-3xl font-bold leading-tight">
            One platform for students, teachers and institutions.
          </h2>
          <p className="max-w-md text-sm text-slate-400">
            Collaboration, coursework, opportunities and analytics — with role-based access enforced
            in the database.
          </p>
        </div>

        <p className="relative text-xs text-slate-500">
          Built with React, TypeScript, Tailwind and Supabase.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1">
            <Link to="/" className="mb-6 flex items-center gap-2 font-semibold lg:hidden">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                S
              </span>
              SHARPOINT
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {children}

          {footer && <div className="text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  )
}

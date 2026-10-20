import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RedirectIfAuthenticated, RequireAuth, RequireRole } from './guards'
import type { AppRole } from '@/types/database'

const state = vi.hoisted(() => ({
  auth: { user: null as { id: string } | null, loading: false },
  session: {
    status: 'active' as string,
    isLoading: false,
    roles: [] as string[],
    capabilities: { homePath: '/app' },
  },
}))

vi.mock('@/features/auth/auth-context', () => ({ useAuth: () => state.auth }))
vi.mock('@/features/profiles/hooks', () => ({ useSessionContext: () => state.session }))

beforeEach(() => {
  state.auth = { user: null, loading: false }
  state.session = {
    status: 'active',
    isLoading: false,
    roles: [],
    capabilities: { homePath: '/app' },
  }
})

function renderAt(path: string, element: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={element}>
          <Route path="/app" element={<div>protected content</div>} />
          <Route path="/admin" element={<div>admin content</div>} />
        </Route>
        <Route path="/sign-in" element={<div>sign in page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireAuth', () => {
  it('shows a spinner while the session is being checked', () => {
    state.auth.loading = true
    renderAt('/app', <RequireAuth />)
    expect(screen.getByText(/checking your session/i)).toBeInTheDocument()
  })

  it('redirects an anonymous visitor to sign in', () => {
    renderAt('/app', <RequireAuth />)
    expect(screen.getByText('sign in page')).toBeInTheDocument()
    expect(screen.queryByText('protected content')).not.toBeInTheDocument()
  })

  it('renders the protected content for an active signed-in user', () => {
    state.auth.user = { id: 'u1' }
    renderAt('/app', <RequireAuth />)
    expect(screen.getByText('protected content')).toBeInTheDocument()
  })

  it('blocks a suspended account even though it is signed in', () => {
    state.auth.user = { id: 'u1' }
    state.session.status = 'suspended'
    renderAt('/app', <RequireAuth />)
    expect(screen.getByText('Account suspended')).toBeInTheDocument()
    expect(screen.queryByText('protected content')).not.toBeInTheDocument()
  })

  it('blocks a deactivated account', () => {
    state.auth.user = { id: 'u1' }
    state.session.status = 'deactivated'
    renderAt('/app', <RequireAuth />)
    expect(screen.getByText('Account deactivated')).toBeInTheDocument()
  })
})

describe('RequireRole', () => {
  it('refuses a student access to an admin area', () => {
    state.session.roles = ['student']
    renderAt('/admin', <RequireRole allow={['admin', 'owner']} />)
    expect(screen.getByText('Not authorized')).toBeInTheDocument()
    expect(screen.queryByText('admin content')).not.toBeInTheDocument()
  })

  it('admits a teacher to a teacher area', () => {
    state.session.roles = ['teacher']
    renderAt('/app', <RequireRole allow={['teacher', 'admin', 'owner'] as AppRole[]} />)
    expect(screen.getByText('protected content')).toBeInTheDocument()
  })

  it('admits an owner everywhere an admin is allowed', () => {
    state.session.roles = ['owner']
    renderAt('/admin', <RequireRole allow={['admin', 'owner']} />)
    expect(screen.getByText('admin content')).toBeInTheDocument()
  })

  it('refuses a user with no roles at all', () => {
    state.session.roles = []
    renderAt('/admin', <RequireRole allow={['admin', 'owner']} />)
    expect(screen.getByText('Not authorized')).toBeInTheDocument()
  })
})

/**
 * A pathless layout route only renders when one of its children matches, so the
 * gate has to WRAP the sign-in route rather than sit beside it — otherwise the
 * guard never runs at /sign-in and the test proves nothing.
 */
function renderAuthGate() {
  return render(
    <MemoryRouter initialEntries={['/sign-in']}>
      <Routes>
        {/* Mirrors App.tsx: the gate wraps ONLY the auth routes. The redirect
            targets are siblings — if they were children, the guard would re-run
            on the target and redirect to itself forever. */}
        <Route element={<RedirectIfAuthenticated />}>
          <Route path="/sign-in" element={<div>sign in page</div>} />
        </Route>
        <Route path="/admin" element={<div>admin content</div>} />
        <Route path="/app" element={<div>student home</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RedirectIfAuthenticated', () => {
  it('sends a signed-in admin to the admin home', () => {
    state.auth.user = { id: 'u1' }
    state.session.capabilities = { homePath: '/admin' }
    renderAuthGate()
    expect(screen.getByText('admin content')).toBeInTheDocument()
    expect(screen.queryByText('sign in page')).not.toBeInTheDocument()
  })

  it('sends a signed-in student to the student home', () => {
    state.auth.user = { id: 'u1' }
    state.session.capabilities = { homePath: '/app' }
    renderAuthGate()
    expect(screen.getByText('student home')).toBeInTheDocument()
  })

  it('lets an anonymous visitor see the auth page', () => {
    renderAuthGate()
    expect(screen.getByText('sign in page')).toBeInTheDocument()
  })
})

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Inbox } from 'lucide-react'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'

describe('EmptyState', () => {
  it('shows the title and description', () => {
    render(<EmptyState title="No courses found" description="Try another search." />)
    expect(screen.getByText('No courses found')).toBeInTheDocument()
    expect(screen.getByText('Try another search.')).toBeInTheDocument()
  })

  it('renders an action when one is provided', () => {
    render(<EmptyState title="Nothing here" action={<button>Create one</button>} />)
    expect(screen.getByRole('button', { name: 'Create one' })).toBeInTheDocument()
  })

  it('omits the description and action when not supplied', () => {
    render(<EmptyState title="Nothing here" icon={Inbox} />)
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('ErrorState', () => {
  it('uses a sensible default heading', () => {
    render(<ErrorState />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('only offers a retry when a handler is given', () => {
    render(<ErrorState />)
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
  })

  it('offers a retry that calls the handler', () => {
    let called = 0
    render(<ErrorState onRetry={() => (called += 1)} />)
    screen.getByRole('button', { name: /try again/i }).click()
    expect(called).toBe(1)
  })

  it('surfaces the provided description', () => {
    render(<ErrorState description="It may have been archived." />)
    expect(screen.getByText('It may have been archived.')).toBeInTheDocument()
  })
})

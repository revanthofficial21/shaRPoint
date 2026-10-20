import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ThemeProvider, useTheme } from './theme'
import { ThemeToggle } from '@/components/common/ThemeToggle'

function ThemeProbe() {
  const { theme } = useTheme()
  return <span data-testid="theme">{theme}</span>
}

describe('ThemeProvider', () => {
  it('defaults to dark', () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('honours a stored light preference', () => {
    localStorage.setItem('sharpoint-theme', 'light')
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('ignores a garbage stored value and falls back to dark', () => {
    localStorage.setItem('sharpoint-theme', 'neon')
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  it('persists the choice so the inline script in index.html can apply it', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    fireEvent.click(screen.getByRole('button'))
    expect(localStorage.getItem('sharpoint-theme')).toBe('light')
  })
})

describe('ThemeToggle', () => {
  it('describes the action it will perform, not the current state', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    // In dark mode the button offers to switch to light.
    expect(screen.getByRole('button')).toHaveAccessibleName(/switch to light theme/i)
  })

  it('switches the document class and its own label when clicked', () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
        <ThemeToggle />
      </ThemeProvider>,
    )

    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(screen.getByRole('button')).toHaveAccessibleName(/switch to dark theme/i)
  })
})

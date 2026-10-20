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

describe('palette presets', () => {
  it('defaults to ember and applies it to the document', () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )
    expect(document.documentElement.getAttribute('data-palette')).toBe('ember')
  })

  it('applies a chosen palette to the document', () => {
    function Picker() {
      const { palette, setPalette } = useTheme()
      return (
        <>
          <span data-testid="palette">{palette}</span>
          <button onClick={() => setPalette('violet')}>violet</button>
        </>
      )
    }
    render(
      <ThemeProvider>
        <Picker />
      </ThemeProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'violet' }))
    expect(screen.getByTestId('palette')).toHaveTextContent('violet')
    expect(document.documentElement.getAttribute('data-palette')).toBe('violet')
  })

  it('persists the choice for the inline script to apply on reload', () => {
    function Picker() {
      const { setPalette } = useTheme()
      return <button onClick={() => setPalette('teal')}>teal</button>
    }
    render(
      <ThemeProvider>
        <Picker />
      </ThemeProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'teal' }))
    expect(localStorage.getItem('sharpoint-palette')).toBe('teal')
  })

  it('honours a stored palette', () => {
    localStorage.setItem('sharpoint-palette', 'rose')
    function Probe() {
      const { palette } = useTheme()
      return <span data-testid="palette">{palette}</span>
    }
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('palette')).toHaveTextContent('rose')
  })

  it('ignores a garbage stored palette and falls back to ember', () => {
    localStorage.setItem('sharpoint-palette', 'neon')
    function Probe() {
      const { palette } = useTheme()
      return <span data-testid="palette">{palette}</span>
    }
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('palette')).toHaveTextContent('ember')
  })

  it('keeps the mode and the palette independent', () => {
    function Probe() {
      const { theme, palette, setPalette } = useTheme()
      return (
        <>
          <span data-testid="mode">{theme}</span>
          <span data-testid="palette">{palette}</span>
          <button onClick={() => setPalette('slate')}>slate</button>
        </>
      )
    }
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'slate' }))
    expect(screen.getByTestId('palette')).toHaveTextContent('slate')
    // switching accent must not change light/dark
    expect(screen.getByTestId('mode')).toHaveTextContent('dark')
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

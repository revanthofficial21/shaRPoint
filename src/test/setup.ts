import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  // ThemeProvider writes a class and a data attribute onto <html>; don't let
  // either leak between tests.
  document.documentElement.className = ''
  document.documentElement.removeAttribute('data-palette')
  localStorage.clear()
})

// jsdom implements neither of these, and Radix primitives touch them on mount.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

class MockObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

// jsdom implements neither; the cast avoids a per-line ts-expect-error that
// becomes "unused" as soon as @types catches up.
window.ResizeObserver = MockObserver as unknown as typeof ResizeObserver
window.IntersectionObserver = MockObserver as unknown as typeof IntersectionObserver

window.scrollTo = vi.fn() as unknown as typeof window.scrollTo

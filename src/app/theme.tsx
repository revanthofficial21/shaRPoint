import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type Theme = 'light' | 'dark'

export const PALETTES = ['ember', 'violet', 'teal', 'rose', 'slate'] as const
export type Palette = (typeof PALETTES)[number]

/** Change this to change what everyone sees first. */
export const DEFAULT_PALETTE: Palette = 'ember'

export interface PaletteMeta {
  label: string
  swatch: string
  blurb: string
}

export const PALETTE_META: Record<Palette, PaletteMeta> = {
  ember: {
    label: 'Ember',
    swatch: 'hsl(32 98% 58%)',
    blurb: 'Warm amber on near-black. The brand default.',
  },
  violet: {
    label: 'Violet',
    swatch: 'hsl(264 90% 68%)',
    blurb: 'Deep plum with an electric violet accent.',
  },
  teal: {
    label: 'Teal',
    swatch: 'hsl(174 80% 52%)',
    blurb: 'Cool teal on a dark marine canvas.',
  },
  rose: {
    label: 'Rose',
    swatch: 'hsl(348 92% 68%)',
    blurb: 'Crimson rose. Bold and sporty.',
  },
  slate: {
    label: 'Slate',
    swatch: 'hsl(220 25% 92%)',
    blurb: 'Neutral and monochrome, with no accent colour.',
  },
}

const THEME_KEY = 'sharpoint-theme'
const PALETTE_KEY = 'sharpoint-palette'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggle: () => void
  palette: Palette
  setPalette: (palette: Palette) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const isPalette = (value: unknown): value is Palette =>
  typeof value === 'string' && (PALETTES as readonly string[]).includes(value)

/**
 * Reads what the inline script in index.html already applied, so React state and
 * the DOM agree on first render — no flash, no mismatch.
 */
function readInitialTheme(): Theme {
  if (typeof document === 'undefined') return 'dark'
  if (document.documentElement.classList.contains('light')) return 'light'
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* storage can be blocked; fall through to the default */
  }
  return 'dark'
}

function readInitialPalette(): Palette {
  if (typeof document === 'undefined') return DEFAULT_PALETTE
  const applied = document.documentElement.getAttribute('data-palette')
  if (isPalette(applied)) return applied
  try {
    const stored = localStorage.getItem(PALETTE_KEY)
    if (isPalette(stored)) return stored
  } catch {
    /* ignore */
  }
  return DEFAULT_PALETTE
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme)
  const [palette, setPaletteState] = useState<Palette>(readInitialPalette)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('light', theme === 'light')
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-palette', palette)
    try {
      localStorage.setItem(PALETTE_KEY, palette)
    } catch {
      /* ignore */
    }
  }, [palette])

  const setTheme = useCallback((next: Theme) => setThemeState(next), [])
  const setPalette = useCallback((next: Palette) => setPaletteState(next), [])
  const toggle = useCallback(
    () => setThemeState((current) => (current === 'dark' ? 'light' : 'dark')),
    [],
  )

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle, palette, setPalette }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside a ThemeProvider')
  return context
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type Theme = 'light' | 'dark'

export const PALETTES = ['nebula', 'ember', 'aurora', 'rose', 'slate'] as const
export type Palette = (typeof PALETTES)[number]

/** Change this to change what everyone sees first. */
export const DEFAULT_PALETTE: Palette = 'nebula'

export interface PaletteMeta {
  label: string
  swatch: string
  blurb: string
}

export const PALETTE_META: Record<Palette, PaletteMeta> = {
  nebula: {
    label: 'Nebula',
    swatch: 'linear-gradient(100deg, hsl(226 88% 52%), hsl(260 80% 56%))',
    blurb: 'Electric blue to violet on deep navy. The default.',
  },
  ember: {
    label: 'Ember',
    swatch: 'linear-gradient(100deg, hsl(30 97% 56%), hsl(14 90% 54%))',
    blurb: 'Warm amber — the original brand look.',
  },
  aurora: {
    label: 'Aurora',
    swatch: 'linear-gradient(100deg, hsl(176 80% 40%), hsl(196 85% 52%))',
    blurb: 'Cool teal on a dark marine canvas.',
  },
  rose: {
    label: 'Rose',
    swatch: 'linear-gradient(100deg, hsl(346 86% 56%), hsl(316 80% 58%))',
    blurb: 'Crimson to magenta. Bold and loud.',
  },
  slate: {
    label: 'Slate',
    swatch: 'linear-gradient(100deg, hsl(220 20% 88%), hsl(222 16% 72%))',
    blurb: 'Neutral monochrome, with no accent colour.',
  },
}

const THEME_KEY = 'sharpoint-theme'
/*
 * VERSIONED. A stored accent from an earlier design direction must not keep
 * overriding the current default — that is exactly how a shipped redesign can
 * look like "nothing changed" to every returning visitor. Bump the suffix when
 * the design direction changes.
 */
const PALETTE_KEY = 'sharpoint-accent.v1'
const LEGACY_PALETTE_KEYS = ['sharpoint-palette']

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
  if (typeof document === 'undefined') return 'light'
  if (document.documentElement.classList.contains('dark')) return 'dark'
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* storage can be blocked; fall through to the default */
  }
  return 'light'
}

function readInitialPalette(): Palette {
  if (typeof document === 'undefined') return DEFAULT_PALETTE
  const applied = document.documentElement.getAttribute('data-palette')
  if (isPalette(applied)) return applied
  try {
    // Drop keys from earlier design directions so they cannot win.
    for (const legacy of LEGACY_PALETTE_KEYS) localStorage.removeItem(legacy)

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

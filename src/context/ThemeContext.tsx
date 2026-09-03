import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ThemePreference } from '../types'

const THEME_KEY = 'aarogyamcare.theme'

interface ThemeContextValue {
  preference: ThemePreference
  resolved: 'light' | 'dark'
  setPreference: (value: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function systemDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(pref: ThemePreference): 'light' | 'dark' {
  const resolved = pref === 'system' ? (systemDark() ? 'dark' : 'light') : pref
  document.documentElement.classList.toggle('dark', resolved === 'dark')
  return resolved
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    const stored = localStorage.getItem(THEME_KEY)
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
  })
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => applyTheme(preference))

  useEffect(() => {
    localStorage.setItem(THEME_KEY, preference)
    setResolved(applyTheme(preference))
    if (preference !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setResolved(applyTheme('system'))
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [preference])

  const setPreference = (value: ThemePreference) => {
    setPreferenceState(value)
  }

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

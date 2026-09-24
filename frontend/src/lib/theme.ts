import { useSyncExternalStore } from 'react'

/**
 * Theme preference (Settings > Appearance). Stored per device in localStorage, because it's about this
 * screen, not the account; "system" follows the OS. index.html applies it before the first paint.
 */
export type Theme = 'system' | 'light' | 'dark'
const KEY = 'quickflow-theme'
const listeners = new Set<() => void>()

export function getTheme(): Theme {
  try {
    const t = localStorage.getItem(KEY)
    return t === 'light' || t === 'dark' ? t : 'system'
  } catch {
    return 'system'
  }
}

export function setTheme(t: Theme) {
  try {
    if (t === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, t)
  } catch { /* storage blocked: the choice still applies until reload */ }
  if (t === 'system') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = t
  listeners.forEach((l) => l())
}

export function useTheme(): Theme {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, getTheme, () => 'system')
}

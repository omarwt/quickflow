import { describe, expect, it } from 'vitest'
import css from './tokens.css?raw'

// WCAG 2.2 AA contrast for every foreground/background pair the components use, in both themes.
function tokens(block: string) {
  return Object.fromEntries([...block.matchAll(/--(color-[\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]))
}
const light = tokens(css.split('@media (prefers-color-scheme: dark)')[0])
const dark = { ...light, ...tokens(css.split('@media (prefers-color-scheme: dark)')[1].split('@media')[0]) }

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const TEXT: [string, string][] = [
  ['text', 'bg'], ['text', 'surface'], ['text', 'surface-2'],
  ['text-muted', 'bg'], ['text-muted', 'surface'], ['text-muted', 'surface-2'],
  ['accent-text', 'surface'], ['accent-text', 'bg'], ['accent-text', 'accent-soft'], ['on-accent', 'accent'], ['on-accent', 'accent-hover'],
  ['success', 'surface'], ['success', 'success-soft'], ['warning', 'surface'], ['warning', 'warning-soft'],
  ['danger', 'surface'], ['danger', 'danger-soft'], ['on-danger', 'danger-fill'], ['on-toast', 'toast'],
]
const UI: [string, string][] = [['border-strong', 'surface'], ['border-strong', 'bg'], ['accent', 'surface']]

describe.each([['light', light], ['dark', dark]] as const)('%s theme', (_, t) => {
  it.each(TEXT)('text %s on %s is at least 4.5:1', (fg, bg) => {
    expect(ratio(t[`color-${fg}`], t[`color-${bg}`])).toBeGreaterThanOrEqual(4.5)
  })
  it.each(UI)('UI part %s on %s is at least 3:1', (fg, bg) => {
    expect(ratio(t[`color-${fg}`], t[`color-${bg}`])).toBeGreaterThanOrEqual(3)
  })
})

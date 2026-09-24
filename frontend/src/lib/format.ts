/** "2026-09-24" → "24 Sep 2026" (dates are local dates, so no timezone shift). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const label = (value: string) => value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ')

/** plural(1, 'item') → "item"; plural(3, 'item') → "items" (F7). */
export const plural = (n: number, word: string, many = `${word}s`) => (n === 1 ? word : many)

const DAY_MS = 86_400_000
const dayIndex = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / DAY_MS

/** Due-date wording relative to `today` (both YYYY-MM-DD in the user's timezone): "today", "tomorrow", "yesterday", else the date. */
export function relativeDay(iso: string, today: string | undefined): string {
  const diff = today ? dayIndex(iso) - dayIndex(today) : NaN
  return diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : diff === -1 ? 'yesterday' : formatDate(iso)
}

/** Today's date (YYYY-MM-DD) in an IANA timezone, e.g. the one chosen in Settings. */
export function todayIn(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

/** Plan window: "Today, 09:00 AM → 10:00 AM" when it starts and ends on the same local day, else both date-times. */
export function formatWindow(start: string, end: string, now = new Date()): string {
  const s = new Date(start), e = new Date(end)
  const time = (d: Date) => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  if (s.toDateString() !== e.toDateString()) return `${formatDateTime(start)} → ${formatDateTime(end)}`
  const days = Math.round((new Date(s.toDateString()).getTime() - new Date(now.toDateString()).getTime()) / DAY_MS)
  const day = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : days === -1 ? 'Yesterday'
    : s.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  return `${day}, ${time(s)} → ${time(e)}`
}

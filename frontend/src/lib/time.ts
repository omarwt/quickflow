import { useEffect, useState } from 'react'

/** 5405 → "1h 30m 05s"; 65 → "1m 05s"; negative → "0s". */
export function formatRest(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${sec}s`
  if (m > 0) return `${m}m ${sec}s`
  return `${s % 60}s`
}

/**
 * Seconds left until `end`, measured on the server's clock: `serverTime` was the server's "now" when the
 * response arrived at `receivedAt` (browser ms), so the browser clock's own offset doesn't matter.
 */
export function remainingSeconds(end: string, serverTime: string, receivedAt: number, nowMs: number): number {
  const serverNow = Date.parse(serverTime) + (nowMs - receivedAt)
  return (Date.parse(end) - serverNow) / 1000
}

/** Re-renders every `ms` so live counters tick (NFR-2 asks for at least once a minute; we tick every second). */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

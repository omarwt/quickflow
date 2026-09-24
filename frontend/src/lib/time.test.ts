import { describe, expect, it } from 'vitest'
import { formatRest, remainingSeconds } from './time'

describe('formatRest', () => {
  it('formats hours, minutes and seconds', () => {
    expect(formatRest(5405)).toBe('1h 30m 05s')
    expect(formatRest(3600)).toBe('1h 00m 00s')
    expect(formatRest(65)).toBe('1m 05s')
    expect(formatRest(9)).toBe('9s')
  })
  it('never shows negative time', () => {
    expect(formatRest(-12)).toBe('0s')
  })
})

describe('remainingSeconds', () => {
  const serverTime = '2026-09-24T10:00:00Z'
  const end = '2026-09-24T11:00:00Z'
  it('counts down from the server time, independent of the browser clock', () => {
    const receivedAt = 1_000_000 // browser clock may be far off; only elapsed time matters
    expect(remainingSeconds(end, serverTime, receivedAt, receivedAt)).toBe(3600)
    expect(remainingSeconds(end, serverTime, receivedAt, receivedAt + 90_000)).toBe(3510)
  })
  it('goes negative after the end so callers can refresh', () => {
    expect(remainingSeconds(end, serverTime, 0, 3_601_000)).toBeLessThan(0)
  })
})

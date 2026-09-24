import { describe, expect, it } from 'vitest'
import { formatWindow, plural, relativeDay, todayIn } from './format'

describe('copy helpers', () => {
  it('pluralises by count', () => {
    expect(`1 of 1 ${plural(1, 'milestone')} done`).toBe('1 of 1 milestone done')
    expect(`0 of 0 ${plural(0, 'milestone')} done`).toBe('0 of 0 milestones done')
    expect(`1 of 3 ${plural(3, 'item')} done`).toBe('1 of 3 items done')
  })
  it('words due dates relative to today', () => {
    expect(relativeDay('2026-09-24', '2026-09-24')).toBe('today')
    expect(relativeDay('2026-09-25', '2026-09-24')).toBe('tomorrow')
    expect(relativeDay('2026-09-23', '2026-09-24')).toBe('yesterday')
    expect(relativeDay('2026-03-01', '2026-02-28')).toBe('tomorrow')
    expect(relativeDay('2026-09-01', '2026-09-24')).not.toMatch(/today|tomorrow|yesterday/)
    expect(relativeDay('2026-09-24', undefined)).not.toBe('today')
  })
  it('computes today in the user timezone, not the browser one', () => {
    const t = new Date('2026-09-24T22:30:00Z')
    expect(todayIn('UTC', t)).toBe('2026-09-24')
    expect(todayIn('Asia/Dubai', t)).toBe('2026-09-25')
    expect(todayIn('America/New_York', t)).toBe('2026-09-24')
  })
  it('shortens same-day plan windows', () => {
    const now = new Date(2026, 8, 24, 8, 0)
    expect(formatWindow(new Date(2026, 8, 24, 9, 0).toISOString(), new Date(2026, 8, 24, 10, 0).toISOString(), now)).toMatch(/^Today, .+ → .+$/)
    expect(formatWindow(new Date(2026, 8, 25, 9, 0).toISOString(), new Date(2026, 8, 25, 10, 0).toISOString(), now)).toMatch(/^Tomorrow, /)
    expect(formatWindow(new Date(2026, 8, 24, 23, 0).toISOString(), new Date(2026, 8, 25, 1, 0).toISOString(), now)).toContain(' → ')
  })
})

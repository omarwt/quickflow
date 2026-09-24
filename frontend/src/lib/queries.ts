import { useQuery, useQueryClient } from '@tanstack/react-query'
import { get, type Settings } from '../api/client'
import { todayIn } from './format'

/**
 * Every feature feeds the dashboard and plans show task/habit/learning titles, so a change anywhere
 * refreshes those views too (FR-08: changes are reflected immediately everywhere).
 */
export function useRefresh() {
  const qc = useQueryClient()
  return (...keys: string[]) =>
    Promise.all([...new Set([...keys, 'dashboard', 'plans', 'plan-sources'])].map((k) => qc.invalidateQueries({ queryKey: [k] })))
}

/** Today's date in the timezone chosen in Settings (I-2), so "Due today" matches the server's idea of today. */
export function useToday(): string | undefined {
  const tz = useQuery({ queryKey: ['settings'], queryFn: () => get<Settings>('/settings') }).data?.timezone
  return tz ? todayIn(tz) : undefined
}

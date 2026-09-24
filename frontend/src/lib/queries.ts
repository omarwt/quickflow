import { useQueryClient } from '@tanstack/react-query'

/**
 * Every feature feeds the dashboard and plans show task/habit/learning titles, so a change anywhere
 * refreshes those views too (FR-08: changes are reflected immediately everywhere).
 */
export function useRefresh() {
  const qc = useQueryClient()
  return (...keys: string[]) =>
    Promise.all([...new Set([...keys, 'dashboard', 'plans', 'plan-sources'])].map((k) => qc.invalidateQueries({ queryKey: [k] })))
}

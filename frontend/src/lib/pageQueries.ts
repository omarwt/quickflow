import { queryOptions, type QueryClient } from '@tanstack/react-query'
import { get, type Dashboard, type Habit, type LearningCard, type Plan, type Settings, type Task } from '../api/client'

/**
 * One definition per page query, shared by the pages and by navigation prefetching (UX-MOTION), so a
 * prefetched page finds its data under exactly the key it reads.
 */
export type TaskFilters = { search: string; status: string; priority: string; due: string; sort: string; archived: boolean }
export const DEFAULT_TASK_FILTERS: TaskFilters = { search: '', status: '', priority: '', due: '', sort: 'CREATED_AT', archived: false }

export function taskParams(f: TaskFilters, search = f.search): URLSearchParams {
  const params = new URLSearchParams({ sort: f.sort, direction: f.sort === 'DUE_DATE' ? 'ASC' : 'DESC', archived: String(f.archived) })
  if (search.trim()) params.set('search', search.trim())
  if (f.status) params.set('status', f.status)
  if (f.priority) params.set('priority', f.priority)
  if (f.due) params.set('due', f.due)
  return params
}

export const pageQueries = {
  tasks: (params: URLSearchParams = taskParams(DEFAULT_TASK_FILTERS)) =>
    queryOptions({ queryKey: ['tasks', params.toString()], queryFn: () => get<Task[]>(`/tasks?${params}`) }),
  habits: () => queryOptions({ queryKey: ['habits'], queryFn: () => get<Habit[]>('/habits') }),
  dashboard: () => queryOptions({ queryKey: ['dashboard'], queryFn: () => get<Dashboard>('/dashboard') }),
  learning: () => queryOptions({ queryKey: ['learning'], queryFn: () => get<LearningCard[]>('/learning-cards') }),
  plans: () => queryOptions({ queryKey: ['plans'], queryFn: () => get<Plan[]>('/plans'), refetchInterval: 30_000 }),
  settings: () => queryOptions({ queryKey: ['settings'], queryFn: () => get<Settings>('/settings') }),
}

/** What each route reads first; prefetched when its nav link is hovered, focused or touched. */
const ROUTE_QUERIES: Record<string, () => { queryKey: readonly unknown[] }[]> = {
  '/dashboard': () => [pageQueries.dashboard(), pageQueries.tasks(taskParams({ ...DEFAULT_TASK_FILTERS, status: 'DONE' })), pageQueries.plans(), pageQueries.learning()],
  '/tasks': () => [pageQueries.tasks()],
  '/habits': () => [pageQueries.habits(), pageQueries.dashboard()],
  '/learning': () => [pageQueries.learning()],
  '/plans': () => [pageQueries.plans()],
  '/settings': () => [pageQueries.settings()],
}

export function prefetchRoute(qc: QueryClient, path: string) {
  // prefetchQuery skips data that is still fresh, so hovering back and forth costs nothing
  for (const q of ROUTE_QUERIES[path]?.() ?? []) void qc.prefetchQuery(q as Parameters<QueryClient['prefetchQuery']>[0])
}

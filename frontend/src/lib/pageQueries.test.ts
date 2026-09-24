import { describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { DEFAULT_TASK_FILTERS, pageQueries, prefetchRoute, taskParams } from './pageQueries'

describe('navigation prefetch', () => {
  it('prefetches the exact key the Tasks page reads on first load', () => {
    const qc = new QueryClient()
    const spy = vi.spyOn(qc, 'prefetchQuery').mockResolvedValue()
    prefetchRoute(qc, '/tasks')
    const pageKey = pageQueries.tasks(taskParams(DEFAULT_TASK_FILTERS, DEFAULT_TASK_FILTERS.search)).queryKey
    expect(spy.mock.calls[0][0].queryKey).toEqual(pageKey)
    expect(pageKey).toEqual(['tasks', 'sort=CREATED_AT&direction=DESC&archived=false'])
  })
  it('covers every navigation target, and the habits page gets its "today" too', () => {
    const qc = new QueryClient()
    const spy = vi.spyOn(qc, 'prefetchQuery').mockResolvedValue()
    for (const path of ['/dashboard', '/tasks', '/habits', '/learning', '/plans', '/settings']) prefetchRoute(qc, path)
    const keys = spy.mock.calls.map((c) => c[0].queryKey?.[0])
    expect(keys).toEqual(['dashboard', 'tasks', 'plans', 'learning', 'tasks', 'habits', 'dashboard', 'learning', 'plans', 'settings'])
  })
  it('builds filter params in one place', () => {
    expect(taskParams({ ...DEFAULT_TASK_FILTERS, sort: 'DUE_DATE', status: 'TODO', search: ' x ' }).toString())
      .toBe('sort=DUE_DATE&direction=ASC&archived=false&search=x&status=TODO')
  })
})

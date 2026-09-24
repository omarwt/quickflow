import { useDeferredValue, useState } from 'react'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { api, type Task } from '../api/client'
import { DEFAULT_TASK_FILTERS, pageQueries, taskParams, type TaskFilters } from '../lib/pageQueries'
import TaskForm from '../components/TaskForm'
import { Badge, Button, type Tone } from '../components/ds'
import { ConfirmDialog, Dialog, EmptyState, ErrorState, Loading, useToast } from '../components/ui'
import { label, relativeDay } from '../lib/format'
import { useRefresh, useToday } from '../lib/queries'
import { PHONE_QUERY, useMediaQuery } from '../lib/media'

const STATUS_TONE: Record<Task['status'], Tone> = { TODO: 'neutral', IN_PROGRESS: 'accent', DONE: 'success' }

type Filters = TaskFilters

export default function TasksPage() {
  const toast = useToast()
  const refresh = useRefresh()
  const today = useToday()
  const [f, setF] = useState<Filters>(DEFAULT_TASK_FILTERS)
  const search = useDeferredValue(f.search)
  const [editing, setEditing] = useState<Task | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Task | null>(null)
  // phones: the filters move into a sheet behind a "Filters" button, so the list starts near the top
  const phone = useMediaQuery(PHONE_QUERY)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // placeholderData keeps the current rows on screen while a new filter or search loads (no skeleton flash)
  const tasks = useQuery({ ...pageQueries.tasks(taskParams(f, search)), placeholderData: keepPreviousData })

  const action = useMutation({
    mutationFn: ({ task, op }: { task: Task; op: 'complete' | 'reopen' | 'archive' | 'restore' | 'delete' }) =>
      op === 'delete' ? api('DELETE', `/tasks/${task.id}`) : api('POST', `/tasks/${task.id}/${op}`),
    // returning the refetch keeps the mutation pending until the list has the new state, so the
    // optimistic checkbox below never flips back for a moment (UX-FEED)
    onSuccess: (_, { task, op }) => {
      const done = { complete: 'completed', reopen: 'reopened', archive: 'archived', restore: 'restored', delete: 'deleted' }[op]
      toast(`"${task.title}" ${done}`)
      setDeleting(null)
      return refresh('tasks')
    },
    onError: (e) => toast(e.message, 'error'),
  })

  const set = (patch: Partial<Filters>) => setF({ ...f, ...patch })
  const activeFilters = [f.status, f.priority, f.due].filter(Boolean).length + (f.archived ? 1 : 0)
  const filterControls = (
    <>
      <select aria-label="Status filter" value={f.status} onChange={(e) => set({ status: e.target.value })}>
        <option value="">All statuses</option><option value="TODO">Todo</option><option value="IN_PROGRESS">In progress</option><option value="DONE">Done</option>
      </select>
      <select aria-label="Priority filter" value={f.priority} onChange={(e) => set({ priority: e.target.value })}>
        <option value="">All priorities</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
      </select>
      <select aria-label="Due date filter" value={f.due} onChange={(e) => set({ due: e.target.value })}>
        <option value="">Any due date</option><option value="TODAY">Due today</option><option value="OVERDUE">Overdue</option>
        <option value="UPCOMING">Upcoming</option><option value="NONE">No due date</option>
      </select>
      <select aria-label="Sort" value={f.sort} onChange={(e) => set({ sort: e.target.value })}>
        <option value="CREATED_AT">Newest first</option><option value="DUE_DATE">By due date</option>
      </select>
      <label className="check"><input type="checkbox" checked={f.archived} onChange={(e) => set({ archived: e.target.checked })} /> Show archived</label>
    </>
  )
  const busy = (t: Task, ...ops: string[]) => action.isPending && action.variables?.task.id === t.id && ops.includes(action.variables.op)
  // the checkbox shows the requested state at once and settles on the server's answer
  const isDone = (t: Task) => (busy(t, 'complete', 'reopen') ? action.variables?.op === 'complete' : t.status === 'DONE')
  const filtered = Boolean(search.trim() || f.status || f.priority || f.due)

  return (
    <section>
      <div className="page-head">
        <h1>Tasks</h1>
        <Button variant="primary" icon="plus" onClick={() => setEditing('new')}>Add Task</Button>
      </div>

      <div className="toolbar" role="search">
        <input type="search" aria-label="Search tasks" placeholder="Search by title…" value={f.search} onChange={(e) => set({ search: e.target.value })} />
        {phone
          ? <Button icon="filter" onClick={() => setFiltersOpen(true)}>Filters{activeFilters ? ` (${activeFilters})` : ''}</Button>
          : filterControls}
      </div>
      <Dialog title="Filter tasks" open={phone && filtersOpen} onClose={() => setFiltersOpen(false)}>
        <div className="form">
          {filterControls}
          <div className="actions"><Button variant="primary" onClick={() => setFiltersOpen(false)}>Show tasks</Button></div>
        </div>
      </Dialog>

      {tasks.isPending ? <Loading variant="rows" /> : tasks.isError ? <ErrorState error={tasks.error} onRetry={() => tasks.refetch()} /> :
        tasks.data.length === 0 ? (
          filtered || f.archived
            ? <EmptyState title="No matching tasks" text={f.archived ? 'No archived tasks match these filters.' : 'Nothing matches this search and these filters.'}
                action={<Button icon="x" onClick={() => setF({ search: '', status: '', priority: '', due: '', sort: f.sort, archived: false })}>Clear filters</Button>} />
            : <EmptyState title="No tasks yet" text="Add your first task to start tracking your work."
                action={<Button variant="primary" icon="plus" onClick={() => setEditing('new')}>Add Task</Button>} />
        ) : (
          <ul className="list" aria-label="Tasks">
            {tasks.data.map((t) => (
              <li key={t.id} className={`row${t.overdue ? ' overdue' : ''}${isDone(t) ? ' done' : ''}`}>
                <input type="checkbox" aria-label={`Mark "${t.title}" ${t.status === 'DONE' ? 'not done' : 'done'}`} checked={isDone(t)}
                  aria-busy={busy(t, 'complete', 'reopen') || undefined} disabled={t.archived}
                  onChange={() => { if (!busy(t, 'complete', 'reopen')) action.mutate({ task: t, op: t.status === 'DONE' ? 'reopen' : 'complete' }) }} />
                <div className="main">
                  <div className="title">{t.title}</div>
                  {t.description && <div className="muted">{t.description}</div>}
                  <div className="meta">
                    <Badge tone={STATUS_TONE[t.status]}>{label(t.status)}</Badge>
                    <Badge tone={t.priority === 'HIGH' ? 'warning' : 'neutral'}>{label(t.priority)} priority</Badge>
                    {t.dueDate && <Badge icon="plans" tone={!t.overdue && relativeDay(t.dueDate, today) === 'today' ? 'accent' : 'neutral'}>Due {relativeDay(t.dueDate, today)}</Badge>}
                    {t.overdue && <Badge tone="danger" icon="alert">Overdue</Badge>}
                  </div>
                </div>
                <div className="row-actions">
                  {!t.archived && <Button size="sm" variant="ghost" icon="pencil" onClick={() => setEditing(t)}>Edit</Button>}
                  {t.archived
                    ? <Button size="sm" variant="ghost" icon="restore" pending={busy(t, 'restore')} onClick={() => action.mutate({ task: t, op: 'restore' })}>Restore</Button>
                    : <Button size="sm" variant="ghost" icon="archive" pending={busy(t, 'archive')} onClick={() => action.mutate({ task: t, op: 'archive' })}>Archive</Button>}
                  <Button size="sm" variant="danger" icon="trash" onClick={() => setDeleting(t)}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        )}

      <Dialog title={editing === 'new' ? 'Add task' : 'Edit task'} open={editing !== null} onClose={() => setEditing(null)}>
        {editing !== null && (
          <TaskForm task={editing === 'new' ? undefined : editing} onCancel={() => setEditing(null)}
            onSaved={(t) => { refresh('tasks'); toast(editing === 'new' ? `Task "${t.title}" added` : 'Task saved'); setEditing(null) }} />
        )}
      </Dialog>
      <ConfirmDialog open={deleting !== null} title="Delete task" confirmLabel="Delete" busy={action.isPending}
        text={`Delete "${deleting?.title}" permanently? This can't be undone.`}
        onCancel={() => setDeleting(null)} onConfirm={() => deleting && action.mutate({ task: deleting, op: 'delete' })} />
    </section>
  )
}

import { useDeferredValue, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api, get, type Task } from '../api/client'
import TaskForm from '../components/TaskForm'
import { ConfirmDialog, Dialog, EmptyState, ErrorState, Loading, useToast } from '../components/ui'
import { formatDate, label } from '../lib/format'
import { useRefresh } from '../lib/queries'

type Filters = { search: string; status: string; priority: string; due: string; sort: string; archived: boolean }

export default function TasksPage() {
  const toast = useToast()
  const refresh = useRefresh()
  const [f, setF] = useState<Filters>({ search: '', status: '', priority: '', due: '', sort: 'CREATED_AT', archived: false })
  const search = useDeferredValue(f.search)
  const [editing, setEditing] = useState<Task | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Task | null>(null)

  const params = new URLSearchParams({ sort: f.sort, direction: f.sort === 'DUE_DATE' ? 'ASC' : 'DESC', archived: String(f.archived) })
  if (search.trim()) params.set('search', search.trim())
  if (f.status) params.set('status', f.status)
  if (f.priority) params.set('priority', f.priority)
  if (f.due) params.set('due', f.due)
  const tasks = useQuery({ queryKey: ['tasks', params.toString()], queryFn: () => get<Task[]>(`/tasks?${params}`) })

  const action = useMutation({
    mutationFn: ({ task, op }: { task: Task; op: 'complete' | 'reopen' | 'archive' | 'restore' | 'delete' }) =>
      op === 'delete' ? api('DELETE', `/tasks/${task.id}`) : api('POST', `/tasks/${task.id}/${op}`),
    onSuccess: (_, { task, op }) => {
      refresh('tasks')
      const done = { complete: 'completed', reopen: 'reopened', archive: 'archived', restore: 'restored', delete: 'deleted' }[op]
      toast(`"${task.title}" ${done}`)
      setDeleting(null)
    },
    onError: (e) => toast(e.message, 'error'),
  })

  const set = (patch: Partial<Filters>) => setF({ ...f, ...patch })
  const filtered = Boolean(search.trim() || f.status || f.priority || f.due)

  return (
    <section>
      <div className="page-head">
        <h1>Tasks</h1>
        <button className="primary" onClick={() => setEditing('new')}>Add Task</button>
      </div>

      <div className="toolbar" role="search">
        <input type="search" aria-label="Search tasks" placeholder="Search by title…" value={f.search} onChange={(e) => set({ search: e.target.value })} />
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
      </div>

      {tasks.isPending ? <Loading /> : tasks.isError ? <ErrorState error={tasks.error} onRetry={() => tasks.refetch()} /> :
        tasks.data.length === 0 ? (
          filtered || f.archived
            ? <EmptyState title="No matching tasks" text={f.archived ? 'No archived tasks match.' : 'Try a different search or filter.'} />
            : <EmptyState title="No tasks yet" text="Add your first task to start tracking your work."
                action={<button className="primary" onClick={() => setEditing('new')}>Add Task</button>} />
        ) : (
          <ul className="list" aria-label="Tasks">
            {tasks.data.map((t) => (
              <li key={t.id} className={`row${t.overdue ? ' overdue' : ''}${t.status === 'DONE' ? ' done' : ''}`}>
                <input type="checkbox" aria-label={`Mark "${t.title}" ${t.status === 'DONE' ? 'not done' : 'done'}`} checked={t.status === 'DONE'}
                  disabled={t.archived} onChange={() => action.mutate({ task: t, op: t.status === 'DONE' ? 'reopen' : 'complete' })} />
                <div className="main">
                  <div className="title">{t.title}</div>
                  {t.description && <div className="muted">{t.description}</div>}
                  <div className="meta">
                    <span className="badge">{label(t.status)}</span>
                    <span className={`badge${t.priority === 'HIGH' ? ' warning' : ''}`}>{label(t.priority)} priority</span>
                    {t.dueDate && <span className="badge">Due {formatDate(t.dueDate)}</span>}
                    {t.overdue && <span className="badge danger">Overdue</span>}
                  </div>
                </div>
                <div className="row-actions">
                  {!t.archived && <button onClick={() => setEditing(t)}>Edit</button>}
                  {t.archived
                    ? <button onClick={() => action.mutate({ task: t, op: 'restore' })}>Restore</button>
                    : <button onClick={() => action.mutate({ task: t, op: 'archive' })}>Archive</button>}
                  <button className="danger" onClick={() => setDeleting(t)}>Delete</button>
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

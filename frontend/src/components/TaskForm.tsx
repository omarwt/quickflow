import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api, ApiError, type Request, type Task } from '../api/client'
import { Button } from './ds'
import { Field, FormError } from './ui'

type TaskRequest = Request<'TaskRequest'>

/** Add/edit form (BR-1, BR-2 checked here too; the backend stays authoritative). */
export default function TaskForm({ task, onSaved, onCancel }: { task?: Task; onSaved: (t: Task) => void; onCancel: () => void }) {
  const [form, setForm] = useState<TaskRequest>({
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? 'TODO',
    priority: task?.priority ?? 'MEDIUM',
    dueDate: task?.dueDate ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useMutation({
    mutationFn: (body: TaskRequest) => (task ? api<Task>('PUT', `/tasks/${task.id}`, body) : api<Task>('POST', '/tasks', body)),
    onSuccess: onSaved,
  })
  const server = save.error instanceof ApiError ? save.error : undefined
  const set = (k: keyof TaskRequest, v: string) => setForm({ ...form, [k]: v })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    else if (form.title.trim().length > 200) errs.title = 'Title must be at most 200 characters'
    if ((form.description ?? '').length > 2000) errs.description = 'Description must be at most 2000 characters'
    setErrors(errs)
    if (Object.keys(errs).length === 0) save.mutate({ ...form, dueDate: form.dueDate || undefined, description: form.description || undefined })
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <Field label="Title" error={errors.title ?? server?.forField('title')}>
        <input value={form.title} onChange={(e) => set('title', e.target.value)} autoFocus />
      </Field>
      <Field label="Description" error={errors.description ?? server?.forField('description')}>
        <textarea rows={3} value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} />
      </Field>
      <div className="toolbar">
        <Field label="Status">
          <select value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="TODO">Todo</option><option value="IN_PROGRESS">In progress</option><option value="DONE">Done</option>
          </select>
        </Field>
        <Field label="Priority">
          <select value={form.priority} onChange={(e) => set('priority', e.target.value)}>
            <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
          </select>
        </Field>
        <Field label="Due date" error={server?.forField('dueDate')}>
          <input type="date" value={form.dueDate ?? ''} onChange={(e) => set('dueDate', e.target.value)} />
        </Field>
      </div>
      <FormError error={save.error} />
      <div className="actions">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" pending={save.isPending}>{task ? 'Save changes' : 'Add task'}</Button>
      </div>
    </form>
  )
}

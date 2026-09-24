import { useState, type FormEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api, ApiError, get, type Plan, type PlanSources } from '../api/client'
import { Button } from './ds'
import { Field, FormError, Loading } from './ui'

type SourceType = 'TASK' | 'HABIT' | 'LEARNING_RESOURCE'
const key = (t: SourceType, id: number) => `${t}:${id}`

/** Local "YYYY-MM-DDTHH:mm" for <input type=datetime-local>. */
function localInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** US-PLAN-1..4: pick existing items, set duration, window and priority. */
export default function PlanBuilder({ onSaved, onCancel }: { onSaved: (p: Plan) => void; onCancel: () => void }) {
  const sources = useQuery({ queryKey: ['plan-sources'], queryFn: () => get<PlanSources>('/plans/sources') })
  const start = new Date(Date.now() + 5 * 60_000)
  const [form, setForm] = useState({
    title: '', estimatedMinutes: '60', priorityOrder: '1',
    start: localInput(start), end: localInput(new Date(start.getTime() + 60 * 60_000)),
  })
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useMutation({ mutationFn: (body: unknown) => api<Plan>('POST', '/plans', body), onSuccess: onSaved })
  const server = save.error instanceof ApiError ? save.error : undefined

  const windowMinutes = (Date.parse(form.end) - Date.parse(form.start)) / 60_000
  const overWindow = windowMinutes > 0 && Number(form.estimatedMinutes) > windowMinutes // I-10: warn only

  const toggle = (k: string) => {
    const next = new Set(picked)
    if (next.has(k)) next.delete(k)
    else next.add(k)
    setPicked(next)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (picked.size === 0) errs.items = 'Pick at least one task, habit or learning resource'
    if (!(Number(form.estimatedMinutes) >= 1)) errs.estimatedMinutes = 'Estimated duration must be at least 1 minute'
    if (!(Number(form.priorityOrder) >= 1)) errs.priorityOrder = 'Priority order must be 1 or more'
    if (!form.start) errs.start = 'Start date/time is required'
    if (!form.end) errs.end = 'End date/time is required'
    else if (!(windowMinutes > 0)) errs.end = 'End date/time must be after the start date/time'
    setErrors(errs)
    if (Object.keys(errs).length) return
    save.mutate({
      title: form.title.trim(),
      items: [...picked].map((k) => { const [sourceType, id] = k.split(':'); return { sourceType, sourceId: Number(id) } }),
      estimatedMinutes: Number(form.estimatedMinutes),
      startDateTime: new Date(form.start).toISOString(),
      endDateTime: new Date(form.end).toISOString(),
      priorityOrder: Number(form.priorityOrder),
    })
  }

  const group = (title: string, type: SourceType, list: { id: number; title: string }[]) => (
    <fieldset className="picker">
      <legend>{title}</legend>
      {list.length === 0 ? <p className="muted small">None available</p> : list.map((s) => (
        <label key={s.id} className="check">
          <input type="checkbox" checked={picked.has(key(type, s.id))} onChange={() => toggle(key(type, s.id))} />
          {s.title}
        </label>
      ))}
    </fieldset>
  )

  return (
    <form className="form" onSubmit={submit} noValidate>
      <Field label="Title" error={errors.title ?? server?.forField('title')}>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
      </Field>
      <div>
        <strong>Items</strong>
        {sources.isPending ? <Loading /> : sources.data && (
          <div className="pickers">
            {group('Tasks', 'TASK', sources.data.tasks as { id: number; title: string }[])}
            {group('Habits', 'HABIT', sources.data.habits as { id: number; title: string }[])}
            {group('Learning resources', 'LEARNING_RESOURCE', sources.data.learningResources as { id: number; title: string }[])}
          </div>
        )}
        {(errors.items ?? server?.fieldErrors.find((f) => f.field.startsWith('items'))?.message) && (
          <p className="field-error" role="alert">{errors.items ?? server?.fieldErrors.find((f) => f.field.startsWith('items'))?.message}</p>
        )}
      </div>
      <div className="toolbar">
        <Field label="Start" error={errors.start ?? server?.forField('startDateTime')}>
          <input type="datetime-local" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
        </Field>
        <Field label="End" error={errors.end ?? server?.forField('endDateTime')}>
          <input type="datetime-local" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
        </Field>
      </div>
      <div className="toolbar">
        <Field label="Estimated duration (minutes)" error={errors.estimatedMinutes ?? server?.forField('estimatedMinutes')}
          hint={overWindow ? `Longer than the ${Math.round(windowMinutes)}-minute window` : undefined}>
          <input type="number" min={1} value={form.estimatedMinutes} onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })} />
        </Field>
        <Field label="Priority order" hint="1 = highest" error={errors.priorityOrder ?? server?.forField('priorityOrder')}>
          <input type="number" min={1} value={form.priorityOrder} onChange={(e) => setForm({ ...form, priorityOrder: e.target.value })} />
        </Field>
      </div>
      <FormError error={save.error} />
      <div className="actions">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" pending={save.isPending}>Create plan</Button>
      </div>
    </form>
  )
}

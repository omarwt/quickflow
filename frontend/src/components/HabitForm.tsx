import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api, ApiError, type Habit, type Request } from '../api/client'
import { Field, FormError } from './ui'

type HabitRequest = Request<'HabitRequest'>

export default function HabitForm({ habit, onSaved, onCancel }: { habit?: Habit; onSaved: (h: Habit) => void; onCancel: () => void }) {
  const [form, setForm] = useState<HabitRequest>({
    name: habit?.name ?? '',
    description: habit?.description ?? '',
    frequency: habit?.frequency ?? 'DAILY',
  })
  const [nameError, setNameError] = useState<string>()
  const save = useMutation({
    mutationFn: (body: HabitRequest) => (habit ? api<Habit>('PUT', `/habits/${habit.id}`, body) : api<Habit>('POST', '/habits', body)),
    onSuccess: onSaved,
  })
  const server = save.error instanceof ApiError ? save.error : undefined

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const name = form.name.trim()
    const err = !name ? 'Name is required' : name.length > 150 ? 'Name must be at most 150 characters' : undefined
    setNameError(err)
    if (!err) save.mutate({ ...form, description: form.description || undefined })
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <Field label="Name" error={nameError ?? server?.forField('name')}>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
      </Field>
      <Field label="Description" error={server?.forField('description')}>
        <textarea rows={2} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </Field>
      <fieldset className="radio-group">
        <legend>Repeats</legend>
        {(['DAILY', 'WEEKLY'] as const).map((f) => (
          <label key={f} className="check">
            <input type="radio" name="frequency" checked={form.frequency === f} onChange={() => setForm({ ...form, frequency: f })} />
            {f === 'DAILY' ? 'Daily' : 'Weekly'}
          </label>
        ))}
      </fieldset>
      <FormError error={save.error} />
      <div className="actions">
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit" className="primary" disabled={save.isPending}>{habit ? 'Save changes' : 'Add habit'}</button>
      </div>
    </form>
  )
}

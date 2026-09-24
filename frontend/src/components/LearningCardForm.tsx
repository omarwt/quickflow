import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api, ApiError, type LearningCard, type Request } from '../api/client'
import { Field, FormError } from './ui'

type CardRequest = Request<'LearningCardRequest'>

export default function LearningCardForm({ onSaved, onCancel }: { onSaved: (c: LearningCard) => void; onCancel: () => void }) {
  const [form, setForm] = useState<CardRequest>({ title: '', description: '', status: 'NOT_STARTED' })
  const [titleError, setTitleError] = useState<string>()
  const save = useMutation({ mutationFn: (b: CardRequest) => api<LearningCard>('POST', '/learning-cards', b), onSuccess: onSaved })
  const server = save.error instanceof ApiError ? save.error : undefined

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const err = form.title.trim() ? undefined : 'Title is required' // BR-8
    setTitleError(err)
    if (!err) save.mutate({ ...form, description: form.description || undefined })
  }
  return (
    <form className="form" onSubmit={submit} noValidate>
      <Field label="Title" error={titleError ?? server?.forField('title')}>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus placeholder="e.g. Designing Data-Intensive Applications" />
      </Field>
      <Field label="Description or source" hint="A link, book, course or topic" error={server?.forField('description')}>
        <textarea rows={2} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </Field>
      <Field label="Status">
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CardRequest['status'] })}>
          <option value="NOT_STARTED">Not started</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option>
        </select>
      </Field>
      <FormError error={save.error} />
      <div className="actions">
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit" className="primary" disabled={save.isPending}>Add card</button>
      </div>
    </form>
  )
}

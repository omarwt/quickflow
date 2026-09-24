import { useState, type FormEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api, ApiError, type LearningCard } from '../api/client'
import { pageQueries } from '../lib/pageQueries'
import LearningCardForm from '../components/LearningCardForm'
import { Badge, Button, Card, IconButton } from '../components/ds'
import { ConfirmDialog, Dialog, EmptyState, ErrorState, Loading, useToast } from '../components/ui'
import { formatDate, formatDateTime, plural } from '../lib/format'
import { useRefresh } from '../lib/queries'

type Status = LearningCard['status']
const STATUS: Record<Status, string> = { NOT_STARTED: 'Not started', IN_PROGRESS: 'In progress', COMPLETED: 'Completed' }

function CardView({ card, onRemove }: { card: LearningCard; onRemove: () => void }) {
  const toast = useToast()
  const refresh = useRefresh()
  const [open, setOpen] = useState(false)
  const [milestone, setMilestone] = useState({ title: '', targetDate: '' })
  const [note, setNote] = useState('')
  const [formError, setFormError] = useState<{ milestone?: string; note?: string }>({})

  const mutate = useMutation({
    mutationFn: ({ method, path, body }: { method: string; path: string; body?: unknown }) =>
      api<LearningCard>(method, `/learning-cards/${card.id}${path}`, body),
    onSuccess: () => refresh('learning'), // returned: pending until the refetch, so optimistic ticks don't flicker
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Request failed', 'error'),
  })

  const addMilestone = (e: FormEvent) => {
    e.preventDefault()
    if (!milestone.title.trim()) return setFormError({ milestone: 'Milestone title is required' })
    setFormError({})
    mutate.mutate({ method: 'POST', path: '/milestones', body: { title: milestone.title, targetDate: milestone.targetDate || undefined } },
      { onSuccess: () => setMilestone({ title: '', targetDate: '' }) })
  }
  const addNote = (e: FormEvent) => {
    e.preventDefault()
    if (!note.trim()) return setFormError({ note: 'Note text is required' })
    setFormError({})
    mutate.mutate({ method: 'POST', path: '/notes', body: { text: note } }, { onSuccess: () => setNote('') })
  }
  const pct = card.milestonesTotal ? Math.round((card.milestonesDone * 100) / card.milestonesTotal) : 0

  return (
    <Card className="learning" aria-label={card.title}>
      <div className="card-head">
        <h2>{card.title}</h2>
        <select aria-label={`Status of ${card.title}`} value={card.status} className="compact"
          onChange={(e) => mutate.mutate({ method: 'PUT', path: '', body: { title: card.title, description: card.description, status: e.target.value } })}>
          {Object.entries(STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      {card.description && <p className="muted">{card.description}</p>}
      <div>
        <div className="progress" role="progressbar" aria-label={`${card.title} milestones`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${pct}%` }} />
        </div>
        <p className="muted small">{card.milestonesDone} of {card.milestonesTotal} {plural(card.milestonesTotal, 'milestone')} done</p>
      </div>
      <div className="row-actions start">
        <Button size="sm" icon={open ? 'chevronUp' : 'chevronDown'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Hide details' : 'Show details'}</Button>
        <Button size="sm" variant="danger" icon="trash" onClick={onRemove}>Remove</Button>
      </div>

      {open && (
        <div className="details">
          <h3>Milestones</h3>
          {card.milestones.length === 0 && <p className="muted small">No milestones yet. Break this resource into steps.</p>}
          <ul className="list compact-list">
            {card.milestones.map((m) => (
              <li key={m.id} className={`mini-row${m.done ? ' done' : ''}`}>
                <label className="check">
                  <input type="checkbox" aria-label={`Milestone done: ${m.title}`}
                    checked={mutate.isPending && mutate.variables?.path === `/milestones/${m.id}` && mutate.variables.method === 'PATCH' ? !m.done : m.done}
                    onChange={() => { if (!mutate.isPending) mutate.mutate({ method: 'PATCH', path: `/milestones/${m.id}`, body: { done: !m.done } }) }} />
                  <span className="title">{m.title}</span>
                </label>
                {m.targetDate && <Badge icon="plans">Target {formatDate(m.targetDate)}</Badge>}
                <IconButton size="sm" variant="ghost" icon="trash" label={`Remove milestone ${m.title}`}
                  onClick={() => mutate.mutate({ method: 'DELETE', path: `/milestones/${m.id}` })} />
              </li>
            ))}
          </ul>
          <form className="inline-form" onSubmit={addMilestone} noValidate>
            <input aria-label="New milestone title" placeholder="New milestone" value={milestone.title}
              onChange={(e) => setMilestone({ ...milestone, title: e.target.value })} />
            <input type="date" aria-label="Milestone target date" value={milestone.targetDate}
              onChange={(e) => setMilestone({ ...milestone, targetDate: e.target.value })} />
            <Button type="submit" icon="plus" pending={mutate.isPending && mutate.variables?.path === '/milestones'}>Add milestone</Button>
          </form>
          {formError.milestone && <p className="field-error" role="alert">{formError.milestone}</p>}

          <h3>Notes</h3>
          {card.notes.length === 0 && <p className="muted small">No notes yet.</p>}
          <ul className="list compact-list">
            {card.notes.map((n) => (
              <li key={n.id} className="mini-row note">
                <div className="main"><p>{n.text}</p><small className="muted">{formatDateTime(n.createdAt)}</small></div>
                <IconButton size="sm" variant="ghost" icon="trash" label="Remove note" onClick={() => mutate.mutate({ method: 'DELETE', path: `/notes/${n.id}` })} />
              </li>
            ))}
          </ul>
          <form className="inline-form" onSubmit={addNote} noValidate>
            <textarea aria-label="New note" rows={2} placeholder="Write a note…" value={note} onChange={(e) => setNote(e.target.value)} />
            <Button type="submit" icon="plus" pending={mutate.isPending && mutate.variables?.path === '/notes'}>Add note</Button>
          </form>
          {formError.note && <p className="field-error" role="alert">{formError.note}</p>}
        </div>
      )}
    </Card>
  )
}

export default function LearningPage() {
  const toast = useToast()
  const refresh = useRefresh()
  const cards = useQuery(pageQueries.learning())
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<LearningCard | null>(null)
  const remove = useMutation({
    mutationFn: (c: LearningCard) => api('DELETE', `/learning-cards/${c.id}`),
    onSuccess: (_, c) => { refresh('learning'); toast(`"${c.title}" removed`); setRemoving(null) },
    onError: (e) => toast(e.message, 'error'),
  })

  return (
    <section>
      <div className="page-head">
        <h1>Learning Resources</h1>
        <Button variant="primary" icon="plus" onClick={() => setAdding(true)}>Add Learning Card</Button>
      </div>
      {cards.isPending ? <Loading variant="cards" count={2} /> : cards.isError ? <ErrorState error={cards.error} onRetry={() => cards.refetch()} /> :
        cards.data.length === 0 ? (
          <EmptyState title="No learning cards yet" text="Add a course, book or topic, then break it into milestones."
            action={<Button variant="primary" icon="plus" onClick={() => setAdding(true)}>Add Learning Card</Button>} />
        ) : (
          <div className="grid wide">{cards.data.map((c) => <CardView key={c.id} card={c} onRemove={() => setRemoving(c)} />)}</div>
        )}
      <Dialog title="Add learning card" open={adding} onClose={() => setAdding(false)}>
        {adding && <LearningCardForm onCancel={() => setAdding(false)}
          onSaved={(c) => { refresh('learning'); toast(`"${c.title}" added`); setAdding(false) }} />}
      </Dialog>
      <ConfirmDialog open={removing !== null} title="Remove learning card" confirmLabel="Remove" busy={remove.isPending}
        text={`Remove "${removing?.title}" with its milestones and notes?`}
        onCancel={() => setRemoving(null)} onConfirm={() => removing && remove.mutate(removing)} />
    </section>
  )
}

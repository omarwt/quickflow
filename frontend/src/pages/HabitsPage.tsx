import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api, get, type Dashboard, type Habit } from '../api/client'
import HabitForm from '../components/HabitForm'
import HabitToggle from '../components/HabitToggle'
import { ConfirmDialog, Dialog, EmptyState, ErrorState, Loading, useToast } from '../components/ui'
import { useRefresh } from '../lib/queries'

function streakText(h: Habit) {
  const n = h.progress.currentStreak
  const unit = h.frequency === 'DAILY' ? 'day' : 'week'
  return n === 0 ? 'No streak yet' : `${n}-${unit} streak`
}

export default function HabitsPage() {
  const toast = useToast()
  const refresh = useRefresh()
  const habits = useQuery({ queryKey: ['habits'], queryFn: () => get<Habit[]>('/habits') })
  // "today" in the user's timezone comes from the server, not the browser clock
  const today = useQuery({ queryKey: ['dashboard'], queryFn: () => get<Dashboard>('/dashboard') }).data?.today
  const [editing, setEditing] = useState<Habit | 'new' | null>(null)
  const [removing, setRemoving] = useState<Habit | null>(null)

  const action = useMutation({
    mutationFn: ({ habit, op }: { habit: Habit; op: 'activate' | 'deactivate' | 'delete' }) =>
      op === 'delete' ? api('DELETE', `/habits/${habit.id}`) : api('POST', `/habits/${habit.id}/${op}`),
    onSuccess: (_, { habit, op }) => {
      refresh('habits')
      toast(`"${habit.name}" ${op === 'delete' ? 'removed' : op + 'd'}`)
      setRemoving(null)
    },
    onError: (e) => toast(e.message, 'error'),
  })

  const card = (h: Habit) => (
    <article key={h.id} className={`card habit${h.active ? '' : ' inactive'}`} aria-label={h.name}>
      <div className="habit-head">
        <h2>{h.name}</h2>
        <span className="badge">{h.frequency === 'DAILY' ? 'Daily' : 'Weekly'}</span>
      </div>
      {h.description && <p className="muted">{h.description}</p>}
      <p className="streak">{streakText(h)}</p>
      {h.frequency === 'WEEKLY' && (
        <p className="muted small">{h.progress.completedThisPeriod ? 'Done this week' : 'Not done this week yet'}</p>
      )}
      {h.active && today && <HabitToggle habit={h} today={today} />}
      {!h.active && <p className="muted small">Inactive: not tracked</p>}
      <div className="row-actions">
        <button onClick={() => setEditing(h)}>Edit</button>
        <button onClick={() => action.mutate({ habit: h, op: h.active ? 'deactivate' : 'activate' })}>{h.active ? 'Deactivate' : 'Activate'}</button>
        <button className="danger" onClick={() => setRemoving(h)}>Remove</button>
      </div>
    </article>
  )

  const active = habits.data?.filter((h) => h.active) ?? []
  const inactive = habits.data?.filter((h) => !h.active) ?? []

  return (
    <section>
      <div className="page-head">
        <h1>Habits</h1>
        <button className="primary" onClick={() => setEditing('new')}>Add Habit</button>
      </div>
      {habits.isPending ? <Loading /> : habits.isError ? <ErrorState error={habits.error} onRetry={() => habits.refetch()} /> :
        habits.data.length === 0 ? (
          <EmptyState title="No habits yet" text="Add a daily or weekly habit and tick it off each time you do it."
            action={<button className="primary" onClick={() => setEditing('new')}>Add Habit</button>} />
        ) : (
          <>
            <div className="grid">{active.map(card)}</div>
            {inactive.length > 0 && (
              <>
                <h2 className="section-title">Inactive</h2>
                <div className="grid">{inactive.map(card)}</div>
              </>
            )}
          </>
        )}
      <Dialog title={editing === 'new' ? 'Add habit' : 'Edit habit'} open={editing !== null} onClose={() => setEditing(null)}>
        {editing !== null && (
          <HabitForm habit={editing === 'new' ? undefined : editing} onCancel={() => setEditing(null)}
            onSaved={(h) => { refresh('habits'); toast(editing === 'new' ? `Habit "${h.name}" added` : 'Habit saved'); setEditing(null) }} />
        )}
      </Dialog>
      <ConfirmDialog open={removing !== null} title="Remove habit" confirmLabel="Remove" busy={action.isPending}
        text={`Remove "${removing?.name}" and its completion history? This can't be undone.`}
        onCancel={() => setRemoving(null)} onConfirm={() => removing && action.mutate({ habit: removing, op: 'delete' })} />
    </section>
  )
}

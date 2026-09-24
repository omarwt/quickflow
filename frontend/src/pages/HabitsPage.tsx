import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api, type Habit } from '../api/client'
import HabitForm from '../components/HabitForm'
import HabitToggle from '../components/HabitToggle'
import { Badge, Button, Card, Icon } from '../components/ds'
import { ConfirmDialog, Dialog, EmptyState, ErrorState, Loading, useToast } from '../components/ui'
import { useRefresh } from '../lib/queries'
import { pageQueries } from '../lib/pageQueries'

function streakText(h: Habit) {
  const n = h.progress.currentStreak
  const unit = h.frequency === 'DAILY' ? 'day' : 'week'
  return n === 0 ? 'No streak yet' : `${n}-${unit} streak`
}

export default function HabitsPage() {
  const toast = useToast()
  const refresh = useRefresh()
  const habits = useQuery(pageQueries.habits())
  // "today" in the user's timezone comes from the server, not the browser clock
  const today = useQuery(pageQueries.dashboard()).data?.today
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
    <Card key={h.id} className={`habit${h.active ? '' : ' inactive'}`} aria-label={h.name}>
      <div className="card-head">
        <h2>{h.name}</h2>
        <Badge tone="accent">{h.frequency === 'DAILY' ? 'Daily' : 'Weekly'}</Badge>
      </div>
      {h.description && <p className="muted">{h.description}</p>}
      <p className="streak"><Icon name="habits" size={16} />{streakText(h)}</p>
      {h.frequency === 'WEEKLY' && (
        <p className="muted small">{h.progress.completedThisPeriod ? 'Done this week' : 'Not done this week yet'}</p>
      )}
      {h.active && today && <HabitToggle habit={h} today={today} />}
      {!h.active && <p className="muted small">Inactive: not tracked</p>}
      <div className="row-actions">
        <Button size="sm" variant="ghost" icon="pencil" onClick={() => setEditing(h)}>Edit</Button>
        <Button size="sm" variant="ghost" icon={h.active ? 'archive' : 'restore'}
          pending={action.isPending && action.variables?.habit.id === h.id && action.variables.op !== 'delete'}
          onClick={() => action.mutate({ habit: h, op: h.active ? 'deactivate' : 'activate' })}>{h.active ? 'Deactivate' : 'Activate'}</Button>
        <Button size="sm" variant="danger" icon="trash" onClick={() => setRemoving(h)}>Remove</Button>
      </div>
    </Card>
  )

  const active = habits.data?.filter((h) => h.active) ?? []
  const inactive = habits.data?.filter((h) => !h.active) ?? []

  return (
    <section>
      <div className="page-head">
        <h1>Habits</h1>
        <Button variant="primary" icon="plus" onClick={() => setEditing('new')}>Add Habit</Button>
      </div>
      {habits.isPending ? <Loading variant="cards" /> : habits.isError ? <ErrorState error={habits.error} onRetry={() => habits.refetch()} /> :
        habits.data.length === 0 ? (
          <EmptyState title="No habits yet" text="Add a daily or weekly habit and tick it off each time you do it."
            action={<Button variant="primary" icon="plus" onClick={() => setEditing('new')}>Add Habit</Button>} />
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

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api, type Plan } from '../api/client'
import { pageQueries } from '../lib/pageQueries'
import PlanBuilder from '../components/PlanBuilder'
import PlanCard from '../components/PlanCard'
import { Button } from '../components/ds'
import { ConfirmDialog, Dialog, EmptyState, ErrorState, Loading, useToast } from '../components/ui'
import { useRefresh } from '../lib/queries'

export default function PlansPage() {
  const toast = useToast()
  const refresh = useRefresh()
  // refetches every 30 s (see pageQueries) so status changes made by the clock show up without user action
  const plans = useQuery(pageQueries.plans())
  const [building, setBuilding] = useState(false)
  const [removing, setRemoving] = useState<Plan | null>(null)
  const remove = useMutation({
    mutationFn: (p: Plan) => api('DELETE', `/plans/${p.id}`),
    onSuccess: (_, p) => { refresh('plans'); toast(`Plan "${p.title}" removed`); setRemoving(null) },
    onError: (e) => toast(e.message, 'error'),
  })

  const all = plans.data ?? []
  const active = all.filter((p) => p.status !== 'COMPLETED') // already sorted by priority, then start
  const history = all.filter((p) => p.status === 'COMPLETED').sort((a, b) => b.endDateTime.localeCompare(a.endDateTime))
  const card = (p: Plan) => <PlanCard key={p.id} plan={p} receivedAt={plans.dataUpdatedAt} onRemove={() => setRemoving(p)} />

  return (
    <section>
      <div className="page-head">
        <h1>Todo Plans</h1>
        <Button variant="primary" icon="plus" onClick={() => setBuilding(true)}>Create Plan</Button>
      </div>
      {plans.isPending ? <Loading variant="cards" count={2} /> : plans.isError ? <ErrorState error={plans.error} onRetry={() => plans.refetch()} /> :
        all.length === 0 ? (
          <EmptyState title="No plans yet" text="Bundle existing tasks, habits and learning resources into a time-boxed plan."
            action={<Button variant="primary" icon="plus" onClick={() => setBuilding(true)}>Create Plan</Button>} />
        ) : (
          <>
            <h2 className="section-title">Active and upcoming</h2>
            {active.length ? <div className="grid wide">{active.map(card)}</div> : <p className="muted">Nothing scheduled.</p>}
            <h2 className="section-title">Completed</h2>
            {history.length ? <div className="grid wide">{history.map(card)}</div> : <p className="muted">No completed plans yet.</p>}
          </>
        )}
      <Dialog title="Create plan" open={building} onClose={() => setBuilding(false)}>
        {building && <PlanBuilder onCancel={() => setBuilding(false)}
          onSaved={(p) => { refresh('plans'); toast(`Plan "${p.title}" created`); setBuilding(false) }} />}
      </Dialog>
      <ConfirmDialog open={removing !== null} title="Remove plan" confirmLabel="Remove" busy={remove.isPending}
        text={`Remove the plan "${removing?.title}"? Its tasks, habits and learning resources are kept.`}
        onCancel={() => setRemoving(null)} onConfirm={() => removing && remove.mutate(removing)} />
    </section>
  )
}

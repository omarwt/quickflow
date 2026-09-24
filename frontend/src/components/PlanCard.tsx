import { useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api, type Plan, type PlanItem } from '../api/client'
import { formatDateTime, label } from '../lib/format'
import { useRefresh } from '../lib/queries'
import { formatRest, remainingSeconds, useNow } from '../lib/time'
import { useToast } from './ui'

const SOURCE: Record<string, string> = { TASK: 'Task', HABIT: 'Habit', LEARNING_RESOURCE: 'Learning' }

/** One plan: progress, live rest time, per-item done toggles (FR-08). Shared by Todo Plans and the dashboard. */
export default function PlanCard({ plan, receivedAt, onRemove, compact }: {
  plan: Plan; receivedAt: number; onRemove?: () => void; compact?: boolean
}) {
  const toast = useToast()
  const refresh = useRefresh()
  const now = useNow()
  const toEnd = remainingSeconds(plan.endDateTime, plan.serverTime, receivedAt, now)
  const toStart = remainingSeconds(plan.startDateTime, plan.serverTime, receivedAt, now)

  // When a boundary passes (start reached or time up), ask the server for the new status.
  const boundary = plan.status === 'NOT_STARTED' ? toStart <= 0 : plan.status === 'IN_PROGRESS' && toEnd <= 0
  const asked = useRef(false)
  useEffect(() => {
    if (boundary && !asked.current) {
      asked.current = true
      refresh('plans')
    }
  }, [boundary, refresh])

  const toggle = useMutation({
    mutationFn: ({ itemId, done }: { itemId: number; done: boolean }) => api<Plan>('PATCH', `/plans/${plan.id}/items/${itemId}`, { done }),
    // BR-13: the item may also have completed a task or a habit, so those views refresh too
    onSuccess: () => refresh('plans', 'tasks', 'habits'),
    onError: (e) => toast(e.message, 'error'),
  })

  return (
    <article className={`card plan ${plan.status.toLowerCase()}`} aria-label={plan.title}>
      <div className="habit-head">
        <h2>{plan.title}</h2>
        <span className={`badge${plan.status === 'IN_PROGRESS' ? ' success' : ''}`}>{label(plan.status)}</span>
      </div>
      <p className="muted small">
        Priority {plan.priorityOrder} · {formatDateTime(plan.startDateTime)} → {formatDateTime(plan.endDateTime)} · est. {plan.estimatedMinutes} min
      </p>
      {plan.status === 'IN_PROGRESS' && (
        <p className="rest" aria-live="off">Rest time: <strong data-testid="rest-time">{formatRest(toEnd)}</strong></p>
      )}
      {plan.status === 'NOT_STARTED' && <p className="muted small">Starts in {formatRest(toStart)}</p>}
      <div>
        <div className="progress" role="progressbar" aria-label={`${plan.title} progress`} aria-valuenow={plan.progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${plan.progressPercent}%` }} />
        </div>
        <p className="small"><strong>{plan.progressPercent}%</strong> complete · {plan.doneCount} of {plan.totalCount} items done</p>
      </div>
      {!compact && (
        <ul className="list compact-list">
          {(plan.items as PlanItem[]).map((i) => (
            <li key={i.id} className={`mini-row${i.done ? ' done' : ''}`}>
              <label className="check">
                <input type="checkbox" checked={i.done} disabled={toggle.isPending} aria-label={`Plan item done: ${i.title}`}
                  onChange={() => toggle.mutate({ itemId: i.id, done: !i.done })} />
                <span className="title">{i.title}</span>
              </label>
              <span className="badge">{SOURCE[i.sourceType]}</span>
              {!i.sourceAvailable && <span className="badge danger">deleted</span>}
            </li>
          ))}
        </ul>
      )}
      {onRemove && <div className="row-actions start"><button className="danger" onClick={onRemove}>Remove</button></div>}
    </article>
  )
}

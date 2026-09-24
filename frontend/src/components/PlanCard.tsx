import { useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api, type Plan, type PlanItem } from '../api/client'
import { formatWindow, label, plural } from '../lib/format'
import { useRefresh } from '../lib/queries'
import { formatRest, remainingSeconds, useNow } from '../lib/time'
import { useToast } from './ui'
import { Badge, Button, Card, Icon, type Tone } from './ds'

const STATUS_TONE: Record<Plan['status'], Tone> = { NOT_STARTED: 'neutral', IN_PROGRESS: 'success', COMPLETED: 'accent' }
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
  // UX-PLAN start highlight: stays for the first 10 minutes, so a start can't be missed once its message has closed
  const justStarted = plan.status === 'IN_PROGRESS' && toStart > -600

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
    onSuccess: () => refresh('plans', 'tasks', 'habits'), // returned, so the toggle stays pending until the refetch
    onError: (e) => toast(e.message, 'error'),
  })

  return (
    <Card className={`plan ${plan.status.toLowerCase()}`} aria-label={plan.title}>
      <div className="card-head">
        <h2>{plan.title}</h2>
        <span className="badges">
          {justStarted && <Badge tone="accent" icon="clock">Just started</Badge>}
          <Badge tone={STATUS_TONE[plan.status]}>{label(plan.status)}</Badge>
        </span>
      </div>
      <p className="muted small">
        Priority {plan.priorityOrder} · {formatWindow(plan.startDateTime, plan.endDateTime)} · est. {plan.estimatedMinutes} min
      </p>
      {plan.status === 'IN_PROGRESS' && (
        <p className="rest" aria-live="off"><Icon name="clock" />Rest time: <strong data-testid="rest-time">{formatRest(toEnd)}</strong></p>
      )}
      {plan.status === 'NOT_STARTED' && <p className="muted small">Starts in {formatRest(toStart)}</p>}
      <div>
        <div className="progress" role="progressbar" aria-label={`${plan.title} progress`} aria-valuenow={plan.progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${plan.progressPercent}%` }} />
        </div>
        <p className="small"><strong>{plan.progressPercent}%</strong> complete · {plan.doneCount} of {plan.totalCount} {plural(plan.totalCount, 'item')} done</p>
      </div>
      {!compact && (
        <ul className="list compact-list">
          {(plan.items as PlanItem[]).map((i) => (
            <li key={i.id} className={`mini-row${i.done ? ' done' : ''}`}>
              <label className="check">
                <input type="checkbox" checked={toggle.isPending && toggle.variables?.itemId === i.id ? toggle.variables.done : i.done}
                  aria-busy={(toggle.isPending && toggle.variables?.itemId === i.id) || undefined} aria-label={`Plan item done: ${i.title}`}
                  onChange={() => { if (!toggle.isPending) toggle.mutate({ itemId: i.id, done: !i.done }) }} />
                <span className="title">{i.title}</span>
              </label>
              <Badge>{SOURCE[i.sourceType]}</Badge>
              {!i.sourceAvailable && <Badge tone="danger">deleted</Badge>}
            </li>
          ))}
        </ul>
      )}
      {onRemove && <div className="row-actions start"><Button size="sm" variant="danger" icon="trash" onClick={onRemove}>Remove</Button></div>}
    </Card>
  )
}

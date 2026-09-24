import { useState, type ReactNode } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api, type Habit, type LearningCard, type Model, type Plan, type Task } from '../api/client'
import HabitForm from '../components/HabitForm'
import HabitToggle from '../components/HabitToggle'
import LearningCardForm from '../components/LearningCardForm'
import PlanBuilder from '../components/PlanBuilder'
import PlanCard from '../components/PlanCard'
import TaskForm from '../components/TaskForm'
import { Badge, Card, Icon, Menu, type IconName } from '../components/ds'
import { Dialog, EmptyState, ErrorState, Loading, useToast } from '../components/ui'
import { formatDate, formatWindow, label, plural, todayIn } from '../lib/format'
import { pageQueries, taskParams, DEFAULT_TASK_FILTERS } from '../lib/pageQueries'
import { useRefresh } from '../lib/queries'

type QuickAdd = 'task' | 'habit' | 'learning' | 'plan' | null

function greeting(hour = new Date().getHours()) {
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

/** Summary tile: one number that matters, a short breakdown, and a link to the full page. */
function Stat({ title, icon, value, detail, to, progress }: {
  title: string; icon: IconName; value: string; detail: string; to: string; progress?: number
}) {
  return (
    <Card className="stat" aria-label={title}>
      <div className="stat-head"><Icon name={icon} /><h2>{title}</h2></div>
      <p className="stat-value">{value}</p>
      {progress !== undefined && (
        <div className="progress" role="progressbar" aria-label={`${title} progress`} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${progress}%` }} />
        </div>
      )}
      <p className="muted small">{detail}</p>
      <Link className="stat-link small" to={to}>Open {title.toLowerCase()}</Link>
    </Card>
  )
}

/** Tick a task done (or back) straight from the dashboard; optimistic like the Tasks page (UX-FEED). */
function TaskRow({ task }: { task: Task }) {
  const toast = useToast()
  const refresh = useRefresh()
  const done = task.status === 'DONE'
  const toggle = useMutation({
    mutationFn: () => api('POST', `/tasks/${task.id}/${done ? 'reopen' : 'complete'}`),
    onSuccess: () => { toast(`"${task.title}" ${done ? 'reopened' : 'completed'}`); return refresh('tasks') },
    onError: (e) => toast(e.message, 'error'),
  })
  const shown = toggle.isPending ? !done : done
  return (
    <li className={`mini-row${shown ? ' done' : ''}`}>
      <label className="check">
        <input type="checkbox" checked={shown} aria-busy={toggle.isPending || undefined}
          aria-label={`Mark "${task.title}" ${done ? 'not done' : 'done'}`} onChange={() => { if (!toggle.isPending) toggle.mutate() }} />
        <span className="title">{task.title}</span>
      </label>
      {task.priority === 'HIGH' && <Badge tone="warning">High</Badge>}
      {task.overdue && task.dueDate && <Badge tone="danger" icon="alert">Due {formatDate(task.dueDate)}</Badge>}
    </li>
  )
}

function Section({ title, count, to, children }: { title: string; count?: number; to: string; children: ReactNode }) {
  return (
    <Card className="dash-section" aria-label={title}>
      <div className="card-head">
        <h2>{title}{count !== undefined && <span className="muted"> · {count}</span>}</h2>
        <Link className="small" to={to}>View all</Link>
      </div>
      {children}
    </Card>
  )
}

export default function DashboardPage() {
  const toast = useToast()
  const refresh = useRefresh()
  const dash = useQuery(pageQueries.dashboard())
  // FR-09 lists the dashboard summary doesn't carry: tasks completed today, the next plan, cards in progress
  const doneTasks = useQuery(pageQueries.tasks(taskParams({ ...DEFAULT_TASK_FILTERS, status: 'DONE' }))).data ?? []
  const plansQuery = useQuery(pageQueries.plans())
  const allPlans = plansQuery.data ?? []
  const cardList = useQuery(pageQueries.learning()).data ?? []
  const tz = useQuery(pageQueries.settings()).data?.timezone ?? 'UTC'
  const [adding, setAdding] = useState<QuickAdd>(null)
  const saved = (what: string, key: string) => { refresh(key); toast(what); setAdding(null) }

  const quickAdd = (
    <Menu label="Quick add" trigger={{ icon: 'plus', text: 'Quick add' }} items={[
      { label: 'Add task', icon: 'tasks', onSelect: () => setAdding('task') },
      { label: 'Add habit', icon: 'habits', onSelect: () => setAdding('habit') },
      { label: 'Add learning card', icon: 'learning', onSelect: () => setAdding('learning') },
      { label: 'Create plan', icon: 'plans', onSelect: () => setAdding('plan') },
    ]} />
  )

  if (dash.isPending) return <section><h1>Dashboard</h1><Loading variant="cards" count={4} /></section>
  if (dash.isError) return <section><h1>Dashboard</h1><ErrorState error={dash.error} onRetry={() => dash.refetch()} /></section>

  // springdoc marks nested fields optional; the backend always sends them (see docs/architecture.md)
  const tasks = dash.data.tasks as Model<'DashboardTasks'>
  const habits = dash.data.habits as Model<'DashboardHabits'>
  const plans = dash.data.plans as Model<'DashboardPlans'>
  const learning = dash.data.learning as Model<'DashboardLearning'>
  const cards = learning.cardsByStatus as Record<string, number>
  const cardTotal = Object.values(cards).reduce((a, b) => a + b, 0)
  const milestonePct = learning.milestonesTotal ? Math.round((learning.milestonesDone * 100) / learning.milestonesTotal) : 0
  const habitList = habits.today as Habit[]
  const active = plans.inProgress as Plan[]
  const completedToday = doneTasks.filter((t) => t.completedAt && todayIn(tz, new Date(t.completedAt)) === dash.data.today)
  const next = allPlans.filter((p) => p.status === 'NOT_STARTED').sort((a, b) => a.startDateTime.localeCompare(b.startDateTime))[0]
  const lastDone = allPlans.filter((p) => p.status === 'COMPLETED').sort((a, b) => b.endDateTime.localeCompare(a.endDateTime))[0]
  const plansAt = plansQuery.dataUpdatedAt // live timers of /plans cards count from that response
  // learning snapshot: up to three real cards, the ones being worked on first
  const ORDER: Record<string, number> = { IN_PROGRESS: 0, NOT_STARTED: 1, COMPLETED: 2 }
  const topCards = [...cardList].sort((a, b) => ORDER[a.status] - ORDER[b.status] || b.milestonesDone - a.milestonesDone).slice(0, 3)

  return (
    <section className="dashboard">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">{greeting()}, {dash.data.displayName} · {formatDate(dash.data.today)}</p>
        </div>
        {quickAdd}
      </div>

      <div className="stats">
        <Stat title="Tasks" icon="tasks" to="/tasks" value={`${tasks.completionPercent}%`} progress={tasks.completionPercent}
          detail={`${tasks.done} of ${tasks.total} done · ${tasks.completedToday} today · ${tasks.overdue.length} overdue`} />
        <Stat title="Habits" icon="habits" to="/habits" value={`${habits.completedToday}/${habits.active}`}
          progress={habits.active ? Math.round((habits.completedToday * 100) / habits.active) : 0}
          detail={`${habits.completedToday} of ${habits.active} ${plural(habits.active, 'active habit')} done today`} />
        <Stat title="Plans" icon="plans" to="/plans" value={String(active.length)}
          detail={`in progress · ${plans.notStarted} upcoming · ${plans.completed} completed`} />
        <Stat title="Learning" icon="learning" to="/learning" value={`${milestonePct}%`} progress={milestonePct}
          detail={`${learning.milestonesDone} of ${learning.milestonesTotal} ${plural(learning.milestonesTotal, 'milestone')} · ${learning.milestonesCompletedLast7Days} this week`} />
      </div>

      <div className="dash-grid">
        <Section title="Today's tasks" count={tasks.dueToday.length} to="/tasks">
          {tasks.dueToday.length === 0
            ? <p className="muted small">Nothing due today.</p>
            : <ul className="list compact-list" aria-label="Today's tasks">{(tasks.dueToday as Task[]).map((t) => <TaskRow key={t.id} task={t} />)}</ul>}
        </Section>

        <Section title="Overdue" count={tasks.overdue.length} to="/tasks">
          {tasks.overdue.length === 0
            ? <p className="muted small">No overdue tasks. Nice.</p>
            : <ul className="list compact-list" aria-label="Overdue tasks">{(tasks.overdue as Task[]).map((t) => <TaskRow key={t.id} task={t} />)}</ul>}
        </Section>

        <Section title="Completed today" count={completedToday.length} to="/tasks">
          {completedToday.length === 0
            ? <p className="muted small">Nothing completed yet today.</p>
            : <ul className="list compact-list" aria-label="Completed today">{completedToday.map((t) => <TaskRow key={t.id} task={t} />)}</ul>}
        </Section>

        <Section title="Habits today" count={habitList.length} to="/habits">
          {habitList.length === 0
            ? <EmptyState title="No active habits" text="Add a habit to build a daily or weekly routine." />
            : <ul className="list compact-list" aria-label="Habit checklist">{habitList.map((h) => (
                <li key={h.id} className="mini-row"><span className="title main">{h.name}</span><HabitToggle habit={h} today={dash.data.today} /></li>
              ))}</ul>}
        </Section>

        <Section title={active.length ? 'Active plans' : 'Plans'} count={active.length || undefined} to="/plans">
          {active.length > 0
            ? <div className="plan-stack">{active.map((p) => <PlanCard key={p.id} plan={p} receivedAt={dash.dataUpdatedAt} compact />)}</div>
            : <p className="muted small">No plan is running right now.</p>}
          {/* nothing running: still show real plans, the next one and the last finished one */}
          {active.length === 0 && (next || lastDone) && (
            <div className="plan-stack">
              {next && <PlanCard plan={next} receivedAt={plansAt} compact />}
              {lastDone && <PlanCard plan={lastDone} receivedAt={plansAt} compact />}
            </div>
          )}
          {active.length > 0 && next && (
            <p className="next-plan small"><Icon name="clock" size={16} /><span>Next: <strong>{next.title}</strong> · {formatWindow(next.startDateTime, next.endDateTime)}</span></p>
          )}
          {allPlans.length === 0 && <p className="muted small">No plans yet. Use Quick add to create one from your tasks, habits and learning.</p>}
        </Section>

        <Section title="Learning" to="/learning">
          {cardTotal === 0
            ? <p className="muted small">No learning cards yet.</p>
            : <>
                <ul className="status-counts" aria-label="Learning cards by status">{Object.entries(cards).map(([status, n]) => (
                  <li key={status}><Badge tone={status === 'COMPLETED' ? 'success' : status === 'IN_PROGRESS' ? 'accent' : 'neutral'}>{n}</Badge> {label(status)}</li>
                ))}</ul>
                <ul className="list compact-list" aria-label="Learning cards">{topCards.map((c: LearningCard) => {
                  const pct = c.milestonesTotal ? Math.round((c.milestonesDone * 100) / c.milestonesTotal) : 0
                  return (
                    <li key={c.id} className="mini-row card-progress">
                      <div className="main">
                        <span className="title">{c.title}</span>
                        <div className="progress" role="progressbar" aria-label={`${c.title} milestones`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${pct}%` }} /></div>
                      </div>
                      <Badge tone={c.status === 'COMPLETED' ? 'success' : c.status === 'IN_PROGRESS' ? 'accent' : 'neutral'}>{label(c.status)}</Badge>
                      <span className="muted small">{c.milestonesDone}/{c.milestonesTotal}</span>
                    </li>
                  )
                })}</ul>
                <p className="muted small">{learning.milestonesCompletedLast7Days} {plural(learning.milestonesCompletedLast7Days, 'milestone')} completed in the last 7 days</p>
              </>}
        </Section>
      </div>

      <Dialog title="Add task" open={adding === 'task'} onClose={() => setAdding(null)}>
        <TaskForm onCancel={() => setAdding(null)} onSaved={(t) => saved(`Task "${t.title}" added`, 'tasks')} />
      </Dialog>
      <Dialog title="Add habit" open={adding === 'habit'} onClose={() => setAdding(null)}>
        <HabitForm onCancel={() => setAdding(null)} onSaved={(h) => saved(`Habit "${h.name}" added`, 'habits')} />
      </Dialog>
      <Dialog title="Add learning card" open={adding === 'learning'} onClose={() => setAdding(null)}>
        <LearningCardForm onCancel={() => setAdding(null)} onSaved={(c) => saved(`"${c.title}" added`, 'learning')} />
      </Dialog>
      <Dialog title="Create plan" open={adding === 'plan'} onClose={() => setAdding(null)}>
        <PlanBuilder onCancel={() => setAdding(null)} onSaved={(p) => saved(`Plan "${p.title}" created`, 'plans')} />
      </Dialog>
    </section>
  )
}

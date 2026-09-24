import { useEffect, useState, useSyncExternalStore, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError, type Model, type Settings } from '../api/client'
import { pageQueries } from '../lib/pageQueries'
import { formatDate, plural } from '../lib/format'
import { useNow } from '../lib/time'
import { setTheme, useTheme, type Theme } from '../lib/theme'
import { Badge, Button, Card, Icon, type Tone } from '../components/ds'
import { ErrorState, Field, FormError, Loading, useToast } from '../components/ui'

const VIEWS: { value: Settings['defaultView']; label: string }[] = [
  { value: 'DASHBOARD', label: 'Dashboard' },
  { value: 'TASKS', label: 'Tasks' },
  { value: 'HABITS', label: 'Habits' },
  { value: 'LEARNING', label: 'Learning Resources' },
  { value: 'PLANS', label: 'Todo Plans' },
]
const TIMEZONES = [...new Set(['UTC', ...Intl.supportedValuesOf('timeZone')])]
const THEMES: { value: Theme; label: string }[] = [
  { value: 'system', label: 'Match system' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' },
]

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'

/** Browser notification permission, re-read when the user answers the prompt. */
function subscribePermission(onChange: () => void) {
  let status: PermissionStatus | undefined
  navigator.permissions?.query({ name: 'notifications' }).then((s) => { status = s; s.onchange = onChange }).catch(() => {})
  return () => { if (status) status.onchange = null }
}
const readPermission = () => ('Notification' in window ? Notification.permission : 'unsupported') as NotificationPermission | 'unsupported'
const usePermission = () => useSyncExternalStore(subscribePermission, readPermission)

/** Read-only profile summary: who, since when, and how much is in QuickFlow (UX-SET "profile information"). */
function ProfileSummary({ settings }: { settings: Settings }) {
  const dash = useQuery(pageQueries.dashboard()).data
  const tasks = useQuery(pageQueries.tasks()).data ?? []
  const habits = useQuery(pageQueries.habits()).data ?? []
  const cards = useQuery(pageQueries.learning()).data ?? []
  const plans = useQuery(pageQueries.plans()).data ?? []
  const created = [...tasks, ...habits, ...cards, ...plans].map((x) => x.createdAt).filter(Boolean).sort()[0]
  const d = dash?.tasks as Model<'DashboardTasks'> | undefined
  const counts: [number, string][] = [[tasks.length, 'task'], [habits.length, 'habit'], [cards.length, 'learning card'], [plans.length, 'plan']]
  return (
    <Card className="profile" aria-label="Profile summary">
      <span className="avatar" aria-hidden="true">{initials(settings.displayName)}</span>
      <div className="profile-main">
        <h2>{settings.displayName}</h2>
        <p className="muted small">{settings.email || 'No email added'}</p>
        <p className="muted small">{created ? `Using QuickFlow since ${formatDate(created.slice(0, 10))}` : 'Nothing added yet'}</p>
        <ul className="profile-counts" aria-label="Your data">
          {counts.map(([n, word]) => <li key={word}><strong>{n}</strong> {plural(n, word)}</li>)}
          {d && <li><strong>{d.completionPercent}%</strong> of tasks done</li>}
        </ul>
      </div>
    </Card>
  )
}

export default function SettingsPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const query = useQuery(pageQueries.settings())
  const [form, setForm] = useState<Settings | null>(null)
  const [nameError, setNameError] = useState<string>()
  const theme = useTheme()
  const permission = usePermission()
  const now = useNow(30_000)
  useEffect(() => {
    if (query.data) setForm({ ...query.data, email: query.data.email ?? '' })
  }, [query.data])

  const save = useMutation({
    mutationFn: (s: Settings) => api<Settings>('PUT', '/settings', s),
    onSuccess: (s) => {
      qc.setQueryData(['settings'], s)
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast('Settings saved')
    },
  })

  if (query.isPending) return <section><h1>Settings</h1><Loading variant="form" count={4} /></section>
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />
  if (!form) return null

  const saved = { ...query.data, email: query.data.email ?? '' }
  const dirty = JSON.stringify(form) !== JSON.stringify(saved)
  const err = save.error instanceof ApiError ? save.error : undefined
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setForm({ ...form, [k]: v })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.displayName.trim()) return setNameError('Display name is required')
    setNameError(undefined)
    save.mutate({ ...form, email: form.email?.trim() || null } as Settings)
  }
  const localTime = new Intl.DateTimeFormat(undefined, { timeZone: form.timezone, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(now)
  const permissionInfo: Record<string, [Tone, string]> = {
    granted: ['success', 'Browser notifications allowed'], denied: ['danger', 'Blocked in the browser'],
    default: ['neutral', 'Browser notifications not set up'], unsupported: ['neutral', 'This browser has no notifications'],
  }
  const [tone, permissionText] = permissionInfo[permission]
  const testNotification = () => {
    toast('This is how a plan start looks: Plan "Example" has started', 'info')
    if (permission === 'granted') new Notification('QuickFlow', { body: 'Plan "Example" has started' })
  }

  return (
    <section className="settings">
      <div className="page-head"><h1>Settings</h1></div>
      <ProfileSummary settings={saved as Settings} />

      <form className="card form settings-form" onSubmit={submit} noValidate>
        <fieldset>
          <legend>Profile</legend>
          <Field label="Display name" hint="Shown in the dashboard greeting" error={nameError ?? err?.forField('displayName')}>
            <input value={form.displayName} maxLength={100} onChange={(e) => set('displayName', e.target.value)} />
          </Field>
          <Field label="Email (optional)" error={err?.forField('email')}>
            <input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
          </Field>
        </fieldset>

        <fieldset>
          <legend>Preferences</legend>
          <Field label="Timezone" hint={`Decides what 'today' means for tasks, habits and the dashboard. Time there now: ${localTime}`} error={err?.forField('timezone')}>
            <select value={form.timezone} onChange={(e) => set('timezone', e.target.value)}>
              {TIMEZONES.map((tz) => <option key={tz}>{tz}</option>)}
            </select>
          </Field>
          <Field label="Default view" hint="The page QuickFlow opens on">
            <select value={form.defaultView} onChange={(e) => set('defaultView', e.target.value as Settings['defaultView'])}>
              {VIEWS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </Field>
        </fieldset>

        <fieldset>
          <legend>Notifications</legend>
          <label className="check">
            <input type="checkbox" checked={form.notificationsEnabled} onChange={(e) => set('notificationsEnabled', e.target.checked)} />
            Notify me when a plan's start time arrives
          </label>
          <div className="notify-status">
            <Badge tone={tone} icon={permission === 'granted' ? 'check' : 'info'}>{permissionText}</Badge>
            {permission === 'default' && <Button size="sm" icon="info" onClick={() => Notification.requestPermission()}>Allow browser notifications</Button>}
            <Button size="sm" variant="ghost" icon="clock" onClick={testNotification}>Send test notification</Button>
          </div>
          <small className="muted">In-app messages always appear while QuickFlow is open{permission === 'granted' ? '; the browser also shows them when the tab is in the background' : ''}.</small>
        </fieldset>

        <FormError error={save.error} />
        <div className="actions">
          {dirty && <span className="muted small unsaved"><Icon name="info" size={14} /> Unsaved changes</span>}
          {dirty && <Button variant="ghost" onClick={() => { setForm(saved as Settings); setNameError(undefined) }}>Discard</Button>}
          <Button type="submit" variant="primary" pending={save.isPending}>{save.isPending ? 'Saving…' : 'Save settings'}</Button>
        </div>
      </form>

      <Card className="form" aria-label="Appearance">
        <fieldset className="radio-group theme-group">
          <legend>Theme</legend>
          {THEMES.map((t) => (
            <label key={t.value} className="check">
              <input type="radio" name="theme" value={t.value} checked={theme === t.value} onChange={() => setTheme(t.value)} />{t.label}
            </label>
          ))}
        </fieldset>
        <small className="muted">Applies straight away and is saved on this device.</small>
      </Card>
    </section>
  )
}

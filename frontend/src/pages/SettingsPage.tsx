import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError, get, type Settings } from '../api/client'
import { ErrorState, Field, FormError, Loading, useToast } from '../components/ui'

const VIEWS: { value: Settings['defaultView']; label: string }[] = [
  { value: 'DASHBOARD', label: 'Dashboard' },
  { value: 'TASKS', label: 'Tasks' },
  { value: 'HABITS', label: 'Habits' },
  { value: 'LEARNING', label: 'Learning Resources' },
  { value: 'PLANS', label: 'Todo Plans' },
]

const TIMEZONES = Intl.supportedValuesOf('timeZone')

export default function SettingsPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const query = useQuery({ queryKey: ['settings'], queryFn: () => get<Settings>('/settings') })
  const [form, setForm] = useState<Settings | null>(null)
  const [nameError, setNameError] = useState<string>()
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

  if (query.isPending) return <Loading />
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />
  if (!form) return null

  const err = save.error instanceof ApiError ? save.error : undefined
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setForm({ ...form, [k]: v })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.displayName.trim()) return setNameError('Display name is required')
    setNameError(undefined)
    save.mutate({ ...form, email: form.email?.trim() || null } as Settings)
  }

  return (
    <section>
      <h1>Settings</h1>
      <form className="card form" onSubmit={submit} noValidate>
        <h2>Profile</h2>
        <Field label="Display name" error={nameError ?? err?.forField('displayName')}>
          <input value={form.displayName} maxLength={100} onChange={(e) => set('displayName', e.target.value)} />
        </Field>
        <Field label="Email (optional)" error={err?.forField('email')}>
          <input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <h2>Preferences</h2>
        <Field label="Timezone" hint="Decides what 'today' means for tasks, habits and the dashboard" error={err?.forField('timezone')}>
          <select value={form.timezone} onChange={(e) => set('timezone', e.target.value)}>
            {[...new Set(['UTC', ...TIMEZONES])].map((tz) => <option key={tz}>{tz}</option>)}
          </select>
        </Field>
        <Field label="Default view" hint="The page QuickFlow opens on">
          <select value={form.defaultView} onChange={(e) => set('defaultView', e.target.value as Settings['defaultView'])}>
            {VIEWS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </Field>
        <label className="check">
          <input type="checkbox" checked={form.notificationsEnabled} onChange={(e) => set('notificationsEnabled', e.target.checked)} />
          Notify me when a plan's start time arrives
        </label>
        <FormError error={save.error} />
        <div className="actions">
          <button type="submit" className="primary" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save settings'}</button>
        </div>
      </form>
    </section>
  )
}

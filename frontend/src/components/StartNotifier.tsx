import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, get, type Plan, type Settings } from '../api/client'
import { useRefresh } from '../lib/queries'
import { useToast } from './ui'

/**
 * US-PLAN-7: polls the server for plans whose start time has arrived and hasn't been acknowledged,
 * shows an in-app notification (plus a browser notification when enabled and allowed), then acknowledges it.
 * The server remembers acknowledgements, so a plan notifies once, also if it started while the app was closed.
 */
export default function StartNotifier() {
  const toast = useToast()
  const refresh = useRefresh()
  const settings = useQuery({ queryKey: ['settings'], queryFn: () => get<Settings>('/settings') })
  const due = useQuery({ queryKey: ['start-notifications'], queryFn: () => get<Plan[]>('/plans/start-notifications'), refetchInterval: 15_000 })
  const shown = useRef(new Set<number>())
  const enabled = settings.data?.notificationsEnabled ?? true

  useEffect(() => {
    if (enabled && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {})
  }, [enabled])

  useEffect(() => {
    for (const p of due.data ?? []) {
      if (shown.current.has(p.id)) continue
      shown.current.add(p.id)
      if (enabled) {
        toast(`Plan "${p.title}" has started`, 'info')
        if ('Notification' in window && Notification.permission === 'granted') new Notification('QuickFlow', { body: `Plan "${p.title}" has started` })
      }
      api('POST', `/plans/${p.id}/start-notification/ack`).then(() => refresh('plans')).catch(() => shown.current.delete(p.id))
    }
  }, [due.data, enabled, toast, refresh])

  return null
}

import { useMutation } from '@tanstack/react-query'
import { api, type Habit } from '../api/client'
import { useToast } from './ui'
import { useRefresh } from '../lib/queries'

/** Complete / undo today's completion (FR-04). Shared by the Habits page and the dashboard checklist. */
export default function HabitToggle({ habit, today }: { habit: Habit; today: string }) {
  const toast = useToast()
  const refresh = useRefresh()
  const toggle = useMutation({
    mutationFn: () => habit.progress.completedToday
      ? api('DELETE', `/habits/${habit.id}/completions/${today}`)
      : api('POST', `/habits/${habit.id}/completions`),
    onSuccess: () => {
      toast(habit.progress.completedToday ? `"${habit.name}" unmarked for today` : `"${habit.name}" done for today`)
      return refresh('habits') // stay pending until the refetch, so the optimistic tick doesn't flicker
    },
    onError: (e) => toast(e.message, 'error'),
  })
  return (
    <label className="check">
      <input type="checkbox" checked={toggle.isPending ? !habit.progress.completedToday : habit.progress.completedToday}
        disabled={!habit.active} aria-busy={toggle.isPending || undefined}
        onChange={() => { if (!toggle.isPending) toggle.mutate() }} aria-label={`Done today: ${habit.name}`} />
      Done today
    </label>
  )
}

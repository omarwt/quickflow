import { Navigate, Route, Routes } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { get, type Settings } from './api/client'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import TasksPage from './pages/TasksPage'
import HabitsPage from './pages/HabitsPage'
import LearningPage from './pages/LearningPage'
import PlansPage from './pages/PlansPage'
import SettingsPage from './pages/SettingsPage'

export const ROUTES = {
  DASHBOARD: '/dashboard',
  TASKS: '/tasks',
  HABITS: '/habits',
  LEARNING: '/learning',
  PLANS: '/plans',
} as const

/** "/" opens the page chosen in Settings (default view). */
function Home() {
  const settings = useQuery({ queryKey: ['settings'], queryFn: () => get<Settings>('/settings') })
  if (settings.isPending) return null
  return <Navigate to={ROUTES[settings.data?.defaultView ?? 'DASHBOARD']} replace />
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="habits" element={<HabitsPage />} />
        <Route path="learning" element={<LearningPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

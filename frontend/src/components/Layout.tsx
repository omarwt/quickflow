import { NavLink, Outlet } from 'react-router-dom'
import StartNotifier from './StartNotifier'
import { Icon, type IconName } from './ds'

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/tasks', label: 'Tasks', icon: 'tasks' },
  { to: '/habits', label: 'Habits', icon: 'habits' },
  { to: '/learning', label: 'Learning Resources', icon: 'learning' },
  { to: '/plans', label: 'Todo Plans', icon: 'plans' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

export default function Layout() {
  return (
    <div className="shell">
      <header className="sidebar">
        <div className="brand"><span className="brand-mark"><Icon name="check" size={16} /></span>QuickFlow</div>
        <nav aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              <Icon name={n.icon} />{n.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <StartNotifier />
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}

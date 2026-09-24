import { NavLink, Outlet } from 'react-router-dom'
import StartNotifier from './StartNotifier'
import { Icon, type IconName } from './ds'

// `short` is the visible label in the mobile tab bar; the accessible name stays the full label (WCAG 2.5.3)
const NAV: { to: string; label: string; short?: string; icon: IconName }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/tasks', label: 'Tasks', icon: 'tasks' },
  { to: '/habits', label: 'Habits', icon: 'habits' },
  { to: '/learning', label: 'Learning Resources', short: 'Learning', icon: 'learning' },
  { to: '/plans', label: 'Todo Plans', short: 'Plans', icon: 'plans' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

export default function Layout() {
  return (
    <div className="shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="sidebar">
        <div className="brand"><span className="brand-mark"><Icon name="check" size={16} /></span>QuickFlow</div>
        <nav aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} aria-label={n.label} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              <Icon name={n.icon} />
              <span className="nav-full">{n.label}</span>
              <span className="nav-short" aria-hidden="true">{n.short ?? n.label}</span>
            </NavLink>
          ))}
        </nav>
      </header>
      <StartNotifier />
      <main className="content" id="main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  )
}

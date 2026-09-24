import { NavLink, Outlet } from 'react-router-dom'

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/habits', label: 'Habits' },
  { to: '/learning', label: 'Learning Resources' },
  { to: '/plans', label: 'Todo Plans' },
  { to: '/settings', label: 'Settings' },
]

export default function Layout() {
  return (
    <div className="shell">
      <header className="sidebar">
        <div className="brand">QuickFlow</div>
        <nav aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}

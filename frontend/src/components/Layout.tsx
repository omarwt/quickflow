import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { flushSync } from 'react-dom'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { prefetchRoute } from '../lib/pageQueries'
import StartNotifier from './StartNotifier'
import { Icon, IconButton, type IconName } from './ds'

// `short` is the visible label in the mobile tab bar; the accessible name stays the full label (WCAG 2.5.3)
const NAV: { to: string; label: string; short?: string; icon: IconName }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/tasks', label: 'Tasks', icon: 'tasks' },
  { to: '/habits', label: 'Habits', icon: 'habits' },
  { to: '/learning', label: 'Learning Resources', short: 'Learning', icon: 'learning' },
  { to: '/plans', label: 'Todo Plans', short: 'Plans', icon: 'plans' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Page change as a View Transition (UX-MOTION): the shell has its own transition name, so only the page
 * area animates. Falls back to a plain navigation when the API is missing or motion is reduced.
 */
function useTransitionNavigate() {
  const navigate = useNavigate()
  return (e: MouseEvent<HTMLAnchorElement>, to: string) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    if (!document.startViewTransition || reducedMotion() || window.location.pathname === to) return
    e.preventDefault()
    document.startViewTransition(() => flushSync(() => navigate(to)))
  }
}

/** After a navigation: page title, scroll to top, focus on the new heading so keyboard and screen-reader users land there. */
function usePageOrientation(pathname: string) {
  const first = useRef(true)
  useEffect(() => {
    const label = NAV.find((n) => pathname.startsWith(n.to))?.label
    document.title = label ? `${label} · QuickFlow` : 'QuickFlow'
    if (first.current) { first.current = false; return } // the first load keeps the browser's own focus
    window.scrollTo({ top: 0, behavior: 'instant' })
    const h1 = document.querySelector<HTMLElement>('main h1')
    if (h1) { h1.tabIndex = -1; h1.focus({ preventScroll: true }) }
  }, [pathname])
}

export default function Layout() {
  // tablet icon rail (760-1023 px): expands over the content, closes on navigation, Escape or a click outside
  const [railOpen, setRailOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setRailOpen(false), [pathname])
  usePageOrientation(pathname)
  const go = useTransitionNavigate()
  const qc = useQueryClient()
  useEffect(() => {
    if (!railOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setRailOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [railOpen])

  return (
    <div className={`shell${railOpen ? ' rail-open' : ''}`}>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="sidebar">
        <div className="brand"><span className="brand-mark"><Icon name="check" size={16} /></span><span className="brand-name">QuickFlow</span></div>
        <IconButton className="rail-toggle" variant="ghost" size="sm" icon={railOpen ? 'chevronLeft' : 'chevronRight'}
          label={railOpen ? 'Collapse navigation' : 'Expand navigation'} aria-expanded={railOpen} aria-controls="main-nav"
          onClick={() => setRailOpen(!railOpen)} />
        <nav aria-label="Main" id="main-nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} aria-label={n.label} className={({ isActive }) => (isActive ? 'active' : undefined)}
              onClick={(e) => go(e, n.to)} onPointerEnter={() => prefetchRoute(qc, n.to)} onFocus={() => prefetchRoute(qc, n.to)}
              onTouchStart={() => prefetchRoute(qc, n.to)}>
              <Icon name={n.icon} />
              <span className="nav-full">{n.label}</span>
              <span className="nav-short" aria-hidden="true">{n.short ?? n.label}</span>
            </NavLink>
          ))}
        </nav>
      </header>
      <button type="button" className="rail-scrim" aria-hidden="true" tabIndex={-1} onClick={() => setRailOpen(false)} />
      <StartNotifier />
      <main className="content" id="main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  )
}

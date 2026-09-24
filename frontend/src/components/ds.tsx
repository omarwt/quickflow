/**
 * Design-system components (UX-DS). Pages compose these instead of styling raw elements.
 * Icon paths are from Lucide (ISC licence), inlined so there is no icon dependency.
 */
import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type HTMLAttributes, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'

const PATHS = {
  plus: <path d="M5 12h14M12 5v14" />,
  pencil: <><path d="M21.17 6.81a1 1 0 0 0-3.98-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z" /><path d="m15 5 4 4" /></>,
  trash: <><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></>,
  archive: <><rect x="2" y="3" width="20" height="5" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4" /></>,
  restore: <><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></>,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  check: <path d="M20 6 9 17l-5-5" />,
  more: <><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></>,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronUp: <path d="m18 15-6-6-6 6" />,
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>,
  tasks: <><path d="M21 10.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.5" /><path d="m9 11 3 3L22 4" /></>,
  habits: <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" />,
  learning: <><path d="M12 7v14" /><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" /></>,
  plans: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  settings: <path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" />,
  clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  alert: <><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></>,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></>,
} as const
export type IconName = keyof typeof PATHS

/** Decorative by default (aria-hidden); the surrounding control carries the accessible name. */
export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-fill'
  size?: 'sm' | 'md'
  icon?: IconName
  /** shows a spinner and blocks clicks while a request runs; the label stays so the name doesn't change */
  pending?: boolean
}

export function Button({ variant = 'secondary', size = 'md', icon, pending, className, children, disabled, type = 'button', ...rest }: ButtonProps) {
  return (
    <button type={type} className={`btn btn-${variant} btn-${size}${className ? ` ${className}` : ''}`}
      disabled={disabled || pending} aria-busy={pending || undefined} {...rest}>
      {pending ? <span className="spinner" aria-hidden="true" /> : icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      {children}
    </button>
  )
}

/** Icon-only button; `label` is required because it is the accessible name. */
export function IconButton({ icon, label, ...rest }: Omit<ButtonProps, 'children' | 'icon'> & { icon: IconName; label: string }) {
  return <Button {...rest} className={`btn-icon${rest.className ? ` ${rest.className}` : ''}`} aria-label={label} title={label} icon={icon} />
}

export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

export function Badge({ tone = 'neutral', icon, children }: { tone?: Tone; icon?: IconName; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{icon && <Icon name={icon} size={12} />}{children}</span>
}

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLElement> & { className?: string }) {
  return <article className={`card${className ? ` ${className}` : ''}`} {...rest}>{children}</article>
}

export type MenuItem = { label: string; onSelect: () => void; icon?: IconName; danger?: boolean; disabled?: boolean }

/**
 * Menu button for secondary actions (WAI-ARIA menu button pattern): Enter/Space/ArrowDown open it,
 * arrow keys move between items, Escape or a click outside closes it and returns focus to the button.
 */
export function Menu({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const focusItem = (i: number) => {
    const all = list.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
    if (all?.length) all[(i + all.length) % all.length].focus()
  }
  const close = (refocus = true) => { setOpen(false); if (refocus) trigger.current?.focus() }

  useEffect(() => {
    if (!open) return
    focusItem(0)
    const outside = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) close(false) }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])

  const onKey = (e: ReactKeyboardEvent) => {
    const all = Array.from(list.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])
    const at = all.indexOf(document.activeElement as HTMLButtonElement)
    if (e.key === 'Escape') { e.preventDefault(); close() }
    else if (e.key === 'ArrowDown') { e.preventDefault(); focusItem(at + 1) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); focusItem(at - 1) }
    else if (e.key === 'Home') { e.preventDefault(); focusItem(0) }
    else if (e.key === 'End') { e.preventDefault(); focusItem(-1) }
    else if (e.key === 'Tab') close(false)
  }

  return (
    <div className="menu" ref={root} onKeyDown={open ? onKey : undefined}>
      <button ref={trigger} type="button" className="btn btn-ghost btn-sm btn-icon" aria-label={label} title={label}
        aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined}
        onClick={() => setOpen(!open)} onKeyDown={(e) => { if (e.key === 'ArrowDown' && !open) { e.preventDefault(); setOpen(true) } }}>
        <Icon name="more" size={16} />
      </button>
      {open && (
        <ul className="menu-list" role="menu" id={id} aria-label={label} ref={list}>
          {items.map((it) => (
            <li key={it.label} role="none">
              <button type="button" role="menuitem" className={`menu-item${it.danger ? ' danger' : ''}`} disabled={it.disabled}
                onClick={() => { close(); it.onSelect() }}>
                {it.icon && <Icon name={it.icon} size={16} />}{it.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Placeholder with the shape of the content it stands in for, so loading doesn't shift the layout. */
export function Skeleton({ width = '100%', height = '1rem', radius, style }: { width?: string; height?: string; radius?: string; style?: CSSProperties }) {
  return <span className="skeleton" aria-hidden="true" style={{ width, height, borderRadius: radius, ...style }} />
}

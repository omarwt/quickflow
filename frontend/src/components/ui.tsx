import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { ApiError } from '../api/client'
import { Button, Icon, IconButton, Skeleton } from './ds'

/**
 * Loading state shaped like the content it replaces (UX-FEED, F1), so the page doesn't jump when data
 * arrives. Screen readers hear the label; the skeleton itself is hidden from them.
 */
export function Loading({ label = 'Loading…', variant = 'text', count = 3 }: {
  label?: string; variant?: 'text' | 'rows' | 'cards' | 'form'; count?: number
}) {
  const n = Array.from({ length: count }, (_, i) => i)
  return (
    <div className={`loading loading-${variant}`} role="status">
      <span className={variant === 'text' ? 'muted' : 'sr-only'}>{label}</span>
      {variant === 'rows' && <div className="list">{n.map((i) => (
        <div key={i} className="row skeleton-row"><Skeleton width="1.25rem" height="1.25rem" /><div className="main"><Skeleton width="40%" /><Skeleton width="25%" height=".75rem" /></div></div>
      ))}</div>}
      {variant === 'cards' && <div className="grid">{n.map((i) => (
        <div key={i} className="card skeleton-card"><Skeleton width="55%" height="1.25rem" /><Skeleton width="80%" /><Skeleton width="100%" height=".5rem" /><Skeleton width="45%" height="2rem" /></div>
      ))}</div>}
      {variant === 'form' && <div className="card form skeleton-card">{n.map((i) => (
        <div key={i} className="field"><Skeleton width="30%" height=".875rem" /><Skeleton height="2.5rem" /></div>
      ))}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : 'Something went wrong'
  return (
    <div className="state error" role="alert">
      <Icon name="alert" size={24} />
      <p>{message}</p>
      {onRetry && <Button onClick={onRetry}>Try again</Button>}
    </div>
  )
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="state empty">
      <h2>{title}</h2>
      <p className="muted">{text}</p>
      {action}
    </div>
  )
}

/** Modal built on <dialog>: focus is trapped by the browser and Escape closes it. */
export function Dialog({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      d.showModal()
      // showModal() focuses the first focusable element (the Close button); start in the content instead:
      // the first form field, or the first button (Cancel in confirmations)
      const body = d.querySelector('.dialog-body')
      body?.querySelector<HTMLElement>('input, select, textarea, button')?.focus()
    }
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="dialog-title">
      <div className="dialog-head">
        <h2 id="dialog-title">{title}</h2>
        <IconButton variant="ghost" icon="x" label="Close" onClick={onClose} />
      </div>
      <div className="dialog-body">{open && children}</div>
    </dialog>
  )
}

export function Field({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className={`field${error ? ' invalid' : ''}`}>
      <span>{label}</span>
      {children}
      {hint && !error && <small className="muted">{hint}</small>}
      {error && <small className="field-error" role="alert">{error}</small>}
    </label>
  )
}

/** Form-level error for an API failure that isn't tied to a field. */
export function FormError({ error }: { error: unknown }) {
  if (!error) return null
  if (error instanceof ApiError && error.fieldErrors.length > 0) return null
  return <p className="field-error" role="alert">{error instanceof Error ? error.message : 'Request failed'}</p>
}

type Toast = { id: number; text: string; kind: 'info' | 'success' | 'error' }
const ToastContext = createContext<(text: string, kind?: Toast['kind']) => void>(() => {})

// every toast closes by itself; info (plan start) stays longest so it isn't missed, and errors longer than successes
const DURATION: Record<Toast['kind'], number> = { success: 4000, error: 7000, info: 15000 }
const MAX_TOASTS = 3

/** One toast: closes after its duration, but waits while hovered or focused so it can be read or dismissed. */
function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: number) => void }) {
  const [paused, setPaused] = useState(false)
  const left = useRef(DURATION[toast.kind])
  useEffect(() => {
    if (paused) return
    const started = Date.now()
    const timer = setTimeout(() => onClose(toast.id), left.current)
    return () => { clearTimeout(timer); left.current -= Date.now() - started }
  }, [paused, onClose, toast.id])
  return (
    <div className={`toast ${toast.kind}`} role={toast.kind === 'error' ? 'alert' : 'status'}
      onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <Icon name={toast.kind === 'error' ? 'alert' : toast.kind === 'info' ? 'info' : 'check'} />
      <span className="toast-text">{toast.text}</span>
      <IconButton variant="ghost" size="sm" icon="x" label="Dismiss" onClick={() => onClose(toast.id)} />
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const push = useCallback((text: string, kind: Toast['kind'] = 'success') => {
    // the same message again replaces the old one, and at most MAX_TOASTS are shown (oldest go first)
    setToasts((t) => [...t.filter((x) => x.text !== text), { id: Date.now() + Math.random(), text, kind }].slice(-MAX_TOASTS))
  }, [])
  const close = useCallback((id: number) => setToasts((all) => all.filter((x) => x.id !== id)), [])
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => <ToastItem key={t.id} toast={t} onClose={close} />)}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

/** Confirmation step for destructive actions. */
export function ConfirmDialog({ title, text, confirmLabel, open, onConfirm, onCancel, busy }: {
  title: string; text: string; confirmLabel: string; open: boolean; onConfirm: () => void; onCancel: () => void; busy?: boolean
}) {
  return (
    <Dialog title={title} open={open} onClose={onCancel}>
      <p>{text}</p>
      <div className="actions">
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="danger-fill" onClick={onConfirm} pending={busy}>{confirmLabel}</Button>
      </div>
    </Dialog>
  )
}

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { ApiError } from '../api/client'

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return <p className="muted" role="status">{label}</p>
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : 'Something went wrong'
  return (
    <div className="state error" role="alert">
      <p>{message}</p>
      {onRetry && <button onClick={onRetry}>Try again</button>}
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
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="dialog-title">
      <div className="dialog-head">
        <h2 id="dialog-title">{title}</h2>
        <button type="button" className="ghost" aria-label="Close" onClick={onClose}>×</button>
      </div>
      {open && children}
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

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const push = useCallback((text: string, kind: Toast['kind'] = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, text, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'info' ? 10000 : 4000)
  }, [])
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`} role={t.kind === 'error' ? 'alert' : 'status'}>
            {t.text}
            <button className="ghost" aria-label="Dismiss" onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))}>×</button>
          </div>
        ))}
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
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="button" className="primary danger-fill" onClick={onConfirm} disabled={busy}>{confirmLabel}</button>
      </div>
    </Dialog>
  )
}

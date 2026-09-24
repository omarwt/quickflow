// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { act, createElement, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ToastProvider, useToast } from './ui'

// tell React this is a test environment, so act() flushes updates
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// The toast host is small enough to test without a DOM library: render into a detached node with fake timers.
function mount(messages: [string, 'info' | 'success' | 'error'][]) {
  const el = document.createElement('div')
  function Pusher() {
    const toast = useToast()
    useEffect(() => { messages.forEach(([t, k]) => toast(t, k)) }, [toast])
    return null
  }
  act(() => createRoot(el).render(createElement(ToastProvider, null, createElement(Pusher))))
  return el
}
const texts = (el: HTMLElement) => Array.from(el.querySelectorAll('.toast-text'), (n) => n.textContent)

describe('toasts', () => {
  it('close by themselves: success after 4 s, info (plan start) after 15 s', async () => {
    vi.useFakeTimers()
    const el = mount([['Saved', 'success'], ['Plan "A" has started', 'info']])
    expect(texts(el)).toEqual(['Saved', 'Plan "A" has started'])
    act(() => { vi.advanceTimersByTime(4100) })
    expect(texts(el)).toEqual(['Plan "A" has started'])
    act(() => { vi.advanceTimersByTime(11000) })
    expect(texts(el)).toEqual([])
    vi.useRealTimers()
  })
  it('replace a repeated message and never show more than three', () => {
    const el = mount([['a', 'success'], ['b', 'success'], ['a', 'success'], ['c', 'success'], ['d', 'success']])
    expect(texts(el)).toEqual(['a', 'c', 'd'])
  })
})

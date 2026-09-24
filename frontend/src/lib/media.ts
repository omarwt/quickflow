import { useSyncExternalStore } from 'react'

/**
 * Size classes (UX-SIZES). CSS custom properties can't be used inside media queries, so these numbers
 * are repeated in index.css; keep both in sync (see the "size classes" comment in tokens.css).
 */
export const BREAKPOINTS = { largePhone: 480, tablet: 760, laptop: 1024, wide: 1440 } as const
export const PHONE_QUERY = `(max-width: ${BREAKPOINTS.tablet - 0.02}px)`

/** Re-renders when the media query starts or stops matching. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

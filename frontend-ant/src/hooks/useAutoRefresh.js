import { useEffect, useRef, useCallback } from 'react'

/**
 * Calls `callback` immediately on mount, then every `intervalMs` milliseconds.
 * Pauses when the browser tab is not visible to avoid unnecessary API calls.
 *
 * @param {Function} callback  - async-safe fetch function
 * @param {number}   intervalMs - refresh interval in ms (default 10s)
 */
export function useAutoRefresh(callback, intervalMs = 10000) {
  const savedCallback = useRef(callback)

  // Always keep the ref current so the interval closure doesn't go stale
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    // Fire immediately
    savedCallback.current()

    const id = setInterval(() => {
      if (!document.hidden) savedCallback.current()
    }, intervalMs)

    return () => clearInterval(id)
  }, [intervalMs])
}

import { useEffect, useRef } from 'react'

/**
 * Connects to the backend SSE stream at /api/sse/tasks.
 * Calls `onUpdate` whenever a "task-update" event is received.
 * Automatically reconnects with exponential backoff on disconnection.
 *
 * Replaces useAutoRefresh – no polling, pure server push.
 *
 * @param {Function} onUpdate  called on each server-push event
 */
export function useTaskSSE(onUpdate) {
  const onUpdateRef   = useRef(onUpdate)
  const reconnectRef  = useRef(null)
  const esRef         = useRef(null)

  // Keep the callback ref current so the SSE handler never captures a stale closure
  useEffect(() => { onUpdateRef.current = onUpdate }, [onUpdate])

  useEffect(() => {
    let retryDelay = 2_000   // start at 2s, cap at 30s

    const connect = () => {
      const es = new EventSource('/api/sse/tasks')
      esRef.current = es

      // Fire once immediately so the component loads data on mount
      onUpdateRef.current()

      es.addEventListener('task-update', () => {
        // Ignore events when the tab is hidden to avoid wasted renders
        if (!document.hidden) onUpdateRef.current()
      })

      es.onopen = () => {
        retryDelay = 2_000   // reset backoff on successful connection
      }

      es.onerror = () => {
        es.close()
        esRef.current = null
        // Reconnect with backoff
        reconnectRef.current = setTimeout(() => {
          retryDelay = Math.min(retryDelay * 1.5, 30_000)
          connect()
        }, retryDelay)
      }
    }

    connect()

    return () => {
      clearTimeout(reconnectRef.current)
      esRef.current?.close()
      esRef.current = null
    }
  }, []) // intentionally empty – connect once per mount
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { loadQueue, confirmCheckin } from '../api/db'
import { checkinVisit } from '../api/api'

/**
 * Manages the offline check-in queue.
 *
 * - Auto-syncs whenever `online` transitions to true.
 * - Calls `onSynced()` after at least one item is successfully synced,
 *   so the parent can refresh its visit list from the local cache.
 */
export function useSyncQueue(credentials, online, onSynced) {
  const [syncing,  setSyncing]  = useState(false)
  const [queueLen, setQueueLen] = useState(() => loadQueue().length)
  const onSyncedRef = useRef(onSynced)
  useEffect(() => { onSyncedRef.current = onSynced }, [onSynced])

  const refreshQueueLen = useCallback(() => setQueueLen(loadQueue().length), [])

  const sync = useCallback(async () => {
    const queue = loadQueue()
    if (queue.length === 0) return

    setSyncing(true)
    let anySuccess = false

    for (const item of queue) {
      try {
        await checkinVisit(credentials, item.visitId, item.lat, item.lng, item.checkinTime)
        confirmCheckin(item.visitId)
        anySuccess = true
      } catch {
        // Leave in queue — will retry on next online event
      }
    }

    setSyncing(false)
    setQueueLen(loadQueue().length)
    if (anySuccess) onSyncedRef.current?.()
  }, [credentials])

  // Trigger sync every time the device comes back online
  useEffect(() => {
    if (online) sync()
  }, [online, sync])

  return { syncing, queueLen, sync, refreshQueueLen }
}

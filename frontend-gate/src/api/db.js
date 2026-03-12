/**
 * Lightweight localStorage-backed offline store for the Gate Check-In app.
 *
 * visits     — current week's visit list, fetched when online and merged with local state.
 * queue      — pending check-ins that happened while offline; each entry: { visitId, lat, lng, checkinTime }
 * cacheTime  — ISO timestamp of the last successful server fetch.
 */

const VISITS_KEY     = 'gate_visits'
const QUEUE_KEY      = 'gate_queue'
const CACHE_TIME_KEY = 'gate_cache_time'

// ── Visits cache ──────────────────────────────────────────────────────────────

export function loadVisits() {
  try { return JSON.parse(localStorage.getItem(VISITS_KEY) ?? '[]') } catch { return [] }
}

export function saveVisits(visits) {
  localStorage.setItem(VISITS_KEY, JSON.stringify(visits))
  localStorage.setItem(CACHE_TIME_KEY, new Date().toISOString())
}

export function getCacheTime() {
  return localStorage.getItem(CACHE_TIME_KEY)
}

// ── Offline queue ─────────────────────────────────────────────────────────────

export function loadQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') } catch { return [] }
}

function saveQueue(q) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q))
}

export function addToQueue(item) {
  // Replace if the same visit is already queued (re-check-in attempt)
  const q = loadQueue().filter(x => x.visitId !== item.visitId)
  q.push(item)
  saveQueue(q)
}

export function removeFromQueue(visitId) {
  saveQueue(loadQueue().filter(x => x.visitId !== visitId))
}

// ── Optimistic local mutations ────────────────────────────────────────────────

/**
 * Mark a visit as PENDING_SYNC in the local cache and add it to the offline queue.
 * Called when the device is offline at check-in time.
 */
export function applyLocalCheckin(visitId, lat, lng, checkinTime) {
  const visits = loadVisits().map(v =>
    v.id === visitId
      ? { ...v, status: 'PENDING_SYNC', checkedInAt: checkinTime, checkedInBy: 'local', checkinLat: lat, checkinLng: lng }
      : v
  )
  saveVisits(visits)
  addToQueue({ visitId, lat, lng, checkinTime })
}

/**
 * Mark a visit as CHECKED_IN after a successful server sync.
 * Called by the sync queue after a successful PUT /api/visits/{id}/checkin.
 */
export function confirmCheckin(visitId) {
  const visits = loadVisits().map(v =>
    v.id === visitId ? { ...v, status: 'CHECKED_IN' } : v
  )
  saveVisits(visits)
  removeFromQueue(visitId)
}

export function clearAll() {
  localStorage.removeItem(VISITS_KEY)
  localStorage.removeItem(QUEUE_KEY)
  localStorage.removeItem(CACHE_TIME_KEY)
}

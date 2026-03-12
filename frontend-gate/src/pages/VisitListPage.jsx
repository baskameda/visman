import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  NavBar, List, PullToRefresh, Popup, Button, Toast, SpinLoading, Badge,
} from 'antd-mobile'
import { useAuth }         from '../context/AuthContext'
import GreetingOverlay    from '../components/GreetingOverlay'

const HELP_SECTIONS = [
  {
    title: 'Checking in a visitor',
    items: [
      'Tap any visit row to open the detail popup.',
      'Tap Check In to record the arrival. GPS coordinates are captured automatically if available.',
      'Each visit can only be checked in once.',
    ],
  },
  {
    title: 'Offline mode',
    items: [
      'Check-ins work without internet — they are saved locally with a blue "Queued" indicator.',
      'When your device reconnects the queue is synced automatically. No manual action needed.',
    ],
  },
  {
    title: 'Week view',
    items: [
      'Shows the current week (Monday to Sunday) with today at the top.',
      'Pull down to refresh the list when you are online.',
      'If the cache is more than 5 minutes old it refreshes automatically on reconnect.',
    ],
  },
  {
    title: 'Status colours',
    items: [
      'Orange dot — Pending (visitor not yet checked in).',
      'Green dot — Checked In.',
      'Blue dot — Queued offline (will sync on reconnect).',
      'Red dot — No Show.',
    ],
  },
]
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useSyncQueue }    from '../hooks/useSyncQueue'
import { getWeekVisits }   from '../api/api'
import {
  loadVisits, saveVisits, getCacheTime,
  loadQueue, applyLocalCheckin,
} from '../api/db'

// ── Session countdown (updates every minute) ─────────────────────────────────
const SESSION_MS = 9 * 60 * 60 * 1000
function useSessionTimer() {
  const compute = () => {
    const loginAt = parseInt(localStorage.getItem('loginAt') ?? '0', 10)
    if (!loginAt) return null
    const rem = loginAt + SESSION_MS - Date.now()
    if (rem <= 0) return null
    const totalMin = Math.ceil(rem / 60000)
    return { h: Math.floor(totalMin / 60), m: totalMin % 60, totalMin }
  }
  const [time, setTime] = useState(compute)
  useEffect(() => {
    const id = setInterval(() => setTime(compute()), 60000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return time
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getWeekRange() {
  const today = new Date()
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { from: monday.toISOString().slice(0, 10), to: sunday.toISOString().slice(0, 10) }
}

function todayStr() { return new Date().toISOString().slice(0, 10) }

function formatDate(iso) {
  const [y, m, d] = iso.split('-')
  const t = todayStr()
  if (iso === t) return 'Today'
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
  if (iso === tomorrow.toISOString().slice(0, 10)) return 'Tomorrow'
  const names = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const date = new Date(y, m - 1, d)
  return `${names[date.getDay()]} ${d}/${m}`
}

function formatTime(iso) {
  if (!iso) return null
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch { return null }
}

function getGPS() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()  => resolve(null),
      { timeout: 6000, maximumAge: 30000, enableHighAccuracy: true },
    )
  })
}

// ── Status display ────────────────────────────────────────────────────────────

const STATUS = {
  PENDING:      { color: '#faad14', label: 'Pending',  dot: '#faad14' },
  CHECKED_IN:   { color: '#52c41a', label: 'Checked In', dot: '#52c41a' },
  PENDING_SYNC: { color: '#1677ff', label: 'Queued',   dot: '#1677ff' },
  NO_SHOW:      { color: '#ff4d4f', label: 'No Show',  dot: '#ff4d4f' },
}

function StatusDot({ status }) {
  const cfg = STATUS[status] ?? { dot: '#d9d9d9' }
  return (
    <span
      className="status-dot"
      style={{ background: cfg.dot, marginRight: 8 }}
    />
  )
}

// ── Visit detail popup ────────────────────────────────────────────────────────

function VisitPopup({ visit, online, onCheckin, onClose, checkingIn }) {
  if (!visit) return null
  const cfg = STATUS[visit.status] ?? STATUS.PENDING
  const canCheckin = visit.status === 'PENDING'
  const isQueued   = visit.status === 'PENDING_SYNC'
  const isDone     = visit.status === 'CHECKED_IN'
  const period = visit.invitationStartDate === visit.invitationEndDate
    ? visit.invitationStartDate
    : `${visit.invitationStartDate} → ${visit.invitationEndDate}`

  return (
    <Popup
      visible={true}
      onMaskClick={onClose}
      position="bottom"
      bodyStyle={{ borderRadius: '16px 16px 0 0', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="visit-popup-body">
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e0e0e0', margin: '0 auto 20px' }} />

        {/* Status badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.2 }}>
              {visit.visitorFirstName} {visit.visitorLastName}
            </div>
            {visit.visitorCompany && (
              <div style={{ fontSize: 13, color: '#8c8c8c', marginTop: 3 }}>{visit.visitorCompany}</div>
            )}
            {visit.visitorFunction && (
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>{visit.visitorFunction}</div>
            )}
          </div>
          <span style={{
            background: cfg.color + '20', color: cfg.color,
            border: `1px solid ${cfg.color}60`,
            borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 8,
          }}>
            {cfg.label}
          </span>
        </div>

        {/* Details */}
        <div style={{ background: '#f8f8f8', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
          {[
            { icon: '🚪', label: 'Entrance', value: visit.entranceName },
            { icon: '📅', label: 'Visit date', value: visit.visitDate },
            { icon: '🗓', label: 'Period', value: period },
            visit.inviterUsername && { icon: '👤', label: 'Invited by', value: visit.inviterUsername },
          ].filter(Boolean).map(({ icon, label, value }) => (
            <div key={label} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 14, width: 20, flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: 12, color: '#8c8c8c', minWidth: 72, flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Check-in info if already done */}
        {(isDone || isQueued) && (
          <div style={{
            background: isDone ? '#f6ffed' : '#e6f4ff',
            border: `1px solid ${isDone ? '#b7eb8f' : '#91caff'}`,
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
          }}>
            {isDone && (
              <div style={{ fontSize: 13, color: '#389e0d' }}>
                <strong>Checked in</strong>
                {visit.checkedInAt && ` at ${formatTime(visit.checkedInAt)}`}
                {visit.checkedInBy && ` by ${visit.checkedInBy}`}
              </div>
            )}
            {isQueued && (
              <div style={{ fontSize: 13, color: '#0958d9' }}>
                <strong>Queued for sync</strong>
                {visit.checkedInAt && ` — recorded at ${formatTime(visit.checkedInAt)}`}
                <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                  Will upload automatically when online
                </div>
              </div>
            )}
            {visit.checkinLat != null && (
              <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>
                GPS: {Number(visit.checkinLat).toFixed(5)}, {Number(visit.checkinLng).toFixed(5)}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        {canCheckin && (
          <Button
            block color="primary" size="large" loading={checkingIn}
            style={{ '--background-color': '#531dab', '--border-color': '#531dab', borderRadius: 14, marginBottom: 10 }}
            onClick={() => onCheckin(visit)}
          >
            {online ? 'Check In' : 'Check In (Offline)'}
          </Button>
        )}
        {isQueued && (
          <Button block disabled size="large" style={{ borderRadius: 14, marginBottom: 10 }}>
            Waiting for sync…
          </Button>
        )}
        <Button block size="large" style={{ borderRadius: 14 }} onClick={onClose}>
          Close
        </Button>
      </div>
    </Popup>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VisitListPage({ onLogout }) {
  const { auth }    = useAuth()
  const online      = useOnlineStatus()
  const sessionTime = useSessionTimer()
  const [helpOpen, setHelpOpen] = useState(false)

  const [visits,      setVisits]      = useState(() => {
    // Re-overlay any queued items on the cached visits
    const cached = loadVisits()
    const queuedIds = new Set(loadQueue().map(q => q.visitId))
    return cached.map(v => queuedIds.has(v.id) ? { ...v, status: 'PENDING_SYNC' } : v)
  })
  const [fetching,    setFetching]    = useState(false)
  const [selected,    setSelected]    = useState(null)   // visit object shown in popup
  const [checkingIn,  setCheckingIn]  = useState(false)
  const cacheTimeRef = useRef(getCacheTime())

  // ── Sync queue ──────────────────────────────────────────────────────────────
  const handleSynced = useCallback(() => {
    // After sync, reload visits from cache (confirmCheckin already updated it)
    const updated = loadVisits()
    setVisits(updated)
    // Update selected popup if still open
    setSelected(prev => prev ? (updated.find(v => v.id === prev.id) ?? null) : null)
  }, [])

  const { syncing, queueLen, refreshQueueLen } = useSyncQueue(auth, online, handleSynced)

  // ── Fetch from server ───────────────────────────────────────────────────────
  const fetchVisits = useCallback(async () => {
    if (!online) return
    setFetching(true)
    try {
      const { from, to } = getWeekRange()
      const fresh = await getWeekVisits(auth, from, to)

      // Preserve PENDING_SYNC status for items still in the queue
      const queuedIds = new Set(loadQueue().map(q => q.visitId))
      const merged = fresh.map(v => queuedIds.has(v.id) ? { ...v, status: 'PENDING_SYNC' } : v)
      saveVisits(merged)
      cacheTimeRef.current = getCacheTime()
      setVisits(merged)
    } catch {
      Toast.show({ content: 'Could not refresh — showing cached data', duration: 2000 })
    } finally { setFetching(false) }
  }, [auth, online])

  // Auto-fetch when coming online (and cache is stale > 5 min or empty)
  useEffect(() => {
    if (!online) return
    const cacheTime = getCacheTime()
    const stale = !cacheTime || (Date.now() - new Date(cacheTime).getTime() > 5 * 60 * 1000)
    if (stale) fetchVisits()
  }, [online, fetchVisits])

  // ── Check-in ────────────────────────────────────────────────────────────────
  const handleCheckin = useCallback(async (visit) => {
    setCheckingIn(true)
    try {
      const coords      = await getGPS()
      const checkinTime = new Date().toISOString()
      const lat         = coords?.lat ?? null
      const lng         = coords?.lng ?? null

      if (online) {
        const { checkinVisit } = await import('../api/api')
        await checkinVisit(auth, visit.id, lat, lng, checkinTime)
        // Update local state and cache
        setVisits(prev => {
          const next = prev.map(v => v.id === visit.id
            ? { ...v, status: 'CHECKED_IN', checkedInAt: checkinTime, checkedInBy: auth.username, checkinLat: lat, checkinLng: lng }
            : v)
          saveVisits(next)
          return next
        })
        setSelected(prev => prev?.id === visit.id
          ? { ...prev, status: 'CHECKED_IN', checkedInAt: checkinTime, checkinLat: lat, checkinLng: lng }
          : prev)
        Toast.show({ icon: 'success', content: 'Checked in!' })
      } else {
        applyLocalCheckin(visit.id, lat, lng, checkinTime)
        setVisits(prev => {
          const next = prev.map(v => v.id === visit.id
            ? { ...v, status: 'PENDING_SYNC', checkedInAt: checkinTime, checkinLat: lat, checkinLng: lng }
            : v)
          return next
        })
        setSelected(prev => prev?.id === visit.id
          ? { ...prev, status: 'PENDING_SYNC', checkedInAt: checkinTime }
          : prev)
        refreshQueueLen()
        Toast.show({
          content: coords ? 'Queued — GPS captured' : 'Queued — no GPS',
          duration: 2500,
        })
      }
    } catch (e) {
      Toast.show({ icon: 'fail', content: 'Check-in failed: ' + (e.response?.data?.message ?? e.message) })
    } finally { setCheckingIn(false) }
  }, [auth, online, refreshQueueLen])

  // ── Group visits by date ────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const today = todayStr()
    const map = {}
    for (const v of visits) {
      if (!map[v.visitDate]) map[v.visitDate] = []
      map[v.visitDate].push(v)
    }
    return Object.entries(map).sort(([a], [b]) => {
      if (a === today) return -1
      if (b === today) return 1
      return a < b ? -1 : 1
    })
  }, [visits])

  const pendingCount = visits.filter(v => v.status === 'PENDING').length

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
      <GreetingOverlay />

      {/* NavBar */}
      <NavBar
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Online / offline indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
              <span
                className="online-dot"
                style={{ background: online ? '#52c41a' : '#ff4d4f' }}
              />
              <span style={{ color: online ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>
                {online ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Queued badge */}
            {queueLen > 0 && (
              <Badge content={queueLen} style={{ '--color': '#1677ff' }}>
                <span style={{ fontSize: 11, color: '#1677ff', fontWeight: 600 }}>
                  {syncing ? 'Syncing…' : 'Queued'}
                </span>
              </Badge>
            )}

            {/* Help */}
            <span
              style={{ fontSize: 15, color: '#8c8c8c', padding: '4px 6px', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => setHelpOpen(true)}
            >?</span>

            {/* Logout */}
            <span
              style={{ fontSize: 13, color: '#8c8c8c', padding: '4px 6px', cursor: 'pointer' }}
              onClick={onLogout}
            >
              Out
            </span>
          </div>
        }
        style={{ '--height': '52px', '--border-bottom': '1px solid #eee', fontWeight: 700 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.3 }}>
          <span style={{ color: '#531dab', fontSize: 15 }}>Gate Entry</span>
          {(auth?.firstName || auth?.lastName) && (
            <span style={{ fontSize: 11, color: '#8c8c8c', fontWeight: 400 }}>
              {[auth.firstName, auth.lastName].filter(Boolean).join(' ')}
            </span>
          )}
          {sessionTime && (
            <span style={{
              fontSize: 10, fontWeight: 500,
              color: sessionTime.totalMin < 10 ? '#ff4d4f'
                   : sessionTime.totalMin < 30 ? '#fa8c16'
                   : '#bfbfbf',
            }}>
              {sessionTime.h > 0 ? `${sessionTime.h}h ${sessionTime.m}m` : `${sessionTime.m}m`} left
            </span>
          )}
        </div>
        {pendingCount > 0 && (
          <Badge content={pendingCount} style={{ '--color': '#faad14', marginLeft: 6 }} />
        )}
      </NavBar>

      {/* Scroll body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {fetching && (
          <div style={{ textAlign: 'center', padding: 12 }}>
            <SpinLoading color="#531dab" style={{ '--size': '20px' }} />
          </div>
        )}

        <PullToRefresh
          onRefresh={fetchVisits}
          disabled={!online}
          renderText={s => s === 'pulling' ? 'Pull to refresh' : s === 'canRelease' ? 'Release' : s === 'refreshing' ? 'Refreshing…' : 'Done'}
        >
          {visits.length === 0 ? (
            <div style={{ padding: '80px 24px', textAlign: 'center' }}>
              {online ? (
                fetching ? null : (
                  <>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🚪</div>
                    <div style={{ color: '#8c8c8c', fontSize: 14 }}>No visits assigned this week</div>
                  </>
                )
              ) : (
                <>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📵</div>
                  <div style={{ color: '#8c8c8c', fontSize: 14, marginBottom: 6 }}>Offline — no cached data</div>
                  <div style={{ color: '#bfbfbf', fontSize: 12 }}>Connect to load this week's visits</div>
                </>
              )}
            </div>
          ) : (
            grouped.map(([date, dayVisits]) => {
              const isToday = date === todayStr()
              return (
                <div key={date}>
                  <div className={`day-header${isToday ? ' today' : ''}`}>
                    {formatDate(date)}
                    <span style={{ marginLeft: 6, color: '#bfbfbf', fontWeight: 400, textTransform: 'none', fontSize: 11 }}>
                      {dayVisits.filter(v => v.status === 'PENDING').length > 0
                        ? `${dayVisits.filter(v => v.status === 'PENDING').length} pending`
                        : `${dayVisits.filter(v => v.status === 'CHECKED_IN').length}/${dayVisits.length} done`
                      }
                    </span>
                  </div>
                  <List style={{ '--border-inner': 'none' }}>
                    {dayVisits.map(v => (
                      <List.Item
                        key={v.id}
                        prefix={<StatusDot status={v.status} />}
                        description={
                          <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                            {v.entranceName}
                            {v.visitorCompany ? ` · ${v.visitorCompany}` : ''}
                            {v.status === 'CHECKED_IN' && v.checkedInAt
                              ? ` · ${formatTime(v.checkedInAt)}`
                              : ''}
                            {v.status === 'PENDING_SYNC' ? ' · queued' : ''}
                          </span>
                        }
                        arrow
                        clickable
                        onClick={() => setSelected(v)}
                        style={{
                          '--border-bottom': '1px solid #f0f0f0',
                          background: v.status === 'PENDING' && isToday ? '#fafaf5' : 'white',
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: 14 }}>
                          {v.visitorFirstName} {v.visitorLastName}
                        </span>
                      </List.Item>
                    ))}
                  </List>
                </div>
              )
            })
          )}
        </PullToRefresh>
      </div>

      {/* Visit detail popup */}
      {selected && (
        <VisitPopup
          visit={selected}
          online={online}
          checkingIn={checkingIn}
          onCheckin={handleCheckin}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Help popup */}
      <Popup visible={helpOpen} onMaskClick={() => setHelpOpen(false)}
        bodyStyle={{ borderRadius: '16px 16px 0 0', padding: '20px 20px 32px', maxHeight: '70vh', overflowY: 'auto' }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>How to use this page</span>
          <Button size="mini" fill="none" onClick={() => setHelpOpen(false)}>Close</Button>
        </div>
        {HELP_SECTIONS.map((s, i) => (
          <div key={s.title} style={{ marginBottom: 16 }}>
            {i > 0 && <div style={{ height: 1, background: '#f0f0f0', margin: '12px 0' }} />}
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: '#531dab' }}>{s.title}</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {s.items.map(item => (
                <li key={item} style={{ fontSize: 13, color: '#595959', marginBottom: 4, lineHeight: 1.5 }}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </Popup>
    </div>
  )
}

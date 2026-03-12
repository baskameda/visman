import React, { useState, useCallback, useEffect } from 'react'
import {
  NavBar, Tabs, List, Tag, Button, SpinLoading,
  PullToRefresh, Toast, Empty, Badge, Popup,
} from 'antd-mobile'

const HELP_SECTIONS = [
  {
    title: 'Mine tab',
    items: [
      'Security checks assigned directly to you.',
      'Tap a row to open the review screen and act on the check.',
    ],
  },
  {
    title: 'Open tab',
    items: [
      'Unassigned checks available to the whole Security group.',
      'Tap Claim to take ownership of a check before reviewing it.',
    ],
  },
  {
    title: 'Reviewing a visitor',
    items: [
      'Tick Identity Confirmed once you have verified their documents.',
      'Set the reliability score, add a note if needed.',
      'Choose: Approve, Refuse, Blacklist, or Ask Inviter.',
      'Ask Inviter sends a question back — the task returns with their answer (max 5 rounds).',
    ],
  },
  {
    title: 'Refreshing',
    items: [
      'Pull down on any tab to refresh manually.',
      'The list auto-refreshes every 20 seconds in the background.',
    ],
  },
]
import {
  UserOutline, ClockCircleOutline, EnvironmentOutline,
  RightOutline, AddOutline,
} from 'antd-mobile-icons'
import {
  getPendingMineChecks, getPendingOthersChecks,
  buildTaskMap, claimSecurityCheck, claimTask,
} from '../api/api'
import { useAuth } from '../context/AuthContext'
import GreetingOverlay from '../components/GreetingOverlay'

// ── Auto-refresh every 20s ───────────────────────────────────────────────────
function usePolling(fn, ms = 20000) {
  useEffect(() => {
    fn()
    const id = setInterval(fn, ms)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

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

// ── Single check row ─────────────────────────────────────────────────────────
function CheckRow({ sc, task, onPress, onClaim, claimable }) {
  const [claiming, setClaiming] = useState(false)

  const period = sc.startDate === sc.endDate
    ? sc.startDate
    : `${sc.startDate} → ${sc.endDate}`

  const handleClaim = async (e) => {
    e.stopPropagation()
    setClaiming(true)
    try { await onClaim(sc) }
    finally { setClaiming(false) }
  }

  return (
    <List.Item
      onClick={() => task && onPress(sc, task)}
      arrow={task ? <RightOutline /> : false}
      style={{ cursor: task ? 'pointer' : 'default' }}
      extra={
        claimable && !task ? (
          <Button size="mini" color="warning" fill="outline"
            loading={claiming} onClick={handleClaim}
            icon={<AddOutline />}>
            Claim
          </Button>
        ) : null
      }
    >
      <div style={{ padding: '2px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>
            {sc.visitorFirstName} {sc.visitorLastName}
          </span>
          {sc.clarificationCount > 0 && (
            <Tag color="warning" style={{ fontSize: 10 }}>
              {sc.clarificationCount} Q&amp;A
            </Tag>
          )}
          {!task && <Tag color="default" style={{ fontSize: 10 }}>Unclaimed</Tag>}
        </div>
        {sc.visitorCompany && (
          <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 2 }}>
            {sc.visitorCompany}
            {sc.visitorFunction ? ` · ${sc.visitorFunction}` : ''}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: '#595959' }}>
          <span><ClockCircleOutline style={{ marginRight: 3 }} />{period}</span>
          {sc.entranceName && (
            <span><EnvironmentOutline style={{ marginRight: 3 }} />{sc.entranceName}</span>
          )}
          {sc.inviterUsername && (
            <span><UserOutline style={{ marginRight: 3 }} />by {sc.inviterUsername}</span>
          )}
        </div>
      </div>
    </List.Item>
  )
}

// ── Tab content with pull-to-refresh ─────────────────────────────────────────
function CheckList({ checks, scToTask, loading, onPress, onClaim, claimable, emptyText }) {
  if (loading && checks.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <SpinLoading color="warning" />
      </div>
    )
  }
  if (checks.length === 0) {
    return <Empty style={{ paddingTop: 64 }} description={emptyText} />
  }
  return (
    <List>
      {checks.map(sc => (
        <CheckRow
          key={sc.id}
          sc={sc}
          task={scToTask[sc.id]}
          onPress={onPress}
          onClaim={onClaim}
          claimable={claimable}
        />
      ))}
    </List>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function TaskListPage({ onReview, onLogout }) {
  const { auth } = useAuth()
  const [helpOpen,   setHelpOpen]   = useState(false)
  const sessionTime = useSessionTimer()

  const [mineChecks,   setMineChecks]   = useState([])
  const [othersChecks, setOthersChecks] = useState([])
  const [scToTask,     setScToTask]     = useState({})
  const [loading,      setLoading]      = useState(true)

  const loadTasks = useCallback(async () => {
    try {
      const [mine, others, taskMap] = await Promise.all([
        getPendingMineChecks(auth),
        getPendingOthersChecks(auth),
        buildTaskMap(auth),
      ])
      setMineChecks(mine)
      setOthersChecks(others)
      setScToTask(taskMap)
    } catch (e) {
      Toast.show({ icon: 'fail', content: 'Failed to load: ' + (e.message ?? 'unknown') })
    } finally {
      setLoading(false)
    }
  }, [auth])

  usePolling(loadTasks)

  const handleOpenReview = (sc, task) => onReview(sc, task)

  const handleClaim = async (sc) => {
    try {
      await claimSecurityCheck(auth, sc.id)
      // After claiming the check, also claim the BPMN task
      const taskMapRefreshed = await buildTaskMap(auth)
      const task = taskMapRefreshed[sc.id]
      if (task) await claimTask(auth, task.id)
      Toast.show({ icon: 'success', content: `Claimed ${sc.visitorFirstName} ${sc.visitorLastName}` })
      await loadTasks()
    } catch (e) {
      Toast.show({ icon: 'fail', content: 'Claim failed: ' + (e.response?.data?.message ?? e.message) })
    }
  }

  const tabs = [
    {
      key: 'mine',
      title: (
        <Badge content={mineChecks.length > 0 ? mineChecks.length : null} color="#fa8c16">
          <span style={{ paddingRight: mineChecks.length > 0 ? 8 : 0 }}>Mine</span>
        </Badge>
      ),
      content: (
        <PullToRefresh onRefresh={loadTasks}>
          <CheckList
            checks={mineChecks}
            scToTask={scToTask}
            loading={loading}
            onPress={handleOpenReview}
            onClaim={handleClaim}
            claimable={false}
            emptyText="No checks assigned to you."
          />
        </PullToRefresh>
      ),
    },
    {
      key: 'open',
      title: (
        <Badge content={othersChecks.length > 0 ? othersChecks.length : null} color="#8c8c8c">
          <span style={{ paddingRight: othersChecks.length > 0 ? 8 : 0 }}>Open</span>
        </Badge>
      ),
      content: (
        <PullToRefresh onRefresh={loadTasks}>
          <CheckList
            checks={othersChecks}
            scToTask={scToTask}
            loading={loading}
            onPress={handleOpenReview}
            onClaim={handleClaim}
            claimable={true}
            emptyText="No open checks available."
          />
        </PullToRefresh>
      ),
    },
  ]

  return (
    <div style={{ minHeight: '100dvh', background: '#f5f5f5' }}>
      <GreetingOverlay accentColor="#fa8c16" />
      <NavBar
        back={null}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button size="mini" fill="none" color="default"
              onClick={() => setHelpOpen(true)}
              style={{ minWidth: 0, padding: '0 6px', color: '#8c8c8c' }}
            >?</Button>
            <Button size="mini" fill="none" color="default" onClick={onLogout}>
              Sign out
            </Button>
          </div>
        }
        style={{
          background: '#fff',
          borderBottom: '1px solid #eee',
          '--height': '52px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.3 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Security Review</span>
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
      </NavBar>

      <Tabs
        style={{
          '--title-font-size': '14px',
          '--active-title-color': '#fa8c16',
          '--active-line-color': '#fa8c16',
          background: '#fff',
          borderBottom: '1px solid #eee',
        }}
      >
        {tabs.map(tab => (
          <Tabs.Tab key={tab.key} title={tab.title}>
            <div style={{ background: '#f5f5f5', minHeight: 'calc(100dvh - 96px)' }}>
              {tab.content}
            </div>
          </Tabs.Tab>
        ))}
      </Tabs>

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
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: '#fa8c16' }}>{s.title}</div>
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

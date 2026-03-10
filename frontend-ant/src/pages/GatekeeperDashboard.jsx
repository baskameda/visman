import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  Typography, Alert, Button, Modal, Space, Tooltip, Tag,
  Card, Spin, Collapse, Table, Badge, Tabs,
} from 'antd'
import {
  BankOutlined, ReloadOutlined, LoginOutlined, UserOutlined,
  CalendarOutlined, CheckCircleOutlined, TeamOutlined,
  PauseCircleOutlined, PlayCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import Layout               from '../components/Layout'
import Tx                   from '../components/Tx'
import GreetingOverlay      from '../components/GreetingOverlay'
import { usePageHelp }      from '../hooks/usePageHelp'

const HELP_SECTIONS = [
  {
    title: 'Checking in a visitor',
    items: [
      'Find the visitor in the calendar below — expand the relevant month, then the week.',
      'Click Check In on a PENDING visit to record the arrival immediately.',
      'A warning appears if you check in on a different date than scheduled — confirm to proceed.',
      'Each visit can only be checked in once. CHECKED_IN visits are shown in green.',
    ],
  },
  {
    title: 'Weekly calendar',
    items: [
      'Months expand to reveal weeks; the week closest to today is opened automatically.',
      'Each week row shows the total visit count and how many are still pending.',
      'My Entrances at the top lists the gates you are assigned to — visits are scoped to those entrances.',
    ],
  },
  {
    title: 'My Performance panel',
    items: [
      'Shows your check-in streak, count for today, on-time rate, and busiest hour of the day.',
      'Collapsed by default — click the panel header to expand.',
    ],
  },
  {
    title: 'Supervised tab (supervisors only)',
    items: [
      'Appears if the admin has assigned you as a gatekeeper supervisor.',
      'Shows visits across all your supervisees\' entrances so you can monitor their activity.',
    ],
  },
]
import OrgStatsPanel        from '../components/OrgStatsPanel'
import { useAuth }          from '../context/AuthContext'
import { useTheme }         from '../context/ThemeContext'
import { useTranslation }   from 'react-i18next'
import { useOrgStats }      from '../hooks/useOrgStats'
import { useUserMap, formatUser } from '../hooks/useUserMap'
import {
  checkInVisit, getMyEntrances,
  getMyVisitDateIndex, getMyVisitsForWeek,
  getSuperviseeVisits, getMyGatekeeperSupervisees,
} from '../api/operatonApi'

const { Title, Text } = Typography

// ── Date helpers ──────────────────────────────────────────────────────────────

function isoWeekStart(dateStr) {
  const d = dayjs(dateStr)
  const dow = d.day()                    // 0 = Sun, 1 = Mon …
  const delta = dow === 0 ? -6 : 1 - dow
  return d.add(delta, 'day').format('YYYY-MM-DD')
}

function isoWeekEnd(weekStart) {
  return dayjs(weekStart).add(6, 'day').format('YYYY-MM-DD')
}

function monthKey(weekStart) {
  return dayjs(weekStart).format('YYYY-MM')
}

function weekRangeLabel(weekStart) {
  const s = dayjs(weekStart)
  const e = s.add(6, 'day')
  return s.month() === e.month()
    ? `${s.format('MMM D')}–${e.format('D')}`
    : `${s.format('MMM D')} – ${e.format('MMM D')}`
}

// Build [{weekStart, pending, checkedIn, total}] from the date-index response
function buildWeekIndex(dateIndex) {
  const map = new Map()
  for (const { date, pending, checkedIn } of dateIndex) {
    const ws = isoWeekStart(date)
    if (!map.has(ws)) map.set(ws, { weekStart: ws, pending: 0, checkedIn: 0, total: 0 })
    const w = map.get(ws)
    w.pending   += pending
    w.checkedIn += checkedIn
    w.total     += pending + checkedIn
  }
  return [...map.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart))
}

// Group weeks into months [{key, label, weeks, total, pending}]
function buildMonthGroups(weeks) {
  const map = new Map()
  for (const week of weeks) {
    const mk = monthKey(week.weekStart)
    if (!map.has(mk)) {
      map.set(mk, {
        key:     mk,
        label:   dayjs(week.weekStart).format('MMMM YYYY'),
        weeks:   [],
        total:   0,
        pending: 0,
      })
    }
    const m = map.get(mk)
    m.weeks.push(week)
    m.total   += week.total
    m.pending += week.pending
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key))
}

// Return the weekStart closest in time to today
function findClosestWeek(weeks) {
  if (!weeks.length) return null
  const todayWeek = isoWeekStart(dayjs().format('YYYY-MM-DD'))
  if (weeks.some(w => w.weekStart === todayWeek)) return todayWeek
  return weeks.reduce((best, w) => {
    if (!best) return w.weekStart
    const db = Math.abs(dayjs(best).diff(dayjs(todayWeek), 'day'))
    const dw = Math.abs(dayjs(w.weekStart).diff(dayjs(todayWeek), 'day'))
    return dw < db ? w.weekStart : best
  }, null)
}

const VISIT_STATUS_COLOR = { PENDING: 'processing', CHECKED_IN: 'success', NO_SHOW: 'warning' }

// ── Component ─────────────────────────────────────────────────────────────────

export default function GatekeeperDashboard() {
  const { auth }   = useAuth()
  const { dark }   = useTheme()
  const { t }      = useTranslation()
  const isSupervisor = auth?.isGatekeeperSupervisor ?? false
  const userMap    = useUserMap(auth)
  usePageHelp(HELP_SECTIONS)
  // Cat 2: theme-aware secondary text that passes WCAG AA on both light and dark bg
  const textSub = dark ? '#a0a0a0' : '#6b6b6b'

  // Supervised visits (supervisor only)
  const [superviseeVisits,        setSuperviseeVisits]        = useState([])
  const [superviseeLoading,       setSuperviseeLoading]       = useState(false)
  const [superviseeError,         setSuperviseeError]         = useState('')
  const [mySupervisees,           setMySupervisees]           = useState([])

  // Lightweight week index (dates + counts, no visit details)
  const [weekIndex,    setWeekIndex]    = useState([])
  const [indexLoading, setIndexLoading] = useState(true)
  const [error,        setError]        = useState('')
  const [lastRefresh,  setLastRefresh]  = useState(null)

  // Lazy-loaded visit data per week: weekStart → Visit[]
  const [weekCache,      setWeekCache]      = useState({})
  const [weekLoadingMap, setWeekLoadingMap] = useState({}) // weekStart → bool
  const weekCacheRef  = useRef({})   // mirror for non-render reads
  const loadingLock   = useRef(new Set())  // prevent double-fetches

  // Collapse open/close state
  const [expandedMonths, setExpandedMonths] = useState([])
  const [expandedWeeks,  setExpandedWeeks]  = useState([])
  const expandedWeeksRef = useRef([])

  // Check-in modal
  const [dialogOpen,   setDialogOpen]   = useState(false)
  const [activeVisit,  setActiveVisit]  = useState(null)
  const [submitting,   setSubmitting]   = useState(false)
  const [dialogError,  setDialogError]  = useState('')

  // Entrances card
  const [myEntrances,      setMyEntrances]      = useState([])
  const [entrancesLoading, setEntrancesLoading] = useState(true)

  // Cat 4: pause live auto-refresh
  const [paused, setPaused] = useState(false)

  // Stats
  const { stats: orgStats, loading: orgLoading, refresh: orgRefresh } = useOrgStats(auth)

  // ── Keep refs in sync ───────────────────────────────────────────────────────
  useEffect(() => { weekCacheRef.current = weekCache },    [weekCache])
  useEffect(() => { expandedWeeksRef.current = expandedWeeks }, [expandedWeeks])

  // ── Load date index ─────────────────────────────────────────────────────────
  const loadIndex = useCallback(async () => {
    setError('')
    try {
      const dateIndex = await getMyVisitDateIndex(auth)
      const weeks = buildWeekIndex(dateIndex)
      setWeekIndex(weeks)
      setLastRefresh(new Date())
      return weeks
    } catch (e) {
      setError(e.message ?? 'Failed to load visits')
      return null
    } finally {
      setIndexLoading(false)
    }
  }, [auth])

  // ── Load visit data for one week ────────────────────────────────────────────
  const loadWeek = useCallback(async (weekStart, force = false) => {
    if (loadingLock.current.has(weekStart)) return
    if (!force && weekCacheRef.current[weekStart] !== undefined) return
    loadingLock.current.add(weekStart)
    setWeekLoadingMap(prev => ({ ...prev, [weekStart]: true }))
    try {
      const visits = await getMyVisitsForWeek(auth, weekStart, isoWeekEnd(weekStart))
      setWeekCache(prev => ({ ...prev, [weekStart]: visits }))
    } catch {
      setWeekCache(prev => ({ ...prev, [weekStart]: [] }))
    } finally {
      loadingLock.current.delete(weekStart)
      setWeekLoadingMap(prev => ({ ...prev, [weekStart]: false }))
    }
  }, [auth])

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    loadIndex().then(weeks => {
      if (!weeks) return
      const cw = findClosestWeek(weeks)
      if (cw) {
        setExpandedMonths([monthKey(cw)])
        setExpandedWeeks([cw])
      }
    })
    getMyEntrances(auth)
      .then(setMyEntrances)
      .catch(() => {})
      .finally(() => setEntrancesLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch data for newly expanded weeks ─────────────────────────────────────
  useEffect(() => {
    expandedWeeks.forEach(wk => {
      if (weekCacheRef.current[wk] === undefined && !loadingLock.current.has(wk)) {
        loadWeek(wk)
      }
    })
  }, [expandedWeeks]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-refresh every 60 s (Cat 4: respects paused state) ─────────────────
  useEffect(() => {
    if (paused) return
    const id = setInterval(() => {
      loadIndex()
      expandedWeeksRef.current.forEach(wk => loadWeek(wk, true))
    }, 60_000)
    return () => clearInterval(id)
  }, [loadIndex, loadWeek, paused])

  // ── Collapse handlers ───────────────────────────────────────────────────────
  const handleWeekChange = useCallback((month, openKeys) => {
    const monthWeeks = new Set(month.weeks.map(w => w.weekStart))
    setExpandedWeeks(prev => [
      ...prev.filter(w => !monthWeeks.has(w)),
      ...openKeys,
    ])
    openKeys.forEach(wk => loadWeek(wk))
  }, [loadWeek])

  // ── Manual refresh ──────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    loadIndex()
    expandedWeeksRef.current.forEach(wk => loadWeek(wk, true))
  }, [loadIndex, loadWeek])

  // ── Supervisee visits ────────────────────────────────────────────────────────
  const loadSuperviseeVisits = useCallback(async () => {
    setSuperviseeLoading(true); setSuperviseeError('')
    try {
      const [visits, supervisees] = await Promise.all([
        getSuperviseeVisits(auth),
        getMyGatekeeperSupervisees(auth),
      ])
      setSuperviseeVisits(visits)
      setMySupervisees(supervisees)
    } catch (e) { setSuperviseeError(e.response?.data?.message ?? e.message) }
    finally { setSuperviseeLoading(false) }
  }, [auth])

  useEffect(() => { if (isSupervisor) loadSuperviseeVisits() }, [isSupervisor, loadSuperviseeVisits])

  // ── Check-in ────────────────────────────────────────────────────────────────
  const handleOpenDialog = (visit) => {
    setActiveVisit(visit)
    setDialogError('')
    setDialogOpen(true)
  }

  const handleCheckIn = async () => {
    setSubmitting(true); setDialogError('')
    try {
      await checkInVisit(auth, activeVisit.id)
      setDialogOpen(false)
      gkRefresh()
      // Invalidate the affected week so it reloads on next open/refresh
      const ws = isoWeekStart(activeVisit.visitDate)
      loadIndex()
      loadWeek(ws, true)
      if (isSupervisor) loadSuperviseeVisits()
    } catch (e) {
      const msg = e.response?.status === 409
        ? 'This visit is already checked in.'
        : t('gatekeeper.failedToSubmit', { error: e.response?.data?.message ?? e.message })
      setDialogError(msg)
    } finally { setSubmitting(false) }
  }

  // ── Table columns ───────────────────────────────────────────────────────────
  const todayStr = dayjs().format('YYYY-MM-DD')

  const columns = [
    {
      title: 'Date',
      dataIndex: 'visitDate',
      key: 'date',
      width: 130,
      render: (d) => (
        <Space size={4}>
          <Text style={{ fontSize: 13 }}>{dayjs(d).format('ddd, MMM D')}</Text>
          {d === todayStr && (
            <Tag color="blue" style={{ fontSize: 11, padding: '0 4px', lineHeight: '16px', margin: 0 }}>
              Today
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Visitor',
      key: 'visitor',
      render: (_, v) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>
            {v.visitorFirstName} {v.visitorLastName}
          </Text>
          {v.visitorCompany && (
            <Text style={{ display: 'block', fontSize: 13, color: textSub }}>
              {v.visitorCompany}
              {v.visitorFunction ? ` · ${v.visitorFunction}` : ''}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Entrance',
      dataIndex: 'entranceName',
      key: 'entrance',
      width: 150,
    },
    {
      title: 'Invited by',
      dataIndex: 'inviterUsername',
      key: 'inviter',
      width: 160,
      render: (u) => u
        ? <Text style={{ fontSize: 13, color: textSub }}>{formatUser(u, userMap)}</Text>
        : null,
    },
    {
      title: 'Approved by',
      dataIndex: 'securityApprover',
      key: 'approver',
      width: 160,
      render: (u) => u
        ? <Text style={{ fontSize: 13, color: textSub }}>{formatUser(u, userMap)}</Text>
        : null,
    },
    {
      title: 'Status',
      key: 'status',
      width: 140,
      render: (_, v) => (
        <div>
          <Tag color={VISIT_STATUS_COLOR[v.status] ?? 'default'} style={{ margin: 0 }}>
            {v.status === 'PENDING' ? 'Awaiting Check-in' : v.status === 'CHECKED_IN' ? 'Checked In' : v.status}
          </Tag>
          {v.checkedInBy && (
            <Text style={{ display: 'block', fontSize: 13, color: textSub, marginTop: 2 }}>
              <CheckCircleOutlined aria-hidden="true" style={{ marginRight: 3, color: '#52c41a' }} />
              {formatUser(v.checkedInBy, userMap)}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 90,
      render: (_, v) => v.status === 'PENDING' ? (
        <Button
          type="primary" size="small"
          style={{ background: '#389e0d', borderColor: '#389e0d' }}
          onClick={() => handleOpenDialog(v)}
        >
          Check In
        </Button>
      ) : null,
    },
  ]

  // ── Build grouped data for render ───────────────────────────────────────────
  const monthGroups = buildMonthGroups(weekIndex)

  // ── Supervised tab columns (same as main + assigned-to column) ───────────────
  const supervisedColumns = [
    ...columns.slice(0, 2), // Date, Visitor
    {
      title: 'Entrance',
      dataIndex: 'entranceName',
      key: 'entrance',
      width: 150,
    },
    {
      title: 'Gatekeeper',
      key: 'assignedTo',
      width: 160,
      render: (_, v) => v.checkedInBy
        ? <Text type="secondary" style={{ fontSize: 12 }}><CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />{formatUser(v.checkedInBy, userMap)}</Text>
        : <Text type="secondary" style={{ fontSize: 12 }}>—</Text>,
    },
    columns[columns.length - 2], // Status
    columns[columns.length - 1], // Action
  ]

  // Group supervised visits by responsible gatekeeper (supervisee)
  const visitsByGatekeeper = superviseeVisits.reduce((acc, v) => {
    const key = v.responsibleGatekeeper ?? 'Unknown'
    if (!acc[key]) acc[key] = []
    acc[key].push(v)
    return acc
  }, {})

  const supervisedTab = (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button icon={<ReloadOutlined />} onClick={loadSuperviseeVisits} loading={superviseeLoading}
          aria-label="Reload supervised visits" />
      </div>
      {superviseeError && (
        <Alert type="error" message={superviseeError} showIcon closable
          onClose={() => setSuperviseeError('')} style={{ marginBottom: 16 }} />
      )}
      {superviseeLoading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
      ) : mySupervisees.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', border: '2px dashed #e8e8e8', borderRadius: 12 }}>
          <TeamOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 12 }} />
          <div><Text type="secondary">No supervisees assigned.</Text></div>
        </div>
      ) : (
        mySupervisees.map(gatekeeper => {
          const visits = visitsByGatekeeper[gatekeeper] ?? []
          const pending = visits.filter(v => v.status === 'PENDING').length
          return (
            <div key={gatekeeper} style={{ marginBottom: 24 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', marginBottom: 8,
                background: '#f5f0ff', borderRadius: 8, border: '1px solid #d3adf7',
              }}>
                <UserOutlined style={{ color: '#531dab' }} />
                <Text strong style={{ color: '#531dab' }}>{formatUser(gatekeeper, userMap)}</Text>
                <Tag color="purple" style={{ margin: 0 }}>{visits.length} visit{visits.length !== 1 ? 's' : ''}</Tag>
                {pending > 0 && <Tag color="processing" style={{ margin: 0 }}>{pending} pending</Tag>}
              </div>
              {visits.length === 0 ? (
                <div style={{ padding: '12px 16px', color: textSub, fontSize: 13, border: '1px dashed #e8e8e8', borderRadius: 8 }}>
                  No visits yet.
                </div>
              ) : (
                <Table
                  size="small"
                  dataSource={visits}
                  columns={supervisedColumns}
                  rowKey="id"
                  pagination={false}
                  style={{ borderRadius: 8, overflow: 'hidden' }}
                  aria-label={`Visits for supervisee ${formatUser(gatekeeper, userMap)}`}
                />
              )}
            </div>
          )
        })
      )}
    </div>
  )

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <GreetingOverlay />

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}><Tx k="gatekeeper.title" /></Title>
        {(auth?.firstName || auth?.lastName) && (
          <Tag icon={<UserOutlined />} style={{ fontSize: 13, fontWeight: 600, borderRadius: 20 }}>
            {[auth.firstName, auth.lastName].filter(Boolean).join(' ')}
          </Tag>
        )}
      </div>

      <OrgStatsPanel
        stats={orgStats} loading={orgLoading} onRefresh={orgRefresh}
        isAdmin={auth?.isAlsoAdmin ?? auth?.role === 'ADMIN'}
      />

      {/* My Entrances */}
      <Card
        size="small"
        style={{ marginBottom: 12, borderColor: '#d9d9d9' }}
        title={<Space><LoginOutlined style={{ color: '#1677ff' }} /><Text strong>My Entrances</Text></Space>}
      >
        {entrancesLoading
          ? <Spin size="small" />
          : myEntrances.length === 0
          ? <Text type="secondary">No entrances assigned yet.</Text>
          : <Space wrap>
              {myEntrances.map(e => (
                <Tooltip key={e.id} title={e.description || ''}>
                  <Tag icon={<BankOutlined />} color="blue">{e.name}</Tag>
                </Tooltip>
              ))}
            </Space>
        }
      </Card>


      {error && (
        <Alert
          type="error" message={error} showIcon closable
          onClose={() => setError('')} style={{ marginBottom: 16 }}
        />
      )}

      <Tabs items={[
        {
          key: 'my',
          label: <Space><CalendarOutlined /><Tx k="gatekeeper.title" /></Space>,
          children: (
            <>
              {/* Header — Cat 4: pause / resume live updates */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {paused
                    ? 'Live updates paused'
                    : lastRefresh
                    ? t('common.liveUpdated', { time: lastRefresh.toLocaleTimeString() })
                    : t('common.connecting')}
                </Text>
                <Space>
                  <Tooltip title={paused ? 'Resume live updates (60 s)' : 'Pause live updates'}>
                    <Button
                      icon={paused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                      onClick={() => setPaused(p => !p)}
                      aria-pressed={paused}
                      aria-label={paused ? 'Resume live updates' : 'Pause live updates'}
                    />
                  </Tooltip>
                  <Tooltip title={t('common.refreshNow')}>
                    <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={indexLoading}
                      aria-label={t('common.refreshNow')} />
                  </Tooltip>
                </Space>
              </div>

              {/* Visit accordion */}
              {indexLoading ? (
                <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
              ) : monthGroups.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', border: '2px dashed #e8e8e8', borderRadius: 12 }}>
                  <CalendarOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 12 }} />
                  <div><Text type="secondary"><Tx k="gatekeeper.emptyState" /></Text></div>
                </div>
              ) : (
                <Collapse
                  activeKey={expandedMonths}
                  onChange={setExpandedMonths}
                  style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8 }}
                >
                  {monthGroups.map(month => (
                    <Collapse.Panel
                      key={month.key}
                      header={
                        <Space>
                          <Text strong style={{ fontSize: 14 }}>{month.label}</Text>
                          <Tag>{month.total} visit{month.total !== 1 ? 's' : ''}</Tag>
                          {month.pending > 0 && (
                            <Tag color="processing">{month.pending} pending</Tag>
                          )}
                        </Space>
                      }
                    >
                      <Collapse
                        activeKey={expandedWeeks.filter(w => month.weeks.some(mw => mw.weekStart === w))}
                        onChange={(openKeys) => handleWeekChange(month, openKeys)}
                        style={{ background: '#fafafa', borderRadius: 6 }}
                      >
                        {month.weeks.map(week => {
                          const isCurrentWeek = week.weekStart === isoWeekStart(todayStr)
                          const isLoading = weekLoadingMap[week.weekStart]
                          const data = weekCache[week.weekStart]

                          return (
                            <Collapse.Panel
                              key={week.weekStart}
                              header={
                                <Space>
                                  <CalendarOutlined
                                    style={{ color: isCurrentWeek ? '#1677ff' : textSub }}
                                  />
                                  <Text style={{ fontWeight: isCurrentWeek ? 600 : 400 }}>
                                    {weekRangeLabel(week.weekStart)}
                                    {isCurrentWeek ? ' · This week' : ''}
                                  </Text>
                                  <Tag style={{ marginLeft: 4 }}>{week.total}</Tag>
                                  {week.pending > 0 && (
                                    <Tag color="processing">{week.pending} pending</Tag>
                                  )}
                                </Space>
                              }
                            >
                              {isLoading || data === undefined ? (
                                <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
                              ) : (
                                <Table
                                  size="small"
                                  dataSource={data}
                                  columns={columns}
                                  rowKey="id"
                                  pagination={false}
                                  locale={{ emptyText: 'No visits for this week.' }}
                                  style={{ background: '#fff', borderRadius: 6, overflow: 'hidden' }}
                                  aria-label={`Visits for week of ${weekRangeLabel(week.weekStart)}`}
                                />
                              )}
                            </Collapse.Panel>
                          )
                        })}
                      </Collapse>
                    </Collapse.Panel>
                  ))}
                </Collapse>
              )}
            </>
          ),
        },
        ...(isSupervisor ? [{
          key: 'supervised',
          label: (
            <Space>
              <TeamOutlined />
              Supervised
              {superviseeVisits.filter(v => v.status === 'PENDING').length > 0 && (
                <Tag color="processing" style={{ marginLeft: 4 }}>
                  {superviseeVisits.filter(v => v.status === 'PENDING').length}
                </Tag>
              )}
            </Space>
          ),
          children: supervisedTab,
        }] : []),
      ]} />

      {/* Check-in modal */}
      <Modal
        open={dialogOpen}
        onCancel={() => setDialogOpen(false)}
        footer={null}
        title={
          <Space>
            <BankOutlined style={{ color: '#389e0d' }} />
            Check In — {activeVisit ? `${activeVisit.visitorFirstName} ${activeVisit.visitorLastName}` : ''}
          </Space>
        }
        width={440}
      >
        {activeVisit && (
          <>
            <Space direction="vertical" size={6} style={{ width: '100%', marginBottom: 20 }}>
              {activeVisit.visitorCompany && (
                <Space>
                  <BankOutlined style={{ color: textSub }} />
                  <Text>{activeVisit.visitorCompany}</Text>
                </Space>
              )}
              <Space>
                <CalendarOutlined style={{ color: textSub }} />
                <Text strong>{activeVisit.visitDate}</Text>
              </Space>
              <Space>
                <LoginOutlined style={{ color: textSub }} />
                <Text>{activeVisit.entranceName}</Text>
              </Space>
              {activeVisit.inviterUsername && (
                <Space>
                  <UserOutlined style={{ color: textSub }} />
                  <Text type="secondary">Invited by {activeVisit.inviterUsername}</Text>
                </Space>
              )}
            </Space>
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
              <Tx k="gatekeeper.confirmDesc" />
            </Text>
            {(() => {
              if (!activeVisit) return null
              const diff = dayjs(activeVisit.visitDate).diff(dayjs(todayStr), 'day')
              if (diff === 0) return null
              const isPast = diff < 0
              return (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message={isPast
                    ? `This visit was scheduled ${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''} ago (${activeVisit.visitDate}). Are you sure you want to check in for a past date?`
                    : `This visit is scheduled ${diff} day${diff !== 1 ? 's' : ''} in the future (${activeVisit.visitDate}). Are you sure you want to check in early?`
                  }
                />
              )
            })()}
          </>
        )}
        {dialogError && (
          <Alert
            type="error" message={dialogError} showIcon closable
            onClose={() => setDialogError('')} style={{ marginBottom: 16 }}
          />
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting}>
            <Tx k="common.cancel" />
          </Button>
          <Button
            type="primary" onClick={handleCheckIn} loading={submitting}
            style={{ background: '#389e0d', borderColor: '#389e0d' }}
          >
            {t('gatekeeper.confirmCheckIn')}
          </Button>
        </div>
      </Modal>
    </Layout>
  )
}

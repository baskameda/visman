import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import {
  Button, Row, Col, Typography, Alert, Space,
  Modal, Form, Input, DatePicker, Tooltip, Divider,
  List, Avatar, Tag, Spin, Select, Tabs, Badge, Card, Radio, Collapse,
} from 'antd'
import {
  PlusCircleOutlined, UserAddOutlined, ReloadOutlined,
  SearchOutlined, BankOutlined, UserOutlined, PhoneOutlined, MailOutlined,
  QuestionCircleOutlined, LoginOutlined, CalendarOutlined,
  CloseCircleOutlined, DownOutlined, UpOutlined, CheckCircleOutlined,
  ClockCircleOutlined, StopOutlined, TeamOutlined, ApartmentOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import Layout          from '../components/Layout'
import Tx              from '../components/Tx'
import GreetingOverlay from '../components/GreetingOverlay'
import { usePageHelp } from '../hooks/usePageHelp'
import { useUserMap, formatUser, getCheckProcessStatus } from '../hooks/useUserMap'

const HELP_SECTIONS = [
  {
    title: 'Creating an invitation',
    items: [
      'Click New Invitation. Choose the entrance, the date range, and optionally a company name.',
      'Add one or more visitors: search your existing registry or fill in a new visitor manually.',
      'Each visitor gets an independent security check — you can invite multiple people in one go.',
      'Blacklisted visitors appear in red and cannot be added to an invitation.',
    ],
  },
  {
    title: 'Active Invitations panel',
    items: [
      'Pending — the security team has not yet reviewed the visitor. No action needed from you.',
      'In Review — security has a question. Open the invitation and answer it to unblock the process.',
      'You have up to 5 clarification rounds; after the 5th unanswered round the visit is auto-refused.',
    ],
  },
  {
    title: 'Invitation history',
    items: [
      'Use the History link in the sidebar to see all past invitations grouped by month.',
      'The current month is always shown at the top. Past months lazy-load when you expand them.',
      'Click any invitation row to see full details: visitors, security decisions, and check-in records.',
    ],
  },
  {
    title: 'My Performances panel',
    items: [
      'Shows your invitation streak, overall approval rate, and rank among inviters.',
      'Collapsed by default — click the panel header to expand.',
    ],
  },
  {
    title: 'Supervised tab (supervisors only)',
    items: [
      'Appears if you have been assigned as a supervisor by the admin.',
      'You can answer a clarification question on behalf of a supervisee without claiming the invitation.',
      "To take full control click Claim — the invitation is permanently transferred to your account and cannot be returned.",
    ],
  },
]
import { useAuth }     from '../context/AuthContext'
import { useTheme }   from '../context/ThemeContext'
import { useTaskSSE }  from '../hooks/useTaskSSE'
import {
  getTasksByAssignee, searchVisitors, getEntrances,
  createInvitation, getMyInvitations, getMyInvitationMonths, getInvitation,
  getTaskLocalVariable, getSecurityCheck, clarifySecurityCheck,
  getSuperviseeInvitations, claimInvitation, getTasksForProcess,
  getMySupervisees,
} from '../api/operatonApi'

const { Title, Text } = Typography

const STATUS_COLOR = { PENDING: 'processing', APPROVED: 'success', REFUSED: 'error', IN_REVIEW: 'warning' }
const STATUS_LABEL = { PENDING: 'Pending', APPROVED: 'Approved', REFUSED: 'Refused', IN_REVIEW: 'In Review' }
const SC_STATUS_COLOR = { PENDING: 'default', APPROVED: 'success', REFUSED: 'error', BLACKLISTED: 'error' }
const VISIT_STATUS_COLOR = { PENDING: 'default', CHECKED_IN: 'success', NO_SHOW: 'warning' }

const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December']

function monthKey(year, month) { return `${year}-${String(month).padStart(2, '0')}` }

const _today = new Date()
const CURRENT_MONTH_KEY = monthKey(_today.getFullYear(), _today.getMonth() + 1)

// ── Visitor registry search ───────────────────────────────────────────────────
function VisitorSearch({ credentials, onSelect }) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const debounce = useRef(null)

  const doSearch = useCallback(async (q) => {
    setLoading(true)
    try { setResults(await searchVisitors(credentials, q)) }
    catch { setResults([]) }
    finally { setLoading(false) }
  }, [credentials])

  useEffect(() => { doSearch('') }, [doSearch])

  const handleChange = (e) => {
    const q = e.target.value
    setQuery(q)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => doSearch(q), 300)
  }

  return (
    <div>
      <Input
        prefix={loading ? <Spin size="small" /> : <SearchOutlined style={{ color: '#bfbfbf' }} />}
        placeholder="Search your previous visitors…"
        value={query}
        onChange={handleChange}
        allowClear
        onClear={() => { setQuery(''); doSearch('') }}
        style={{ marginBottom: 8 }}
      />
      {results.length > 0 ? (
        <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, maxHeight: 200, overflowY: 'auto' }}>
          <List
            size="small"
            dataSource={results}
            renderItem={v => {
              const blocked = v.blacklisted
              return (
                <List.Item
                  aria-disabled={blocked}
                  aria-label={blocked ? `${v.firstName} ${v.lastName} – blacklisted, cannot be invited` : undefined}
                  style={{
                    cursor: blocked ? 'not-allowed' : 'pointer',
                    padding: '8px 12px',
                    transition: 'background 0.15s',
                    background: blocked ? '#fff1f0' : undefined,
                    borderLeft: blocked ? '3px solid #ff7875' : '3px solid transparent',
                  }}
                  onClick={() => { if (!blocked) onSelect(v) }}
                  onMouseEnter={e => { if (!blocked) e.currentTarget.style.background = '#f5f5f5' }}
                  onMouseLeave={e => { if (!blocked) e.currentTarget.style.background = '' }}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar size={28} style={{ background: blocked ? '#cf1322' : '#1677ff', fontSize: 12 }}>
                        {blocked
                          ? <><StopOutlined aria-hidden="true" style={{ fontSize: 13 }} /><span className="sr-only">Blacklisted</span></>
                          : (v.firstName?.[0]?.toUpperCase() ?? '?')}
                      </Avatar>
                    }
                    title={
                      <Space size={6}>
                        <Text style={{ fontSize: 13, fontWeight: 600, color: blocked ? '#595959' : undefined }}>
                          {v.firstName} {v.lastName}
                        </Text>
                        {blocked && <Tag color="error" style={{ fontSize: 11, margin: 0 }}>Blacklisted – cannot be invited</Tag>}
                      </Space>
                    }
                    description={<Space size={4}><Tag icon={<BankOutlined aria-hidden="true" />} style={{ fontSize: 11, margin: 0 }}>{v.company}</Tag></Space>}
                  />
                </List.Item>
              )
            }}
          />
        </div>
      ) : !loading ? (
        <Text type="secondary" style={{ fontSize: 12 }}>No visitors found.</Text>
      ) : null}
    </div>
  )
}

// ── Invitation drill-down modal ───────────────────────────────────────────────
function InvitationDrillModal({ open, invitationId, credentials, onClose, userMap }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !invitationId) return
    setLoading(true)
    getInvitation(credentials, invitationId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [open, invitationId, credentials])

  const inv = data
  return (
    <Modal
      open={open} onCancel={onClose} footer={null}
      title={<Space><CalendarOutlined style={{ color: '#1677ff' }} /> Invitation Detail</Space>}
      width={640} destroyOnHidden
    >
      {loading && <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>}
      {!loading && inv && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Space wrap>
              <Tag icon={<LoginOutlined />} color="blue">{inv.entranceName}</Tag>
              <Tag color={STATUS_COLOR[inv.status] ?? 'default'}>{STATUS_LABEL[inv.status] ?? inv.status}</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {inv.startDate} → {inv.endDate}
              </Text>
              {inv.company && <Tag icon={<BankOutlined />}>{inv.company}</Tag>}
            </Space>
            {inv.description && <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>{inv.description}</Text>}
          </div>
          {(inv.visitors ?? []).map(v => {
            const ps = getCheckProcessStatus({ ...v, status: v.securityCheckStatus })
            const officerName = formatUser(v.securityReviewer ?? v.assignedTo, userMap)
            return (
              <Card
                key={v.visitorId} size="small" style={{ marginBottom: 12, borderColor: '#f0f0f0' }}
                title={
                  <Space wrap>
                    <UserOutlined />
                    <Text strong>{v.firstName} {v.lastName}</Text>
                    {v.company && <Text type="secondary" style={{ fontSize: 12 }}>· {v.company}</Text>}
                    {v.reliability != null && <Tag color={v.reliability > 60 ? 'success' : v.reliability > 30 ? 'warning' : 'error'}>Reliability: {v.reliability}</Tag>}
                  </Space>
                }
              >
                <div style={{ marginBottom: 10 }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '2px 10px', borderRadius: 20,
                    background: ps.bg, border: `1px solid ${ps.color}55`,
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: ps.color, flexShrink: 0 }} />
                    <Text style={{ fontSize: 11, fontWeight: 600, color: ps.color }}>{ps.label}</Text>
                  </div>
                </div>
                {officerName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Tag style={{ margin: 0, fontSize: 10, borderRadius: 10 }} color="orange">Security officer</Tag>
                    <Text style={{ fontSize: 12 }}>{officerName}</Text>
                  </div>
                )}
                {(v.visits ?? []).length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {v.visits.map(vs => (
                      <Tag key={vs.id} color={VISIT_STATUS_COLOR[vs.status] ?? 'default'} style={{ fontSize: 11 }}>
                        {vs.visitDate} · {vs.status}
                      </Tag>
                    ))}
                  </div>
                ) : (
                  <Text type="secondary" style={{ fontSize: 12 }}>No visits yet.</Text>
                )}
              </Card>
            )
          })}
        </>
      )}
    </Modal>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function InviterDashboard() {
  const { auth }  = useAuth()
  const { dark }  = useTheme()
  const userMap   = useUserMap(auth)
  usePageHelp(HELP_SECTIONS)
  // Cat 2: theme-aware secondary text — passes WCAG AA on both light and dark card bg
  const textSub = dark ? '#a0a0a0' : '#6b6b6b'

  // Data — month-grouped invitations
  const [monthsIndex,   setMonthsIndex]   = useState([])          // [{year,month,count}]
  const [loadedMonths,  setLoadedMonths]  = useState({})          // { "YYYY-MM": Invitation[] }
  const [loadingMonths, setLoadingMonths] = useState({})          // { "YYYY-MM": bool }
  const [expandedKeys,  setExpandedKeys]  = useState([CURRENT_MONTH_KEY])
  const loadedMonthsRef = useRef({})

  const [clarTasks,   setClarTasks]   = useState([])
  const [clarSCs,     setClarSCs]     = useState({})   // taskId → SecurityCheck | null
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [lastRefresh, setLastRefresh] = useState(null)

  // Tab
  const [activeTab, setActiveTab] = useState('invitations')
  const prevClarCount = useRef(0)
  useEffect(() => {
    if (clarTasks.length > 0 && clarTasks.length > prevClarCount.current) setActiveTab('questions')
    prevClarCount.current = clarTasks.length
  }, [clarTasks.length])


  // Derived: active invitations from all loaded months
  const pendingInvs  = useMemo(() => Object.values(loadedMonths).flat().filter(inv => inv.status === 'PENDING'),   [loadedMonths])
  const inReviewInvs = useMemo(() => Object.values(loadedMonths).flat().filter(inv => inv.status === 'IN_REVIEW'), [loadedMonths])

  // Invitation creation form
  const [inviteOpen,   setInviteOpen]   = useState(false)
  const [visitorList,  setVisitorList]  = useState([])   // array of visitor entries
  const [addTab,       setAddTab]       = useState('registry')
  const [pendingReg,   setPendingReg]   = useState(null) // selected registry visitor
  const [submitting,   setSubmitting]   = useState(false)
  const [submitError,  setSubmitError]  = useState('')
  const [entrances,    setEntrances]    = useState([])
  const [entrancesLoading, setEntrancesLoading] = useState(false)
  const [inviteForm]   = Form.useForm()
  const [newVForm]     = Form.useForm()

  // Clarification modal
  const [clarOpen,      setClarOpen]      = useState(false)
  const [clarTaskId,    setClarTaskId]    = useState(null)
  const [clarAnswer,    setClarAnswer]    = useState('')
  const [clarSubmitting, setClarSubmitting] = useState(false)
  const [clarError,     setClarError]     = useState('')

  // Invitation drill-down
  const [drillId, setDrillId] = useState(null)

  // Supervised invitations
  const [superviseeInvs,   setSuperviseeInvs]   = useState([])
  const [svLoading,        setSvLoading]        = useState(false)
  const [mySupervisees,    setMySupervisees]    = useState([])

  // Claim modal
  const [claimOpen,        setClaimOpen]        = useState(false)
  const [claimInvDetail,   setClaimInvDetail]   = useState(null)
  const [claimInvLoading,  setClaimInvLoading]  = useState(false)
  const [claimVisitorId,   setClaimVisitorId]   = useState(null)
  const [claimSubmitting,  setClaimSubmitting]  = useState(false)
  const [claimError,       setClaimError]       = useState('')
  const [claimInvId,       setClaimInvId]       = useState(null)

  // Supervisor clarification modal (for supervisee invitations)
  const [svClarOpen,       setSvClarOpen]       = useState(false)
  const [svClarPairs,      setSvClarPairs]      = useState([])   // [{task, sc}]
  const [svClarAnswer,     setSvClarAnswer]     = useState('')
  const [svClarSubmitting, setSvClarSubmitting] = useState(false)
  const [svClarError,      setSvClarError]      = useState('')
  const [svClarLoading,    setSvClarLoading]    = useState(false)

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setError('')
    try {
      // Build the set of months to refresh: current month + all already-loaded months
      const alreadyLoaded = Object.keys(loadedMonthsRef.current)
      const nowYear  = _today.getFullYear()
      const nowMonth = _today.getMonth() + 1
      const monthsToFetch = [
        { year: nowYear, month: nowMonth },
        ...alreadyLoaded
          .filter(k => k !== CURRENT_MONTH_KEY)
          .map(k => { const [y, m] = k.split('-').map(Number); return { year: y, month: m } }),
      ]

      const [months, assigned, ...monthResults] = await Promise.all([
        getMyInvitationMonths(auth),
        getTasksByAssignee(auth),
        ...monthsToFetch.map(({ year, month }) => getMyInvitations(auth, year, month)),
      ])

      setMonthsIndex(months)

      const nextLoaded = { ...loadedMonthsRef.current }
      monthsToFetch.forEach(({ year, month }, i) => {
        nextLoaded[monthKey(year, month)] = monthResults[i]
      })
      setLoadedMonths(nextLoaded)
      loadedMonthsRef.current = nextLoaded

      const clarOnly = assigned.filter(t => t.taskDefinitionKey === 'Activity_Clarification_V2')
      setClarTasks(clarOnly)

      // Load security check details for each clarification task
      const scMap = {}
      await Promise.all(clarOnly.map(async t => {
        try {
          const varData = await getTaskLocalVariable(auth, t.id, 'securityCheckId')
          scMap[t.id] = await getSecurityCheck(auth, varData.value)
        } catch { scMap[t.id] = null }
      }))
      setClarSCs(scMap)
      setLastRefresh(new Date())
    } catch (e) {
      setError('Failed to load: ' + (e.message ?? 'unknown'))
    } finally { setLoading(false) }

    // Also reload supervised invitations + supervisee list for supervisors
    if (auth?.isSupervisor) {
      setSvLoading(true)
      try {
        const [invs, supervisees] = await Promise.all([
          getSuperviseeInvitations(auth),
          getMySupervisees(auth),
        ])
        setSuperviseeInvs(invs)
        setMySupervisees(supervisees)
      } catch { /* non-critical */ }
      finally { setSvLoading(false) }
    }
  }, [auth])

  // Keep ref in sync so loadData always sees the current loaded set without a dep cycle
  useEffect(() => { loadedMonthsRef.current = loadedMonths }, [loadedMonths])

  useTaskSSE(loadData)

  // ── Lazy-load a month when its panel is opened ─────────────────────────────
  const handlePanelChange = useCallback(async (keys) => {
    setExpandedKeys(keys)
    for (const key of keys) {
      if (key in loadedMonthsRef.current) continue        // already loaded
      if (loadingMonths[key]) continue                    // fetch in flight
      const [yr, mo] = key.split('-').map(Number)
      setLoadingMonths(prev => ({ ...prev, [key]: true }))
      try {
        const invs = await getMyInvitations(auth, yr, mo)
        setLoadedMonths(prev => {
          const next = { ...prev, [key]: invs }
          loadedMonthsRef.current = next
          return next
        })
      } catch {
        setLoadedMonths(prev => {
          const next = { ...prev, [key]: [] }
          loadedMonthsRef.current = next
          return next
        })
      } finally {
        setLoadingMonths(prev => ({ ...prev, [key]: false }))
      }
    }
  }, [auth, loadingMonths])

  // ── Invitation form ────────────────────────────────────────────────────────
  const handleOpenInvite = () => {
    setVisitorList([])
    setPendingReg(null)
    setSubmitError('')
    inviteForm.resetFields()
    newVForm.resetFields()
    setInviteOpen(true)
    if (entrances.length === 0) {
      setEntrancesLoading(true)
      getEntrances(auth).then(setEntrances).catch(() => {}).finally(() => setEntrancesLoading(false))
    }
  }

  const handleAddFromRegistry = () => {
    if (!pendingReg) return
    if (pendingReg.blacklisted) return
    // Avoid duplicates (same id)
    if (visitorList.some(v => v.mode === 'registry' && v.id === pendingReg.id)) return
    setVisitorList(prev => [...prev, { mode: 'registry', id: pendingReg.id, label: `${pendingReg.firstName} ${pendingReg.lastName} (${pendingReg.company})` }])
    setPendingReg(null)
  }

  const handleAddNew = (values) => {
    setVisitorList(prev => [...prev, {
      mode: 'new',
      key: Date.now(),
      label: `${values.nFirstName} ${values.nLastName} (${values.nCompany})`,
      firstName:   values.nFirstName,
      lastName:    values.nLastName,
      company:     values.nCompany,
      function:    values.nFunction  || null,
      email:       values.nEmail     || null,
      phone:       values.nPhone     || null,
      description: values.nDesc      || null,
    }])
    newVForm.resetFields()
  }

  const handleRemoveVisitor = (idx) => setVisitorList(prev => prev.filter((_, i) => i !== idx))

  const capacityDays = () => {
    const range = inviteForm.getFieldValue('dateRange')
    if (!range?.[0] || !range?.[1]) return 0
    return range[1].diff(range[0], 'day') + 1
  }
  const capacity = visitorList.length * capacityDays()

  const handleSubmitInvite = async (values) => {
    if (visitorList.length === 0) { setSubmitError('Add at least one visitor.'); return }
    setSubmitting(true); setSubmitError('')
    try {
      const [start, end] = values.dateRange
      const body = {
        startDate:   start.format('YYYY-MM-DD'),
        endDate:     end.format('YYYY-MM-DD'),
        entranceId:  values.entranceId,
        company:     values.company   || null,
        description: values.invDesc   || null,
        visitors: visitorList.map(v =>
          v.mode === 'registry'
            ? { id: v.id }
            : { firstName: v.firstName, lastName: v.lastName, company: v.company, function: v.function, email: v.email, phone: v.phone, description: v.description }
        ),
      }
      await createInvitation(auth, body)
      setInviteOpen(false)
      loadData()
    } catch (e) {
      setSubmitError('Failed: ' + (e.response?.data?.message ?? e.message))
    } finally { setSubmitting(false) }
  }

  // ── Clarification ──────────────────────────────────────────────────────────
  const handleOpenClar = (taskId) => {
    setClarTaskId(taskId)
    setClarAnswer('')
    setClarError('')
    setClarOpen(true)
  }

  const handleSubmitClar = async () => {
    if (!clarAnswer.trim()) { setClarError('Answer required'); return }
    const sc = clarSCs[clarTaskId]
    if (!sc) { setClarError('Security check not loaded'); return }
    setClarSubmitting(true); setClarError('')
    try {
      await clarifySecurityCheck(auth, sc.id, clarTaskId, clarAnswer.trim())
      setClarOpen(false)
      loadData()
    } catch (e) {
      setClarError('Failed: ' + (e.response?.data?.message ?? e.message))
    } finally { setClarSubmitting(false) }
  }

  // ── Claim invitation (supervisor) ──────────────────────────────────────────
  const handleOpenClaim = async (invId) => {
    setClaimInvId(invId)
    setClaimVisitorId(null)
    setClaimError('')
    setClaimOpen(true)
    setClaimInvLoading(true)
    try { setClaimInvDetail(await getInvitation(auth, invId)) }
    catch { setClaimInvDetail(null) }
    finally { setClaimInvLoading(false) }
  }

  const handleSubmitClaim = async () => {
    if (!claimVisitorId) { setClaimError('Select a visitor'); return }
    setClaimSubmitting(true); setClaimError('')
    try {
      await claimInvitation(auth, claimInvId, claimVisitorId)
      setClaimOpen(false)
      loadData()
    } catch (e) {
      setClaimError('Failed: ' + (e.response?.data?.message ?? e.message))
    } finally { setClaimSubmitting(false) }
  }

  // ── Supervisor: answer clarification without claiming ──────────────────────
  const handleOpenSvClar = async (inv) => {
    if (!inv.processInstanceId) return
    setSvClarLoading(true); setSvClarError(''); setSvClarPairs([]); setSvClarAnswer('')
    setSvClarOpen(true)
    try {
      const tasks = await getTasksForProcess(auth, inv.processInstanceId)
      const clarOnly = tasks.filter(t => t.taskDefinitionKey === 'Activity_Clarification_V2')
      const pairs = []
      for (const t of clarOnly) {
        try {
          const varData = await getTaskLocalVariable(auth, t.id, 'securityCheckId')
          const sc = await getSecurityCheck(auth, varData.value)
          pairs.push({ task: t, sc })
        } catch { pairs.push({ task: t, sc: null }) }
      }
      setSvClarPairs(pairs)
      if (pairs.length === 0) setSvClarError('No pending clarification questions found for this invitation.')
    } catch (e) {
      setSvClarError('Failed to load tasks: ' + (e.message ?? 'unknown'))
    } finally { setSvClarLoading(false) }
  }

  const handleSubmitSvClar = async (taskId, scId) => {
    if (!svClarAnswer.trim()) { setSvClarError('Answer required'); return }
    setSvClarSubmitting(true); setSvClarError('')
    try {
      await clarifySecurityCheck(auth, scId, taskId, svClarAnswer.trim())
      setSvClarOpen(false)
      loadData()
    } catch (e) {
      setSvClarError('Failed: ' + (e.response?.data?.message ?? e.message))
    } finally { setSvClarSubmitting(false) }
  }

  // ── Invitation list row ────────────────────────────────────────────────────
  const InvitationRow = ({ inv }) => {
    const days = dayjs(inv.endDate).diff(dayjs(inv.startDate), 'day') + 1
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={`Invitation ${inv.startDate} to ${inv.endDate}, ${inv.entranceName}, status: ${STATUS_LABEL[inv.status] ?? inv.status}`}
        onClick={() => setDrillId(inv.id)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDrillId(inv.id) } }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
          cursor: 'pointer', borderBottom: '1px solid #f0f0f0',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
        onMouseLeave={e => e.currentTarget.style.background = ''}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <Space size={4} wrap>
            <Text strong style={{ fontSize: 13 }}>
              {inv.startDate === inv.endDate
                ? inv.startDate
                : `${inv.startDate} → ${inv.endDate} (${days}d)`}
            </Text>
            <Tag icon={<LoginOutlined />} style={{ fontSize: 11, margin: 0 }}>{inv.entranceName}</Tag>
            {inv.company && <Tag icon={<BankOutlined />} style={{ fontSize: 11, margin: 0 }}>{inv.company}</Tag>}
          </Space>
          {inv.description && <Text style={{ fontSize: 13, color: textSub, display: 'block' }}>{inv.description}</Text>}
        </div>
        <Tag color={STATUS_COLOR[inv.status] ?? 'default'} style={{ flexShrink: 0 }}>
          {STATUS_LABEL[inv.status] ?? inv.status}
        </Tag>
        <DownOutlined aria-hidden="true" style={{ fontSize: 11, color: textSub, flexShrink: 0 }} />
      </div>
    )
  }

  // ── Clarification task card ────────────────────────────────────────────────
  const ClarTaskCard = ({ task }) => {
    const sc = clarSCs[task.id]
    const [showParticipants, setShowParticipants] = useState(false)
    const { label: statusLabel, color: statusColor, bg: statusBg } = sc
      ? getCheckProcessStatus(sc)
      : { label: 'Clarification Requested', color: '#d46b08', bg: '#fffbe6' }
    const officerName = sc ? formatUser(sc.securityReviewer ?? sc.assignedTo, userMap) : null

    return (
      <Card
        size="small"
        style={{ borderRadius: 12, border: '1px solid #ffd591', background: '#fffbe6' }}
        styles={{ body: { padding: 14 } }}
      >
        <Space direction="vertical" size={6} style={{ width: '100%' }}>
          {sc ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Space>
                  <UserOutlined aria-hidden="true" style={{ color: textSub }} />
                  <Text strong style={{ fontSize: 13 }}>{sc.visitorFirstName} {sc.visitorLastName}</Text>
                  {sc.visitorCompany && <Text style={{ fontSize: 13, color: textSub }}>· {sc.visitorCompany}</Text>}
                </Space>
              </div>
              <div
                role="status"
                aria-label={`Status: ${statusLabel}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '2px 10px', borderRadius: 20,
                  background: statusBg, border: `1px solid ${statusColor}55`,
                }}
              >
                <div aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
                <Text style={{ fontSize: 13, fontWeight: 600, color: statusColor }}>{statusLabel}</Text>
              </div>
              <div style={{ background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 6, padding: '8px 12px' }}>
                <Text style={{ fontSize: 13, color: '#d46b08', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                  Security's question {sc.clarificationCount > 0 ? `(round ${sc.clarificationCount}/5)` : ''}
                </Text>
                <Text style={{ fontSize: 13 }}>{sc.clarificationQuestion ?? '—'}</Text>
              </div>
              {officerName && (
                <div style={{ borderTop: '1px solid #ffe7ba', paddingTop: 6 }}>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={showParticipants}
                    onClick={() => setShowParticipants(o => !o)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowParticipants(o => !o) } }}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, userSelect: 'none' }}
                  >
                    <TeamOutlined aria-hidden="true" style={{ fontSize: 11, color: textSub }} />
                    <Text style={{ fontSize: 13, color: textSub }}>
                      {showParticipants ? 'Hide participants' : 'Show participants'}
                    </Text>
                    <span aria-hidden="true" style={{
                      fontSize: 11, color: textSub, display: 'inline-block',
                      transform: showParticipants ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
                    }}>▾</span>
                  </div>
                  {showParticipants && (
                    <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Tag style={{ margin: 0, fontSize: 11, borderRadius: 10 }} color="orange">Security officer</Tag>
                      <Text style={{ fontSize: 13 }}>{officerName}</Text>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <Spin size="small" />
          )}
          <Button
            type="primary" size="small" block
            style={{ background: '#d46b08', borderColor: '#d46b08', marginTop: 4 }}
            onClick={() => handleOpenClar(task.id)}
            disabled={!sc}
          >
            Answer Security Question
          </Button>
        </Space>
      </Card>
    )
  }

  // ── Supervisee invitation row ──────────────────────────────────────────────
  const SuperviseeInvRow = ({ inv }) => {
    const days = dayjs(inv.endDate).diff(dayjs(inv.startDate), 'day') + 1
    const isInReview = inv.status === 'IN_REVIEW'
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
        borderBottom: '1px solid #f0f0f0',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Space size={4} wrap>
            <Text strong style={{ fontSize: 13 }}>
              {inv.startDate === inv.endDate
                ? inv.startDate
                : `${inv.startDate} → ${inv.endDate} (${days}d)`}
            </Text>
            <Tag icon={<LoginOutlined />} style={{ fontSize: 11, margin: 0 }}>{inv.entranceName}</Tag>
            {inv.company && <Tag icon={<BankOutlined />} style={{ fontSize: 11, margin: 0 }}>{inv.company}</Tag>}
            <Tag icon={<UserOutlined />} color="blue" style={{ fontSize: 11, margin: 0 }}>
              {inv.inviterUsername}
            </Tag>
          </Space>
          {inv.description && <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{inv.description}</Text>}
        </div>
        <Tag color={STATUS_COLOR[inv.status] ?? 'default'} style={{ flexShrink: 0 }}>
          {STATUS_LABEL[inv.status] ?? inv.status}
        </Tag>
        <Space size={4}>
          {isInReview && (
            <Tooltip title="Answer security question on behalf of this inviter (without claiming)">
              <Button size="small" icon={<QuestionCircleOutlined />}
                style={{ color: '#d46b08', borderColor: '#d46b08' }}
                onClick={() => handleOpenSvClar(inv)}>
                Answer
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Claim this invitation — it will be transferred to your account">
            <Button size="small" icon={<ApartmentOutlined />}
              onClick={() => handleOpenClaim(inv.id)}>
              Claim
            </Button>
          </Tooltip>
        </Space>
      </div>
    )
  }

  // ── Main render ────────────────────────────────────────────────────────────
  const activeTaskSC = clarSCs[clarTaskId]

  return (
    <Layout>
      <GreetingOverlay />
      {error && <Alert type="error" message={error} showIcon closable onClose={() => setError('')} style={{ marginBottom: 16 }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Title level={4} style={{ margin: 0 }}><Tx k="inviter.title" /></Title>
            {(auth?.firstName || auth?.lastName) && (
              <Tag icon={<UserOutlined />} style={{ fontSize: 13, fontWeight: 600, borderRadius: 20 }}>
                {[auth.firstName, auth.lastName].filter(Boolean).join(' ')}
              </Tag>
            )}
          </div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {lastRefresh ? `Live · updated ${lastRefresh.toLocaleTimeString()}` : 'Connecting…'}
          </Text>
        </div>
        <Space>
          <Tooltip title="Refresh now">
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}
              aria-label="Refresh invitations" />
          </Tooltip>
          <Button type="primary" icon={<PlusCircleOutlined />} onClick={handleOpenInvite}>
            New Invitation
          </Button>
        </Space>
      </div>

      {/* ── Active Invitations panel ── */}
      <Collapse
        defaultActiveKey={['active']}
        style={{ marginBottom: 12, borderRadius: 8 }}
        items={[{
          key: 'active',
          label: (
            <Space size={6}>
              <ClockCircleOutlined />
              <span>Active Invitations</span>
              {pendingInvs.length > 0  && <Badge count={pendingInvs.length}  style={{ backgroundColor: '#8c8c8c' }} />}
              {inReviewInvs.length > 0 && <Badge count={inReviewInvs.length} style={{ backgroundColor: '#d46b08' }} />}
            </Space>
          ),
          children: (
            <Tabs
              size="small"
              defaultActiveKey="pending"
              items={[
                {
                  key: 'pending',
                  label: (
                    <Space size={4}>
                      <ClockCircleOutlined />
                      <span>Pending</span>
                      {pendingInvs.length > 0 && <Badge count={pendingInvs.length} style={{ backgroundColor: '#8c8c8c' }} />}
                    </Space>
                  ),
                  children: loading ? (
                    <div style={{ padding: 24, textAlign: 'center' }}><Spin /></div>
                  ) : pendingInvs.length === 0 ? (
                    <div style={{ padding: '24px 0', textAlign: 'center' }}>
                      <ClockCircleOutlined style={{ fontSize: 32, color: '#d9d9d9', marginBottom: 8 }} />
                      <div><Text type="secondary">No pending invitations.</Text></div>
                    </div>
                  ) : (
                    <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
                      {pendingInvs.map(inv => <InvitationRow key={inv.id} inv={inv} />)}
                    </div>
                  ),
                },
                {
                  key: 'inreview',
                  label: (
                    <Space size={4}>
                      <StopOutlined style={{ color: inReviewInvs.length > 0 ? '#d46b08' : undefined }} />
                      <span style={{ color: inReviewInvs.length > 0 ? '#d46b08' : undefined }}>In Review</span>
                      {inReviewInvs.length > 0 && <Badge count={inReviewInvs.length} style={{ backgroundColor: '#d46b08' }} />}
                    </Space>
                  ),
                  children: loading ? (
                    <div style={{ padding: 24, textAlign: 'center' }}><Spin /></div>
                  ) : inReviewInvs.length === 0 ? (
                    <div style={{ padding: '24px 0', textAlign: 'center' }}>
                      <StopOutlined style={{ fontSize: 32, color: '#d9d9d9', marginBottom: 8 }} />
                      <div><Text type="secondary">No invitations currently in review.</Text></div>
                    </div>
                  ) : (
                    <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
                      {inReviewInvs.map(inv => <InvitationRow key={inv.id} inv={inv} />)}
                    </div>
                  ),
                },
              ]}
            />
          ),
        }]}
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'invitations',
            label: (
              <Space size={6}>
                <UserAddOutlined />
                <span>My Invitations</span>
                {monthsIndex.length > 0 && (
                  <Badge
                    count={monthsIndex.reduce((s, m) => s + m.count, 0)}
                    style={{ backgroundColor: '#1677ff' }}
                    overflowCount={999}
                  />
                )}
              </Space>
            ),
            children: loading ? (
              <div style={{ padding: 24, textAlign: 'center' }}><Spin /></div>
            ) : (() => {
              // Always show current month at top even if it has no entries yet
              const hasCurrentInIndex = monthsIndex.some(m => monthKey(m.year, m.month) === CURRENT_MONTH_KEY)
              const base = hasCurrentInIndex
                ? monthsIndex
                : [{ year: _today.getFullYear(), month: _today.getMonth() + 1, count: 0 }, ...monthsIndex]
              const allMonths = [...base].sort((a, b) => {
                const ak = monthKey(a.year, a.month)
                const bk = monthKey(b.year, b.month)
                if (ak === CURRENT_MONTH_KEY) return -1
                if (bk === CURRENT_MONTH_KEY) return 1
                return bk > ak ? 1 : bk < ak ? -1 : 0
              })

              if (allMonths.length === 0) return (
                <div style={{ padding: 48, textAlign: 'center', borderRadius: 12, border: '2px dashed #e8e8e8' }}>
                  <UserAddOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 12 }} />
                  <div><Text type="secondary"><Tx k="inviter.emptyState" /></Text></div>
                </div>
              )

              const collapseItems = allMonths.map(m => {
                const key  = monthKey(m.year, m.month)
                const isCurrentMonth = key === CURRENT_MONTH_KEY
                const invs = loadedMonths[key]
                const isLoading = !!loadingMonths[key]
                const label = `${MONTH_NAMES[m.month - 1]} ${m.year}`

                return {
                  key,
                  label: (
                    <Space size={6}>
                      <Text strong style={{ color: isCurrentMonth ? '#1677ff' : undefined }}>{label}</Text>
                      {isCurrentMonth && <Tag color="blue" style={{ margin: 0 }}>Current</Tag>}
                      <Badge
                        count={isCurrentMonth ? (invs?.length ?? m.count) : m.count}
                        showZero={isCurrentMonth}
                        style={{ backgroundColor: isCurrentMonth ? '#1677ff' : '#8c8c8c' }}
                        overflowCount={999}
                      />
                    </Space>
                  ),
                  children: isLoading ? (
                    <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
                  ) : !invs ? (
                    <div style={{ padding: 24, textAlign: 'center' }}>
                      <Text type="secondary">Loading…</Text>
                    </div>
                  ) : invs.length === 0 ? (
                    <div style={{ padding: '32px 0', textAlign: 'center', border: '2px dashed #e8e8e8', borderRadius: 8 }}>
                      <UserAddOutlined style={{ fontSize: 36, color: '#d9d9d9', marginBottom: 8 }} />
                      <div><Text type="secondary">No invitations in {label}.</Text></div>
                    </div>
                  ) : (
                    <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
                      {invs.map(inv => <InvitationRow key={inv.id} inv={inv} />)}
                    </div>
                  ),
                }
              })

              return (
                <Collapse
                  activeKey={expandedKeys}
                  onChange={handlePanelChange}
                  style={{ background: 'transparent', border: 'none' }}
                  items={collapseItems}
                />
              )
            })(),
          },
          {
            key: 'questions',
            label: (
              <Space size={6}>
                <QuestionCircleOutlined style={{ color: clarTasks.length > 0 ? '#d46b08' : undefined }} />
                <span style={{ color: clarTasks.length > 0 ? '#d46b08' : undefined }}>Security Questions</span>
                {clarTasks.length > 0 && <Badge count={clarTasks.length} style={{ backgroundColor: '#d46b08' }} />}
              </Space>
            ),
            children: loading ? (
              <div style={{ padding: 24, textAlign: 'center' }}><Spin /></div>
            ) : clarTasks.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', borderRadius: 12, border: '2px dashed #e8e8e8' }}>
                <QuestionCircleOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 12 }} />
                <div><Text type="secondary">No security questions at this time.</Text></div>
              </div>
            ) : (
              <Row gutter={[16, 16]}>
                {clarTasks.map(task => (
                  <Col key={task.id} xs={24} sm={12} md={8}>
                    <ClarTaskCard task={task} />
                  </Col>
                ))}
              </Row>
            ),
          },
          ...(auth?.isSupervisor ? [{
            key: 'supervised',
            label: (
              <Space size={6}>
                <TeamOutlined />
                <span>Supervised</span>
                {superviseeInvs.length > 0 && <Badge count={superviseeInvs.length} style={{ backgroundColor: '#531dab' }} />}
              </Space>
            ),
            children: svLoading ? (
              <div style={{ padding: 24, textAlign: 'center' }}><Spin /></div>
            ) : mySupervisees.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', borderRadius: 12, border: '2px dashed #e8e8e8' }}>
                <TeamOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 12 }} />
                <div><Text type="secondary">No supervised invitations.</Text></div>
              </div>
            ) : (() => {
              const invsByInviter = superviseeInvs.reduce((acc, inv) => {
                const key = inv.inviterUsername ?? 'Unknown'
                if (!acc[key]) acc[key] = []
                acc[key].push(inv)
                return acc
              }, {})
              return mySupervisees.map(inviter => {
                const invs = invsByInviter[inviter] ?? []
                return (
                  <div key={inviter} style={{ marginBottom: 20 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 12px', marginBottom: 0,
                      background: '#e6f4ff', borderRadius: '8px 8px 0 0',
                      border: '1px solid #91caff', borderBottom: 'none',
                    }}>
                      <UserOutlined style={{ color: '#1677ff' }} />
                      <Text strong style={{ color: '#1677ff' }}>{inviter}</Text>
                      <Tag color="blue" style={{ margin: 0 }}>{invs.length} invitation{invs.length !== 1 ? 's' : ''}</Tag>
                    </div>
                    <div style={{ border: '1px solid #91caff', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                      {invs.length === 0 ? (
                        <div style={{ padding: '12px 16px', color: textSub, fontSize: 13 }}>
                          No invitations yet.
                        </div>
                      ) : invs.map(inv => <SuperviseeInvRow key={inv.id} inv={inv} />)}
                    </div>
                  </div>
                )
              })
            })(),
          }] : []),
        ]}
      />

      {/* ── Invitation creation modal ── */}
      <Modal
        open={inviteOpen}
        onCancel={() => setInviteOpen(false)}
        footer={null}
        title={<Space><PlusCircleOutlined style={{ color: '#1677ff' }} /> New Invitation</Space>}
        width={600}
        destroyOnHidden
      >
        {submitError && (
          <Alert type="error" message={submitError} showIcon closable onClose={() => setSubmitError('')} style={{ marginBottom: 16 }} />
        )}

        <Form form={inviteForm} layout="vertical" onFinish={handleSubmitInvite} requiredMark={false}>

          {/* Date range + Entrance */}
          <Row gutter={12}>
            <Col span={14}>
              <Form.Item name="dateRange" label="Visit Period" rules={[{ required: true, message: 'Required' }]} style={{ marginBottom: 12 }}>
                <DatePicker.RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="entranceId" label={<Space size={4}><LoginOutlined />Entrance</Space>}
                rules={[{ required: true, message: 'Required' }]} style={{ marginBottom: 12 }}>
                <Select
                  loading={entrancesLoading}
                  placeholder="Select entrance"
                  options={entrances.map(e => ({ value: e.id, label: e.description ? `${e.name} — ${e.description}` : e.name }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="company" label="Company (optional)" style={{ marginBottom: 12 }}>
                <Input prefix={<BankOutlined style={{ color: '#bfbfbf' }} />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="invDesc" label="Description (optional)" style={{ marginBottom: 12 }}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          {/* Visitor list */}
          <Divider plain style={{ margin: '8px 0' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Visitors</Text>
          </Divider>

          {visitorList.length > 0 && (
            <div style={{ marginBottom: 8, border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
              {visitorList.map((v, idx) => (
                <div key={v.id ?? v.key} style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', borderBottom: idx < visitorList.length - 1 ? '1px solid #f0f0f0' : undefined }}>
                  <UserOutlined style={{ marginRight: 8, color: textSub }} />
                  <Text style={{ flex: 1, fontSize: 13 }}>{v.label}</Text>
                  <Tag style={{ fontSize: 11, margin: 0, marginRight: 8 }}>{v.mode === 'registry' ? 'Registry' : 'New'}</Tag>
                  <Button type="text" size="small" icon={<CloseCircleOutlined />} onClick={() => handleRemoveVisitor(idx)} style={{ color: '#ff4d4f', padding: 0 }}
                    aria-label={`Remove ${v.label} from invitation`} />
                </div>
              ))}
            </div>
          )}

          {/* Capacity indicator */}
          {visitorList.length > 0 && capacityDays() > 0 && (
            <Alert
              type={capacity > 50 ? 'error' : capacity > 40 ? 'warning' : 'success'}
              message={`Capacity: ${visitorList.length} visitors × ${capacityDays()} days = ${capacity} visits${capacity > 50 ? ' — exceeds maximum of 50!' : ''}`}
              showIcon style={{ marginBottom: 12, fontSize: 12 }}
            />
          )}

          {/* Add visitor section */}
          <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: '12px 16px', background: '#fafafa', marginBottom: 16 }}>
            <Tabs
              size="small"
              activeKey={addTab}
              onChange={setAddTab}
              items={[
                {
                  key: 'registry',
                  label: 'From Registry',
                  children: (
                    <>
                      <VisitorSearch credentials={auth} onSelect={v => setPendingReg(v)} />
                      {pendingReg && (
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Tag color="blue">{pendingReg.firstName} {pendingReg.lastName}</Tag>
                          <Button size="small" type="primary" onClick={handleAddFromRegistry}>Add to list</Button>
                          <Button size="small" onClick={() => setPendingReg(null)}>Clear</Button>
                        </div>
                      )}
                    </>
                  ),
                },
                {
                  key: 'new',
                  label: 'New Visitor',
                  children: (
                    <Form form={newVForm} layout="inline" onFinish={handleAddNew} component={false}>
                      <Row gutter={8} style={{ width: '100%' }}>
                        <Col span={8}>
                          <Form.Item name="nFirstName" rules={[{ required: true, message: '' }]} style={{ marginBottom: 8 }}>
                            <Input placeholder="First name" size="small" />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="nLastName" rules={[{ required: true, message: '' }]} style={{ marginBottom: 8 }}>
                            <Input placeholder="Last name" size="small" />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="nCompany" rules={[{ required: true, message: '' }]} style={{ marginBottom: 8 }}>
                            <Input placeholder="Company" size="small" />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="nFunction" style={{ marginBottom: 8 }}>
                            <Input placeholder="Role (opt)" size="small" />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="nEmail" style={{ marginBottom: 8 }}>
                            <Input placeholder="Email (opt)" size="small" type="email" />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="nPhone" style={{ marginBottom: 0 }}>
                            <Input placeholder="Phone (opt)" size="small" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Button type="primary" size="small" style={{ marginTop: 8 }} onClick={() => newVForm.submit()}>
                        Add Visitor
                      </Button>
                    </Form>
                  ),
                },
              ]}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setInviteOpen(false)} disabled={submitting}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting} disabled={capacity > 50}>
              Create Invitation
            </Button>
          </div>
        </Form>
      </Modal>

      {/* ── Clarification answer modal ── */}
      <Modal
        open={clarOpen}
        onCancel={() => setClarOpen(false)}
        footer={null}
        title={<Space><QuestionCircleOutlined style={{ color: '#d46b08' }} /> Answer Security Question</Space>}
        width={480}
        destroyOnHidden
      >
        {activeTaskSC && (
          <>
            <Space style={{ marginBottom: 12 }}>
              <UserOutlined />
              <Text strong>{activeTaskSC.visitorFirstName} {activeTaskSC.visitorLastName}</Text>
              {activeTaskSC.startDate && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  · {activeTaskSC.startDate} → {activeTaskSC.endDate}
                </Text>
              )}
            </Space>
            <div style={{ background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#d46b08', display: 'block', marginBottom: 6 }}>
                Security's question {activeTaskSC.clarificationCount > 0 ? `(attempt ${activeTaskSC.clarificationCount})` : ''}
              </Text>
              <Text strong>{activeTaskSC.clarificationQuestion ?? '—'}</Text>
            </div>
          </>
        )}
        {clarError && <Alert type="error" message={clarError} showIcon closable onClose={() => setClarError('')} style={{ marginBottom: 12 }} />}
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 6 }}>Your answer</Text>
          <Input.TextArea rows={3} placeholder="Enter your clarification…" value={clarAnswer} onChange={e => setClarAnswer(e.target.value)}
            aria-label="Your answer to the security question" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={() => setClarOpen(false)} disabled={clarSubmitting}>Cancel</Button>
          <Button type="primary" loading={clarSubmitting} onClick={handleSubmitClar}>Send Answer</Button>
        </div>
      </Modal>

      {/* ── Invitation drill-down modal ── */}
      <InvitationDrillModal
        open={drillId !== null}
        invitationId={drillId}
        credentials={auth}
        onClose={() => setDrillId(null)}
        userMap={userMap}
      />

      {/* ── Claim invitation modal (supervisor) ── */}
      <Modal
        open={claimOpen}
        onCancel={() => setClaimOpen(false)}
        footer={null}
        title={<Space><ApartmentOutlined style={{ color: '#531dab' }} /> Claim Invitation</Space>}
        width={520}
        destroyOnHidden
      >
        <Alert
          type="warning" showIcon style={{ marginBottom: 16 }}
          message="Claiming this invitation will permanently transfer it to your account. The original inviter will no longer be able to modify it. This cannot be undone."
        />
        {claimError && (
          <Alert type="error" message={claimError} showIcon closable
            onClose={() => setClaimError('')} style={{ marginBottom: 12 }} />
        )}
        {claimInvLoading && <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>}
        {!claimInvLoading && claimInvDetail && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <strong>{claimInvDetail.inviterUsername}</strong> · {claimInvDetail.startDate} → {claimInvDetail.endDate}
                {claimInvDetail.company ? ` · ${claimInvDetail.company}` : ''}
              </Text>
            </div>
            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Which visitor triggered this claim?
              </Text>
              <Radio.Group
                value={claimVisitorId}
                onChange={e => setClaimVisitorId(e.target.value)}
                style={{ width: '100%' }}
                aria-label="Select the visitor who triggered this claim"
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {(claimInvDetail.visitors ?? []).map(v => (
                    <Radio key={v.visitorId} value={v.visitorId}>
                      <Space size={6}>
                        <UserOutlined />
                        <Text>{v.firstName} {v.lastName}</Text>
                        {v.company && <Text type="secondary" style={{ fontSize: 12 }}>· {v.company}</Text>}
                        <Tag color={SC_STATUS_COLOR[v.securityCheckStatus] ?? 'default'} style={{ margin: 0 }}>
                          {v.securityCheckStatus ?? '—'}
                        </Tag>
                      </Space>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </div>
          </>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button onClick={() => setClaimOpen(false)} disabled={claimSubmitting}>Cancel</Button>
          <Button type="primary" danger loading={claimSubmitting}
            disabled={!claimVisitorId || claimInvLoading}
            onClick={handleSubmitClaim}>
            Claim Invitation
          </Button>
        </div>
      </Modal>

      {/* ── Supervisor clarification answer modal ── */}
      <Modal
        open={svClarOpen}
        onCancel={() => setSvClarOpen(false)}
        footer={null}
        title={<Space><QuestionCircleOutlined style={{ color: '#d46b08' }} /> Answer Security Question</Space>}
        width={520}
        destroyOnHidden
      >
        {svClarLoading && <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>}
        {!svClarLoading && svClarError && !svClarPairs.length && (
          <Alert type="info" showIcon message={svClarError} />
        )}
        {!svClarLoading && svClarPairs.map(({ task, sc }) => (
          <div key={task.id}>
            {sc && (
              <>
                <Space style={{ marginBottom: 12 }}>
                  <UserOutlined />
                  <Text strong>{sc.visitorFirstName} {sc.visitorLastName}</Text>
                  {sc.visitorCompany && <Text type="secondary" style={{ fontSize: 12 }}>· {sc.visitorCompany}</Text>}
                  <Tag color="blue" style={{ margin: 0 }}>{sc.inviterUsername ?? '—'}</Tag>
                </Space>
                <div style={{ background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                  <Text style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#d46b08', display: 'block', marginBottom: 6 }}>
                    Security's question {sc.clarificationCount > 0 ? `(attempt ${sc.clarificationCount})` : ''}
                  </Text>
                  <Text strong>{sc.clarificationQuestion ?? '—'}</Text>
                </div>
              </>
            )}
            {svClarError && (
              <Alert type="error" message={svClarError} showIcon closable
                onClose={() => setSvClarError('')} style={{ marginBottom: 12 }} />
            )}
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>Your answer</Text>
              <Input.TextArea rows={3} placeholder="Enter your clarification…"
                value={svClarAnswer} onChange={e => setSvClarAnswer(e.target.value)}
                aria-label="Your answer to the security question" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setSvClarOpen(false)} disabled={svClarSubmitting}>Cancel</Button>
              <Button type="primary" loading={svClarSubmitting}
                onClick={() => handleSubmitSvClar(task.id, sc?.id)}>
                Send Answer
              </Button>
            </div>
          </div>
        ))}
      </Modal>
    </Layout>
  )
}

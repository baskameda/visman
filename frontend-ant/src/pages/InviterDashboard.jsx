import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  Button, Row, Col, Typography, Alert, Space,
  Modal, Form, Input, DatePicker, Tooltip, Divider,
  List, Avatar, Tag, Spin, Select, Tabs, Badge, Card, Radio,
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
import { useAuth }     from '../context/AuthContext'
import { useTaskSSE }  from '../hooks/useTaskSSE'
import { useInviterStats } from '../hooks/useInviterStats'
import { useOrgStats }     from '../hooks/useOrgStats'
import {
  getTasksByAssignee, searchVisitors, getEntrances,
  createInvitation, getMyInvitations, getInvitation,
  getTaskLocalVariable, getSecurityCheck, clarifySecurityCheck,
  getSuperviseeInvitations, claimInvitation, getTasksForProcess,
} from '../api/operatonApi'

const { Title, Text } = Typography

const STATUS_COLOR = { PENDING: 'processing', APPROVED: 'success', REFUSED: 'error', IN_REVIEW: 'warning' }
const STATUS_LABEL = { PENDING: 'Pending', APPROVED: 'Approved', REFUSED: 'Refused', IN_REVIEW: 'In Review' }
const SC_STATUS_COLOR = { PENDING: 'default', APPROVED: 'success', REFUSED: 'error', BLACKLISTED: 'error' }
const VISIT_STATUS_COLOR = { PENDING: 'default', CHECKED_IN: 'success', NO_SHOW: 'warning' }

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
            renderItem={v => (
              <List.Item
                style={{ cursor: 'pointer', padding: '8px 12px', transition: 'background 0.15s' }}
                onClick={() => onSelect(v)}
                onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <List.Item.Meta
                  avatar={<Avatar size={28} style={{ background: '#1677ff', fontSize: 12 }}>{v.firstName?.[0]?.toUpperCase() ?? '?'}</Avatar>}
                  title={<Text style={{ fontSize: 13, fontWeight: 600 }}>{v.firstName} {v.lastName}</Text>}
                  description={<Space size={4}><Tag icon={<BankOutlined />} style={{ fontSize: 11, margin: 0 }}>{v.company}</Tag></Space>}
                />
              </List.Item>
            )}
          />
        </div>
      ) : !loading ? (
        <Text type="secondary" style={{ fontSize: 12 }}>No visitors found.</Text>
      ) : null}
    </div>
  )
}

// ── Invitation drill-down modal ───────────────────────────────────────────────
function InvitationDrillModal({ open, invitationId, credentials, onClose }) {
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
          {(inv.visitors ?? []).map(v => (
            <Card
              key={v.visitorId} size="small" style={{ marginBottom: 12, borderColor: '#f0f0f0' }}
              title={
                <Space>
                  <UserOutlined />
                  <Text strong>{v.firstName} {v.lastName}</Text>
                  {v.company && <Text type="secondary" style={{ fontSize: 12 }}>· {v.company}</Text>}
                  <Tag color={SC_STATUS_COLOR[v.securityCheckStatus] ?? 'default'} style={{ margin: 0 }}>
                    {v.securityCheckStatus ?? '—'}
                  </Tag>
                  {v.reliability != null && <Tag color={v.reliability > 60 ? 'success' : v.reliability > 30 ? 'warning' : 'error'}>{v.reliability}</Tag>}
                </Space>
              }
            >
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
          ))}
        </>
      )}
    </Modal>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function InviterDashboard() {
  const { auth } = useAuth()

  // Data
  const [invitations, setInvitations] = useState([])
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

  // Stats
  const { stats: inviterStats, loading: statsLoading } = useInviterStats(auth)
  const { stats: orgStats,     loading: orgLoading   } = useOrgStats(auth)

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
      const [invs, assigned] = await Promise.all([
        getMyInvitations(auth),
        getTasksByAssignee(auth),
      ])
      setInvitations(invs)

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

    // Also reload supervised invitations for supervisors
    if (auth?.isSupervisor) {
      setSvLoading(true)
      try { setSuperviseeInvs(await getSuperviseeInvitations(auth)) }
      catch { /* non-critical */ }
      finally { setSvLoading(false) }
    }
  }, [auth])

  useTaskSSE(loadData)

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

  // ── Stats ──────────────────────────────────────────────────────────────────
  const renderStats = () => {
    if (statsLoading) return (
      <Row gutter={12} style={{ marginBottom: 20 }}>
        {[1,2,3,4].map(i => <Col key={i} xs={12} sm={6}><div style={{ background: '#f5f5f5', borderRadius: 10, height: 80 }} /></Col>)}
      </Row>
    )
    if (!inviterStats) return null
    const { total, approvalRate, approvalBadge, streak, milestone } = inviterStats
    const milestoneColors = ['#8c8c8c','#1677ff','#d46b08','#531dab','#389e0d']
    const milestoneIcons  = ['🌱','⭐','🏅','🏆','💎']
    const mc = milestoneColors[milestone.level] ?? '#8c8c8c'
    const mi = milestoneIcons[milestone.level]  ?? '🌱'
    const progress = milestone.next
      ? Math.min(100, Math.round(((total - milestone.min) / (milestone.next - milestone.min)) * 100))
      : 100
    const cards = [
      { label: 'Invitations', value: total, sub: 'all time', color: '#1677ff' },
      { label: 'Streak 🔥', value: streak > 0 ? `${streak}d` : '—', sub: streak > 0 ? `${streak} day${streak !== 1 ? 's' : ''} in a row` : 'No streak', color: streak >= 7 ? '#cc0000' : streak >= 3 ? '#d46b08' : '#8c8c8c' },
      { label: 'Approval', value: approvalRate !== null ? `${approvalRate}%` : '—', sub: approvalBadge?.label ?? 'No data', color: approvalBadge?.color ?? '#8c8c8c' },
      { label: 'Rank', value: `${mi} ${milestone.label}`, sub: milestone.next ? `${progress}% to ${milestone.nextLabel}` : 'Max level!', color: mc },
    ]
    return (
      <div style={{ marginBottom: 20 }}>
        <Row gutter={12} style={{ marginBottom: 8 }}>
          {cards.map(({ label, value, sub, color }) => (
            <Col key={label} xs={12} sm={6}>
              <div style={{ border: `1px solid ${color}40`, background: `${color}08`, borderRadius: 10, padding: '12px 14px' }}>
                <Text style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#8c8c8c', display: 'block', marginBottom: 4 }}>{label}</Text>
                <Text strong style={{ fontSize: 20, color, lineHeight: 1.1, display: 'block' }}>{value}</Text>
                <Text style={{ fontSize: 11, color: '#8c8c8c' }}>{sub}</Text>
              </div>
            </Col>
          ))}
        </Row>
        {milestone.next && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 11, color: '#8c8c8c', whiteSpace: 'nowrap', minWidth: 120 }}>
              Next: {milestoneIcons[milestone.level + 1]} {milestone.nextLabel}
            </Text>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: mc + '20' }}>
              <div style={{ width: `${progress}%`, height: '100%', borderRadius: 3, background: mc, transition: 'width 0.6s ease' }} />
            </div>
            <Text style={{ fontSize: 11, color: '#8c8c8c', minWidth: 32, textAlign: 'right' }}>{progress}%</Text>
          </div>
        )}
      </div>
    )
  }

  // ── Invitation list row ────────────────────────────────────────────────────
  const InvitationRow = ({ inv }) => {
    const days = dayjs(inv.endDate).diff(dayjs(inv.startDate), 'day') + 1
    return (
      <div
        onClick={() => setDrillId(inv.id)}
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
          {inv.description && <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{inv.description}</Text>}
        </div>
        <Tag color={STATUS_COLOR[inv.status] ?? 'default'} style={{ flexShrink: 0 }}>
          {STATUS_LABEL[inv.status] ?? inv.status}
        </Tag>
        <DownOutlined style={{ fontSize: 11, color: '#8c8c8c', flexShrink: 0 }} />
      </div>
    )
  }

  // ── Clarification task card ────────────────────────────────────────────────
  const ClarTaskCard = ({ task }) => {
    const sc = clarSCs[task.id]
    return (
      <Card
        size="small"
        style={{ borderRadius: 12, border: '1px solid #ffd591', background: '#fffbe6' }}
        styles={{ body: { padding: 14 } }}
      >
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          {sc ? (
            <>
              <Space>
                <UserOutlined style={{ color: '#8c8c8c' }} />
                <Text strong style={{ fontSize: 13 }}>{sc.visitorFirstName} {sc.visitorLastName}</Text>
                {sc.visitorCompany && <Text type="secondary" style={{ fontSize: 12 }}>· {sc.visitorCompany}</Text>}
              </Space>
              <div style={{ background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 6, padding: '8px 12px' }}>
                <Text style={{ fontSize: 11, color: '#d46b08', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                  Security's question {sc.clarificationCount > 0 ? `(attempt ${sc.clarificationCount})` : ''}
                </Text>
                <Text style={{ fontSize: 13 }}>{sc.clarificationQuestion ?? '—'}</Text>
              </div>
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
            Answer
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
      {error && <Alert type="error" message={error} showIcon closable onClose={() => setError('')} style={{ marginBottom: 16 }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}><Tx k="inviter.title" /></Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {lastRefresh ? `Live · updated ${lastRefresh.toLocaleTimeString()}` : 'Connecting…'}
          </Text>
        </div>
        <Space>
          <Tooltip title="Refresh now">
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading} />
          </Tooltip>
          <Button type="primary" icon={<PlusCircleOutlined />} onClick={handleOpenInvite}>
            New Invitation
          </Button>
        </Space>
      </div>

      {renderStats()}

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
                {invitations.length > 0 && <Badge count={invitations.length} style={{ backgroundColor: '#1677ff' }} />}
              </Space>
            ),
            children: loading ? (
              <div style={{ padding: 24, textAlign: 'center' }}><Spin /></div>
            ) : invitations.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', borderRadius: 12, border: '2px dashed #e8e8e8' }}>
                <UserAddOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 12 }} />
                <div><Text type="secondary"><Tx k="inviter.emptyState" /></Text></div>
              </div>
            ) : (
              <div style={{ border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden' }}>
                {invitations.map(inv => <InvitationRow key={inv.id} inv={inv} />)}
              </div>
            ),
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
            ) : superviseeInvs.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', borderRadius: 12, border: '2px dashed #e8e8e8' }}>
                <TeamOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 12 }} />
                <div><Text type="secondary">No supervised invitations.</Text></div>
              </div>
            ) : (
              <div style={{ border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden' }}>
                {superviseeInvs.map(inv => <SuperviseeInvRow key={inv.id} inv={inv} />)}
              </div>
            ),
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
                  <UserOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                  <Text style={{ flex: 1, fontSize: 13 }}>{v.label}</Text>
                  <Tag style={{ fontSize: 11, margin: 0, marginRight: 8 }}>{v.mode === 'registry' ? 'Registry' : 'New'}</Tag>
                  <Button type="text" size="small" icon={<CloseCircleOutlined />} onClick={() => handleRemoveVisitor(idx)} style={{ color: '#ff4d4f', padding: 0 }} />
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
          <Input.TextArea rows={3} placeholder="Enter your clarification…" value={clarAnswer} onChange={e => setClarAnswer(e.target.value)} />
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
                value={svClarAnswer} onChange={e => setSvClarAnswer(e.target.value)} />
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

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Typography, Alert, Tag, Select, Skeleton, Space, Card, Spin, Divider, Modal, Button } from 'antd'
import {
  CheckCircleOutlined, StopOutlined, ClockCircleOutlined, SyncOutlined,
  UserOutlined, DownOutlined, UpOutlined, LoginOutlined, BankOutlined,
  CalendarOutlined, ReloadOutlined,
} from '@ant-design/icons'
import Layout          from '../components/Layout'
import Tx              from '../components/Tx'
import { useAuth }     from '../context/AuthContext'
import { usePageHelp } from '../hooks/usePageHelp'

const HELP_SECTIONS = [
  {
    title: 'Browsing your history',
    items: [
      'Invitations are grouped by month, newest first. The current month is always at the top.',
      'Past month panels are collapsed — click any month header to load and expand it.',
      'The count badge on each month header shows how many invitations were created that month.',
    ],
  },
  {
    title: 'Invitation detail',
    items: [
      'Click any invitation row to open the full detail view.',
      'The detail shows all visitors, their security check outcomes (Approved / Refused / Blacklisted), and check-in records for approved visits.',
      'The process flow diagram shows where in the workflow each visitor currently stands.',
    ],
  },
  {
    title: 'Status guide',
    items: [
      'Pending — awaiting security review. No action needed from you.',
      'In Review — security has asked you a question. Go to My Tasks to answer it.',
      'Approved — security cleared the visitor; a visit record has been created for each day in the date range.',
      'Refused — access was denied. The process is closed.',
    ],
  },
]
import { useTranslation } from 'react-i18next'
import { getMyInvitations, getInvitation } from '../api/operatonApi'

const { Text, Title } = Typography
const { Option } = Select

const STATUS_COLOR = {
  PENDING:   'processing',
  APPROVED:  'success',
  REFUSED:   'error',
  IN_REVIEW: 'warning',
}
const STATUS_ICON = {
  PENDING:   <ClockCircleOutlined />,
  APPROVED:  <CheckCircleOutlined />,
  REFUSED:   <StopOutlined />,
  IN_REVIEW: <SyncOutlined spin />,
}
const SC_STATUS_COLOR = { PENDING: 'default', APPROVED: 'success', REFUSED: 'error', BLACKLISTED: 'error' }
const VISIT_STATUS_COLOR = { PENDING: 'default', CHECKED_IN: 'success', NO_SHOW: 'warning' }

function fmtDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function fmtMonthOption(ym) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

// ── Invitation detail modal ───────────────────────────────────────────────────
function InvitationDetailModal({ open, invitationId, credentials, onClose }) {
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
          <Space wrap style={{ marginBottom: 16 }}>
            <Tag icon={<LoginOutlined />} color="blue">{inv.entranceName}</Tag>
            <Tag color={STATUS_COLOR[inv.status] ?? 'default'}>{inv.status}</Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {inv.startDate === inv.endDate ? inv.startDate : `${inv.startDate} → ${inv.endDate}`}
            </Text>
            {inv.company && <Tag icon={<BankOutlined />}>{inv.company}</Tag>}
          </Space>
          {inv.description && <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>{inv.description}</Text>}

          {(inv.visitors ?? []).map(v => (
            <Card key={v.visitorId} size="small" style={{ marginBottom: 10, borderColor: '#f0f0f0' }}
              title={
                <Space>
                  <UserOutlined />
                  <Text strong>{v.firstName} {v.lastName}</Text>
                  {v.company && <Text type="secondary" style={{ fontSize: 12 }}>· {v.company}</Text>}
                  <Tag color={SC_STATUS_COLOR[v.securityCheckStatus] ?? 'default'} style={{ margin: 0 }}>
                    {v.securityCheckStatus ?? '—'}
                  </Tag>
                  {v.reliability != null && (
                    <Tag color={v.reliability > 60 ? 'success' : v.reliability > 30 ? 'warning' : 'error'}>
                      Reliability: {v.reliability}
                    </Tag>
                  )}
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

// ── Invitation row ─────────────────────────────────────────────────────────────
function InvitationRow({ inv, open, onToggle }) {
  const days = (() => {
    const d1 = new Date(inv.startDate), d2 = new Date(inv.endDate)
    return Math.round((d2 - d1) / 86400000) + 1
  })()

  return (
    <div style={{ borderBottom: '1px solid #f0f0f0' }}>
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px', cursor: 'pointer',
          background: open ? '#f0f5ff' : 'transparent',
          transition: 'background 0.15s', userSelect: 'none',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = '#fafafa' }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent' }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <Space size={4} wrap>
            <Text strong style={{ fontSize: 13 }}>
              {inv.startDate === inv.endDate ? inv.startDate : `${inv.startDate} → ${inv.endDate} (${days}d)`}
            </Text>
            <Tag icon={<LoginOutlined />} style={{ fontSize: 11, margin: 0 }}>{inv.entranceName}</Tag>
            {inv.company && <Tag icon={<BankOutlined />} style={{ fontSize: 11, margin: 0 }}>{inv.company}</Tag>}
          </Space>
          {inv.description && <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{inv.description}</Text>}
        </div>
        <Tag icon={STATUS_ICON[inv.status]} color={STATUS_COLOR[inv.status] ?? 'default'} style={{ margin: 0, flexShrink: 0 }}>
          {inv.status}
        </Tag>
        {open
          ? <UpOutlined   style={{ fontSize: 12, color: '#8c8c8c', flexShrink: 0 }} />
          : <DownOutlined style={{ fontSize: 12, color: '#8c8c8c', flexShrink: 0 }} />
        }
      </div>
    </div>
  )
}

// ── Day group ─────────────────────────────────────────────────────────────────
function DayGroup({ day, invs, openId, onToggle, onDrill }) {
  return (
    <div style={{ marginBottom: 12, border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '6px 16px', background: '#f5f5f5', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#8c8c8c' }}>
          {fmtDate(day)}
        </Text>
        <Text style={{ fontSize: 11, color: '#bfbfbf' }}>
          · {invs.length} invitation{invs.length !== 1 ? 's' : ''}
        </Text>
      </div>
      {invs.map(inv => (
        <InvitationRow
          key={inv.id} inv={inv}
          open={openId === inv.id}
          onToggle={() => {
            onToggle(inv.id)
            if (openId !== inv.id) onDrill(inv.id)
          }}
        />
      ))}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function InvitationHistoryPage() {
  const { auth } = useAuth()
  const { t }    = useTranslation()
  usePageHelp(HELP_SECTIONS)

  const [invitations,  setInvitations]  = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [lastRefresh,  setLastRefresh]  = useState(null)
  const [monthFilter,  setMonthFilter]  = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [openId,       setOpenId]       = useState(null)
  const [drillId,      setDrillId]      = useState(null)

  const loadInvitations = useCallback(async () => {
    setError('')
    try {
      const data = await getMyInvitations(auth)
      setInvitations(data)
      setLastRefresh(new Date())
    } catch (e) {
      setError(t('history.failedToLoad', { error: e.message ?? 'unknown' }))
    } finally { setLoading(false) }
  }, [auth, t])

  useEffect(() => { loadInvitations() }, [loadInvitations])

  const availableMonths = useMemo(() => {
    const set = new Set(invitations.map(i => i.startDate?.slice(0, 7)).filter(Boolean))
    return [...set].sort().reverse()
  }, [invitations])

  const counts = useMemo(() => invitations.reduce((acc, inv) => {
    acc[inv.status] = (acc[inv.status] ?? 0) + 1
    return acc
  }, {}), [invitations])

  const grouped = useMemo(() => {
    const filtered = invitations.filter(inv => {
      const ym = inv.startDate?.slice(0, 7)
      return (monthFilter === 'all' || ym === monthFilter)
          && (statusFilter === 'all' || inv.status === statusFilter)
    })
    const map = {}
    for (const inv of filtered) {
      const d = inv.startDate ?? '0000-00-00'
      if (!map[d]) map[d] = []
      map[d].push(inv)
    }
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
  }, [invitations, monthFilter, statusFilter])

  const handleToggle = id => setOpenId(prev => prev === id ? null : id)
  const handleDrill  = id => setDrillId(id)

  const statusOptions = [
    ['all',       `All (${invitations.length})`,                    'default'    ],
    ['PENDING',   `Pending (${counts.PENDING   ?? 0})`,             'processing' ],
    ['IN_REVIEW', `In Review (${counts.IN_REVIEW ?? 0})`,           'warning'    ],
    ['APPROVED',  `Approved (${counts.APPROVED  ?? 0})`,            'success'    ],
    ['REFUSED',   `Refused (${counts.REFUSED    ?? 0})`,            'error'      ],
  ]

  return (
    <Layout>
      {error && <Alert type="error" message={error} showIcon closable onClose={() => setError('')} style={{ marginBottom: 16 }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <Title level={4} style={{ margin: '0 0 2px' }}><Tx k="history.title" /></Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {lastRefresh
              ? `${invitations.length} invitation${invitations.length !== 1 ? 's' : ''} · updated ${lastRefresh.toLocaleTimeString()}`
              : t('common.loading')}
          </Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} size="small" onClick={loadInvitations} loading={loading}>Refresh</Button>
          {statusOptions.map(([val, label, color]) => (
            <Tag
              key={val}
              color={statusFilter === val ? color : undefined}
              style={{
                cursor: 'pointer', fontWeight: statusFilter === val ? 700 : 400,
                border: statusFilter === val ? undefined : '1px solid #d9d9d9',
                padding: '2px 10px', borderRadius: 20, fontSize: 12,
              }}
              onClick={() => { setStatusFilter(val); setOpenId(null) }}
            >
              {label}
            </Tag>
          ))}
        </Space>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Select value={monthFilter} onChange={v => { setMonthFilter(v); setOpenId(null) }}
          style={{ width: 220 }} size="middle">
          <Option value="all"><Tx k="history.allTime" /></Option>
          {availableMonths.map(ym => (
            <Option key={ym} value={ym}>{fmtMonthOption(ym)}</Option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden' }}>
              <Skeleton.Input active style={{ width: '100%', height: 32, borderRadius: 0 }} />
              {[1,2].map(j => <Skeleton.Input key={j} active style={{ width: '100%', height: 44, borderRadius: 0, display: 'block', marginTop: 1 }} />)}
            </div>
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', border: '2px dashed #e8e8e8', borderRadius: 12 }}>
          <Text type="secondary">
            {monthFilter !== 'all' || statusFilter !== 'all' ? t('history.noMatch') : t('history.noHistory')}
          </Text>
        </div>
      ) : grouped.map(([day, invs]) => (
        <DayGroup key={day} day={day} invs={invs}
          openId={openId} onToggle={handleToggle} onDrill={handleDrill} />
      ))}

      <InvitationDetailModal
        open={drillId !== null}
        invitationId={drillId}
        credentials={auth}
        onClose={() => setDrillId(null)}
      />
    </Layout>
  )
}

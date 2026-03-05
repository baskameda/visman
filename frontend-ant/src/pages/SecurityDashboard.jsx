import React, { useState, useCallback } from 'react'
import {
  Row, Col, Typography, Alert, Button, Modal,
  Tag, Tooltip, Space, Divider, Checkbox, Input,
  Descriptions, Tabs, Table, message, Card, Spin, Slider,
} from 'antd'
import {
  SafetyCertificateOutlined, ReloadOutlined,
  CheckCircleOutlined, CloseCircleOutlined, StopOutlined,
  BankOutlined, ToolOutlined, MailOutlined, PhoneOutlined,
  QuestionCircleOutlined, UnlockOutlined, UserOutlined,
  LoginOutlined, CalendarOutlined,
} from '@ant-design/icons'
import Layout              from '../components/Layout'
import Tx                  from '../components/Tx'
import OrgStatsPanel       from '../components/OrgStatsPanel'
import SecurityStatsPanel  from '../components/SecurityStatsPanel'
import { useAuth }         from '../context/AuthContext'
import { useTranslation }  from 'react-i18next'
import { useTaskSSE }      from '../hooks/useTaskSSE'
import { useOrgStats }     from '../hooks/useOrgStats'
import { useSecurityStats } from '../hooks/useSecurityStats'
import {
  getTasksByGroup, getTasksByAssignee, claimTask,
  getBlacklistedVisitors, clearBlacklisted,
  getTaskLocalVariable, getSecurityCheck, decideSecurityCheck,
} from '../api/operatonApi'

const { Title, Text } = Typography
const { TextArea } = Input

// ── Blacklist panel ───────────────────────────────────────────────────────────
function BlacklistPanel({ auth, t }) {
  const [visitors, setVisitors] = useState([])
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try { setVisitors(await getBlacklistedVisitors(auth)) }
    catch { setVisitors([]) }
    finally { setLoading(false) }
  }, [auth])

  React.useEffect(() => { load() }, [load])

  const handleRemove = async (v) => {
    try {
      await clearBlacklisted(auth, v.id)
      message.success(t('security.blacklistRemovedOk'))
      load()
    } catch (e) {
      message.error(t('security.blacklistError', { error: e.message }))
    }
  }

  const columns = [
    {
      title: 'Name',
      render: (_, v) => (
        <Space>
          <StopOutlined style={{ color: '#ff4d4f' }} />
          <Text strong>{v.firstName} {v.lastName}</Text>
        </Space>
      ),
    },
    { title: 'Company', dataIndex: 'company' },
    { title: 'Email', dataIndex: 'email', render: v => v || '—' },
    { title: 'Added by', dataIndex: 'createdBy' },
    {
      title: 'Action',
      align: 'right',
      render: (_, v) => (
        <Tooltip title={t('security.removeBlacklist')}>
          <Button size="small" icon={<UnlockOutlined />} type="link"
            style={{ color: '#52c41a' }} onClick={() => handleRemove(v)}>
            {t('security.removeBlacklist')}
          </Button>
        </Tooltip>
      ),
    },
  ]

  if (loading) return <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
  if (visitors.length === 0) return (
    <div style={{ padding: 48, textAlign: 'center', border: '2px dashed #e8e8e8', borderRadius: 12 }}>
      <UnlockOutlined style={{ fontSize: 40, color: '#d9d9d9', marginBottom: 12 }} />
      <div><Text type="secondary"><Tx k="security.blacklistEmpty" /></Text></div>
    </div>
  )

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text strong><Tx k="security.blacklistTitle" /></Text>
        <Button size="small" icon={<ReloadOutlined />} onClick={load}>Refresh</Button>
      </div>
      <Table dataSource={visitors} columns={columns} rowKey="id" size="small" pagination={false} />
    </>
  )
}

// ── Security task card ────────────────────────────────────────────────────────
function SecTaskCard({ task, sc, onAction }) {
  const { t } = useTranslation()

  if (!sc) return (
    <Card style={{ border: '1px solid #e8e8e8', borderRadius: 12 }} styles={{ body: { padding: 16 } }}>
      <Spin size="small" />
    </Card>
  )
  const period = sc.startDate === sc.endDate
    ? sc.startDate
    : `${sc.startDate} → ${sc.endDate}`
  return (
    <Card
      variant="borderless"
      style={{ height: '100%', border: '1px solid #e8e8e8', borderRadius: 12, transition: 'box-shadow 0.2s' }}
      styles={{ body: { padding: 16, display: 'flex', flexDirection: 'column', height: '100%' } }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text strong style={{ fontSize: 13 }}>{sc.visitorFirstName} {sc.visitorLastName}</Text>
        <Tag color="warning" style={{ margin: 0 }}>Pending</Tag>
      </div>
      <Space direction="vertical" size={4} style={{ flex: 1, marginBottom: 12 }}>
        {sc.visitorCompany   && <Space size={6}><BankOutlined style={{ color: '#8c8c8c', fontSize: 12 }} /><Text type="secondary" style={{ fontSize: 12 }}>{sc.visitorCompany}</Text></Space>}
        {sc.visitorFunction  && <Space size={6}><ToolOutlined style={{ color: '#8c8c8c', fontSize: 12 }} /><Text type="secondary" style={{ fontSize: 12 }}>{sc.visitorFunction}</Text></Space>}
        <Space size={6}><CalendarOutlined style={{ color: '#8c8c8c', fontSize: 12 }} /><Text type="secondary" style={{ fontSize: 12 }}>{period}</Text></Space>
        <Space size={6}><LoginOutlined style={{ color: '#8c8c8c', fontSize: 12 }} /><Text type="secondary" style={{ fontSize: 12 }}>{sc.entranceName}</Text></Space>
        {sc.inviterUsername  && <Space size={6}><UserOutlined style={{ color: '#8c8c8c', fontSize: 12 }} /><Text type="secondary" style={{ fontSize: 12 }}>Invited by {sc.inviterUsername}</Text></Space>}
        {sc.clarificationCount > 0 && (
          <Tag color="warning" style={{ fontSize: 11 }}>
            {sc.clarificationCount} clarification{sc.clarificationCount !== 1 ? 's' : ''}
          </Tag>
        )}
      </Space>
      <Divider style={{ margin: '0 0 12px' }} />
      <Button type="primary" block onClick={() => onAction(task, sc)}>
        {t('security.actionLabel')}
      </Button>
    </Card>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function SecurityDashboard() {
  const { auth }     = useAuth()
  const { t }        = useTranslation()

  const [tasks,       setTasks]       = useState([])
  const [scData,      setScData]      = useState({})  // taskId → SecurityCheck
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [lastRefresh, setLastRefresh] = useState(null)

  const [dialogOpen,        setDialogOpen]        = useState(false)
  const [activeTask,        setActiveTask]         = useState(null)
  const [activeSC,          setActiveSC]           = useState(null)
  const [identityConfirmed, setIdentityConfirmed]  = useState(false)
  const [reliability,       setReliability]        = useState(70)
  const [note,              setNote]               = useState('')
  const [clarQuestion,      setClarQuestion]       = useState('')
  const [submitting,        setSubmitting]         = useState(false)
  const [validationErr,     setValidationErr]      = useState('')

  const loadTasks = useCallback(async () => {
    setError('')
    try {
      const [assigned, candidate] = await Promise.all([
        getTasksByAssignee(auth),
        getTasksByGroup(auth, 'Security'),
      ])
      const merged = [...assigned]
      for (const t of candidate) {
        if (!merged.find(x => x.id === t.id)) merged.push(t)
      }
      const all = merged.filter(t => t.taskDefinitionKey === 'Activity_SecurityCheck_V2')
      setTasks(all)

      // Load security check data for each task
      const newSCs = {}
      await Promise.all(all.map(async task => {
        try {
          const varData = await getTaskLocalVariable(auth, task.id, 'securityCheckId')
          newSCs[task.id] = await getSecurityCheck(auth, varData.value)
        } catch { newSCs[task.id] = null }
      }))
      setScData(newSCs)
      setLastRefresh(new Date())
    } catch (e) {
      setError(t('security.failedToLoad', { error: e.message ?? 'unknown' }))
    } finally { setLoading(false) }
  }, [auth, t])

  useTaskSSE(loadTasks)
  const { stats: orgStats, loading: orgLoading, refresh: orgRefresh } = useOrgStats(auth)
  const { stats: secStats, loading: secLoading, refresh: secRefresh } = useSecurityStats(auth)

  const handleOpenDialog = async (task, sc) => {
    try { await claimTask(auth, task.id) } catch {}
    setActiveTask(task)
    setActiveSC(sc)
    setIdentityConfirmed(false)
    setReliability(70)
    setNote('')
    setClarQuestion('')
    setValidationErr('')
    setDialogOpen(true)
  }

  const handleClose = () => {
    setDialogOpen(false)
    setValidationErr('')
  }

  const handleSubmit = async (decision) => {
    if (!identityConfirmed) { setValidationErr(t('security.identityRequired')); return }
    if ((decision === 'REFUSE' || decision === 'BLACKLIST') && !note.trim()) {
      setValidationErr(t('security.noteRequired')); return
    }
    if (decision === 'ASK_INVITER' && !clarQuestion.trim()) {
      setValidationErr(t('security.clarificationQuestionReq')); return
    }
    setValidationErr('')
    setSubmitting(true)
    try {
      await decideSecurityCheck(auth, activeSC.id, activeTask.id, {
        decision,
        reliability: decision === 'APPROVE' ? reliability : null,
        note:        note.trim() || null,
        clarificationQuestion: clarQuestion.trim() || null,
      })
      handleClose()
      secRefresh()
      await loadTasks()
    } catch (e) {
      setError(t('security.failedToSubmit', { error: e.response?.data?.message ?? e.message }))
    } finally { setSubmitting(false) }
  }

  const clarCount   = activeSC?.clarificationCount ?? 0
  const remaining   = 5 - clarCount
  const hasHistory  = clarCount > 0 && activeSC?.clarificationQuestion
  const visitorName = activeSC
    ? `${activeSC.visitorFirstName ?? ''} ${activeSC.visitorLastName ?? ''}`.trim() || t('common.visitor')
    : t('common.visitor')

  const visitorItems = activeSC ? [
    { key: 'name',    label: 'Name',     children: visitorName },
    activeSC.visitorCompany   && { key: 'company', label: <><BankOutlined /> Company</>, children: activeSC.visitorCompany },
    activeSC.visitorFunction  && { key: 'role',    label: <><ToolOutlined /> Role</>,    children: activeSC.visitorFunction },
    activeSC.visitorEmail     && { key: 'email',   label: <><MailOutlined /> Email</>,   children: activeSC.visitorEmail },
    activeSC.visitorPhone     && { key: 'phone',   label: <><PhoneOutlined /> Phone</>,  children: activeSC.visitorPhone },
    activeSC.inviterUsername  && { key: 'inviter', label: 'Inviter', children: activeSC.inviterUsername },
    { key: 'period',  label: <><CalendarOutlined /> Period</>, children: activeSC.startDate === activeSC.endDate ? activeSC.startDate : `${activeSC.startDate} → ${activeSC.endDate}` },
    { key: 'entrance',label: <><LoginOutlined /> Entrance</>,  children: activeSC.entranceName },
  ].filter(Boolean) : []

  const tabItems = [
    {
      key: '0',
      label: (
        <Space>
          <SafetyCertificateOutlined />
          <Tx k="security.title" />
          {tasks.length > 0 && <Tag color="warning" style={{ marginLeft: 4 }}>{tasks.length}</Tag>}
        </Space>
      ),
      children: (
        <>
          {error && <Alert type="error" message={error} showIcon closable onClose={() => setError('')} style={{ marginBottom: 16 }} />}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {lastRefresh
                ? <Tx k="common.liveUpdated" vars={{ time: lastRefresh.toLocaleTimeString() }} />
                : <Tx k="common.connecting" />}
            </Text>
            <Tooltip title={t('common.refreshNow')}>
              <Button icon={<ReloadOutlined />} onClick={loadTasks} loading={loading} />
            </Tooltip>
          </div>
          <Text strong style={{ display: 'block', marginBottom: 12 }}>
            <Tx k="security.pendingCount" vars={{ count: tasks.length }} />
          </Text>
          {loading ? (
            <Row gutter={[16, 16]}>
              {[1,2,3].map(i => <Col key={i} xs={24} sm={12} md={8}><div style={{ height: 200, background: '#f5f5f5', borderRadius: 12 }} /></Col>)}
            </Row>
          ) : tasks.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', border: '2px dashed #e8e8e8', borderRadius: 12 }}>
              <SafetyCertificateOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 12 }} />
              <div><Text type="secondary"><Tx k="security.emptyState" /></Text></div>
            </div>
          ) : (
            <Row gutter={[16, 16]}>
              {tasks.map(task => (
                <Col key={task.id} xs={24} sm={12} md={8}>
                  <SecTaskCard task={task} sc={scData[task.id]} onAction={handleOpenDialog} />
                </Col>
              ))}
            </Row>
          )}
        </>
      ),
    },
    {
      key: '1',
      label: (
        <Space>
          <StopOutlined />
          <Tx k="security.blacklistManage" />
        </Space>
      ),
      children: <BlacklistPanel auth={auth} t={t} />,
    },
  ]

  return (
    <Layout>
      <OrgStatsPanel stats={orgStats} loading={orgLoading} onRefresh={orgRefresh}
        isAdmin={auth?.isAlsoAdmin ?? auth?.role === 'ADMIN'} />
      <SecurityStatsPanel stats={secStats} loading={secLoading} />

      <Tabs items={tabItems} style={{ marginBottom: 0 }} />

      {/* ════ Review Modal ════ */}
      <Modal
        open={dialogOpen} onCancel={handleClose} footer={null}
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#d46b08' }} />
            <Tx k="security.dialogTitle" vars={{ name: visitorName }} />
          </Space>
        }
        width={600} destroyOnHidden
      >
        {/* Visitor details */}
        <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
          {t('security.visitorDetails')}
        </Text>
        <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: '12px 16px', marginBottom: 16, background: '#fafafa' }}>
          <Descriptions size="small" column={1} items={visitorItems} />
        </div>

        {/* Clarification history */}
        {hasHistory && (
          <>
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
              {t('security.clarificationHistory')}
            </Text>
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: '12px 16px', marginBottom: 16, background: '#fafafa', borderLeft: '4px solid #faad14' }}>
              <Text type="warning" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                {t('security.clarificationCount', { count: clarCount })}
              </Text>
              <div><Text strong>{t('security.clarificationQ')}</Text> {activeSC?.clarificationQuestion}</div>
              {activeSC?.clarificationAnswer && (
                <div style={{ marginTop: 4 }}>
                  <Text strong style={{ color: '#52c41a' }}>{t('security.clarificationA')}</Text>{' '}
                  {activeSC.clarificationAnswer}
                </div>
              )}
            </div>
          </>
        )}

        {clarCount > 0 && (
          <Alert
            type={remaining <= 1 ? 'error' : remaining <= 2 ? 'warning' : 'info'}
            message={
              <span>
                {t('security.clarificationRemaining', { remaining })}{' '}
                <strong>({t('security.clarificationCount', { count: clarCount })})</strong>
              </span>
            }
            showIcon style={{ marginBottom: 16 }}
          />
        )}

        {/* Identity confirmation */}
        <div style={{
          border: `1px solid ${identityConfirmed ? '#52c41a' : '#f0f0f0'}`,
          borderRadius: 8, padding: '12px 16px', marginBottom: 16,
          background: identityConfirmed ? '#f6ffed' : '#fafafa', transition: 'all 0.2s',
        }}>
          <Checkbox checked={identityConfirmed} onChange={e => setIdentityConfirmed(e.target.checked)}>
            <Text style={{ fontWeight: identityConfirmed ? 700 : 400 }}>{t('security.identityConfirm')}</Text>
          </Checkbox>
        </div>

        {/* Reliability score (for APPROVE) */}
        <div style={{ marginBottom: 12 }}>
          <Text strong style={{ display: 'block', marginBottom: 6 }}>
            Reliability Score (for Approve): <Tag color={reliability > 60 ? 'success' : reliability > 30 ? 'warning' : 'error'}>{reliability}</Tag>
          </Text>
          <Slider min={0} max={100} value={reliability} onChange={setReliability} marks={{ 0: '0', 50: '50', 100: '100' }} />
        </div>

        {/* Note */}
        <div style={{ marginBottom: 12 }}>
          <Text strong style={{ display: 'block', marginBottom: 6 }}>{t('security.noteLabel')}</Text>
          <TextArea rows={2} placeholder={t('security.notePlaceholder')} value={note} onChange={e => setNote(e.target.value)} />
        </div>

        {/* Clarification question */}
        <div style={{ marginBottom: 12 }}>
          <Space style={{ marginBottom: 6 }}>
            <QuestionCircleOutlined style={{ color: '#faad14' }} />
            <Text strong style={{ fontSize: 12 }}>{t('security.clarificationQuestion')}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>(for Ask Inviter)</Text>
          </Space>
          <TextArea rows={2} placeholder={t('security.clarificationQuestion') + '…'} value={clarQuestion} onChange={e => setClarQuestion(e.target.value)} />
        </div>

        {validationErr && <Alert type="error" message={validationErr} showIcon style={{ marginBottom: 12 }} />}
        {error         && <Alert type="error" message={error}         showIcon style={{ marginBottom: 12 }} />}

        {/* Action buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
          <Button onClick={handleClose} disabled={submitting} style={{ marginRight: 'auto' }}>
            {t('common.cancel')}
          </Button>

          <Tooltip title={t('security.refuseHint')}>
            <Button icon={<CloseCircleOutlined />} onClick={() => handleSubmit('REFUSE')}
              loading={submitting} style={{ borderColor: '#faad14', color: '#d46b08' }}>
              {t('security.btnRefuse')}
            </Button>
          </Tooltip>

          <Tooltip title={t('security.blacklistHint')}>
            <Button danger icon={<StopOutlined />} onClick={() => handleSubmit('BLACKLIST')} loading={submitting}>
              {t('security.btnBlacklist')}
            </Button>
          </Tooltip>

          {remaining > 0 && (
            <Tooltip title={t('security.askInviterHint')}>
              <Button icon={<QuestionCircleOutlined />} onClick={() => handleSubmit('ASK_INVITER')}
                loading={submitting} style={{ borderColor: '#1890ff', color: '#1890ff' }}>
                {t('security.btnAskInviter')}
              </Button>
            </Tooltip>
          )}

          <Tooltip title={t('security.approveHint')}>
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleSubmit('APPROVE')}
              loading={submitting} style={{ background: '#52c41a', borderColor: '#52c41a' }}>
              {t('security.btnApprove')}
            </Button>
          </Tooltip>
        </div>
      </Modal>
    </Layout>
  )
}

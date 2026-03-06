import React, { useState, useEffect, useCallback } from 'react'
import {
  Typography, Table, Button, Space, Modal, Select, Alert, Popconfirm, Tag, Tabs, Spin,
} from 'antd'
import {
  TeamOutlined, PlusCircleOutlined, DeleteOutlined, ReloadOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import {
  getSupervisorAssignments, setSupervisorAssignment,
  removeSupervisorAssignment, getSupervisableInviters,
  getSecuritySupervisorAssignments, setSecuritySupervisorAssignment,
  removeSecuritySupervisorAssignment, getSecurityOfficers,
} from '../api/operatonApi'

const { Title, Text } = Typography

// ── Reusable assignment panel ─────────────────────────────────────────────────

function AssignmentPanel({
  assignments, members, loading, error, onError,
  subjectLabel,       // e.g. "Inviter"
  supervisorLabel,    // e.g. "Supervisor"
  subjectKey,         // field name for subject, e.g. "inviterUsername"
  supervisorKey,      // field name for supervisor, e.g. "supervisorUsername"
  onAssign, onRemove, onReload,
  subjectColor = 'blue', supervisorColor = 'purple',
}) {
  const [open,          setOpen]          = useState(false)
  const [subjectSel,    setSubjectSel]    = useState(null)
  const [supervisorSel, setSupervisorSel] = useState(null)
  const [submitting,    setSubmitting]    = useState(false)
  const [submitError,   setSubmitError]   = useState('')

  const superviseeCount = assignments.reduce((acc, a) => {
    acc[a[supervisorKey]] = (acc[a[supervisorKey]] ?? 0) + 1
    return acc
  }, {})

  const assignedSubjects = new Set(assignments.map(a => a[subjectKey]))
  const currentSupervisorOfSelected = assignments.find(a => a[subjectKey] === subjectSel)?.[supervisorKey]
  const supervisorAtCap = supervisorSel
    && supervisorSel !== currentSupervisorOfSelected
    && (superviseeCount[supervisorSel] ?? 0) >= 10

  const memberOptions = members.map(u => ({
    value: u.username,
    label: `${u.username}${(u.firstName || u.lastName) ? ` — ${u.firstName} ${u.lastName}`.trim() : ''}`,
  }))

  const handleOpen = () => { setSubjectSel(null); setSupervisorSel(null); setSubmitError(''); setOpen(true) }

  const handleSubmit = async () => {
    if (!subjectSel || !supervisorSel) { setSubmitError('Both fields are required'); return }
    if (subjectSel === supervisorSel) { setSubmitError(`${subjectLabel} and supervisor must be different users`); return }
    setSubmitting(true); setSubmitError('')
    try {
      await onAssign(subjectSel, supervisorSel)
      setOpen(false)
      onReload()
    } catch (e) {
      setSubmitError('Failed: ' + (e.response?.data?.message ?? e.message))
    } finally { setSubmitting(false) }
  }

  const columns = [
    {
      title: subjectLabel,
      dataIndex: subjectKey,
      render: v => <Tag color={subjectColor}>{v}</Tag>,
    },
    {
      title: 'Supervisor',
      dataIndex: supervisorKey,
      render: (v) => {
        const count = superviseeCount[v] ?? 0
        return (
          <Space size={4}>
            <Tag color={supervisorColor}>{v}</Tag>
            <Text type="secondary" style={{ fontSize: 11 }}>{count}/10</Text>
            {count >= 10 && <Tag color="error" style={{ fontSize: 10 }}>Full</Tag>}
          </Space>
        )
      },
    },
    {
      title: 'Actions',
      width: 100,
      render: (_, row) => (
        <Popconfirm
          title="Remove this supervisor assignment?"
          okText="Remove" okButtonProps={{ danger: true }}
          onConfirm={() => onRemove(row[subjectKey])}
        >
          <Button danger size="small" icon={<DeleteOutlined />}>Remove</Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={onReload} loading={loading} />
          <Button type="primary" icon={<PlusCircleOutlined />} onClick={handleOpen}>
            Add Assignment
          </Button>
        </Space>
      </div>

      {error && (
        <Alert type="error" message={error} showIcon closable onClose={() => onError('')} style={{ marginBottom: 16 }} />
      )}

      <Table
        dataSource={assignments}
        columns={columns}
        rowKey={subjectKey}
        loading={loading}
        size="small"
        pagination={{ pageSize: 20 }}
        locale={{ emptyText: 'No supervisor assignments yet.' }}
        style={{ borderRadius: 8, overflow: 'hidden' }}
      />

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        title={<Space><TeamOutlined /> Add Supervisor Assignment</Space>}
        footer={null}
        width={440}
        destroyOnHidden
      >
        {submitError && (
          <Alert type="error" message={submitError} showIcon closable
            onClose={() => setSubmitError('')} style={{ marginBottom: 16 }} />
        )}

        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 6 }}>{subjectLabel}</Text>
          <Select
            style={{ width: '100%' }}
            placeholder={`Select the ${subjectLabel.toLowerCase()} to be supervised`}
            options={memberOptions}
            value={subjectSel}
            onChange={setSubjectSel}
            showSearch
            filterOption={(input, opt) => opt.label.toLowerCase().includes(input.toLowerCase())}
          />
          {assignedSubjects.has(subjectSel) && (
            <Text type="warning" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
              This {subjectLabel.toLowerCase()} already has a supervisor — saving will replace it.
            </Text>
          )}
        </div>

        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ display: 'block', marginBottom: 6 }}>{supervisorLabel}</Text>
          <Select
            style={{ width: '100%' }}
            placeholder={`Select the ${supervisorLabel.toLowerCase()}`}
            options={memberOptions
              .filter(o => o.value !== subjectSel)
              .map(o => {
                const count = superviseeCount[o.value] ?? 0
                const full = count >= 10 && o.value !== currentSupervisorOfSelected
                return { ...o, label: `${o.label} (${count}/10${full ? ' — full' : ''})`, disabled: full }
              })}
            value={supervisorSel}
            onChange={setSupervisorSel}
            showSearch
            filterOption={(input, opt) => opt.label.toLowerCase().includes(input.toLowerCase())}
          />
          {supervisorAtCap && (
            <Text type="danger" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
              This supervisor has reached the limit of 10.
            </Text>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button type="primary" loading={submitting} disabled={supervisorAtCap} onClick={handleSubmit}>Save</Button>
        </div>
      </Modal>
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SupervisorAssignmentPage() {
  const { auth } = useAuth()

  // Inviter supervisor state
  const [inviterAssignments, setInviterAssignments] = useState([])
  const [inviters,           setInviters]           = useState([])
  const [inviterLoading,     setInviterLoading]     = useState(true)
  const [inviterError,       setInviterError]       = useState('')

  // Security supervisor state
  const [secAssignments, setSecAssignments] = useState([])
  const [officers,       setOfficers]       = useState([])
  const [secLoading,     setSecLoading]     = useState(true)
  const [secError,       setSecError]       = useState('')

  const loadInviter = useCallback(async () => {
    setInviterLoading(true); setInviterError('')
    try {
      const [asgn, inv] = await Promise.all([
        getSupervisorAssignments(auth),
        getSupervisableInviters(auth),
      ])
      setInviterAssignments(asgn)
      setInviters(inv)
    } catch (e) {
      setInviterError('Failed to load: ' + (e.response?.data?.message ?? e.message))
    } finally { setInviterLoading(false) }
  }, [auth])

  const loadSecurity = useCallback(async () => {
    setSecLoading(true); setSecError('')
    try {
      const [asgn, off] = await Promise.all([
        getSecuritySupervisorAssignments(auth),
        getSecurityOfficers(auth),
      ])
      setSecAssignments(asgn)
      setOfficers(off)
    } catch (e) {
      setSecError('Failed to load: ' + (e.response?.data?.message ?? e.message))
    } finally { setSecLoading(false) }
  }, [auth])

  useEffect(() => { loadInviter(); loadSecurity() }, [loadInviter, loadSecurity])

  const tabItems = [
    {
      key: 'inviter',
      label: <Space><TeamOutlined />Inviter Supervisors</Space>,
      children: (
        <AssignmentPanel
          assignments={inviterAssignments}
          members={inviters}
          loading={inviterLoading}
          error={inviterError}
          onError={setInviterError}
          subjectLabel="Inviter"
          supervisorLabel="Supervisor (must be an inviter)"
          subjectKey="inviterUsername"
          supervisorKey="supervisorUsername"
          onAssign={(subject, supervisor) => setSupervisorAssignment(auth, subject, supervisor)}
          onRemove={(subject) => removeSupervisorAssignment(auth, subject).then(loadInviter)}
          onReload={loadInviter}
          subjectColor="blue"
          supervisorColor="purple"
        />
      ),
    },
    {
      key: 'security',
      label: <Space><SafetyCertificateOutlined />Security Supervisors</Space>,
      children: (
        <AssignmentPanel
          assignments={secAssignments}
          members={officers}
          loading={secLoading}
          error={secError}
          onError={setSecError}
          subjectLabel="Officer"
          supervisorLabel="Supervisor (must be a Security member)"
          subjectKey="officerUsername"
          supervisorKey="supervisorUsername"
          onAssign={(subject, supervisor) => setSecuritySupervisorAssignment(auth, subject, supervisor)}
          onRemove={(subject) => removeSecuritySupervisorAssignment(auth, subject).then(loadSecurity)}
          onReload={loadSecurity}
          subjectColor="orange"
          supervisorColor="red"
        />
      ),
    },
  ]

  return (
    <Layout>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <TeamOutlined style={{ marginRight: 8 }} />
          Supervisor Assignments
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Manage supervisor hierarchies. One supervisor per member, max 10 supervisees per supervisor.
        </Text>
      </div>

      <Tabs items={tabItems} />
    </Layout>
  )
}

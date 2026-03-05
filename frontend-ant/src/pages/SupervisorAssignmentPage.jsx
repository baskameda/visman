import React, { useState, useEffect, useCallback } from 'react'
import {
  Typography, Table, Button, Space, Modal, Select, Alert, Popconfirm, Tag, Spin,
} from 'antd'
import {
  TeamOutlined, PlusCircleOutlined, DeleteOutlined, ReloadOutlined,
} from '@ant-design/icons'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import {
  getSupervisorAssignments, setSupervisorAssignment,
  removeSupervisorAssignment, getSupervisableInviters,
} from '../api/operatonApi'

const { Title, Text } = Typography

export default function SupervisorAssignmentPage() {
  const { auth } = useAuth()

  const [assignments, setAssignments] = useState([])
  const [inviters,    setInviters]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')

  // Modal
  const [open,         setOpen]         = useState(false)
  const [inviterSel,   setInviterSel]   = useState(null)
  const [supervisorSel, setSupervisorSel] = useState(null)
  const [submitting,   setSubmitting]   = useState(false)
  const [submitError,  setSubmitError]  = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [asgn, inv] = await Promise.all([
        getSupervisorAssignments(auth),
        getSupervisableInviters(auth),
      ])
      setAssignments(asgn)
      setInviters(inv)
    } catch (e) {
      setError('Failed to load: ' + (e.response?.data?.message ?? e.message))
    } finally { setLoading(false) }
  }, [auth])

  useEffect(() => { load() }, [load])

  const handleOpen = () => {
    setInviterSel(null); setSupervisorSel(null); setSubmitError('')
    setOpen(true)
  }

  const handleSubmit = async () => {
    if (!inviterSel || !supervisorSel) { setSubmitError('Both fields are required'); return }
    if (inviterSel === supervisorSel) { setSubmitError('Inviter and supervisor must be different users'); return }
    setSubmitting(true); setSubmitError('')
    try {
      await setSupervisorAssignment(auth, inviterSel, supervisorSel)
      setOpen(false)
      load()
    } catch (e) {
      setSubmitError('Failed: ' + (e.response?.data?.message ?? e.message))
    } finally { setSubmitting(false) }
  }

  const handleRemove = async (inviterUsername) => {
    try {
      await removeSupervisorAssignment(auth, inviterUsername)
      load()
    } catch (e) {
      setError('Failed to remove: ' + (e.response?.data?.message ?? e.message))
    }
  }

  // Build option list for selects
  const inviterOptions = inviters.map(u => ({
    value: u.username,
    label: `${u.username}${(u.firstName || u.lastName) ? ` — ${u.firstName} ${u.lastName}`.trim() : ''}`,
  }))

  // Count supervisees per supervisor
  const superviseeCount = assignments.reduce((acc, a) => {
    acc[a.supervisorUsername] = (acc[a.supervisorUsername] ?? 0) + 1
    return acc
  }, {})

  // Already-assigned inviter usernames
  const assignedInviters = new Set(assignments.map(a => a.inviterUsername))

  // Current supervisor of the selected inviter (if any) — moving away from them doesn't count against cap
  const currentSupervisorOfSelected = assignments.find(a => a.inviterUsername === inviterSel)?.supervisorUsername

  // Cap check for the modal Save button
  const supervisorAtCap = supervisorSel
    && supervisorSel !== currentSupervisorOfSelected
    && (superviseeCount[supervisorSel] ?? 0) >= 10

  const columns = [
    {
      title: 'Inviter',
      dataIndex: 'inviterUsername',
      render: v => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Supervisor',
      dataIndex: 'supervisorUsername',
      render: (v) => {
        const count = superviseeCount[v] ?? 0
        return (
          <Space size={4}>
            <Tag color="purple">{v}</Tag>
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
          onConfirm={() => handleRemove(row.inviterUsername)}
        >
          <Button danger size="small" icon={<DeleteOutlined />}>Remove</Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <TeamOutlined style={{ marginRight: 8 }} />
            Supervisor Assignments
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Assign supervisors to inviters. One supervisor per inviter, max 10 inviters per supervisor.
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading} />
          <Button type="primary" icon={<PlusCircleOutlined />} onClick={handleOpen}>
            Add Assignment
          </Button>
        </Space>
      </div>

      {error && (
        <Alert type="error" message={error} showIcon closable onClose={() => setError('')} style={{ marginBottom: 16 }} />
      )}

      <Table
        dataSource={assignments}
        columns={columns}
        rowKey="inviterUsername"
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
          <Text strong style={{ display: 'block', marginBottom: 6 }}>Inviter</Text>
          <Select
            style={{ width: '100%' }}
            placeholder="Select the inviter to be supervised"
            options={inviterOptions}
            value={inviterSel}
            onChange={setInviterSel}
            showSearch
            filterOption={(input, opt) => opt.label.toLowerCase().includes(input.toLowerCase())}
          />
          {assignedInviters.has(inviterSel) && (
            <Text type="warning" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
              This inviter already has a supervisor — saving will replace it.
            </Text>
          )}
        </div>

        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ display: 'block', marginBottom: 6 }}>Supervisor</Text>
          <Select
            style={{ width: '100%' }}
            placeholder="Select the supervisor (must be an inviter)"
            options={inviterOptions
              .filter(o => o.value !== inviterSel)
              .map(o => {
                const count = superviseeCount[o.value] ?? 0
                const full = count >= 10 && o.value !== currentSupervisorOfSelected
                return {
                  ...o,
                  label: `${o.label} (${count}/10${full ? ' — full' : ''})`,
                  disabled: full,
                }
              })}
            value={supervisorSel}
            onChange={setSupervisorSel}
            showSearch
            filterOption={(input, opt) => opt.label.toLowerCase().includes(input.toLowerCase())}
          />
          {supervisorAtCap && (
            <Text type="danger" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
              This supervisor has reached the limit of 10 inviters.
            </Text>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button type="primary" loading={submitting} disabled={supervisorAtCap} onClick={handleSubmit}>Save</Button>
        </div>
      </Modal>
    </Layout>
  )
}

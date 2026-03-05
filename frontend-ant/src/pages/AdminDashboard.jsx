import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button, Table, Typography, Alert, Space, Spin, Tag, Avatar,
  Modal, Form, Input, Select, Checkbox, Tabs, Card, Row, Col,
  Statistic, Tooltip, Popconfirm, message, Empty, Divider,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  UserAddOutlined, TeamOutlined, BarChartOutlined,
  CheckCircleOutlined, CloseCircleOutlined, Loading3QuartersOutlined,
  HistoryOutlined, SettingOutlined, LoginOutlined,
} from '@ant-design/icons'

import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import {
  getAllActiveTasksForProcess, getHistoricProcesses, getHistoricVariables,
  getProcessVariables, getUsers, getAllGroups, getGroupMembers,
  getHistoricTasksByAssignee,
  createUser, deleteUser, updateUser,
  createGroup, deleteGroup,
  addMembership, removeMembership,
  getEntrances, createEntrance, updateEntrance, deleteEntrance,
  getEntranceGatekeepers, setEntranceGatekeepers,
} from '../api/operatonApi'

const { Title, Text } = Typography

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// ─── Entrances tab ────────────────────────────────────────────────────────────
function EntrancesTab({ auth, porters }) {
  const [entrances,     setEntrances]     = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [modalOpen,     setModalOpen]     = useState(false)
  const [editTarget,    setEditTarget]    = useState(null)
  const [saving,        setSaving]        = useState(false)
  const [gatekeeperMap, setGatekeeperMap] = useState({})
  const [assignTarget,  setAssignTarget]  = useState(null)
  const [assignSelected,setAssignSelected]= useState([])
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignSaving,  setAssignSaving]  = useState(false)
  const [form] = Form.useForm()

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const list = await getEntrances(auth)
      setEntrances(list)
      const map = {}
      await Promise.all(list.map(async e => {
        try { map[e.id] = await getEntranceGatekeepers(auth, e.id) }
        catch { map[e.id] = [] }
      }))
      setGatekeeperMap(map)
    }
    catch (e) { setError('Failed to load: ' + e.message) }
    finally { setLoading(false) }
  }, [auth])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditTarget(null); form.resetFields(); setModalOpen(true) }
  const openEdit   = (e) => { setEditTarget(e); form.setFieldsValue({ name: e.name, description: e.description ?? '' }); setModalOpen(true) }

  const openAssign = async (e) => {
    setAssignTarget(e); setAssignLoading(true)
    try { setAssignSelected(await getEntranceGatekeepers(auth, e.id)) }
    catch { setAssignSelected([]) }
    finally { setAssignLoading(false) }
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      if (editTarget) {
        await updateEntrance(auth, editTarget.id, { name: values.name.trim(), description: values.description?.trim() || null })
      } else {
        await createEntrance(auth, { name: values.name.trim(), description: values.description?.trim() || null })
      }
      message.success(editTarget ? 'Entrance updated.' : 'Entrance created.')
      setModalOpen(false); await load()
    } catch (e) {
      if (e?.errorFields) return
      message.error('Failed: ' + (e.response?.data?.message ?? e.message))
    } finally { setSaving(false) }
  }

  const handleSaveAssign = async () => {
    setAssignSaving(true)
    try {
      await setEntranceGatekeepers(auth, assignTarget.id, assignSelected)
      message.success('Gatekeepers updated.')
      setAssignTarget(null)
      await load()
    } catch (e) { message.error('Failed: ' + e.message) }
    finally { setAssignSaving(false) }
  }

  const handleDelete = async (e) => {
    try { await deleteEntrance(auth, e.id); message.success('Deleted.'); await load() }
    catch (err) { message.error('Failed: ' + err.message) }
  }

  const columns = [
    {
      title: 'Name', dataIndex: 'name', key: 'name',
      render: (text) => <Space><LoginOutlined style={{ color: '#1677ff' }} /><strong>{text}</strong></Space>,
    },
    {
      title: 'Description', dataIndex: 'description', key: 'description',
      render: (text) => text ? <Text type="secondary">{text}</Text> : <Text type="secondary" italic>—</Text>,
    },
    {
      title: 'Assigned Gatekeepers', key: 'gatekeepers',
      render: (_, record) => {
        const assigned = gatekeeperMap[record.id] ?? []
        if (assigned.length === 0)
          return <Text type="secondary" italic>None</Text>
        return (
          <Space wrap>
            {assigned.map(uid => {
              const p = porters.find(x => x.id === uid)
              return (
                <Tag key={uid} color="purple">
                  {p ? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || uid : uid}
                </Tag>
              )
            })}
          </Space>
        )
      },
    },
    {
      title: 'Actions', key: 'actions', align: 'center', width: 130,
      render: (_, record) => (
        <Space>
          <Tooltip title="Assign gatekeepers">
            <Button size="small" type="primary" ghost icon={<TeamOutlined />} onClick={() => openAssign(record)} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Popconfirm
            title={`Delete "${record.name}"?`}
            description="This cannot be undone."
            onConfirm={() => handleDelete(record)}
            okText="Delete" okButtonProps={{ danger: true }}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0 }}>Facility Entrances</Title>
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>New Entrance</Button>
      </div>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

      {loading
        ? <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        : entrances.length === 0
          ? <Empty description="No entrances defined yet." />
          : <Table dataSource={entrances} columns={columns} rowKey="id" size="small" pagination={false} />
      }

      {/* Create / Edit Modal */}
      <Modal open={modalOpen} title={editTarget ? `Edit — ${editTarget.name}` : 'New Entrance'}
        onCancel={() => setModalOpen(false)} onOk={handleSave} confirmLoading={saving}
        okText={editTarget ? 'Save Changes' : 'Create'} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Required.' }]}>
            <Input autoFocus />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Optional…" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Assign Gatekeepers Modal */}
      <Modal
        open={Boolean(assignTarget)}
        title={<Space><TeamOutlined />Assign Gatekeepers — {assignTarget?.name}</Space>}
        onCancel={() => setAssignTarget(null)}
        onOk={handleSaveAssign}
        confirmLoading={assignSaving}
        okText={`Save (${assignSelected.length} selected)`}
        destroyOnClose>
        {assignLoading
          ? <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
          : porters.length === 0
          ? <Text type="secondary">No gatekeepers found in the Porters group.</Text>
          : porters.map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                borderBottom: '1px solid #f0f0f0', cursor: 'pointer',
              }} onClick={() => setAssignSelected(prev =>
                prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id]
              )}>
                <Checkbox checked={assignSelected.includes(p.id)} />
                <Avatar style={{ background: '#531dab', flexShrink: 0 }}>
                  {(p.firstName?.[0] ?? p.id[0]).toUpperCase()}
                </Avatar>
                <div>
                  <div><strong>{p.firstName} {p.lastName}</strong></div>
                  <small style={{ color: '#888' }}>{p.id}</small>
                </div>
              </div>
            ))
        }
      </Modal>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { auth }   = useAuth()
  const navigate   = useNavigate()

  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [lastRefresh, setLastRefresh] = useState(null)

  const [activeTasks, setActiveTasks] = useState([])
  const [history, setHistory]         = useState([])
  const [historyVars, setHistoryVars] = useState({})
  const [users, setUsers]             = useState([])
  const [groups, setGroups]           = useState([])
  const [groupMembers, setGroupMembers] = useState({})
  const [usersLoaded, setUsersLoaded] = useState(false)
  const [tasksByUser, setTasksByUser] = useState({})

  // Dialogs
  const [userModal,  setUserModal]    = useState(false)
  const [editUser,   setEditUser]     = useState(null)
  const [groupModal, setGroupModal]   = useState(false)
  const [saving, setSaving]           = useState(false)
  const [userForm]   = Form.useForm()
  const [groupForm]  = Form.useForm()

  const load = useCallback(async () => {
    setError('')
    try {
      const [tasks, hist] = await Promise.all([
        getAllActiveTasksForProcess(auth),
        getHistoricProcesses(auth),
      ])
      setActiveTasks(tasks)
      setHistory(hist.slice(0, 30))

      const newHistIds = hist.slice(0, 30).filter(p => !historyVars[p.id]).map(p => p.id)
      if (newHistIds.length > 0) {
        const hVarMap = {}
        await Promise.all(newHistIds.map(async id => {
          try { hVarMap[id] = await getHistoricVariables(auth, id) } catch { hVarMap[id] = {} }
        }))
        setHistoryVars(prev => ({ ...prev, ...hVarMap }))
      }

      if (!usersLoaded) {
        const [userList, groupList] = await Promise.all([getUsers(auth), getAllGroups(auth)])
        setUsers(userList); setGroups(groupList)
        const mMap = {}
        await Promise.all(groupList.map(async g => {
          try { mMap[g.id] = await getGroupMembers(auth, g.id) } catch { mMap[g.id] = [] }
        }))
        setGroupMembers(mMap); setUsersLoaded(true)
        const tMap = {}
        await Promise.all(userList.map(async u => {
          try { tMap[u.id] = await getHistoricTasksByAssignee(auth, u.id) } catch { tMap[u.id] = [] }
        }))
        setTasksByUser(tMap)
      } else {
        const tMap = {}
        await Promise.all(users.map(async u => {
          try { tMap[u.id] = await getHistoricTasksByAssignee(auth, u.id) } catch { tMap[u.id] = [] }
        }))
        setTasksByUser(tMap)
      }

      setLastRefresh(new Date())
    } catch (e) {
      setError('Failed to load: ' + (e.message ?? 'unknown'))
    } finally { setLoading(false) }
  }, [auth, usersLoaded, users, historyVars])

  useAutoRefresh(load, 15000)

  const refreshUsers = () => { setUsersLoaded(false) }

  const today = new Date().toDateString()
  const completedToday = history.filter(p =>
    p.state === 'COMPLETED' && historyVars[p.id]?.checkedIn &&
    p.endTime && new Date(p.endTime).toDateString() === today).length
  const refusedToday = history.filter(p =>
    p.state === 'COMPLETED' && !historyVars[p.id]?.checkedIn &&
    p.endTime && new Date(p.endTime).toDateString() === today).length

  // ── User columns ───────────────────────────────────────────────────────────
  const userColumns = [
    {
      title: 'User', key: 'user',
      render: (_, u) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1677ff' }}>{(u.firstName?.[0] ?? u.id[0]).toUpperCase()}</Avatar>
          <div>
            <div><strong>{u.firstName} {u.lastName}</strong></div>
            <small style={{ color: '#888' }}>{u.id}</small>
          </div>
        </Space>
      ),
    },
    { title: 'Email', dataIndex: 'email', key: 'email', render: t => <Text type="secondary">{t || '—'}</Text> },
    {
      title: 'Groups', key: 'groups',
      render: (_, u) => {
        const mg = Object.entries(groupMembers).filter(([, m]) => m.some(x => x.id === u.id)).map(([g]) => g)
        return mg.length ? mg.map(g => <Tag key={g} color="blue">{g}</Tag>) : <Text type="secondary">—</Text>
      },
    },
    {
      title: 'Tasks', key: 'tasks', align: 'center',
      render: (_, u) => <Tag color="processing">{tasksByUser[u.id]?.length ?? '…'}</Tag>,
    },
    {
      title: 'Actions', key: 'actions', align: 'center',
      render: (_, u) => (
        <Space>
          <Tooltip title="Edit"><Button size="small" icon={<EditOutlined />}
            onClick={() => { setEditUser(u); userForm.setFieldsValue({ firstName: u.firstName, lastName: u.lastName, email: u.email, password: '' }); setUserModal(true) }} /></Tooltip>
          <Popconfirm title={`Delete user "${u.id}"?`} onConfirm={async () => {
            try { await deleteUser(auth, u.id); message.success('User deleted.'); refreshUsers() }
            catch (e) { message.error('Failed: ' + e.message) }
          }} okButtonProps={{ danger: true }} okText="Delete">
            <Tooltip title="Delete"><Button size="small" danger icon={<DeleteOutlined />} /></Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // ── Group columns ──────────────────────────────────────────────────────────
  const groupColumns = [
    { title: 'Group ID', dataIndex: 'id', key: 'id', render: t => <strong>{t}</strong> },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Members', key: 'members',
      render: (_, g) => {
        const m = groupMembers[g.id] ?? []
        return m.length ? m.map(x => <Tag key={x.id}>{x.firstName ?? x.id}</Tag>) : <Text type="secondary">—</Text>
      },
    },
    { title: 'Count', key: 'count', align: 'center', render: (_, g) => <Tag>{(groupMembers[g.id] ?? []).length}</Tag> },
    {
      title: 'Actions', key: 'actions', align: 'center',
      render: (_, g) => (
        <Popconfirm title={`Delete group "${g.id}"?`} onConfirm={async () => {
          try { await deleteGroup(auth, g.id); message.success('Group deleted.'); refreshUsers() }
          catch (e) { message.error('Failed: ' + e.message) }
        }} okButtonProps={{ danger: true }} okText="Delete">
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ]

  const handleSaveUser = async () => {
    try {
      const values = await userForm.validateFields()
      setSaving(true)
      if (editUser) {
        await updateUser(auth, editUser.id, { firstName: values.firstName, lastName: values.lastName, email: values.email })
      } else {
        await createUser(auth, { id: values.id?.trim(), firstName: values.firstName, lastName: values.lastName, email: values.email, password: values.password })
        if (values.groups?.length) {
          for (const g of values.groups) await addMembership(auth, values.id.trim(), g)
        }
      }
      message.success(editUser ? 'User updated.' : 'User created.')
      setUserModal(false); setEditUser(null); userForm.resetFields(); refreshUsers()
    } catch (e) {
      if (e?.errorFields) return
      message.error('Failed: ' + (e.response?.data?.message ?? e.message))
    } finally { setSaving(false) }
  }

  const handleSaveGroup = async () => {
    try {
      const values = await groupForm.validateFields()
      setSaving(true)
      await createGroup(auth, { id: values.id.trim(), name: values.name.trim() })
      if (values.members?.length) {
        for (const uid of values.members) await addMembership(auth, uid, values.id.trim())
      }
      message.success('Group created.')
      setGroupModal(false); groupForm.resetFields(); refreshUsers()
    } catch (e) {
      if (e?.errorFields) return
      message.error('Failed: ' + (e.response?.data?.message ?? e.message))
    } finally { setSaving(false) }
  }

  const tabItems = [
    {
      key: 'active', label: <span><CheckCircleOutlined /> Active ({activeTasks.length})</span>,
      children: (
        <Table
          dataSource={activeTasks} rowKey="id" size="small" pagination={false}
          columns={[
            { title: 'Visitor', dataIndex: 'name', key: 'name', render: t => <strong>{t || '—'}</strong> },
            { title: 'Task', dataIndex: 'name', key: 'task', render: t => <Tag color="blue">{t}</Tag> },
            { title: 'Started', dataIndex: 'created', key: 'created', render: fmtDateTime },
          ]} />
      ),
    },
    {
      key: 'history', label: <span><HistoryOutlined /> History ({history.length})</span>,
      children: (
        <Table dataSource={history} rowKey="id" size="small" pagination={{ pageSize: 10 }}
          columns={[
            { title: 'Visitor', key: 'visitor', render: (_, p) => historyVars[p.id]?.VName || '—' },
            {
              title: 'Outcome', key: 'outcome',
              render: (_, p) => {
                const ok = p.state === 'COMPLETED' && historyVars[p.id]?.checkedIn
                return ok
                  ? <Tag icon={<CheckCircleOutlined />} color="success">Checked In</Tag>
                  : <Tag icon={<CloseCircleOutlined />} color="error">Refused</Tag>
              },
            },
            { title: 'Started', dataIndex: 'startTime', key: 'startTime', render: fmtDateTime },
          ]} />
      ),
    },
    {
      key: 'users', label: <span><UserAddOutlined /> Users ({users.length})</span>,
      children: (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12, gap: 8 }}>
            <Button icon={<UserAddOutlined />} onClick={() => { setEditUser(null); userForm.resetFields(); setUserModal(true) }}>New User</Button>
          </div>
          <Table dataSource={users} rowKey="id" columns={userColumns} size="small" pagination={false} />
        </div>
      ),
    },
    {
      key: 'groups', label: <span><TeamOutlined /> Groups ({groups.length})</span>,
      children: (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <Button icon={<PlusOutlined />} onClick={() => setGroupModal(true)}>New Group</Button>
          </div>
          <Table dataSource={groups} rowKey="id" columns={groupColumns} size="small" pagination={false} />
        </div>
      ),
    },
    {
      key: 'entrances', label: <span><LoginOutlined /> Entrances</span>,
      children: <EntrancesTab auth={auth} porters={groupMembers['Porters'] ?? []} />,
    },
  ]

  return (
    <Layout title="">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Admin Overview</Title>
          <Text type="secondary">{lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()} · auto-refreshes every 15s` : 'Loading…'}</Text>
        </div>
        <Button icon={<TeamOutlined />} onClick={() => navigate('/supervisor-admin')}>
          Supervisor Assignments
        </Button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>}
      {error   && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}><Card><Statistic title="Active Processes" value={activeTasks.length} valueStyle={{ color: '#1677ff' }} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="Checked In Today"  value={completedToday}    valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="Refused Today"     value={refusedToday}      valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="Total Users"       value={users.length}      valueStyle={{ color: '#722ed1' }} /></Card></Col>
      </Row>

      <Card>
        <Tabs items={tabItems} />
      </Card>

      {/* User Modal */}
      <Modal open={userModal} title={editUser ? `Edit User — ${editUser.id}` : 'Create New User'}
        onCancel={() => { setUserModal(false); setEditUser(null); userForm.resetFields() }}
        onOk={handleSaveUser} confirmLoading={saving}
        okText={editUser ? 'Save Changes' : 'Create User'} destroyOnClose>
        <Form form={userForm} layout="vertical" style={{ marginTop: 16 }}>
          {!editUser && <Form.Item name="id" label="Username" rules={[{ required: true, message: 'Required.' }]}><Input /></Form.Item>}
          <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'Required.' }]}><Input /></Form.Item>
          <Form.Item name="lastName" label="Last Name"><Input /></Form.Item>
          <Form.Item name="email" label="Email"><Input /></Form.Item>
          <Form.Item name="password" label={editUser ? 'New Password (blank to keep)' : 'Password'}
            rules={editUser ? [] : [{ required: true, message: 'Required.' }]}>
            <Input.Password />
          </Form.Item>
          {!editUser && groups.length > 0 && (
            <Form.Item name="groups" label="Assign to Groups">
              <Select mode="multiple" options={groups.map(g => ({ label: g.id, value: g.id }))} />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Group Modal */}
      <Modal open={groupModal} title="Create New Group"
        onCancel={() => { setGroupModal(false); groupForm.resetFields() }}
        onOk={handleSaveGroup} confirmLoading={saving} okText="Create Group" destroyOnClose>
        <Form form={groupForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="id" label="Group ID" rules={[{ required: true, message: 'Required.' }]}
            help="Unique identifier. Cannot be changed later.">
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Display Name" rules={[{ required: true, message: 'Required.' }]}><Input /></Form.Item>
          {users.length > 0 && (
            <Form.Item name="members" label="Add Initial Members (optional)">
              <Select mode="multiple" options={users.map(u => ({ label: `${u.firstName} ${u.lastName} (${u.id})`, value: u.id }))} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Layout>
  )
}

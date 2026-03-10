import React, { useState, useCallback, useEffect } from 'react'
import {
  Button, Table, Typography, Alert, Space, Spin, Tag, Avatar,
  Modal, Form, Input, Select, Checkbox, Tabs, Card, Row, Col,
  Statistic, Tooltip, Popconfirm, message,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  UserAddOutlined, TeamOutlined,
  CheckCircleOutlined, CloseCircleOutlined,
  HistoryOutlined,
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
} from '../api/operatonApi'

const { Title, Text } = Typography

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { auth }   = useAuth()

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

  // Group member management
  const [groupMembersTarget,   setGroupMembersTarget]   = useState(null)
  const [groupMembersSel,      setGroupMembersSel]      = useState([])
  const [groupMembersOriginal, setGroupMembersOriginal] = useState([])
  const [groupMembersSaving,   setGroupMembersSaving]   = useState(false)

  // User group management
  const [userGroupsTarget,   setUserGroupsTarget]   = useState(null)
  const [userGroupsSel,      setUserGroupsSel]       = useState([])
  const [userGroupsOriginal, setUserGroupsOriginal] = useState([])
  const [userGroupsSaving,   setUserGroupsSaving]   = useState(false)

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
          <Tooltip title="Edit profile"><Button size="small" icon={<EditOutlined />}
            onClick={() => { setEditUser(u); userForm.setFieldsValue({ firstName: u.firstName, lastName: u.lastName, email: u.email, password: '' }); setUserModal(true) }}
            aria-label={`Edit profile for ${u.id}`} /></Tooltip>
          <Tooltip title="Manage groups"><Button size="small" icon={<TeamOutlined />}
            onClick={() => openManageUserGroups(u)} aria-label={`Manage groups for ${u.id}`} /></Tooltip>
          <Popconfirm title={`Delete user "${u.id}"?`} onConfirm={async () => {
            try { await deleteUser(auth, u.id); message.success('User deleted.'); refreshUsers() }
            catch (e) { message.error('Failed: ' + e.message) }
          }} okButtonProps={{ danger: true }} okText="Delete">
            <Tooltip title="Delete"><Button size="small" danger icon={<DeleteOutlined />}
              aria-label={`Delete user ${u.id}`} /></Tooltip>
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
        <Space>
          <Tooltip title="Manage members">
            <Button size="small" icon={<UserAddOutlined />} onClick={() => openManageGroupMembers(g)}
              aria-label={`Manage members of ${g.id}`} />
          </Tooltip>
          <Popconfirm title={`Delete group "${g.id}"?`} onConfirm={async () => {
            try { await deleteGroup(auth, g.id); message.success('Group deleted.'); refreshUsers() }
            catch (e) { message.error('Failed: ' + e.message) }
          }} okButtonProps={{ danger: true }} okText="Delete">
            <Button size="small" danger icon={<DeleteOutlined />} aria-label={`Delete group ${g.id}`} />
          </Popconfirm>
        </Space>
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

  const openManageGroupMembers = (g) => {
    const current = (groupMembers[g.id] ?? []).map(m => m.id)
    setGroupMembersTarget(g)
    setGroupMembersSel(current)
    setGroupMembersOriginal(current)
  }

  const handleSaveGroupMembers = async () => {
    setGroupMembersSaving(true)
    try {
      const added   = groupMembersSel.filter(id => !groupMembersOriginal.includes(id))
      const removed = groupMembersOriginal.filter(id => !groupMembersSel.includes(id))
      await Promise.all([
        ...added.map(uid   => addMembership(auth, uid, groupMembersTarget.id)),
        ...removed.map(uid => removeMembership(auth, uid, groupMembersTarget.id)),
      ])
      message.success('Members updated.')
      setGroupMembersTarget(null)
      refreshUsers()
    } catch (e) {
      message.error('Failed: ' + (e.response?.data?.message ?? e.message))
    } finally { setGroupMembersSaving(false) }
  }

  const openManageUserGroups = (u) => {
    const current = Object.entries(groupMembers)
      .filter(([, m]) => m.some(x => x.id === u.id))
      .map(([gid]) => gid)
    setUserGroupsTarget(u)
    setUserGroupsSel(current)
    setUserGroupsOriginal(current)
  }

  const handleSaveUserGroups = async () => {
    setUserGroupsSaving(true)
    try {
      const added   = userGroupsSel.filter(gid => !userGroupsOriginal.includes(gid))
      const removed = userGroupsOriginal.filter(gid => !userGroupsSel.includes(gid))
      await Promise.all([
        ...added.map(gid   => addMembership(auth, userGroupsTarget.id, gid)),
        ...removed.map(gid => removeMembership(auth, userGroupsTarget.id, gid)),
      ])
      message.success('Group memberships updated.')
      setUserGroupsTarget(null)
      refreshUsers()
    } catch (e) {
      message.error('Failed: ' + (e.response?.data?.message ?? e.message))
    } finally { setUserGroupsSaving(false) }
  }

  const tabItems = [
    {
      key: 'active', label: <span><CheckCircleOutlined /> Active ({activeTasks.length})</span>,
      children: (
        <Table
          dataSource={activeTasks} rowKey="id" size="small" pagination={false}
          aria-label="Active BPMN process tasks"
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
          aria-label="Completed process history"
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
          <Table dataSource={users} rowKey="id" columns={userColumns} size="small" pagination={false} aria-label="System users" />
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
          <Table dataSource={groups} rowKey="id" columns={groupColumns} size="small" pagination={false} aria-label="System groups" />
        </div>
      ),
    },
  ]

  return (
    <Layout title="">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Admin Overview</Title>
          <Text type="secondary">{lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()} · auto-refreshes every 15s` : 'Loading…'}</Text>
        </div>
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
        okText={editUser ? 'Save Changes' : 'Create User'} destroyOnHidden>
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
        onOk={handleSaveGroup} confirmLoading={saving} okText="Create Group" destroyOnHidden>
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

      {/* Manage Group Members Modal */}
      <Modal
        open={Boolean(groupMembersTarget)}
        title={<Space><UserAddOutlined />Members — {groupMembersTarget?.id}</Space>}
        onCancel={() => setGroupMembersTarget(null)}
        onOk={handleSaveGroupMembers}
        confirmLoading={groupMembersSaving}
        okText="Save"
        destroyOnHidden
        width={480}
      >
        {users.length === 0
          ? <Text type="secondary">No users found.</Text>
          : users.map(u => (
            <div key={u.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
              borderBottom: '1px solid #f0f0f0', cursor: 'pointer',
            }} onClick={() => setGroupMembersSel(prev =>
              prev.includes(u.id) ? prev.filter(x => x !== u.id) : [...prev, u.id]
            )}>
              <Checkbox checked={groupMembersSel.includes(u.id)} aria-label={`${u.firstName ?? ''} ${u.lastName ?? ''} (${u.id})`}
                onChange={() => setGroupMembersSel(prev => prev.includes(u.id) ? prev.filter(x => x !== u.id) : [...prev, u.id])} />
              <Avatar style={{ background: '#1677ff', flexShrink: 0 }}>
                {(u.firstName?.[0] ?? u.id[0]).toUpperCase()}
              </Avatar>
              <div>
                <div><strong>{u.firstName} {u.lastName}</strong></div>
                <small style={{ color: '#888' }}>{u.id}</small>
              </div>
            </div>
          ))
        }
      </Modal>

      {/* Manage User Groups Modal */}
      <Modal
        open={Boolean(userGroupsTarget)}
        title={<Space><TeamOutlined />Groups — {userGroupsTarget?.id}</Space>}
        onCancel={() => setUserGroupsTarget(null)}
        onOk={handleSaveUserGroups}
        confirmLoading={userGroupsSaving}
        okText="Save"
        destroyOnHidden
        width={400}
      >
        {groups.length === 0
          ? <Text type="secondary">No groups found.</Text>
          : groups.map(g => (
            <div key={g.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
              borderBottom: '1px solid #f0f0f0', cursor: 'pointer',
            }} onClick={() => setUserGroupsSel(prev =>
              prev.includes(g.id) ? prev.filter(x => x !== g.id) : [...prev, g.id]
            )}>
              <Checkbox checked={userGroupsSel.includes(g.id)} aria-label={`${g.name ?? g.id} group (${g.id})`}
                onChange={() => setUserGroupsSel(prev => prev.includes(g.id) ? prev.filter(x => x !== g.id) : [...prev, g.id])} />
              <Tag color="blue" style={{ margin: 0 }}>{g.id}</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>{g.name}</Text>
            </div>
          ))
        }
      </Modal>
    </Layout>
  )
}

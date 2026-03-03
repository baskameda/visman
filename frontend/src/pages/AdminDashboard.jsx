import React, { useState, useCallback } from 'react'
import {
  Box, Grid, Typography, Card, CardContent, Chip,
  Tab, Tabs, Table, TableBody, TableCell, TableHead, TableRow,
  Avatar, CircularProgress, Alert, Tooltip, IconButton,
  LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Divider, TextField, MenuItem, Select, FormControl, InputLabel,
  List, ListItem, ListItemText, ListItemIcon, Checkbox, FormHelperText,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import RefreshIcon            from '@mui/icons-material/Refresh'
import PeopleIcon             from '@mui/icons-material/People'
import PlayCircleOutlineIcon  from '@mui/icons-material/PlayCircleOutline'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CancelOutlinedIcon     from '@mui/icons-material/CancelOutlined'
import GroupsIcon             from '@mui/icons-material/Groups'
import AssignmentIcon         from '@mui/icons-material/Assignment'
import HistoryIcon            from '@mui/icons-material/History'
import BarChartIcon           from '@mui/icons-material/BarChart'
import CloseIcon              from '@mui/icons-material/Close'
import PersonAddIcon          from '@mui/icons-material/PersonAdd'
import GroupAddIcon           from '@mui/icons-material/GroupAdd'
import EditIcon               from '@mui/icons-material/Edit'
import DeleteIcon             from '@mui/icons-material/Delete'
import ManageAccountsIcon     from '@mui/icons-material/ManageAccounts'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, Legend,
} from 'recharts'
import Layout             from '../components/Layout'
import ProcessFlowViz, { FLOW_STEPS, TASK_KEY_TO_STEP } from '../components/ProcessFlowViz'
import { useAuth }        from '../context/AuthContext'
import { useTaskSSE }     from '../hooks/useTaskSSE'
import {
  getAllActiveTasksForProcess, getHistoricProcesses, getHistoricVariables,
  getProcessVariables, getUsers, getAllGroups, getGroupMembers,
  getHistoricTasksByAssignee,
  createUser, deleteUser, updateUser, updateUserPassword,
  createGroup, deleteGroup,
  addMembership, removeMembership,
} from '../api/operatonApi'

// ─── Constants ────────────────────────────────────────────────────────────────

const GROUP_COLORS = { Invitors: '#1677ff', Security: '#d46b08', Porters: '#531dab', webAdmins: '#389e0d' }
const BAR_COLORS   = ['#1677ff', '#d46b08', '#531dab', '#389e0d', '#dc2626', '#0891b2']

const colorFor = (gid) => GROUP_COLORS[gid] ?? '#64748b'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function buildDailyChartData(tasksByUser) {
  const dateSet = new Set()
  Object.values(tasksByUser).forEach(tasks =>
    tasks.forEach(t => { if (t.endTime) dateSet.add(t.endTime.split('T')[0]) })
  )
  return [...dateSet].sort().map(date => {
    const row = { date }
    Object.entries(tasksByUser).forEach(([uid, tasks]) => {
      row[uid] = tasks.filter(t => t.endTime?.startsWith(date)).length
    })
    return row
  })
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, loading }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{label}</Typography>
            {loading
              ? <CircularProgress size={24} sx={{ color }} />
              : <Typography variant="h4" fontWeight={700} sx={{ color }}>{value}</Typography>}
          </Box>
          <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: alpha(color, 0.1),
                     display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {React.cloneElement(icon, { sx: { color, fontSize: 26 } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

// ─── Process rows ─────────────────────────────────────────────────────────────

function ActiveProcessRow({ p }) {
  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="body2" fontWeight={600}>{p.visitorName || '—'}</Typography>
        <Typography variant="caption" color="text.secondary">
          {p.visitDate ? new Date(p.visitDate).toLocaleDateString() : '—'}
        </Typography>
      </TableCell>
      <TableCell><Chip label={p.taskName || 'In Progress'} size="small" color="primary" variant="outlined" /></TableCell>
      <TableCell sx={{ minWidth: 320 }}>
        <ProcessFlowViz currentTaskKey={p.taskKey} outcome="active" compact />
      </TableCell>
      <TableCell><Typography variant="caption" color="text.secondary">{fmtDateTime(p.startedAt)}</Typography></TableCell>
    </TableRow>
  )
}

function HistoricProcessRow({ proc, vars }) {
  const outcome = proc.state === 'COMPLETED' ? (vars?.checkedIn ? 'completed' : 'refused') : 'active'
  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="body2" fontWeight={600}>{vars?.VName || '—'}</Typography>
        <Typography variant="caption" color="text.secondary">
          {vars?.VDate ? new Date(vars.VDate).toLocaleDateString() : '—'}
        </Typography>
      </TableCell>
      <TableCell>
        {outcome === 'completed'
          ? <Chip icon={<CheckCircleOutlineIcon />} label="Checked In" size="small" color="success" />
          : outcome === 'refused'
          ? <Chip icon={<CancelOutlinedIcon />} label="Refused" size="small" color="error" />
          : <Chip icon={<PlayCircleOutlineIcon />} label="Active" size="small" color="primary" />}
      </TableCell>
      <TableCell sx={{ minWidth: 320 }}><ProcessFlowViz outcome={outcome} compact /></TableCell>
      <TableCell><Typography variant="caption" color="text.secondary">{fmtDateTime(proc.startTime)}</Typography></TableCell>
    </TableRow>
  )
}

// ─── User History Dialog ──────────────────────────────────────────────────────

function UserHistoryDialog({ user, tasks, open, onClose }) {
  if (!user) return null
  const uniqueDays = new Set(tasks.map(t => t.endTime?.split('T')[0]).filter(Boolean)).size
  const avgPerDay  = uniqueDays > 0 ? (tasks.length / uniqueDays).toFixed(1) : 0

  const dailyData = (() => {
    const counts = {}
    tasks.forEach(t => {
      const d = t.endTime?.split('T')[0]
      if (d) counts[d] = (counts[d] ?? 0) + 1
    })
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, Tasks: count }))
  })()

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {(user.firstName?.[0] ?? user.id[0]).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6">{user.firstName} {user.lastName}</Typography>
            <Typography variant="caption" color="text.secondary">{user.id}</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
          <Chip icon={<AssignmentIcon />} label={`${tasks.length} tasks total`} color="primary" variant="outlined" />
          <Chip icon={<BarChartIcon />}   label={`${avgPerDay} tasks/day avg`} color="secondary" variant="outlined" />
          <Chip icon={<HistoryIcon />}    label={`${uniqueDays} active days`} variant="outlined" />
        </Box>
        {dailyData.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Tasks Completed Per Day</Typography>
            <Box sx={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <ReTooltip />
                  <Bar dataKey="Tasks" fill="#1677ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        )}
        <Divider sx={{ mb: 2 }} />
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Task History</Typography>
        {tasks.length === 0
          ? <Typography color="text.secondary">No completed tasks found.</Typography>
          : (
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Task</strong></TableCell>
                  <TableCell><strong>Process</strong></TableCell>
                  <TableCell><strong>Completed</strong></TableCell>
                  <TableCell><strong>Duration</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map(t => {
                  const ms  = t.startTime && t.endTime ? new Date(t.endTime) - new Date(t.startTime) : null
                  const dur = ms != null ? (ms < 60000 ? `${Math.round(ms / 1000)}s` : `${Math.round(ms / 60000)}m`) : '—'
                  return (
                    <TableRow key={t.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{t.name}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.68rem' }}>
                          {t.processInstanceId?.substring(0, 8)}…
                        </Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2">{fmtDateTime(t.endTime)}</Typography></TableCell>
                      <TableCell><Chip label={dur} size="small" variant="outlined" /></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )
        }
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  )
}

// ─── Create User Dialog ───────────────────────────────────────────────────────

function CreateUserDialog({ open, onClose, groups, auth, onCreated }) {
  const [form, setForm]       = useState({ id: '', firstName: '', lastName: '', email: '', password: '' })
  const [selGroups, setSelGroups] = useState([])
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const reset = () => { setForm({ id: '', firstName: '', lastName: '', email: '', password: '' }); setSelGroups([]); setError('') }
  const handleClose = () => { reset(); onClose() }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.id.trim())        { setError('Username is required.');  return }
    if (!form.firstName.trim()) { setError('First name is required.'); return }
    if (!form.password.trim())  { setError('Password is required.');  return }
    setSaving(true); setError('')
    try {
      await createUser(auth, { ...form, id: form.id.trim() })
      for (const gid of selGroups) {
        await addMembership(auth, form.id.trim(), gid)
      }
      onCreated()
      handleClose()
    } catch (e) {
      setError(e.response?.data?.message ?? e.message ?? 'Failed to create user.')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonAddIcon color="primary" /> Create New User
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 0.5 }}>
          <TextField label="Username *" value={form.id}        onChange={set('id')}        fullWidth autoFocus />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="First Name *" value={form.firstName} onChange={set('firstName')} fullWidth />
            <TextField label="Last Name"    value={form.lastName}  onChange={set('lastName')}  fullWidth />
          </Box>
          <TextField label="Email"     value={form.email}    onChange={set('email')}    fullWidth type="email" />
          <TextField label="Password *" value={form.password} onChange={set('password')} fullWidth type="password" />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Assign to Groups</Typography>
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, maxHeight: 200, overflowY: 'auto' }}>
              <List dense disablePadding>
                {groups.map(g => (
                  <ListItem key={g.id} dense button
                    onClick={() => setSelGroups(s => s.includes(g.id) ? s.filter(x => x !== g.id) : [...s, g.id])}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Checkbox edge="start" checked={selGroups.includes(g.id)} size="small"
                        sx={{ color: colorFor(g.id), '&.Mui-checked': { color: colorFor(g.id) } }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={g.id}
                      secondary={g.name}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    <Chip label={g.id} size="small" sx={{
                      bgcolor: alpha(colorFor(g.id), 0.1), color: colorFor(g.id),
                      fontWeight: 700, fontSize: '0.65rem', height: 18,
                    }} />
                  </ListItem>
                ))}
              </List>
            </Box>
            {selGroups.length > 0 && (
              <FormHelperText>Will be added to: {selGroups.join(', ')}</FormHelperText>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <PersonAddIcon />}>
          Create User
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Edit User Dialog ─────────────────────────────────────────────────────────

function EditUserDialog({ open, user, allGroups, currentGroups, auth, onSaved, onClose }) {
  const [form, setForm]       = useState({ firstName: '', lastName: '', email: '', newPassword: '' })
  const [selGroups, setSelGroups] = useState([])
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  React.useEffect(() => {
    if (user) {
      setForm({ firstName: user.firstName ?? '', lastName: user.lastName ?? '', email: user.email ?? '', newPassword: '' })
      setSelGroups(currentGroups)
      setError('')
    }
  }, [user, currentGroups])

  if (!user) return null

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const toggleGroup = (gid) => setSelGroups(s => s.includes(gid) ? s.filter(x => x !== gid) : [...s, gid])

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      await updateUser(auth, user.id, { firstName: form.firstName, lastName: form.lastName, email: form.email })
      if (form.newPassword.trim()) {
        await updateUserPassword(auth, user.id, form.newPassword.trim())
      }

      // Diff memberships
      const toAdd    = selGroups.filter(g => !currentGroups.includes(g))
      const toRemove = currentGroups.filter(g => !selGroups.includes(g))
      for (const gid of toAdd)    await addMembership(auth, user.id, gid)
      for (const gid of toRemove) await removeMembership(auth, user.id, gid)

      onSaved()
      onClose()
    } catch (e) {
      setError(e.response?.data?.message ?? e.message ?? 'Failed to save.')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ManageAccountsIcon color="primary" />
        Edit User — {user.id}
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 0.5 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="First Name" value={form.firstName} onChange={set('firstName')} fullWidth autoFocus />
            <TextField label="Last Name"  value={form.lastName}  onChange={set('lastName')}  fullWidth />
          </Box>
          <TextField label="Email" value={form.email} onChange={set('email')} fullWidth type="email" />
          <TextField label="New Password (leave blank to keep)" value={form.newPassword}
            onChange={set('newPassword')} fullWidth type="password" />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Group Memberships</Typography>
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, maxHeight: 200, overflowY: 'auto' }}>
              <List dense disablePadding>
                {allGroups.map(g => (
                  <ListItem key={g.id} dense button onClick={() => toggleGroup(g.id)}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Checkbox edge="start" checked={selGroups.includes(g.id)} size="small"
                        sx={{ color: colorFor(g.id), '&.Mui-checked': { color: colorFor(g.id) } }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={g.id}
                      secondary={g.name}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Create Group Dialog ──────────────────────────────────────────────────────

function CreateGroupDialog({ open, onClose, users, auth, onCreated }) {
  const [id, setId]           = useState('')
  const [name, setName]       = useState('')
  const [selUsers, setSelUsers] = useState([])
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const reset = () => { setId(''); setName(''); setSelUsers([]); setError('') }
  const handleClose = () => { reset(); onClose() }

  const handleSave = async () => {
    if (!id.trim())   { setError('Group ID is required.');   return }
    if (!name.trim()) { setError('Group name is required.'); return }
    setSaving(true); setError('')
    try {
      await createGroup(auth, { id: id.trim(), name: name.trim() })
      for (const uid of selUsers) {
        await addMembership(auth, uid, id.trim())
      }
      onCreated()
      handleClose()
    } catch (e) {
      setError(e.response?.data?.message ?? e.message ?? 'Failed to create group.')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <GroupAddIcon color="secondary" /> Create New Group
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 0.5 }}>
          <TextField label="Group ID *"   value={id}   onChange={e => setId(e.target.value)}   fullWidth autoFocus
            helperText="Unique identifier, e.g. Managers. Cannot be changed later." />
          <TextField label="Display Name *" value={name} onChange={e => setName(e.target.value)} fullWidth />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Add Initial Members (optional)</Typography>
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, maxHeight: 200, overflowY: 'auto' }}>
              <List dense disablePadding>
                {users.map(u => (
                  <ListItem key={u.id} dense button
                    onClick={() => setSelUsers(s => s.includes(u.id) ? s.filter(x => x !== u.id) : [...s, u.id])}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Checkbox edge="start" checked={selUsers.includes(u.id)} size="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.id}
                      secondary={u.id}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
            {selUsers.length > 0 && (
              <FormHelperText>{selUsers.length} user(s) will be added</FormHelperText>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" color="secondary" onClick={handleSave} disabled={saving}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <GroupAddIcon />}>
          Create Group
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

function ConfirmDeleteDialog({ open, title, description, onConfirm, onClose, loading }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">{description}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <DeleteIcon />}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Users tab ────────────────────────────────────────────────────────────────

function UsersTab({ users, groups, groupMembers, tasksByUser, loadingUserTasks,
                    onOpenHistory, onEditUser, onDeleteUser }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell><strong>User</strong></TableCell>
          <TableCell><strong>Email</strong></TableCell>
          <TableCell><strong>Groups</strong></TableCell>
          <TableCell align="center"><strong>Tasks Done</strong></TableCell>
          <TableCell align="center"><strong>Actions</strong></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {users.map(u => {
          const memberGroups = Object.entries(groupMembers)
            .filter(([, members]) => members.some(m => m.id === u.id))
            .map(([gId]) => gId)
          const taskCount = tasksByUser[u.id]?.length ?? null

          return (
            <TableRow key={u.id} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: 'primary.main' }}>
                    {(u.firstName?.[0] ?? u.id[0]).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{u.firstName} {u.lastName}</Typography>
                    <Typography variant="caption" color="text.secondary">{u.id}</Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">{u.email || '—'}</Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {memberGroups.map(g => (
                    <Chip key={g} label={g} size="small" sx={{
                      bgcolor: alpha(colorFor(g), 0.1), color: colorFor(g),
                      fontWeight: 700, fontSize: '0.65rem',
                    }} />
                  ))}
                  {memberGroups.length === 0 &&
                    <Typography variant="caption" color="text.disabled">—</Typography>}
                </Box>
              </TableCell>
              <TableCell align="center">
                {loadingUserTasks
                  ? <CircularProgress size={14} />
                  : <Chip label={taskCount ?? '…'} size="small"
                      color={taskCount > 0 ? 'primary' : 'default'}
                      variant={taskCount > 0 ? 'filled' : 'outlined'} />}
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                  <Tooltip title="View task history">
                    <IconButton size="small" onClick={() => onOpenHistory(u)} color="primary">
                      <HistoryIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit user">
                    <IconButton size="small" onClick={() => onEditUser(u, memberGroups)} color="default">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete user">
                    <IconButton size="small" onClick={() => onDeleteUser(u)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

// ─── Groups tab ───────────────────────────────────────────────────────────────

function GroupsTab({ groups, groupMembers, users, auth, onDataChanged }) {
  const [addDialogGroup, setAddDialogGroup]   = useState(null)
  const [selUsers, setSelUsers]               = useState([])
  const [saving, setSaving]                   = useState(false)
  const [delGroup, setDelGroup]               = useState(null)
  const [deleting, setDeleting]               = useState(false)
  const [error, setError]                     = useState('')

  const handleAddMembers = async () => {
    setSaving(true); setError('')
    try {
      for (const uid of selUsers) {
        await addMembership(auth, uid, addDialogGroup.id)
      }
      onDataChanged()
      setAddDialogGroup(null); setSelUsers([])
    } catch (e) {
      setError(e.response?.data?.message ?? e.message ?? 'Failed to add member.')
    } finally { setSaving(false) }
  }

  const handleRemoveMember = async (userId, groupId) => {
    try {
      await removeMembership(auth, userId, groupId)
      onDataChanged()
    } catch (e) {
      setError('Failed to remove member: ' + (e.response?.data?.message ?? e.message))
    }
  }

  const handleDeleteGroup = async () => {
    setDeleting(true)
    try {
      await deleteGroup(auth, delGroup.id)
      onDataChanged()
      setDelGroup(null)
    } catch (e) {
      setError('Failed to delete group: ' + (e.response?.data?.message ?? e.message))
    } finally { setDeleting(false) }
  }

  // Users not yet in the group (for the add-member picker)
  const nonMembers = addDialogGroup
    ? users.filter(u => !(groupMembers[addDialogGroup.id] ?? []).some(m => m.id === u.id))
    : []

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Grid container spacing={2}>
        {groups.map(g => {
          const members = groupMembers[g.id] ?? []
          const color   = colorFor(g.id)
          return (
            <Grid item xs={12} sm={6} md={4} key={g.id}>
              <Card variant="outlined" sx={{ borderTop: `3px solid ${color}` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <GroupsIcon sx={{ color, fontSize: 18 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={700}>{g.id}</Typography>
                      {g.name && g.name !== g.id && (
                        <Typography variant="caption" color="text.secondary">{g.name}</Typography>
                      )}
                    </Box>
                    <Chip label={`${members.length}`} size="small"
                      sx={{ bgcolor: alpha(color, 0.1), color, fontWeight: 700 }} />
                  </Box>

                  {members.length === 0
                    ? <Typography variant="body2" color="text.disabled" sx={{ mb: 1.5 }}>No members</Typography>
                    : members.map(m => (
                      <Box key={m.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: color }}>
                          {(m.firstName?.[0] ?? m.id[0]).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" noWrap>
                            {m.firstName} {m.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">{m.id}</Typography>
                        </Box>
                        <Tooltip title="Remove from group">
                          <IconButton size="small" onClick={() => handleRemoveMember(m.id, g.id)}
                            sx={{ opacity: 0.4, '&:hover': { opacity: 1, color: 'error.main' } }}>
                            <CloseIcon sx={{ fontSize: 12 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ))
                  }

                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Button size="small" startIcon={<PersonAddIcon />}
                      onClick={() => { setAddDialogGroup(g); setSelUsers([]) }}
                      sx={{ flex: 1, fontSize: '0.75rem' }}>
                      Add Members
                    </Button>
                    <Tooltip title="Delete group">
                      <IconButton size="small" onClick={() => setDelGroup(g)}
                        sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {/* Add members to group dialog */}
      <Dialog open={Boolean(addDialogGroup)} onClose={() => setAddDialogGroup(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Members to {addDialogGroup?.id}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
          {nonMembers.length === 0
            ? <Typography color="text.secondary">All users are already in this group.</Typography>
            : (
              <List dense disablePadding>
                {nonMembers.map(u => (
                  <ListItem key={u.id} dense button
                    onClick={() => setSelUsers(s => s.includes(u.id) ? s.filter(x => x !== u.id) : [...s, u.id])}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Checkbox edge="start" checked={selUsers.includes(u.id)} size="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.id}
                      secondary={u.id}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            )
          }
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogGroup(null)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleAddMembers}
            disabled={saving || selUsers.length === 0}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <PersonAddIcon />}>
            Add {selUsers.length > 0 ? `(${selUsers.length})` : ''}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm delete group */}
      <ConfirmDeleteDialog
        open={Boolean(delGroup)}
        title={`Delete group "${delGroup?.id}"?`}
        description="This will permanently delete the group and remove all its memberships. This cannot be undone."
        onConfirm={handleDeleteGroup}
        onClose={() => setDelGroup(null)}
        loading={deleting}
      />
    </Box>
  )
}

// ─── All-users chart tab ──────────────────────────────────────────────────────

function AllUsersChartTab({ tasksByUser, users, loading }) {
  const chartData = buildDailyChartData(tasksByUser)
  const userIds   = Object.keys(tasksByUser)

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
  if (chartData.length === 0) return (
    <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No task history available yet.</Typography>
  )

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2 }}>Tasks Completed Per Day — All Users</Typography>
      <Box sx={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 24, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <ReTooltip />
            <Legend />
            {userIds.map((uid, i) => {
              const u = users.find(x => x.id === uid)
              return (
                <Bar key={uid} dataKey={uid} name={u?.firstName ?? uid}
                  fill={BAR_COLORS[i % BAR_COLORS.length]}
                  radius={[4, 4, 0, 0]} stackId="a" />
              )
            })}
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { auth } = useAuth()

  const [activeTab, setActiveTab]     = useState(0)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [lastRefresh, setLastRefresh] = useState(null)

  const [activeTasks, setActiveTasks]         = useState([])
  const [activeTaskVars, setActiveTaskVars]   = useState({})
  const [history, setHistory]                 = useState([])
  const [historyVars, setHistoryVars]         = useState({})
  const [users, setUsers]                     = useState([])
  const [groups, setGroups]                   = useState([])
  const [groupMembers, setGroupMembers]       = useState({})
  const [usersLoaded, setUsersLoaded]         = useState(false)
  const [tasksByUser, setTasksByUser]         = useState({})
  const [loadingUserTasks, setLoadingUserTasks] = useState(false)

  // Dialog states
  const [historyDialogUser, setHistoryDialogUser]   = useState(null)
  const [createUserOpen, setCreateUserOpen]         = useState(false)
  const [editUserData, setEditUserData]             = useState(null)   // { user, currentGroups }
  const [deleteUserData, setDeleteUserData]         = useState(null)
  const [createGroupOpen, setCreateGroupOpen]       = useState(false)
  const [deletingUser, setDeletingUser]             = useState(false)

  const loadUserData = useCallback(async (userList, groupList) => {
    const mMap = {}
    await Promise.all(groupList.map(async g => {
      try { mMap[g.id] = await getGroupMembers(auth, g.id) } catch { mMap[g.id] = [] }
    }))
    setGroupMembers(mMap)

    setLoadingUserTasks(true)
    const tMap = {}
    await Promise.all(userList.map(async u => {
      try { tMap[u.id] = await getHistoricTasksByAssignee(auth, u.id) } catch { tMap[u.id] = [] }
    }))
    setTasksByUser(tMap)
    setLoadingUserTasks(false)
  }, [auth])

  const refreshUsersAndGroups = useCallback(async () => {
    const [userList, groupList] = await Promise.all([getUsers(auth), getAllGroups(auth)])
    setUsers(userList)
    setGroups(groupList)
    await loadUserData(userList, groupList)
  }, [auth, loadUserData])

  const load = useCallback(async () => {
    setError('')
    try {
      const [tasks, hist] = await Promise.all([
        getAllActiveTasksForProcess(auth),
        getHistoricProcesses(auth),
      ])
      setActiveTasks(tasks)
      setHistory(hist.slice(0, 30))

      const uniquePids = [...new Set(tasks.map(t => t.processInstanceId))]
      const varMap = {}
      await Promise.all(uniquePids.map(async pid => {
        try { varMap[pid] = await getProcessVariables(auth, pid) } catch { varMap[pid] = {} }
      }))
      setActiveTaskVars(varMap)

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
        setUsers(userList)
        setGroups(groupList)
        await loadUserData(userList, groupList)
        setUsersLoaded(true)
      }

      setLastRefresh(new Date())
    } catch (e) {
      setError('Failed to load: ' + (e.message ?? 'unknown'))
    } finally {
      setLoading(false)
    }
  }, [auth, usersLoaded, historyVars, loadUserData])

  useTaskSSE(load)

  // Delete user
  const handleDeleteUser = async () => {
    setDeletingUser(true)
    try {
      await deleteUser(auth, deleteUserData.id)
      await refreshUsersAndGroups()
      setDeleteUserData(null)
    } catch (e) {
      setError('Failed to delete user: ' + (e.response?.data?.message ?? e.message))
    } finally { setDeletingUser(false) }
  }

  // Derived stats
  const stepCounts = Object.fromEntries(FLOW_STEPS.map(s => [s.id, 0]))
  activeTasks.forEach(t => {
    const idx = TASK_KEY_TO_STEP[t.taskDefinitionKey]
    if (idx !== undefined) stepCounts[FLOW_STEPS[idx].id]++
  })
  const today = new Date().toDateString()
  const completedToday = history.filter(p =>
    p.state === 'COMPLETED' && historyVars[p.id]?.checkedIn && p.endTime &&
    new Date(p.endTime).toDateString() === today
  ).length
  const refusedToday = history.filter(p =>
    p.state === 'COMPLETED' && !historyVars[p.id]?.checkedIn && p.endTime &&
    new Date(p.endTime).toDateString() === today
  ).length

  const activeProcs = activeTasks.map(t => ({
    processInstanceId: t.processInstanceId,
    visitorName: activeTaskVars[t.processInstanceId]?.VName,
    visitDate:   activeTaskVars[t.processInstanceId]?.VDate,
    taskName:    t.name, taskKey: t.taskDefinitionKey, startedAt: t.created,
  }))

  return (
    <Layout>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">Admin Overview</Typography>
          <Typography variant="body2" color="text.secondary">
            {lastRefresh ? `Live · updated ${lastRefresh.toLocaleTimeString()}` : 'Connecting…'}
          </Typography>
        </Box>
        <Tooltip title="Refresh now">
          <span>
            <IconButton onClick={load} disabled={loading}>
              <RefreshIcon sx={{
                animation: loading ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
              }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}
      {error   && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard label="Active Processes" value={activeTasks.length}
            icon={<PlayCircleOutlineIcon />}  color="#1677ff" loading={loading && !activeTasks.length} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Checked In Today" value={completedToday}
            icon={<CheckCircleOutlineIcon />} color="#52c41a" loading={loading && !history.length} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Refused Today"    value={refusedToday}
            icon={<CancelOutlinedIcon />}     color="#ff4d4f" loading={loading && !history.length} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Total Users"      value={users.length}
            icon={<PeopleIcon />}             color="#722ed1" loading={loading && !users.length} />
        </Grid>
      </Grid>

      {/* Per-step breakdown */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>Active Processes — by Stage</Typography>
          <Grid container spacing={1}>
            {FLOW_STEPS.map(step => (
              <Grid item xs={6} sm={3} key={step.id}>
                <Box sx={{
                  p: 1.5, borderRadius: 2, textAlign: 'center',
                  bgcolor: alpha(step.color, 0.06), border: '1px solid', borderColor: alpha(step.color, 0.2),
                }}>
                  <Typography variant="h5" fontWeight={700} sx={{ color: step.color }}>{stepCounts[step.id]}</Typography>
                  <Typography variant="caption" color="text.secondary">{step.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card variant="outlined">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                   borderBottom: '1px solid', borderColor: 'divider', pr: 2 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable">
            <Tab icon={<AssignmentIcon />}         iconPosition="start" label={`Active (${activeProcs.length})`} />
            <Tab icon={<CheckCircleOutlineIcon />}  iconPosition="start" label={`History (${history.length})`} />
            <Tab icon={<PeopleIcon />}              iconPosition="start" label={`Users (${users.length})`} />
            <Tab icon={<BarChartIcon />}            iconPosition="start" label="Daily Chart" />
            <Tab icon={<GroupsIcon />}              iconPosition="start" label={`Groups (${groups.length})`} />
          </Tabs>

          {/* Contextual action buttons */}
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            {activeTab === 2 && (
              <Button size="small" variant="contained" startIcon={<PersonAddIcon />}
                onClick={() => setCreateUserOpen(true)}>
                New User
              </Button>
            )}
            {activeTab === 4 && (
              <Button size="small" variant="contained" color="secondary" startIcon={<GroupAddIcon />}
                onClick={() => setCreateGroupOpen(true)}>
                New Group
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ p: 2 }}>
          {activeTab === 0 && (
            activeProcs.length === 0
              ? <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No active processes.</Typography>
              : <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Visitor</strong></TableCell>
                        <TableCell><strong>Current Task</strong></TableCell>
                        <TableCell><strong>Flow Position</strong></TableCell>
                        <TableCell><strong>Started</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeProcs.map(p => <ActiveProcessRow key={p.processInstanceId} p={p} />)}
                    </TableBody>
                  </Table>
                </Box>
          )}

          {activeTab === 1 && (
            history.length === 0
              ? <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No history found.</Typography>
              : <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Visitor</strong></TableCell>
                        <TableCell><strong>Outcome</strong></TableCell>
                        <TableCell><strong>Flow</strong></TableCell>
                        <TableCell><strong>Started</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {history.map(p => <HistoricProcessRow key={p.id} proc={p} vars={historyVars[p.id] ?? {}} />)}
                    </TableBody>
                  </Table>
                </Box>
          )}

          {activeTab === 2 && (
            <UsersTab
              users={users} groups={groups} groupMembers={groupMembers}
              tasksByUser={tasksByUser} loadingUserTasks={loadingUserTasks}
              onOpenHistory={u => setHistoryDialogUser(u)}
              onEditUser={(u, memberGroups) => setEditUserData({ user: u, currentGroups: memberGroups })}
              onDeleteUser={u => setDeleteUserData(u)}
            />
          )}

          {activeTab === 3 && (
            <AllUsersChartTab tasksByUser={tasksByUser} users={users} loading={loadingUserTasks} />
          )}

          {activeTab === 4 && (
            <GroupsTab
              groups={groups} groupMembers={groupMembers} users={users}
              auth={auth} onDataChanged={refreshUsersAndGroups}
            />
          )}
        </Box>
      </Card>

      {/* ── Dialogs ── */}

      <UserHistoryDialog
        user={historyDialogUser}
        tasks={historyDialogUser ? (tasksByUser[historyDialogUser.id] ?? []) : []}
        open={Boolean(historyDialogUser)}
        onClose={() => setHistoryDialogUser(null)}
      />

      <CreateUserDialog
        open={createUserOpen}
        onClose={() => setCreateUserOpen(false)}
        groups={groups} auth={auth}
        onCreated={refreshUsersAndGroups}
      />

      <EditUserDialog
        open={Boolean(editUserData)}
        user={editUserData?.user ?? null}
        currentGroups={editUserData?.currentGroups ?? []}
        allGroups={groups} auth={auth}
        onSaved={refreshUsersAndGroups}
        onClose={() => setEditUserData(null)}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteUserData)}
        title={`Delete user "${deleteUserData?.id}"?`}
        description={`This will permanently delete ${deleteUserData?.firstName ?? deleteUserData?.id} and all their group memberships. This cannot be undone.`}
        onConfirm={handleDeleteUser}
        onClose={() => setDeleteUserData(null)}
        loading={deletingUser}
      />

      <CreateGroupDialog
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        users={users} auth={auth}
        onCreated={refreshUsersAndGroups}
      />
    </Layout>
  )
}

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
import PersonPinIcon          from '@mui/icons-material/PersonPin'
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
import MeetingRoomIcon        from '@mui/icons-material/MeetingRoom'
import AddIcon                from '@mui/icons-material/Add'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, Legend,
} from 'recharts'
import Layout             from '../components/Layout'
import ProcessFlowViz, { FLOW_STEPS, TASK_KEY_TO_STEP } from '../components/ProcessFlowViz'
import { useAuth }        from '../context/AuthContext'
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

// ─── Constants ────────────────────────────────────────────────────────────────

const GROUP_COLORS = { Invitors: '#1677ff', Security: '#d46b08', Porters: '#531dab', webAdmins: '#389e0d' }
const BAR_COLORS   = ['#1677ff', '#d46b08', '#531dab', '#389e0d', '#dc2626', '#0891b2']
const colorFor     = (gid) => GROUP_COLORS[gid] ?? '#64748b'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
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
          <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: `${color}18`,
                     display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {React.cloneElement(icon, { sx: { color, fontSize: 26 } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

// ─── Active / Historic process rows ──────────────────────────────────────────
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
      <TableCell sx={{ minWidth: 340 }}>
        <ProcessFlowViz currentTaskKey={p.taskKey} outcome="active" compact />
      </TableCell>
      <TableCell><Typography variant="caption" color="text.secondary">{fmtDateTime(p.startedAt)}</Typography></TableCell>
    </TableRow>
  )
}

function HistoricProcessRow({ proc, vars }) {
  const outcome = proc.state === 'COMPLETED'
    ? (vars?.checkedIn ? 'completed' : 'refused') : 'active'
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
          ? <Chip icon={<CancelOutlinedIcon />}    label="Refused"     size="small" color="error"   />
          : <Chip icon={<PlayCircleOutlineIcon />} label="Active"      size="small" color="primary" />}
      </TableCell>
      <TableCell sx={{ minWidth: 340 }}><ProcessFlowViz outcome={outcome} compact /></TableCell>
      <TableCell><Typography variant="caption" color="text.secondary">{fmtDateTime(proc.startTime)}</Typography></TableCell>
    </TableRow>
  )
}

// ─── User History Dialog ──────────────────────────────────────────────────────
function UserHistoryDialog({ user, tasks, open, onClose }) {
  if (!user) return null
  const totalTasks = tasks.length
  const uniqueDays = new Set(tasks.map(t => t.endTime?.split('T')[0]).filter(Boolean)).size
  const avgPerDay  = uniqueDays > 0 ? (totalTasks / uniqueDays).toFixed(1) : 0
  const dailyData  = (() => {
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
          <Chip icon={<AssignmentIcon />} label={`${totalTasks} tasks total`} color="primary" variant="outlined" />
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
                  <Bar dataKey="Tasks" fill="#2563eb" radius={[4, 4, 0, 0]} />
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
                  const dMs = t.startTime && t.endTime
                    ? new Date(t.endTime) - new Date(t.startTime) : null
                  const dur = dMs != null
                    ? dMs < 60000 ? `${Math.round(dMs / 1000)}s` : `${Math.round(dMs / 60000)}m`
                    : '—'
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

// ─── Create / Edit User Dialog ────────────────────────────────────────────────
function UserDialog({ open, user, groups, auth, onClose, onSaved }) {
  const isEdit = Boolean(user)
  const [form, setForm] = useState({ id: '', firstName: '', lastName: '', email: '', password: '', selectedGroups: [] })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  React.useEffect(() => {
    if (open) {
      setForm(isEdit
        ? { id: user.id, firstName: user.firstName ?? '', lastName: user.lastName ?? '', email: user.email ?? '', password: '', selectedGroups: [] }
        : { id: '', firstName: '', lastName: '', email: '', password: '', selectedGroups: [] })
      setErrors({})
    }
  }, [open, user])

  const validate = () => {
    const e = {}
    if (!isEdit && !form.id.trim())        e.id        = 'Username is required.'
    if (!form.firstName.trim())            e.firstName = 'First name is required.'
    if (!isEdit && !form.password.trim())  e.password  = 'Password is required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (isEdit) {
        await updateUser(auth, user.id, { firstName: form.firstName, lastName: form.lastName, email: form.email })
      } else {
        await createUser(auth, { id: form.id.trim(), firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password })
        for (const gid of form.selectedGroups) await addMembership(auth, form.id.trim(), gid)
      }
      onSaved()
      onClose()
    } catch (e) {
      setErrors({ submit: e.response?.data?.message ?? e.message })
    } finally {
      setSaving(false)
    }
  }

  const f = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isEdit ? `Edit User — ${user?.id}` : 'Create New User'}
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {errors.submit && <Alert severity="error" sx={{ mb: 2 }}>{errors.submit}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {!isEdit && (
            <TextField label="Username *" value={form.id} onChange={f('id')}
              error={!!errors.id} helperText={errors.id} fullWidth size="small" />
          )}
          <TextField label="First Name *" value={form.firstName} onChange={f('firstName')}
            error={!!errors.firstName} helperText={errors.firstName} fullWidth size="small" />
          <TextField label="Last Name" value={form.lastName} onChange={f('lastName')} fullWidth size="small" />
          <TextField label="Email" value={form.email} onChange={f('email')} fullWidth size="small" />
          {isEdit
            ? <TextField label="New Password (leave blank to keep)" value={form.password} onChange={f('password')}
                type="password" fullWidth size="small" />
            : <TextField label="Password *" value={form.password} onChange={f('password')}
                error={!!errors.password} helperText={errors.password} type="password" fullWidth size="small" />
          }
          {!isEdit && groups.length > 0 && (
            <FormControl fullWidth size="small">
              <InputLabel>Assign to Groups</InputLabel>
              <Select multiple value={form.selectedGroups}
                onChange={e => setForm(prev => ({ ...prev, selectedGroups: e.target.value }))}
                label="Assign to Groups"
                renderValue={(sel) => sel.join(', ')}>
                {groups.map(g => (
                  <MenuItem key={g.id} value={g.id}>
                    <Checkbox checked={form.selectedGroups.includes(g.id)} size="small" />
                    <ListItemText primary={g.id} />
                  </MenuItem>
                ))}
              </Select>
              {form.selectedGroups.length > 0 &&
                <FormHelperText>Will be added to: {form.selectedGroups.join(', ')}</FormHelperText>}
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={18} /> : isEdit ? 'Save Changes' : 'Create User'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Create Group Dialog ──────────────────────────────────────────────────────
function GroupDialog({ open, users, auth, onClose, onSaved }) {
  const [form, setForm]   = useState({ id: '', name: '', selectedUsers: [] })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  React.useEffect(() => { if (open) { setForm({ id: '', name: '', selectedUsers: [] }); setErrors({}) } }, [open])

  const handleSave = async () => {
    const e = {}
    if (!form.id.trim())   e.id   = 'Group ID is required.'
    if (!form.name.trim()) e.name = 'Group name is required.'
    setErrors(e)
    if (Object.keys(e).length) return
    setSaving(true)
    try {
      await createGroup(auth, { id: form.id.trim(), name: form.name.trim() })
      for (const uid of form.selectedUsers) await addMembership(auth, uid, form.id.trim())
      onSaved(); onClose()
    } catch (err) {
      setErrors({ submit: err.response?.data?.message ?? err.message })
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Create New Group <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {errors.submit && <Alert severity="error" sx={{ mb: 2 }}>{errors.submit}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Group ID *" value={form.id}
            onChange={e => setForm(p => ({ ...p, id: e.target.value }))}
            error={!!errors.id} helperText={errors.id || 'Unique identifier. Cannot be changed later.'} fullWidth size="small" />
          <TextField label="Display Name *" value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            error={!!errors.name} helperText={errors.name} fullWidth size="small" />
          {users.length > 0 && (
            <FormControl fullWidth size="small">
              <InputLabel>Add Initial Members (optional)</InputLabel>
              <Select multiple value={form.selectedUsers}
                onChange={e => setForm(p => ({ ...p, selectedUsers: e.target.value }))}
                label="Add Initial Members (optional)"
                renderValue={sel => `${sel.length} user(s) selected`}>
                {users.map(u => (
                  <MenuItem key={u.id} value={u.id}>
                    <Checkbox checked={form.selectedUsers.includes(u.id)} size="small" />
                    <ListItemText primary={`${u.firstName} ${u.lastName}`} secondary={u.id} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={18} /> : 'Create Group'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Confirm Delete Dialog ────────────────────────────────────────────────────
function ConfirmDeleteDialog({ open, title, description, onConfirm, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent><Typography>{description}</Typography></DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="error" onClick={onConfirm}>Delete</Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Users tab ────────────────────────────────────────────────────────────────
function UsersTab({ users, groupMembers, tasksByUser, loadingUserTasks, onOpenHistory, onEdit, onDelete }) {
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
              <TableCell><Typography variant="body2" color="text.secondary">{u.email || '—'}</Typography></TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {memberGroups.map(g => (
                    <Chip key={g} label={g} size="small" sx={{
                      bgcolor: alpha(colorFor(g), 0.12), color: colorFor(g), fontWeight: 600, fontSize: '0.65rem',
                    }} />
                  ))}
                  {memberGroups.length === 0 && <Typography variant="caption" color="text.disabled">—</Typography>}
                </Box>
              </TableCell>
              <TableCell align="center">
                {loadingUserTasks
                  ? <CircularProgress size={14} />
                  : <Chip label={taskCount ?? '…'} size="small"
                      color={taskCount > 0 ? 'primary' : 'default'}
                      variant={taskCount > 0 ? 'filled' : 'outlined'} />
                }
              </TableCell>
              <TableCell align="center">
                <Tooltip title="View task history"><IconButton size="small" onClick={() => onOpenHistory(u)} color="primary"><HistoryIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Edit user"><IconButton size="small" onClick={() => onEdit(u)} color="default"><EditIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Delete user"><IconButton size="small" onClick={() => onDelete(u)} color="error"><DeleteIcon fontSize="small" /></IconButton></Tooltip>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

// ─── Groups tab ───────────────────────────────────────────────────────────────
function GroupsTab({ groups, groupMembers, auth, onDelete, onRefresh }) {
  const [removingMember, setRemovingMember] = useState(null)
  const handleRemoveMember = async (groupId, userId) => {
    setRemovingMember(`${groupId}:${userId}`)
    try { await removeMembership(auth, userId, groupId); onRefresh() }
    catch (e) { alert('Failed to remove member: ' + e.message) }
    finally { setRemovingMember(null) }
  }

  return (
    <Grid container spacing={2}>
      {groups.map(g => {
        const members = groupMembers[g.id] ?? []
        const color   = colorFor(g.id)
        return (
          <Grid item xs={12} sm={6} md={4} key={g.id}>
            <Card variant="outlined" sx={{ borderTop: `4px solid ${color}` }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <GroupsIcon sx={{ color }} />
                  <Typography variant="subtitle1" fontWeight={700}>{g.id}</Typography>
                  <Chip label={`${members.length}`} size="small" sx={{ ml: 'auto' }} />
                  <Tooltip title="Delete group">
                    <IconButton size="small" color="error" onClick={() => onDelete(g)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                {members.length === 0
                  ? <Typography variant="body2" color="text.disabled">No members</Typography>
                  : members.map(m => (
                    <Box key={m.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                      <Avatar sx={{ width: 26, height: 26, fontSize: '0.7rem', bgcolor: color }}>
                        {(m.firstName?.[0] ?? m.id[0]).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" sx={{ flex: 1 }}>{m.firstName} {m.lastName}</Typography>
                      <Tooltip title="Remove from group">
                        <IconButton size="small"
                          disabled={removingMember === `${g.id}:${m.id}`}
                          onClick={() => handleRemoveMember(g.id, m.id)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))
                }
              </CardContent>
            </Card>
          </Grid>
        )
      })}
    </Grid>
  )
}

// ─── Assign Gatekeepers Dialog ────────────────────────────────────────────────
function AssignGatekeepersDialog({ open, entrance, porters, auth, onClose, onSaved }) {
  const [selected, setSelected] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  React.useEffect(() => {
    if (!open || !entrance) return
    setLoading(true); setError('')
    getEntranceGatekeepers(auth, entrance.id)
      .then(setSelected)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [open, entrance, auth])

  const toggle = (uid) =>
    setSelected(prev => prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid])

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      await setEntranceGatekeepers(auth, entrance.id, selected)
      onSaved(); onClose()
    } catch (e) { setError(e.response?.data?.message ?? e.message) }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonPinIcon color="primary" />
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>Assign Gatekeepers</Typography>
            <Typography variant="caption" color="text.secondary">{entrance?.name}</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {error   && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} />}
        {!loading && porters.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No gatekeepers found in the Porters group.
          </Typography>
        )}
        {!loading && porters.map(u => (
          <Box key={u.id} sx={{
            display: 'flex', alignItems: 'center', gap: 1.5, py: 1,
            borderBottom: '1px solid', borderColor: 'divider',
            cursor: 'pointer', '&:last-child': { borderBottom: 0 },
          }} onClick={() => toggle(u.id)}>
            <Checkbox checked={selected.includes(u.id)} size="small" />
            <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', bgcolor: '#7c3aed' }}>
              {(u.firstName?.[0] ?? u.id[0]).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600}>{u.firstName} {u.lastName}</Typography>
              <Typography variant="caption" color="text.secondary">{u.id}</Typography>
            </Box>
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || loading}>
          {saving ? <CircularProgress size={18} /> : `Save (${selected.length} selected)`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Entrances tab ────────────────────────────────────────────────────────────
function EntrancesTab({ auth, porters }) {
  const [entrances,        setEntrances]        = useState([])
  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState('')
  const [dialogOpen,       setDialogOpen]       = useState(false)
  const [editTarget,       setEditTarget]       = useState(null)
  const [deleteTarget,     setDeleteTarget]     = useState(null)
  const [assignTarget,     setAssignTarget]     = useState(null)
  const [gatekeeperMap,    setGatekeeperMap]    = useState({}) // entranceId → [username]
  const [form,             setForm]             = useState({ name: '', description: '' })
  const [formErrors,       setFormErrors]       = useState({})
  const [saving,           setSaving]           = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const list = await getEntrances(auth)
      setEntrances(list)
      // Load gatekeeper assignments for all entrances in parallel
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

  React.useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditTarget(null); setForm({ name: '', description: '' }); setFormErrors({}); setDialogOpen(true)
  }
  const openEdit = (e) => {
    setEditTarget(e); setForm({ name: e.name, description: e.description ?? '' }); setFormErrors({}); setDialogOpen(true)
  }

  const handleSave = async () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required.'
    setFormErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    try {
      if (editTarget) {
        await updateEntrance(auth, editTarget.id, { name: form.name.trim(), description: form.description.trim() || null })
      } else {
        await createEntrance(auth, { name: form.name.trim(), description: form.description.trim() || null })
      }
      setDialogOpen(false); await load()
    } catch (e) { setFormErrors({ submit: e.response?.data?.message ?? e.message }) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try { await deleteEntrance(auth, deleteTarget.id); setDeleteTarget(null); await load() }
    catch (e) { setError('Failed to delete: ' + e.message) }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>Facility Entrances</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate}>
          New Entrance
        </Button>
      </Box>

      {error   && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {!loading && entrances.length === 0 && (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <MeetingRoomIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No entrances defined yet. Create one above.</Typography>
        </Box>
      )}

      {entrances.length > 0 && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell><strong>Assigned Gatekeepers</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entrances.map(e => {
              const assigned = gatekeeperMap[e.id] ?? []
              const assignedPorters = porters.filter(p => assigned.includes(p.id))
              return (
                <TableRow key={e.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MeetingRoomIcon fontSize="small" color="action" />
                      <Typography variant="body2" fontWeight={600}>{e.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {e.description || <em>—</em>}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {assigned.length === 0
                      ? <Typography variant="caption" color="text.disabled">None assigned</Typography>
                      : <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {assignedPorters.length > 0
                            ? assignedPorters.map(p => (
                                <Chip key={p.id} size="small" avatar={
                                  <Avatar sx={{ bgcolor: '#7c3aed !important', fontSize: '0.6rem !important' }}>
                                    {(p.firstName?.[0] ?? p.id[0]).toUpperCase()}
                                  </Avatar>
                                } label={p.firstName ? `${p.firstName} ${p.lastName ?? ''}`.trim() : p.id}
                                sx={{ fontSize: '0.7rem' }} />
                              ))
                            : assigned.map(uid => (
                                <Chip key={uid} size="small" label={uid} sx={{ fontSize: '0.7rem' }} />
                              ))
                          }
                        </Box>
                    }
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Assign gatekeepers">
                      <IconButton size="small" color="primary" onClick={() => setAssignTarget(e)}>
                        <PersonPinIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(e)}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(e)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editTarget ? `Edit Entrance — ${editTarget.name}` : 'New Entrance'}
          <IconButton onClick={() => setDialogOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {formErrors.submit && <Alert severity="error" sx={{ mb: 2 }}>{formErrors.submit}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Name *" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              error={!!formErrors.name} helperText={formErrors.name} fullWidth size="small" autoFocus />
            <TextField label="Description" value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              fullWidth size="small" multiline rows={3} placeholder="Optional description…" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : editTarget ? 'Save Changes' : 'Create Entrance'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Gatekeepers Dialog */}
      <AssignGatekeepersDialog
        open={Boolean(assignTarget)} entrance={assignTarget}
        porters={porters} auth={auth}
        onClose={() => setAssignTarget(null)} onSaved={load} />

      {/* Delete Confirm */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title={`Delete entrance "${deleteTarget?.name}"?`}
        description="This will permanently remove this entrance and all gatekeeper assignments."
        onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
    </Box>
  )
}

// ─── All-users daily chart ────────────────────────────────────────────────────
function AllUsersChartTab({ tasksByUser, users, loading }) {
  const chartData = buildDailyChartData(tasksByUser)
  const userIds   = Object.keys(tasksByUser)
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
  if (chartData.length === 0)
    return <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No task history available yet.</Typography>
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2 }}>Tasks Completed Per Day — All Users</Typography>
      <Box sx={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 24, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <ReTooltip /><Legend />
            {userIds.map((uid, i) => {
              const u = users.find(x => x.id === uid)
              return (
                <Bar key={uid} dataKey={uid} name={u ? u.firstName ?? uid : uid}
                  fill={BAR_COLORS[i % BAR_COLORS.length]} radius={[4, 4, 0, 0]} stackId="a" />
              )
            })}
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { auth } = useAuth()

  const [activeTab, setActiveTab]     = useState(0)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [lastRefresh, setLastRefresh] = useState(null)

  const [activeTasks, setActiveTasks]       = useState([])
  const [activeTaskVars, setActiveTaskVars] = useState({})
  const [history, setHistory]               = useState([])
  const [historyVars, setHistoryVars]       = useState({})
  const [users, setUsers]                   = useState([])
  const [groups, setGroups]                 = useState([])
  const [groupMembers, setGroupMembers]     = useState({})
  const [usersLoaded, setUsersLoaded]       = useState(false)
  const [tasksByUser, setTasksByUser]       = useState({})
  const [loadingUserTasks, setLoadingUserTasks] = useState(false)

  // Dialogs
  const [historyDialogUser, setHistoryDialogUser] = useState(null)
  const [userDialogOpen, setUserDialogOpen]       = useState(false)
  const [editingUser, setEditingUser]             = useState(null)
  const [deletingUser, setDeletingUser]           = useState(null)
  const [groupDialogOpen, setGroupDialogOpen]     = useState(false)
  const [deletingGroup, setDeletingGroup]         = useState(null)

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
        setUsers(userList); setGroups(groupList)
        const mMap = {}
        await Promise.all(groupList.map(async g => {
          try { mMap[g.id] = await getGroupMembers(auth, g.id) } catch { mMap[g.id] = [] }
        }))
        setGroupMembers(mMap); setUsersLoaded(true)
        setLoadingUserTasks(true)
        const tMap = {}
        await Promise.all(userList.map(async u => {
          try { tMap[u.id] = await getHistoricTasksByAssignee(auth, u.id) } catch { tMap[u.id] = [] }
        }))
        setTasksByUser(tMap); setLoadingUserTasks(false)
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

  const refreshUsers = async () => {
    setUsersLoaded(false)
    await load()
  }

  const handleDeleteUser = async () => {
    try {
      await deleteUser(auth, deletingUser.id)
      setDeletingUser(null); refreshUsers()
    } catch (e) { setError('Failed to delete user: ' + e.message) }
  }

  const handleDeleteGroup = async () => {
    try {
      await deleteGroup(auth, deletingGroup.id)
      setDeletingGroup(null); refreshUsers()
    } catch (e) { setError('Failed to delete group: ' + e.message) }
  }

  const stepCounts = Object.fromEntries(FLOW_STEPS.map(s => [s.id, 0]))
  activeTasks.forEach(t => {
    const idx = TASK_KEY_TO_STEP[t.taskDefinitionKey]
    if (idx !== undefined) stepCounts[FLOW_STEPS[idx].id]++
  })

  const today = new Date().toDateString()
  const completedToday = history.filter(p =>
    p.state === 'COMPLETED' && historyVars[p.id]?.checkedIn &&
    p.endTime && new Date(p.endTime).toDateString() === today).length
  const refusedToday = history.filter(p =>
    p.state === 'COMPLETED' && !historyVars[p.id]?.checkedIn &&
    p.endTime && new Date(p.endTime).toDateString() === today).length

  const activeProcs = activeTasks.map(t => ({
    processInstanceId: t.processInstanceId,
    visitorName: activeTaskVars[t.processInstanceId]?.VName,
    visitDate:   activeTaskVars[t.processInstanceId]?.VDate,
    taskName:    t.name, taskKey: t.taskDefinitionKey, startedAt: t.created,
  }))

  return (
    <Layout title="">
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">Admin Overview</Typography>
          <Typography variant="body2" color="text.secondary">
            {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()} · auto-refreshes every 15s` : 'Loading…'}
          </Typography>
        </Box>
        <Tooltip title="Refresh now"><span>
          <IconButton onClick={load} disabled={loading}>
            <RefreshIcon sx={{
              animation: loading ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
            }} />
          </IconButton>
        </span></Tooltip>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}
      {error   && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard label="Active Processes" value={activeTasks.length}
            icon={<PlayCircleOutlineIcon />}  color="#2563eb" loading={loading && activeTasks.length === 0} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Checked In Today"  value={completedToday}
            icon={<CheckCircleOutlineIcon />} color="#059669" loading={loading && history.length === 0} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Refused Today"     value={refusedToday}
            icon={<CancelOutlinedIcon />}     color="#dc2626" loading={loading && history.length === 0} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Total Users"       value={users.length}
            icon={<PeopleIcon />}             color="#7c3aed" loading={loading && users.length === 0} />
        </Grid>
      </Grid>

      {/* Stage breakdown */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>Active Processes — by Stage</Typography>
          <Grid container spacing={1}>
            {FLOW_STEPS.map(step => (
              <Grid item xs={6} sm={3} key={step.id}>
                <Box sx={{ p: 1.5, borderRadius: 2, textAlign: 'center',
                           bgcolor: `${step.color}12`, border: '1px solid', borderColor: `${step.color}30` }}>
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
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}
          sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}
          variant="scrollable">
          <Tab icon={<AssignmentIcon />}        iconPosition="start" label={`Active (${activeProcs.length})`} />
          <Tab icon={<CheckCircleOutlineIcon />} iconPosition="start" label={`History (${history.length})`} />
          <Tab icon={<PeopleIcon />}             iconPosition="start" label={`Users (${users.length})`} />
          <Tab icon={<BarChartIcon />}           iconPosition="start" label="Daily Chart" />
          <Tab icon={<GroupsIcon />}             iconPosition="start" label={`Groups (${groups.length})`} />
          <Tab icon={<MeetingRoomIcon />}        iconPosition="start" label="Entrances" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {/* Active processes */}
          {activeTab === 0 && (
            activeProcs.length === 0
              ? <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No active processes.</Typography>
              : <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead><TableRow>
                      <TableCell><strong>Visitor</strong></TableCell>
                      <TableCell><strong>Current Task</strong></TableCell>
                      <TableCell><strong>Flow Position</strong></TableCell>
                      <TableCell><strong>Started</strong></TableCell>
                    </TableRow></TableHead>
                    <TableBody>{activeProcs.map(p => <ActiveProcessRow key={p.processInstanceId} p={p} />)}</TableBody>
                  </Table>
                </Box>
          )}

          {/* History */}
          {activeTab === 1 && (
            history.length === 0
              ? <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No history found.</Typography>
              : <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead><TableRow>
                      <TableCell><strong>Visitor</strong></TableCell>
                      <TableCell><strong>Outcome</strong></TableCell>
                      <TableCell><strong>Flow</strong></TableCell>
                      <TableCell><strong>Started</strong></TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                      {history.map(p => <HistoricProcessRow key={p.id} proc={p} vars={historyVars[p.id] ?? {}} />)}
                    </TableBody>
                  </Table>
                </Box>
          )}

          {/* Users */}
          {activeTab === 2 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
                <Button variant="outlined" size="small" startIcon={<PersonAddIcon />}
                  onClick={() => { setEditingUser(null); setUserDialogOpen(true) }}>
                  New User
                </Button>
              </Box>
              <UsersTab
                users={users} groupMembers={groupMembers}
                tasksByUser={tasksByUser} loadingUserTasks={loadingUserTasks}
                onOpenHistory={u => setHistoryDialogUser(u)}
                onEdit={u => { setEditingUser(u); setUserDialogOpen(true) }}
                onDelete={u => setDeletingUser(u)} />
            </Box>
          )}

          {/* Daily Chart */}
          {activeTab === 3 && (
            <AllUsersChartTab tasksByUser={tasksByUser} users={users} loading={loadingUserTasks} />
          )}

          {/* Groups */}
          {activeTab === 4 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="outlined" size="small" startIcon={<GroupAddIcon />}
                  onClick={() => setGroupDialogOpen(true)}>
                  New Group
                </Button>
              </Box>
              <GroupsTab groups={groups} groupMembers={groupMembers} auth={auth}
                onDelete={g => setDeletingGroup(g)} onRefresh={refreshUsers} />
            </Box>
          )}

          {/* Entrances */}
          {activeTab === 5 && <EntrancesTab auth={auth} porters={groupMembers['Porters'] ?? []} />}
        </Box>
      </Card>

      {/* Dialogs */}
      <UserHistoryDialog
        user={historyDialogUser} tasks={historyDialogUser ? (tasksByUser[historyDialogUser.id] ?? []) : []}
        open={Boolean(historyDialogUser)} onClose={() => setHistoryDialogUser(null)} />

      <UserDialog
        open={userDialogOpen} user={editingUser} groups={groups} auth={auth}
        onClose={() => setUserDialogOpen(false)} onSaved={refreshUsers} />

      <GroupDialog
        open={groupDialogOpen} users={users} auth={auth}
        onClose={() => setGroupDialogOpen(false)} onSaved={refreshUsers} />

      <ConfirmDeleteDialog
        open={Boolean(deletingUser)}
        title={`Delete user "${deletingUser?.id}"?`}
        description={`This will permanently delete ${deletingUser?.firstName} ${deletingUser?.lastName} and all their group memberships.`}
        onConfirm={handleDeleteUser} onClose={() => setDeletingUser(null)} />

      <ConfirmDeleteDialog
        open={Boolean(deletingGroup)}
        title={`Delete group "${deletingGroup?.id}"?`}
        description="This will permanently delete the group and remove all its memberships."
        onConfirm={handleDeleteGroup} onClose={() => setDeletingGroup(null)} />
    </Layout>
  )
}

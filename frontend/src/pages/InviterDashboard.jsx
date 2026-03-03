import React, { useState, useCallback } from 'react'
import {
  Box, Button, Grid, Typography, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Tooltip,
} from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import PersonAddAltIcon     from '@mui/icons-material/PersonAddAlt1'
import RefreshIcon          from '@mui/icons-material/Refresh'
import { DatePicker }       from '@mui/x-date-pickers'
import dayjs                from 'dayjs'
import Layout               from '../components/Layout'
import TaskCard, { TaskCardSkeleton } from '../components/TaskCard'
import ProcessFlowViz       from '../components/ProcessFlowViz'
import { useAuth }          from '../context/AuthContext'
import { useTaskSSE }       from '../hooks/useTaskSSE'
import {
  startProcess, getTasksByAssignee, getTasksByGroup,
  getProcessVariables, completeTask,
} from '../api/operatonApi'

export default function InviterDashboard() {
  const { auth } = useAuth()

  const [inviteTasks, setInviteTasks]   = useState([])
  const [taskVars, setTaskVars]         = useState({})
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [lastRefresh, setLastRefresh]   = useState(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTask, setActiveTask] = useState(null)
  const [vName, setVName]           = useState('')
  const [vDate, setVDate]           = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')

  const loadTasks = useCallback(async () => {
    setError('')
    try {
      const [assigned, candidate] = await Promise.all([
        getTasksByAssignee(auth),
        getTasksByGroup(auth, 'Invitors'),
      ])
      const allTasks = [...assigned]
      for (const t of candidate) {
        if (!allTasks.find(x => x.id === t.id)) allTasks.push(t)
      }
      const inviteOnly = allTasks.filter(t => t.taskDefinitionKey === 'Activity_0fze1aq')
      setInviteTasks(inviteOnly)

      const vars = {}
      await Promise.all(inviteOnly.map(async t => {
        try { vars[t.id] = await getProcessVariables(auth, t.processInstanceId) }
        catch { vars[t.id] = {} }
      }))
      setTaskVars(vars)
      setLastRefresh(new Date())
    } catch (e) {
      setError('Failed to load: ' + (e.message ?? 'unknown'))
    } finally {
      setLoadingTasks(false)
    }
  }, [auth])

  // SSE subscription – server pushes whenever any task in the process changes
  useTaskSSE(loadTasks)

  const handleStartProcess = async () => {
    setSubmitting(true); setError('')
    try {
      await startProcess(auth)
    } catch (e) {
      setError('Failed to start: ' + (e.response?.data?.message ?? e.message))
    } finally { setSubmitting(false) }
    // SSE will trigger reload automatically
  }

  const handleOpenInvite = (task, vars) => {
    setActiveTask(task)
    setVName(vars?.VName ?? '')
    setVDate(vars?.VDate ? dayjs(vars.VDate) : null)
    setError('')
    setDialogOpen(true)
  }

  const handleSubmitInvite = async () => {
    if (!vName.trim()) { setError('Visitor name is required.'); return }
    if (!vDate)        { setError('Visit date is required.');   return }
    setSubmitting(true); setError('')
    try {
      await completeTask(auth, activeTask.id, {
        VName: vName.trim(),
        VDate: vDate.toISOString().split('T')[0],
      })
      setDialogOpen(false)
      // SSE will trigger reload automatically
    } catch (e) {
      setError('Failed to submit: ' + (e.response?.data?.message ?? e.message))
    } finally { setSubmitting(false) }
  }

  return (
    <Layout>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Action bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">Pending Invitations</Typography>
          <Typography variant="body2" color="text.secondary">
            {lastRefresh
              ? `Live \u2022 updated ${lastRefresh.toLocaleTimeString()}`
              : 'Connecting to live updates\u2026'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh now">
            <span>
              <Button variant="outlined" size="small" onClick={loadTasks} disabled={loadingTasks}>
                <RefreshIcon fontSize="small" />
              </Button>
            </span>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <AddCircleOutlineIcon />}
            onClick={handleStartProcess}
            disabled={submitting}
          >
            New Invitation
          </Button>
        </Box>
      </Box>

      <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
        Pending — Fill Invitation Form ({inviteTasks.length})
      </Typography>

      {loadingTasks ? (
        <Grid container spacing={2}>
          {[1, 2].map(i => <Grid item xs={12} sm={6} md={4} key={i}><TaskCardSkeleton /></Grid>)}
        </Grid>
      ) : inviteTasks.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', borderRadius: 2, border: '2px dashed', borderColor: 'divider' }}>
          <PersonAddAltIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No pending forms. Start a new invitation above.</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {inviteTasks.map(task => (
            <Grid item xs={12} sm={6} md={4} key={task.id}>
              <TaskCard
                task={task}
                variables={taskVars[task.id] ?? {}}
                onAction={handleOpenInvite}
                actionLabel="Fill Invitation Form"
                loading={!taskVars[task.id]}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Invite form dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAddAltIcon color="primary" /> Fill Invitation Details
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Provide visitor details. The invitation will proceed through security automatically.
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 3 }}>
            <TextField label="Visitor Name" value={vName}
              onChange={e => setVName(e.target.value)} fullWidth required autoFocus />
            <DatePicker label="Planned Visit Date" value={vDate} onChange={setVDate}
              slotProps={{ textField: { fullWidth: true, required: true } }} />
          </Box>
          <ProcessFlowViz
            currentTaskKey={activeTask?.taskDefinitionKey}
            outcome="active"
            visitorName={vName || undefined}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitInvite} disabled={submitting}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Submit Invitation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}

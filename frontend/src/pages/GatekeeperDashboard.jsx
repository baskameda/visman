import React, { useState, useCallback } from 'react'
import {
  Box, Grid, Typography, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Tooltip,
} from '@mui/material'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import RefreshIcon     from '@mui/icons-material/Refresh'
import { DatePicker }  from '@mui/x-date-pickers'
import dayjs           from 'dayjs'
import Layout          from '../components/Layout'
import TaskCard, { TaskCardSkeleton } from '../components/TaskCard'
import ProcessFlowViz  from '../components/ProcessFlowViz'
import { useAuth }     from '../context/AuthContext'
import { useTaskSSE } from '../hooks/useTaskSSE'
import { getTasksByGroup, getProcessVariables, completeTask, claimTask } from '../api/operatonApi'

export default function GatekeeperDashboard() {
  const { auth } = useAuth()

  const [tasks, setTasks]         = useState([])
  const [taskVars, setTaskVars]   = useState({})
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [lastRefresh, setLastRefresh] = useState(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTask, setActiveTask] = useState(null)
  const [avDate, setAvDate]         = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const loadTasks = useCallback(async () => {
    setError('')
    try {
      const all  = await getTasksByGroup(auth, 'Porters')
      setTasks(all)
      const vars = {}
      await Promise.all(all.map(async t => {
        try { vars[t.id] = await getProcessVariables(auth, t.processInstanceId) }
        catch { vars[t.id] = {} }
      }))
      setTaskVars(vars)
      setLastRefresh(new Date())
    } catch (e) {
      setError('Failed to load: ' + (e.message ?? 'unknown'))
    } finally { setLoading(false) }
  }, [auth])

  useTaskSSE(loadTasks)

  const handleOpenDialog = async (task, vars) => {
    try { await claimTask(auth, task.id) } catch { /* already claimed */ }
    setActiveTask(task)
    setAvDate(vars?.VDate ? dayjs(vars.VDate) : dayjs())
    setError('')
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!avDate) { setError('Please select the actual visit date.'); return }
    setSubmitting(true); setError('')
    try {
      await completeTask(auth, activeTask.id, { AVDate: avDate.toISOString().split('T')[0] })
      setDialogOpen(false)
      await loadTasks()
    } catch (e) {
      setError('Failed to submit: ' + (e.response?.data?.message ?? e.message))
    } finally { setSubmitting(false) }
  }

  const activeVars = activeTask ? (taskVars[activeTask.id] ?? {}) : {}

  return (
    <Layout title="">
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">Gatekeeper Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()} · auto-refreshes every 10s` : 'Loading…'}
          </Typography>
        </Box>
        <Tooltip title="Refresh now">
          <span>
            <Button variant="outlined" size="small" onClick={loadTasks} disabled={loading}>
              <RefreshIcon fontSize="small" />
            </Button>
          </span>
        </Tooltip>
      </Box>

      <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
        Visitors Awaiting Entry ({tasks.length})
      </Typography>

      {loading ? (
        <Grid container spacing={2}>
          {[1,2].map(i => <Grid item xs={12} sm={6} md={4} key={i}><TaskCardSkeleton /></Grid>)}
        </Grid>
      ) : tasks.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', borderRadius: 2,
                   border: '2px dashed', borderColor: 'divider' }}>
          <MeetingRoomIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No visitors awaiting entry.</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {tasks.map(task => (
            <Grid item xs={12} sm={6} md={4} key={task.id}>
              <TaskCard
                task={task}
                variables={taskVars[task.id] ?? {}}
                onAction={handleOpenDialog}
                actionLabel="Allow Entry"
                loading={!taskVars[task.id]}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Allow Visit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MeetingRoomIcon color="success" />
            Allow Entry — {activeVars.VName ?? 'Visitor'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <ProcessFlowViz
              currentTaskKey={activeTask?.taskDefinitionKey}
              outcome="active"
              visitorName={activeVars.VName}
            />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Reliability score: <strong>{activeVars.reliability ?? '—'}</strong>
            &nbsp;·&nbsp; Planned date: <strong>
              {activeVars.VDate ? new Date(activeVars.VDate).toLocaleDateString() : '—'}
            </strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Confirm the visitor's actual arrival date to complete check-in.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <DatePicker
            label="Actual Visit Date" value={avDate} onChange={setAvDate}
            slotProps={{ textField: { fullWidth: true, required: true } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Confirm Check-In'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}

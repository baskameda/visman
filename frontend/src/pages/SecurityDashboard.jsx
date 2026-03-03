import React, { useState, useCallback } from 'react'
import {
  Box, Grid, Typography, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Slider, TextField, Chip, Tooltip,
} from '@mui/material'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import RefreshIcon      from '@mui/icons-material/Refresh'
import Layout           from '../components/Layout'
import TaskCard, { TaskCardSkeleton } from '../components/TaskCard'
import ProcessFlowViz   from '../components/ProcessFlowViz'
import { useAuth }      from '../context/AuthContext'
import { useTaskSSE } from '../hooks/useTaskSSE'
import { getTasksByGroup, getProcessVariables, completeTask, claimTask } from '../api/operatonApi'

export default function SecurityDashboard() {
  const { auth } = useAuth()

  const [tasks, setTasks]         = useState([])
  const [taskVars, setTaskVars]   = useState({})
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [lastRefresh, setLastRefresh] = useState(null)

  const [dialogOpen, setDialogOpen]   = useState(false)
  const [activeTask, setActiveTask]   = useState(null)
  const [reliability, setReliability] = useState(50)
  const [submitting, setSubmitting]   = useState(false)

  const loadTasks = useCallback(async () => {
    setError('')
    try {
      const all  = await getTasksByGroup(auth, 'Security')
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
    setReliability(Number(vars?.reliability ?? 50))
    setError('')
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    setSubmitting(true); setError('')
    try {
      await completeTask(auth, activeTask.id, { reliability })
      setDialogOpen(false)
      await loadTasks()
    } catch (e) {
      setError('Failed to submit: ' + (e.response?.data?.message ?? e.message))
    } finally { setSubmitting(false) }
  }

  const relColor = v => v > 60 ? 'success' : v > 30 ? 'warning' : 'error'
  const relLabel = v => v > 60 ? 'Low Risk' : v > 30 ? 'Medium Risk' : 'HIGH RISK – Will be refused'
  const activeVars = activeTask ? (taskVars[activeTask.id] ?? {}) : {}

  return (
    <Layout title="">
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">Security Dashboard</Typography>
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
        Pending Security Checks ({tasks.length})
      </Typography>

      {loading ? (
        <Grid container spacing={2}>
          {[1,2,3].map(i => <Grid item xs={12} sm={6} md={4} key={i}><TaskCardSkeleton /></Grid>)}
        </Grid>
      ) : tasks.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', borderRadius: 2,
                   border: '2px dashed', borderColor: 'divider' }}>
          <VerifiedUserIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No pending security checks.</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {tasks.map(task => (
            <Grid item xs={12} sm={6} md={4} key={task.id}>
              <TaskCard
                task={task}
                variables={taskVars[task.id] ?? {}}
                onAction={handleOpenDialog}
                actionLabel="Review & Score"
                loading={!taskVars[task.id]}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Security Review Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VerifiedUserIcon color="warning" />
            Security Review — {activeVars.VName ?? 'Visitor'}
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

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Set the reliability score. A score of <strong>30 or below</strong> will automatically refuse the invitation.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" fontWeight={600}>Reliability Score</Typography>
              <Chip label={`${reliability} — ${relLabel(reliability)}`}
                color={relColor(reliability)} size="small" />
            </Box>
            <Slider
              value={reliability}
              onChange={(_, v) => setReliability(v)}
              min={0} max={100} step={5}
              marks={[
                { value: 0,   label: '0' },
                { value: 30,  label: '30' },
                { value: 100, label: '100' },
              ]}
              color={relColor(reliability)}
            />
            <TextField
              type="number" label="Exact value"
              value={reliability}
              onChange={e => setReliability(Math.min(100, Math.max(0, Number(e.target.value))))}
              inputProps={{ min: 0, max: 100 }}
              size="small" sx={{ mt: 1.5, width: 140 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Submit Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}

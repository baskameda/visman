import React, { useState, useCallback } from 'react'
import {
  Box, Grid, Typography, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Tooltip, Chip, Card, CardContent, LinearProgress,
} from '@mui/material'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import DoorFrontIcon   from '@mui/icons-material/DoorFront'
import RefreshIcon     from '@mui/icons-material/Refresh'
import { DatePicker }  from '@mui/x-date-pickers'
import dayjs           from 'dayjs'
import Layout          from '../components/Layout'
import GatekeeperStatsPanel from '../components/GatekeeperStatsPanel'
import { useGatekeeperStats } from '../hooks/useGatekeeperStats'
import Tx              from '../components/Tx'
import OrgStatsPanel    from '../components/OrgStatsPanel'
import { useOrgStats }  from '../hooks/useOrgStats'
import TaskCard, { TaskCardSkeleton } from '../components/TaskCard'
import ProcessFlowViz  from '../components/ProcessFlowViz'
import { useAuth }     from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useTaskSSE } from '../hooks/useTaskSSE'
import { getTasksByGroup, getProcessVariables, completeTask, claimTask, getMyEntrances } from '../api/operatonApi'

export default function GatekeeperDashboard() {
  const { auth } = useAuth()
  const { t }    = useTranslation()

  const [tasks, setTasks]         = useState([])
  const [taskVars, setTaskVars]   = useState({})
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [lastRefresh, setLastRefresh] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTask, setActiveTask] = useState(null)
  const [avDate, setAvDate]         = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [myEntrances, setMyEntrances] = useState([])
  const [entrancesLoading, setEntrancesLoading] = useState(true)

  const loadTasks = useCallback(async () => {
    setError('')
    try {
      const all  = await getTasksByGroup(auth, 'Porters')
      setTasks(all)
      const vars = {}
      await Promise.all(all.map(async task => {
        try { vars[task.id] = await getProcessVariables(auth, task.processInstanceId) }
        catch { vars[task.id] = {} }
      }))
      setTaskVars(vars)
      setLastRefresh(new Date())
    } catch (e) {
      setError(t('gatekeeper.failedToLoad', { error: e.message ?? 'unknown' }))
    } finally { setLoading(false) }
  }, [auth, t])

  useTaskSSE(loadTasks)
  const { stats: orgStats, loading: orgLoading, refresh: orgRefresh } = useOrgStats(auth)
  const { stats: gkStats, loading: gkLoading, refresh: gkRefresh } = useGatekeeperStats(auth)

  React.useEffect(() => {
    setEntrancesLoading(true)
    getMyEntrances(auth)
      .then(setMyEntrances)
      .catch(() => setMyEntrances([]))
      .finally(() => setEntrancesLoading(false))
  }, [auth])

  const handleOpenDialog = async (task, vars) => {
    try { await claimTask(auth, task.id) } catch { /* already claimed */ }
    setActiveTask(task)
    setAvDate(vars?.VDate ? dayjs(vars.VDate) : dayjs())
    setError('')
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!avDate) { setError(t('gatekeeper.selectDate')); return }
    setSubmitting(true); setError('')
    try {
      await completeTask(auth, activeTask.id, { AVDate: avDate.toISOString().split('T')[0] })
      setDialogOpen(false)
      gkRefresh()
      await loadTasks()
    } catch (e) {
      setError(t('gatekeeper.failedToSubmit', { error: e.response?.data?.message ?? e.message }))
    } finally { setSubmitting(false) }
  }

  const activeVars = activeTask ? (taskVars[activeTask.id] ?? {}) : {}

  return (
    <Layout>
      <OrgStatsPanel stats={orgStats} loading={orgLoading} onRefresh={orgRefresh} isAdmin={auth?.isAlsoAdmin ?? auth?.role === 'ADMIN'} />
      <GatekeeperStatsPanel stats={gkStats} loading={gkLoading} />

      {/* My Entrances */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ pb: '12px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: entrancesLoading ? 1 : myEntrances.length > 0 ? 1.5 : 0 }}>
            <DoorFrontIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2" fontWeight={700}>My Entrances</Typography>
          </Box>
          {entrancesLoading && <LinearProgress sx={{ borderRadius: 1 }} />}
          {!entrancesLoading && myEntrances.length === 0 && (
            <Typography variant="body2" color="text.secondary">No entrances assigned yet.</Typography>
          )}
          {!entrancesLoading && myEntrances.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {myEntrances.map(e => (
                <Chip
                  key={e.id}
                  icon={<MeetingRoomIcon />}
                  label={e.name}
                  title={e.description ?? ''}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5"><Tx k='gatekeeper.title' /></Typography>
          <Typography variant="body2" color="text.secondary">
            {lastRefresh
              ? t('common.liveUpdated', { time: lastRefresh.toLocaleTimeString() })
              : t('common.connecting')}
          </Typography>
        </Box>
        <Tooltip title=<Tx k='common.refreshNow' />>
          <span>
            <Button variant="outlined" size="small" onClick={loadTasks} disabled={loading}>
              <RefreshIcon fontSize="small" />
            </Button>
          </span>
        </Tooltip>
      </Box>

      <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
        {t('gatekeeper.visitorsCount', { count: tasks.length })}
      </Typography>

      {loading ? (
        <Grid container spacing={2}>
          {[1,2].map(i => <Grid item xs={12} sm={6} md={4} key={i}><TaskCardSkeleton /></Grid>)}
        </Grid>
      ) : tasks.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', borderRadius: 2, border: '2px dashed', borderColor: 'divider' }}>
          <MeetingRoomIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary"><Tx k='gatekeeper.emptyState' /></Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {tasks.map(task => (
            <Grid item xs={12} sm={6} md={4} key={task.id}>
              <TaskCard
                task={task}
                variables={taskVars[task.id] ?? {}}
                onAction={handleOpenDialog}
                actionLabel=<Tx k='gatekeeper.actionLabel' />
                loading={!taskVars[task.id]}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MeetingRoomIcon color="success" />
            {t('gatekeeper.dialogTitle', { name: activeVars.VName ?? t('common.visitor') })}
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
            <Tx k='gatekeeper.reliabilityScore' /> <strong>{activeVars.reliability ?? '—'}</strong>
            &nbsp;·&nbsp; <Tx k='gatekeeper.plannedDate' /> <strong>
              {activeVars.VDate ? new Date(activeVars.VDate).toLocaleDateString() : '—'}
            </strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            <Tx k='gatekeeper.confirmDesc' />
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <DatePicker
            label=<Tx k='gatekeeper.actualVisitDate' /> value={avDate} onChange={setAvDate}
            slotProps={{ textField: { fullWidth: true, required: true } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting}><Tx k='common.cancel' /></Button>
          <Button variant="contained" color="success" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : t('gatekeeper.confirmCheckIn')}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}

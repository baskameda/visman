import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  Box, Button, Grid, Typography, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Tooltip, InputAdornment, Divider,
  List, ListItemButton, ListItemText, ListItemAvatar, Avatar,
  Paper, Chip,
} from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import PersonAddAltIcon     from '@mui/icons-material/PersonAddAlt1'
import RefreshIcon          from '@mui/icons-material/Refresh'
import SearchIcon           from '@mui/icons-material/Search'
import PersonIcon           from '@mui/icons-material/Person'
import BusinessIcon         from '@mui/icons-material/Business'
import { DatePicker }       from '@mui/x-date-pickers'
import dayjs                from 'dayjs'
import Layout               from '../components/Layout'
import Tx                   from '../components/Tx'
import TaskCard, { TaskCardSkeleton } from '../components/TaskCard'
import ProcessFlowViz       from '../components/ProcessFlowViz'
import { useAuth }          from '../context/AuthContext'
import { useTaskSSE }       from '../hooks/useTaskSSE'
import { useInviterStats }  from '../hooks/useInviterStats'
import InviterStatsPanel    from '../components/InviterStatsPanel'
import OrgStatsPanel        from '../components/OrgStatsPanel'
import { useOrgStats }      from '../hooks/useOrgStats'
import {
  startProcess, getTasksByAssignee, getTasksByGroup,
  getProcessVariables, completeTask,
  searchVisitors, createVisitor,
} from '../api/operatonApi'

// ── Visitor search + selection panel ─────────────────────────────────────────
function VisitorSearch({ credentials, onSelect }) {
  const [query,    setQuery]   = useState('')
  const [results,  setResults] = useState([])
  const [loading,  setLoading] = useState(false)
  const debounce = useRef(null)

  const doSearch = useCallback(async (q) => {
    setLoading(true)
    try { setResults(await searchVisitors(credentials, q)) }
    catch { setResults([]) }
    finally { setLoading(false) }
  }, [credentials])

  // Load recent on mount
  useEffect(() => { doSearch('') }, [doSearch])

  const handleChange = (e) => {
    const q = e.target.value
    setQuery(q)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => doSearch(q), 300)
  }

  return (
    <Box>
      <TextField
        fullWidth size="small" placeholder="Search your previous visitors…"
        value={query} onChange={handleChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {loading ? <CircularProgress size={16} /> : <SearchIcon fontSize="small" />}
            </InputAdornment>
          ),
        }}
        sx={{ mb: 1 }}
      />
      {results.length > 0 && (
        <Paper variant="outlined" sx={{ maxHeight: 220, overflow: 'auto', borderRadius: 1.5 }}>
          <List dense disablePadding>
            {results.map((v, i) => (
              <React.Fragment key={v.id}>
                {i > 0 && <Divider component="li" />}
                <ListItemButton onClick={() => onSelect(v)} sx={{ py: 0.75 }}>
                  <ListItemAvatar sx={{ minWidth: 36 }}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'primary.main' }}>
                      {v.firstName?.[0]?.toUpperCase() ?? '?'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${v.firstName} ${v.lastName}`}
                    secondary={
                      <Box component="span" sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.25 }}>
                        <Chip icon={<BusinessIcon sx={{ fontSize: '10px !important' }} />}
                          label={v.company} size="small"
                          sx={{ height: 18, fontSize: 11, '& .MuiChip-label': { px: 0.75 } }} />
                        {v.function && (
                          <Chip label={v.function} size="small" variant="outlined"
                            sx={{ height: 18, fontSize: 11, '& .MuiChip-label': { px: 0.75 } }} />
                        )}
                      </Box>
                    }
                    primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }}
                    secondaryTypographyProps={{ component: 'span' }}
                  />
                </ListItemButton>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
      {results.length === 0 && !loading && (
        <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
          No previous visitors found — fill in the details below to create a new one.
        </Typography>
      )}
    </Box>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function InviterDashboard() {
  const { auth } = useAuth()

  const [inviteTasks, setInviteTasks]   = useState([])
  const [taskVars, setTaskVars]         = useState({})
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [lastRefresh, setLastRefresh]   = useState(null)

  const [dialogOpen, setDialogOpen]   = useState(false)
  const [activeTask, setActiveTask]   = useState(null)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')

  // Form state
  const [firstName,   setFirstName]   = useState('')
  const [lastName,    setLastName]    = useState('')
  const [company,     setCompany]     = useState('')
  const [fnRole,      setFnRole]      = useState('')
  const [email,       setEmail]       = useState('')
  const [phone,       setPhone]       = useState('')
  const [description, setDescription] = useState('')
  const [vDate,       setVDate]       = useState(null)
  const [selectedVisitorId, setSelectedVisitorId] = useState(null)

  const loadTasks = useCallback(async () => {
    setError('')
    try {
      const [assigned, candidate] = await Promise.all([
        getTasksByAssignee(auth),
        getTasksByGroup(auth, 'Invitors'),
      ])
      const allTasks   = [...assigned]
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

  const { stats: inviterStats, loading: statsLoading, refresh: refreshStats } = useInviterStats(auth)
  const { stats: orgStats, loading: orgLoading, refresh: orgRefresh }         = useOrgStats(auth)
  useTaskSSE(loadTasks)

  const resetForm = () => {
    setFirstName(''); setLastName(''); setCompany('')
    setFnRole(''); setEmail(''); setPhone(''); setDescription('')
    setVDate(null); setSelectedVisitorId(null)
  }

  const handleStartProcess = async () => {
    setSubmitting(true); setError('')
    try { await startProcess(auth) }
    catch (e) { setError('Failed to start: ' + (e.response?.data?.message ?? e.message)) }
    finally { setSubmitting(false) }
  }

  const handleOpenInvite = (task, vars) => {
    setActiveTask(task)
    setFirstName(vars?.VFirstName ?? '')
    setLastName(vars?.VLastName   ?? '')
    setCompany(vars?.VCompany     ?? '')
    setFnRole(vars?.VFunction     ?? '')
    setEmail(vars?.VEmail         ?? '')
    setPhone(vars?.VPhone         ?? '')
    setDescription(vars?.VDescription ?? '')
    setVDate(vars?.VDate ? dayjs(vars.VDate) : null)
    setSelectedVisitorId(vars?.visitorId ?? null)
    setError('')
    setDialogOpen(true)
  }

  const handleSelectVisitor = (v) => {
    setFirstName(v.firstName)
    setLastName(v.lastName)
    setCompany(v.company)
    setFnRole(v.function   ?? '')
    setEmail(v.email       ?? '')
    setPhone(v.phone       ?? '')
    setDescription(v.description ?? '')
    setSelectedVisitorId(v.id)
  }

  const handleSubmitInvite = async () => {
    if (!firstName.trim()) { setError('First name is required.');  return }
    if (!lastName.trim())  { setError('Last name is required.');   return }
    if (!company.trim())   { setError('Company is required.');     return }
    if (!vDate)            { setError('Visit date is required.');  return }

    setSubmitting(true); setError('')
    try {
      // Persist visitor if not already in registry
      let visitorId = selectedVisitorId
      if (!visitorId) {
        const saved = await createVisitor(auth, {
          firstName: firstName.trim(),
          lastName:  lastName.trim(),
          company:   company.trim(),
          function:  fnRole.trim()       || null,
          email:     email.trim()        || null,
          phone:     phone.trim()        || null,
          description: description.trim() || null,
        })
        visitorId = saved.id
      }

      await completeTask(auth, activeTask.id, {
        visitorId,
        VFirstName:   firstName.trim(),
        VLastName:    lastName.trim(),
        VCompany:     company.trim(),
        VFunction:    fnRole.trim()        || null,
        VEmail:       email.trim()         || null,
        VPhone:       phone.trim()         || null,
        VDescription: description.trim()   || null,
        VName:        `${firstName.trim()} ${lastName.trim()}`,
        VDate:        vDate.toISOString().split('T')[0],
      })
      setDialogOpen(false)
      resetForm()
      refreshStats()
    } catch (e) {
      setError('Failed to submit: ' + (e.response?.data?.message ?? e.message))
    } finally { setSubmitting(false) }
  }

  const visitorName = [firstName, lastName].filter(Boolean).join(' ')

  return (
    <Layout>
      <OrgStatsPanel stats={orgStats} loading={orgLoading} onRefresh={orgRefresh}
        isAdmin={auth?.isAlsoAdmin ?? auth?.role === 'ADMIN'} />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Action bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5"><Tx k="inviter.title" /></Typography>
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
          <Button variant="contained"
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <AddCircleOutlineIcon />}
            onClick={handleStartProcess} disabled={submitting}>
            New Invitation
          </Button>
        </Box>
      </Box>

      <InviterStatsPanel stats={inviterStats} loading={statsLoading} />

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
          <Typography color="text.secondary"><Tx k="inviter.emptyState" /></Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {inviteTasks.map(task => (
            <Grid item xs={12} sm={6} md={4} key={task.id}>
              <TaskCard
                task={task} variables={taskVars[task.id] ?? {}}
                onAction={handleOpenInvite} actionLabel="Fill Invitation Form"
                loading={!taskVars[task.id]}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Invite form dialog */}
      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); resetForm() }}
        maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAddAltIcon color="primary" /> Fill Invitation Details
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

          {/* ── Visitor search ── */}
          <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <SearchIcon fontSize="small" /> Search previous visitors
          </Typography>
          <VisitorSearch credentials={auth} onSelect={handleSelectVisitor} />

          <Divider sx={{ my: 2.5 }}>
            <Typography variant="caption" color="text.secondary">or enter visitor details</Typography>
          </Divider>

          {/* ── Mandatory fields ── */}
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Required
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, mt: 1, mb: 1.5 }}>
            <TextField label="First Name *" value={firstName} onChange={e => setFirstName(e.target.value)}
              fullWidth size="small" autoFocus={!selectedVisitorId} />
            <TextField label="Last Name *" value={lastName} onChange={e => setLastName(e.target.value)}
              fullWidth size="small" />
          </Box>
          <TextField label="Company / Agency *" value={company} onChange={e => setCompany(e.target.value)}
            fullWidth size="small" sx={{ mb: 1.5 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><BusinessIcon fontSize="small" /></InputAdornment> }} />

          <DatePicker label="Planned Visit Date *" value={vDate} onChange={setVDate}
            slotProps={{ textField: { fullWidth: true, size: 'small', required: true } }}
            sx={{ mb: 2 }} />

          {/* ── Optional fields ── */}
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Optional
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, mt: 1, mb: 1.5 }}>
            <TextField label="Function / Role" value={fnRole} onChange={e => setFnRole(e.target.value)}
              fullWidth size="small" />
            <TextField label="Telephone" value={phone} onChange={e => setPhone(e.target.value)}
              fullWidth size="small" type="tel" />
          </Box>
          <TextField label="Email" value={email} onChange={e => setEmail(e.target.value)}
            fullWidth size="small" type="email" sx={{ mb: 1.5 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" /></InputAdornment> }} />
          <TextField label="Description / Notes" value={description} onChange={e => setDescription(e.target.value)}
            fullWidth size="small" multiline rows={2} sx={{ mb: 2 }} />

          <ProcessFlowViz currentTaskKey={activeTask?.taskDefinitionKey} outcome="active"
            visitorName={visitorName || undefined} />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => { setDialogOpen(false); resetForm() }} disabled={submitting}>
            <Tx k="common.cancel" />
          </Button>
          <Button variant="contained" onClick={handleSubmitInvite} disabled={submitting}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Submit Invitation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}

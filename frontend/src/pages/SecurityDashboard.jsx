import React, { useState, useCallback } from 'react'
import {
  Box, Grid, Typography, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Chip, Tooltip, Divider,
  FormControlLabel, Checkbox, Paper, Tab, Tabs,
  Table, TableBody, TableCell, TableHead, TableRow,
  IconButton, Snackbar,
} from '@mui/material'
import VerifiedUserIcon      from '@mui/icons-material/VerifiedUser'
import RefreshIcon           from '@mui/icons-material/Refresh'
import CheckCircleIcon       from '@mui/icons-material/CheckCircle'
import CancelIcon            from '@mui/icons-material/Cancel'
import GppBadIcon            from '@mui/icons-material/GppBad'
import PersonIcon            from '@mui/icons-material/Person'
import BusinessIcon          from '@mui/icons-material/Business'
import WorkIcon              from '@mui/icons-material/Work'
import EmailIcon             from '@mui/icons-material/Email'
import PhoneIcon             from '@mui/icons-material/Phone'
import HowToRegIcon          from '@mui/icons-material/HowToReg'
import QuestionAnswerIcon    from '@mui/icons-material/QuestionAnswer'
import LockOpenIcon          from '@mui/icons-material/LockOpen'
import BlockIcon             from '@mui/icons-material/Block'
import Layout                from '../components/Layout'
import SecurityStatsPanel    from '../components/SecurityStatsPanel'
import { useSecurityStats }  from '../hooks/useSecurityStats'
import OrgStatsPanel         from '../components/OrgStatsPanel'
import { useOrgStats }       from '../hooks/useOrgStats'
import Tx                    from '../components/Tx'
import TaskCard, { TaskCardSkeleton } from '../components/TaskCard'
import ProcessFlowViz        from '../components/ProcessFlowViz'
import { useAuth }           from '../context/AuthContext'
import { useTranslation }    from 'react-i18next'
import { useTaskSSE }        from '../hooks/useTaskSSE'
import {
  getTasksByGroup, getProcessVariables, completeTask, claimTask,
  getBlacklistedVisitors, clearBlacklisted,
} from '../api/operatonApi'

// ── Visitor info row ──────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }) {
  if (!value) return null
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.75 }}>
      <Box sx={{ mt: 0.1, color: 'text.secondary', flexShrink: 0 }}>{icon}</Box>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 90, flexShrink: 0 }}>{label}</Typography>
      <Typography variant="body2" fontWeight={500}>{value}</Typography>
    </Box>
  )
}

// ── Q&A history entry ─────────────────────────────────────────────────────────
function QAEntry({ question, answer, attempt, t }) {
  if (!question) return null
  return (
    <Box sx={{ mb: 1.5, pl: 1, borderLeft: '3px solid', borderColor: 'warning.light' }}>
      <Typography variant="caption" color="text.secondary" fontWeight={700}>
        {t('security.clarificationCount', { count: attempt })}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.25 }}>
        <strong>{t('security.clarificationQ')}</strong> {question}
      </Typography>
      {answer && (
        <Typography variant="body2" color="success.main">
          <strong>{t('security.clarificationA')}</strong> {answer}
        </Typography>
      )}
    </Box>
  )
}

// ── Blacklist management panel ────────────────────────────────────────────────
function BlacklistPanel({ auth, t }) {
  const [visitors, setVisitors] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [toast,    setToast]    = useState('')
  const [toastErr, setToastErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { setVisitors(await getBlacklistedVisitors(auth)) }
    catch { setVisitors([]) }
    finally { setLoading(false) }
  }, [auth])

  React.useEffect(() => { load() }, [load])

  const handleRemove = async (v) => {
    try {
      await clearBlacklisted(auth, v.id)
      setToast(t('security.blacklistRemovedOk'))
      load()
    } catch (e) {
      setToastErr(t('security.blacklistError', { error: e.message }))
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          <Tx k="security.blacklistTitle" />
        </Typography>
        <Button size="small" startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
          Refresh
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={28} /></Box>
      ) : visitors.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', borderRadius: 2, border: '2px dashed', borderColor: 'divider' }}>
          <LockOpenIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary"><Tx k="security.blacklistEmpty" /></Typography>
        </Box>
      ) : (
        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Company</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Added by</strong></TableCell>
                <TableCell align="right"><strong>Action</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visitors.map(v => (
                <TableRow key={v.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <BlockIcon fontSize="small" color="error" />
                      <Typography variant="body2" fontWeight={600}>
                        {v.firstName} {v.lastName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2">{v.company}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{v.email ?? '—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{v.createdBy}</Typography></TableCell>
                  <TableCell align="right">
                    <Tooltip title={t('security.removeBlacklist')}>
                      <IconButton size="small" color="success" onClick={() => handleRemove(v)}>
                        <LockOpenIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Snackbar open={!!toast}    autoHideDuration={3000} onClose={() => setToast('')}
        message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
      <Snackbar open={!!toastErr} autoHideDuration={4000} onClose={() => setToastErr('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => setToastErr('')}>{toastErr}</Alert>
      </Snackbar>
    </Box>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function SecurityDashboard() {
  const { auth } = useAuth()
  const { t }    = useTranslation()

  const [tab,         setTab]         = useState(0)
  const [tasks,       setTasks]       = useState([])
  const [taskVars,    setTaskVars]    = useState({})
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [lastRefresh, setLastRefresh] = useState(null)

  const [dialogOpen,        setDialogOpen]        = useState(false)
  const [activeTask,        setActiveTask]        = useState(null)
  const [identityConfirmed, setIdentityConfirmed] = useState(false)
  const [note,              setNote]              = useState('')
  const [clarQuestion,      setClarQuestion]      = useState('')
  const [submitting,        setSubmitting]        = useState(false)
  const [validationErr,     setValidationErr]     = useState('')

  const loadTasks = useCallback(async () => {
    setError('')
    try {
      const all  = await getTasksByGroup(auth, 'Security')
      setTasks(all)
      const vars = {}
      await Promise.all(all.map(async task => {
        try { vars[task.id] = await getProcessVariables(auth, task.processInstanceId) }
        catch { vars[task.id] = {} }
      }))
      setTaskVars(vars)
      setLastRefresh(new Date())
    } catch (e) {
      setError(t('security.failedToLoad', { error: e.message ?? 'unknown' }))
    } finally { setLoading(false) }
  }, [auth, t])

  useTaskSSE(loadTasks)
  const { stats: orgStats, loading: orgLoading, refresh: orgRefresh } = useOrgStats(auth)
  const { stats: secStats, loading: secLoading, refresh: secRefresh } = useSecurityStats(auth)

  const handleOpenDialog = async (task, vars) => {
    try { await claimTask(auth, task.id) } catch { /* already claimed */ }
    setActiveTask(task)
    setIdentityConfirmed(false)
    setNote('')
    setClarQuestion('')
    setValidationErr('')
    setError('')
    setDialogOpen(true)
  }

  const handleClose = () => {
    setDialogOpen(false)
    setIdentityConfirmed(false)
    setNote('')
    setClarQuestion('')
    setValidationErr('')
  }

  const handleSubmit = async (decision) => {
    if (!identityConfirmed) { setValidationErr(t('security.identityRequired')); return }
    if ((decision === 'REFUSE' || decision === 'BLACKLIST') && !note.trim()) {
      setValidationErr(t('security.noteRequired')); return
    }
    if (decision === 'ASK_INVITER' && !clarQuestion.trim()) {
      setValidationErr(t('security.clarificationQuestionReq')); return
    }
    setValidationErr('')
    setSubmitting(true)
    try {
      await completeTask(auth, activeTask.id, {
        securityDecision:      decision,
        securityNote:          note.trim()        || null,
        blacklisted:           decision === 'BLACKLIST',
        identityConfirmed:     true,
        clarificationQuestion: clarQuestion.trim() || null,
        securityReviewer:      decision === 'ASK_INVITER' ? auth.username : null,
        reliability:           decision === 'APPROVE' ? 70 : 20,
      })
      handleClose()
      secRefresh()
      await loadTasks()
    } catch (e) {
      setError(t('security.failedToSubmit', { error: e.response?.data?.message ?? e.message }))
    } finally { setSubmitting(false) }
  }

  const activeVars    = activeTask ? (taskVars[activeTask.id] ?? {}) : {}
  const visitorName   = [activeVars.VFirstName, activeVars.VLastName].filter(Boolean).join(' ')
                      || activeVars.VName || t('common.visitor')
  const clarCount     = Number(activeVars.clarificationCount ?? 0)
  const remaining     = 5 - clarCount
  const hasHistory    = clarCount > 0 && activeVars.clarificationQuestion

  return (
    <Layout>
      <OrgStatsPanel stats={orgStats} loading={orgLoading} onRefresh={orgRefresh}
        isAdmin={auth?.isAlsoAdmin ?? auth?.role === 'ADMIN'} />
      <SecurityStatsPanel stats={secStats} loading={secLoading} />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* ── Tab bar ── */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Tx k="security.title" />
              {tasks.length > 0 && <Chip label={tasks.length} size="small" color="warning" sx={{ height: 18, fontSize: 11 }} />}
            </Box>
          } />
          <Tab label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <BlockIcon fontSize="small" />
              <Tx k="security.blacklistManage" />
            </Box>
          } />
        </Tabs>
      </Box>

      {/* ── Tab 0: review queue ── */}
      {tab === 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {lastRefresh
                ? <Tx k="common.liveUpdated" vars={{ time: lastRefresh.toLocaleTimeString() }} />
                : <Tx k="common.connecting" />}
            </Typography>
            <Tooltip title={t('common.refreshNow')}>
              <span>
                <Button variant="outlined" size="small" onClick={loadTasks} disabled={loading}>
                  <RefreshIcon fontSize="small" />
                </Button>
              </span>
            </Tooltip>
          </Box>

          <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
            <Tx k="security.pendingCount" vars={{ count: tasks.length }} />
          </Typography>

          {loading ? (
            <Grid container spacing={2}>
              {[1, 2, 3].map(i => <Grid item xs={12} sm={6} md={4} key={i}><TaskCardSkeleton /></Grid>)}
            </Grid>
          ) : tasks.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', borderRadius: 2, border: '2px dashed', borderColor: 'divider' }}>
              <VerifiedUserIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary"><Tx k="security.emptyState" /></Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {tasks.map(task => (
                <Grid item xs={12} sm={6} md={4} key={task.id}>
                  <TaskCard task={task} variables={taskVars[task.id] ?? {}}
                    onAction={handleOpenDialog} actionLabel={t('security.actionLabel')}
                    loading={!taskVars[task.id]} />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* ── Tab 1: blacklist ── */}
      {tab === 1 && <BlacklistPanel auth={auth} t={t} />}

      {/* ════ Review Dialog ════ */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VerifiedUserIcon color="warning" />
            <Tx k="security.dialogTitle" vars={{ name: visitorName }} />
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2 }}>
          <Box sx={{ mb: 2.5 }}>
            <ProcessFlowViz currentTaskKey={activeTask?.taskDefinitionKey}
              outcome="active" visitorName={visitorName} />
          </Box>

          {/* Inviter */}
          {activeVars.starter && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary"
                sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('security.inviterLabel')}
              </Typography>
              <Chip icon={<HowToRegIcon />} label={activeVars.starter}
                size="small" variant="outlined" sx={{ ml: 1 }} />
            </Box>
          )}

          {/* Visitor details */}
          <Typography variant="caption" color="text.secondary"
            sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
            {t('security.visitorDetails')}
          </Typography>
          <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 1.5 }}>
            <InfoRow icon={<PersonIcon   fontSize="small" />} label="Name"    value={visitorName} />
            <InfoRow icon={<BusinessIcon fontSize="small" />} label="Company" value={activeVars.VCompany} />
            <InfoRow icon={<WorkIcon     fontSize="small" />} label="Role"    value={activeVars.VFunction} />
            <InfoRow icon={<EmailIcon    fontSize="small" />} label="Email"   value={activeVars.VEmail} />
            <InfoRow icon={<PhoneIcon    fontSize="small" />} label="Phone"   value={activeVars.VPhone} />
            {activeVars.VDescription && (
              <Box sx={{ mt: 0.75, pl: 4 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  {activeVars.VDescription}
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Clarification history */}
          {hasHistory && (
            <>
              <Typography variant="caption" color="text.secondary"
                sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                {t('security.clarificationHistory')}
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 1.5, bgcolor: 'grey.50' }}>
                <QAEntry
                  question={activeVars.clarificationQuestion}
                  answer={activeVars.clarificationAnswer}
                  attempt={clarCount}
                  t={t}
                />
              </Paper>
            </>
          )}

          {/* Remaining attempts warning */}
          {clarCount > 0 && (
            <Alert severity={remaining <= 1 ? 'error' : remaining <= 2 ? 'warning' : 'info'} sx={{ mb: 2 }}>
              {t('security.clarificationRemaining', { remaining })}
              {' '}
              <strong>{t('security.clarificationCount', { count: clarCount })}</strong>
            </Alert>
          )}

          {/* Identity confirmation */}
          <Paper variant="outlined" sx={{
            p: 1.5, mb: 2, borderRadius: 1.5,
            borderColor: identityConfirmed ? 'success.main' : 'divider',
            bgcolor: identityConfirmed ? 'success.50' : 'background.paper',
            transition: 'all 0.2s',
          }}>
            <FormControlLabel
              control={<Checkbox checked={identityConfirmed}
                onChange={e => setIdentityConfirmed(e.target.checked)} color="success" />}
              label={
                <Typography variant="body2" fontWeight={identityConfirmed ? 700 : 400}>
                  {t('security.identityConfirm')}
                </Typography>
              }
            />
          </Paper>

          {/* Note */}
          <TextField label={t('security.noteLabel')} placeholder={t('security.notePlaceholder')}
            value={note} onChange={e => setNote(e.target.value)}
            fullWidth multiline rows={2} sx={{ mb: 1.5 }} />

          {/* Clarification question (shown inline, expands when needed) */}
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
              <QuestionAnswerIcon fontSize="small" color="warning" />
              <Typography variant="caption" color="text.secondary" fontWeight={700}
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('security.clarificationQuestion')}
              </Typography>
              <Typography variant="caption" color="text.secondary">(for Ask Inviter)</Typography>
            </Box>
            <TextField placeholder={t('security.clarificationQuestion') + '…'}
              value={clarQuestion} onChange={e => setClarQuestion(e.target.value)}
              fullWidth multiline rows={2} size="small" />
          </Box>

          {validationErr && <Alert severity="error" sx={{ mb: 1 }}>{validationErr}</Alert>}
          {error         && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        </DialogContent>

        <DialogActions sx={{ px: 2.5, py: 1.5, gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} disabled={submitting} sx={{ mr: 'auto' }}>
            {t('common.cancel')}
          </Button>

          <Tooltip title={t('security.refuseHint')}>
            <span>
              <Button variant="outlined" color="warning"
                startIcon={submitting ? <CircularProgress size={16} /> : <CancelIcon />}
                onClick={() => handleSubmit('REFUSE')} disabled={submitting}>
                {t('security.btnRefuse')}
              </Button>
            </span>
          </Tooltip>

          <Tooltip title={t('security.blacklistHint')}>
            <span>
              <Button variant="outlined" color="error"
                startIcon={submitting ? <CircularProgress size={16} /> : <GppBadIcon />}
                onClick={() => handleSubmit('BLACKLIST')} disabled={submitting}>
                {t('security.btnBlacklist')}
              </Button>
            </span>
          </Tooltip>

          {remaining > 0 && (
            <Tooltip title={t('security.askInviterHint')}>
              <span>
                <Button variant="outlined" color="info"
                  startIcon={submitting ? <CircularProgress size={16} /> : <QuestionAnswerIcon />}
                  onClick={() => handleSubmit('ASK_INVITER')} disabled={submitting}>
                  {t('security.btnAskInviter')}
                </Button>
              </span>
            </Tooltip>
          )}

          <Tooltip title={t('security.approveHint')}>
            <span>
              <Button variant="contained" color="success"
                startIcon={submitting ? <CircularProgress size={16} /> : <CheckCircleIcon />}
                onClick={() => handleSubmit('APPROVE')} disabled={submitting}>
                {t('security.btnApprove')}
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}

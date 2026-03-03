import React, { useState, useCallback } from 'react'
import {
  Box, Grid, Typography, Alert, Card, CardContent, Chip,
  TextField, InputAdornment, ToggleButton, ToggleButtonGroup,
  Skeleton, Divider,
} from '@mui/material'
import SearchIcon             from '@mui/icons-material/Search'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import BlockIcon              from '@mui/icons-material/Block'
import HourglassEmptyIcon     from '@mui/icons-material/HourglassEmpty'
import Layout                 from '../components/Layout'
import ProcessFlowViz         from '../components/ProcessFlowViz'
import { useAuth }            from '../context/AuthContext'
import { useTaskSSE }         from '../hooks/useTaskSSE'
import { getHistoricProcesses, getHistoricVariables } from '../api/operatonApi'

// ─── Single history card ──────────────────────────────────────────────────────

function HistoryCard({ proc, vars, loading }) {
  if (loading) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="40%" sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2 }} />
        </CardContent>
      </Card>
    )
  }

  const outcome = proc.state === 'COMPLETED'
    ? (vars?.checkedIn ? 'completed' : 'refused')
    : 'active'

  const statusChip = {
    completed: <Chip icon={<CheckCircleOutlineIcon />} label="Checked In" color="success" size="small" />,
    refused:   <Chip icon={<BlockIcon />}              label="Refused"    color="error"   size="small" />,
    active:    <Chip icon={<HourglassEmptyIcon />}     label="In Progress" color="primary" size="small" variant="outlined" />,
  }[outcome]

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {vars?.VName ?? 'Unnamed visitor'}
          </Typography>
          {statusChip}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
          Planned: {vars?.VDate ? new Date(vars.VDate).toLocaleDateString() : '—'}
        </Typography>
        {vars?.AVDate && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
            Actual: {new Date(vars.AVDate).toLocaleDateString()}
          </Typography>
        )}
        {vars?.reliability !== undefined && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
            Reliability:{' '}
            <Chip
              label={vars.reliability}
              size="small"
              color={Number(vars.reliability) > 60 ? 'success' : Number(vars.reliability) > 30 ? 'warning' : 'error'}
              sx={{ height: 18, fontSize: '0.7rem', ml: 0.5 }}
            />
          </Typography>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          Started: {new Date(proc.startTime).toLocaleString()}
          {proc.endTime && <> · Ended: {new Date(proc.endTime).toLocaleString()}</>}
        </Typography>

        <Divider sx={{ mb: 1.5 }} />
        <ProcessFlowViz outcome={outcome} compact />
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvitationHistoryPage() {
  const { auth } = useAuth()

  const [history, setHistory]         = useState([])
  const [historyVars, setHistoryVars] = useState({})
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [lastRefresh, setLastRefresh] = useState(null)

  // Filters
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatus]   = useState('all')

  const loadHistory = useCallback(async () => {
    setError('')
    try {
      const procs = await getHistoricProcesses(auth)
      setHistory(procs)

      // Incrementally load vars only for new processes
      const newIds = procs.filter(p => !historyVars[p.id]).map(p => p.id)
      if (newIds.length > 0) {
        const vMap = {}
        await Promise.all(newIds.map(async id => {
          try { vMap[id] = await getHistoricVariables(auth, id) } catch { vMap[id] = {} }
        }))
        setHistoryVars(prev => ({ ...prev, ...vMap }))
      }

      setLastRefresh(new Date())
    } catch (e) {
      setError('Failed to load history: ' + (e.message ?? 'unknown'))
    } finally {
      setLoading(false)
    }
  }, [auth, historyVars])

  // SSE: updates when a process completes or a new one starts
  useTaskSSE(loadHistory)

  // ── Filter logic ────────────────────────────────────────────────────────────
  const filtered = history.filter(proc => {
    const vars    = historyVars[proc.id] ?? {}
    const name    = (vars.VName ?? '').toLowerCase()
    const matchSearch = !search || name.includes(search.toLowerCase())

    const outcome = proc.state === 'COMPLETED'
      ? (vars.checkedIn ? 'completed' : 'refused')
      : 'active'
    const matchStatus = statusFilter === 'all' || outcome === statusFilter

    return matchSearch && matchStatus
  })

  // ── Counts for filter buttons ────────────────────────────────────────────────
  const counts = history.reduce((acc, proc) => {
    const vars    = historyVars[proc.id] ?? {}
    const outcome = proc.state === 'COMPLETED'
      ? (vars.checkedIn ? 'completed' : 'refused')
      : 'active'
    acc[outcome] = (acc[outcome] ?? 0) + 1
    return acc
  }, {})

  return (
    <Layout>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5">Invitation History</Typography>
          <Typography variant="body2" color="text.secondary">
            {lastRefresh
              ? `Live \u2022 ${history.length} total \u2022 updated ${lastRefresh.toLocaleTimeString()}`
              : 'Loading\u2026'}
          </Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search visitor name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />

        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={(_, v) => v && setStatus(v)}
          size="small"
        >
          <ToggleButton value="all">All ({history.length})</ToggleButton>
          <ToggleButton value="active">In Progress ({counts.active ?? 0})</ToggleButton>
          <ToggleButton value="completed">Checked In ({counts.completed ?? 0})</ToggleButton>
          <ToggleButton value="refused">Refused ({counts.refused ?? 0})</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Cards */}
      {loading ? (
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <HistoryCard loading />
            </Grid>
          ))}
        </Grid>
      ) : filtered.length === 0 ? (
        <Box sx={{ p: 6, textAlign: 'center', border: '2px dashed', borderColor: 'divider', borderRadius: 2 }}>
          <Typography color="text.secondary">
            {search || statusFilter !== 'all' ? 'No invitations match your filters.' : 'No invitation history yet.'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filtered.map(proc => (
            <Grid item xs={12} sm={6} md={4} key={proc.id}>
              <HistoryCard proc={proc} vars={historyVars[proc.id] ?? {}} />
            </Grid>
          ))}
        </Grid>
      )}
    </Layout>
  )
}

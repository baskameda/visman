import React, { useState, useCallback, useMemo } from 'react'
import {
  Box, Typography, Alert, Chip, Divider, MenuItem, Select,
  FormControl, InputLabel, Skeleton, Collapse, Tooltip,
} from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import BlockIcon              from '@mui/icons-material/Block'
import HourglassEmptyIcon     from '@mui/icons-material/HourglassEmpty'
import ExpandMoreIcon         from '@mui/icons-material/ExpandMore'
import ExpandLessIcon         from '@mui/icons-material/ExpandLess'
import PersonOutlineIcon      from '@mui/icons-material/PersonOutline'
import Layout                 from '../components/Layout'
import Tx                     from '../components/Tx'
import ProcessFlowViz         from '../components/ProcessFlowViz'
import { useAuth }            from '../context/AuthContext'
import { useTaskSSE }         from '../hooks/useTaskSSE'
import { useTranslation }     from 'react-i18next'
import { getHistoricProcesses, getHistoricVariables } from '../api/operatonApi'

// ── helpers ───────────────────────────────────────────────────────────────────
function outcome(proc, vars) {
  if (proc.state !== 'COMPLETED') return 'active'
  return vars?.checkedIn ? 'completed' : 'refused'
}

function dayKey(isoStr) {
  return isoStr ? isoStr.slice(0, 10) : '0000-00-00'
}

function fmtDay(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmtMonthOption(ym) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

const STATUS_COLORS = { completed: 'success', refused: 'error', active: 'primary' }
const STATUS_ICONS  = {
  completed: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />,
  refused:   <BlockIcon              sx={{ fontSize: 14 }} />,
  active:    <HourglassEmptyIcon     sx={{ fontSize: 14 }} />,
}
const STATUS_KEYS = {
  completed: 'history.statusCheckedIn',
  refused:   'history.statusRefused',
  active:    'history.statusInProgress',
}
const REL_COLOR = r => Number(r) > 60 ? 'success' : Number(r) > 30 ? 'warning' : 'error'

// ── expanded detail card ───────────────────────────────────────────────────────
function DetailCard({ proc, vars }) {
  const { t }   = useTranslation()
  const out     = outcome(proc, vars)
  return (
    <Box sx={{ px: 2, pb: 2, pt: 0.5, background: '#fafafa', borderTop: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 1.5, mt: 1 }}>
        {[
          ['history.planned',     vars?.VDate  ? new Date(vars.VDate ).toLocaleDateString() : '—'],
          vars?.AVDate ? ['history.actual', new Date(vars.AVDate).toLocaleDateString()] : null,
          vars?.reliability !== undefined ? ['history.reliability', vars.reliability, true] : null,
        ].filter(Boolean).map(([k, v, isRel]) => (
          <Box key={k}>
            <Typography variant='caption' color='text.secondary' display='block'><Tx k={k} /></Typography>
            {isRel
              ? <Chip label={v} size='small' color={REL_COLOR(v)} sx={{ height: 18, fontSize: '0.7rem' }} />
              : <Typography variant='body2' fontWeight={600}>{v}</Typography>
            }
          </Box>
        ))}
        <Box>
          <Typography variant='caption' color='text.secondary' display='block'><Tx k='history.started' /></Typography>
          <Typography variant='body2' fontWeight={600}>{new Date(proc.startTime).toLocaleTimeString()}</Typography>
        </Box>
        {proc.endTime && (
          <Box>
            <Typography variant='caption' color='text.secondary' display='block'><Tx k='history.ended' /></Typography>
            <Typography variant='body2' fontWeight={600}>{new Date(proc.endTime).toLocaleTimeString()}</Typography>
          </Box>
        )}
      </Box>
      <ProcessFlowViz outcome={out} compact />
    </Box>
  )
}

// ── single list row ───────────────────────────────────────────────────────────
function HistoryRow({ proc, vars, open, onToggle }) {
  const { t } = useTranslation()
  const out   = outcome(proc, vars)

  return (
    <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}>
      <Box
        onClick={onToggle}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25,
          cursor: 'pointer', userSelect: 'none',
          background: open ? '#f0f5ff' : 'transparent',
          transition: 'background 0.15s',
          '&:hover': { background: open ? '#e6eeff' : '#f5f5f5' },
        }}
      >
        <PersonOutlineIcon sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />
        <Typography variant='body2' fontWeight={600} sx={{ flex: 1, minWidth: 0 }}>
          {vars?.VName ?? t('history.unnamedVisitor')}
        </Typography>
        <Chip
          icon={STATUS_ICONS[out]}
          label={<Tx k={STATUS_KEYS[out]} />}
          color={STATUS_COLORS[out]}
          size='small'
          variant={out === 'active' ? 'outlined' : 'filled'}
          sx={{ flexShrink: 0 }}
        />
        {open ? <ExpandLessIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
               : <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />}
      </Box>
      <Collapse in={open} unmountOnExit>
        <DetailCard proc={proc} vars={vars} />
      </Collapse>
    </Box>
  )
}

// ── day group ─────────────────────────────────────────────────────────────────
function DayGroup({ day, procs, historyVars, openId, onToggle }) {
  return (
    <Box sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 0.75, background: '#f5f5f5', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant='caption' fontWeight={700} color='text.secondary'
          sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>
          {fmtDay(day)}
        </Typography>
        <Typography component='span' variant='caption' color='text.disabled' sx={{ ml: 1 }}>
          {procs.length} {procs.length === 1 ? 'visit' : 'visits'}
        </Typography>
      </Box>
      {procs.map(proc => (
        <HistoryRow
          key={proc.id}
          proc={proc}
          vars={historyVars[proc.id] ?? {}}
          open={openId === proc.id}
          onToggle={() => onToggle(proc.id)}
        />
      ))}
    </Box>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function InvitationHistoryPage() {
  const { auth } = useAuth()
  const { t }    = useTranslation()

  const [history,     setHistory]     = useState([])
  const [historyVars, setHistoryVars] = useState({})
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [lastRefresh, setLastRefresh] = useState(null)
  const [monthFilter, setMonthFilter] = useState('all')
  const [statusFilter, setStatus]     = useState('all')
  const [openId,      setOpenId]      = useState(null)

  const loadHistory = useCallback(async () => {
    setError('')
    try {
      const procs  = await getHistoricProcesses(auth)
      setHistory(procs)
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
      setError(t('history.failedToLoad', { error: e.message ?? 'unknown' }))
    } finally { setLoading(false) }
  }, [auth, historyVars, t])

  useTaskSSE(loadHistory)

  // Available months derived from data
  const availableMonths = useMemo(() => {
    const set = new Set(history.map(p => dayKey(p.startTime).slice(0, 7)))
    return [...set].sort().reverse()
  }, [history])

  // Filter + group
  const grouped = useMemo(() => {
    const filtered = history.filter(proc => {
      const vars  = historyVars[proc.id] ?? {}
      const out   = outcome(proc, vars)
      const ym    = dayKey(proc.startTime).slice(0, 7)
      return (monthFilter === 'all' || ym === monthFilter)
          && (statusFilter === 'all' || out === statusFilter)
    })
    // sort newest first within each day
    filtered.sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
    // group by day
    const map = {}
    for (const proc of filtered) {
      const d = dayKey(proc.startTime)
      if (!map[d]) map[d] = []
      map[d].push(proc)
    }
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
  }, [history, historyVars, monthFilter, statusFilter])

  const counts = useMemo(() => history.reduce((acc, proc) => {
    const out = outcome(proc, historyVars[proc.id] ?? {})
    acc[out] = (acc[out] ?? 0) + 1
    return acc
  }, {}), [history, historyVars])

  const handleToggle = id => setOpenId(prev => prev === id ? null : id)

  return (
    <Layout>
      {error && <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant='h5'><Tx k='history.title' /></Typography>
          <Typography variant='body2' color='text.secondary'>
            {lastRefresh ? t('history.liveCount', { count: history.length, time: lastRefresh.toLocaleTimeString() }) : t('common.loading')}
          </Typography>
        </Box>
        {/* Status chips */}
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            ['all', t('history.filterAll', { count: history.length }), 'default'],
            ['active', t('history.filterInProgress', { count: counts.active ?? 0 }), 'primary'],
            ['completed', t('history.filterCheckedIn', { count: counts.completed ?? 0 }), 'success'],
            ['refused', t('history.filterRefused', { count: counts.refused ?? 0 }), 'error'],
          ].map(([val, label, color]) => (
            <Chip key={val} label={label} size='small'
              color={statusFilter === val ? color : 'default'}
              variant={statusFilter === val ? 'filled' : 'outlined'}
              onClick={() => { setStatus(val); setOpenId(null) }}
              sx={{ cursor: 'pointer', fontWeight: statusFilter === val ? 700 : 400 }}
            />
          ))}
        </Box>
      </Box>

      {/* Month filter */}
      <Box sx={{ mb: 3 }}>
        <FormControl size='small' sx={{ minWidth: 220 }}>
          <InputLabel><Tx k='history.monthFilter' /></InputLabel>
          <Select value={monthFilter} label={<Tx k='history.monthFilter' />}
            onChange={e => { setMonthFilter(e.target.value); setOpenId(null) }}>
            <MenuItem value='all'><Tx k='history.allTime' /></MenuItem>
            {availableMonths.map(ym => (
              <MenuItem key={ym} value={ym}>{fmtMonthOption(ym)}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* List */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[1,2,3].map(i => (
            <Box key={i} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
              <Skeleton variant='rectangular' height={36} />
              {[1,2].map(j => <Skeleton key={j} variant='rectangular' height={44} sx={{ mt: '1px' }} />)}
            </Box>
          ))}
        </Box>
      ) : grouped.length === 0 ? (
        <Box sx={{ p: 6, textAlign: 'center', border: '2px dashed', borderColor: 'divider', borderRadius: 2 }}>
          <Typography color='text.secondary'>
            {monthFilter !== 'all' || statusFilter !== 'all' ? t('history.noMatch') : t('history.noHistory')}
          </Typography>
        </Box>
      ) : grouped.map(([day, procs]) => (
        <DayGroup key={day} day={day} procs={procs}
          historyVars={historyVars} openId={openId} onToggle={handleToggle} />
      ))}
    </Layout>
  )
}

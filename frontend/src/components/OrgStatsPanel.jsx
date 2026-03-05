import React, { useState } from 'react'
import {
  Box, Typography, Skeleton, Paper, Tooltip,
  LinearProgress, Chip, Collapse, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField,
} from '@mui/material'
import SpeedIcon           from '@mui/icons-material/Speed'
import CalendarMonthIcon   from '@mui/icons-material/CalendarMonth'
import EmojiEventsIcon     from '@mui/icons-material/EmojiEvents'
import FlagIcon            from '@mui/icons-material/Flag'
import ExpandMoreIcon      from '@mui/icons-material/ExpandMore'
import ExpandLessIcon      from '@mui/icons-material/ExpandLess'
import SettingsIcon        from '@mui/icons-material/Settings'
import TrendingUpIcon      from '@mui/icons-material/TrendingUp'
import TrendingDownIcon    from '@mui/icons-material/TrendingDown'
import TrendingFlatIcon    from '@mui/icons-material/TrendingFlat'

// ── Challenge config dialog (admin only) ──────────────────────────────────────
function ChallengeConfigDialog({ open, onClose, onSave }) {
  const [label,    setLabel]    = useState('')
  const [target,   setTarget]   = useState('')
  const [deadline, setDeadline] = useState('')

  const handleSave = () => {
    if (!target || isNaN(Number(target))) return
    const cfg = { label: label || 'Monthly Challenge', target: Number(target), deadline: deadline || null }
    localStorage.setItem('org_challenge', JSON.stringify(cfg))
    onSave()
    onClose()
  }
  const handleClear = () => {
    localStorage.removeItem('org_challenge')
    onSave()
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Configure Seasonal Challenge</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Challenge label" value={label} onChange={e => setLabel(e.target.value)}
            placeholder="e.g. March Visitor Sprint" size="small" fullWidth />
          <TextField label="Target (completed visits)" value={target}
            onChange={e => setTarget(e.target.value)} type="number" size="small" fullWidth required />
          <TextField label="Deadline (optional)" value={deadline}
            onChange={e => setDeadline(e.target.value)} placeholder="e.g. 31 Mar 2026"
            size="small" fullWidth />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClear} color="error">Clear challenge</Button>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disableElevation>Save</Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Mini stat card ────────────────────────────────────────────────────────────
function MiniCard({ icon, label, value, sub, color = '#1677ff', tooltip }) {
  return (
    <Tooltip title={tooltip ?? ''} placement="top" arrow>
      <Paper variant="outlined" sx={{
        p: 1.25, flex: 1, minWidth: 0,
        borderColor: color + '33', bgcolor: color + '06',
        cursor: tooltip ? 'help' : 'default',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <Box sx={{ color, display: 'flex', fontSize: 14 }}>{icon}</Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600}
            sx={{ textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.4 }}>
            {label}
          </Typography>
        </Box>
        <Typography variant="h6" fontWeight={800} sx={{ color, lineHeight: 1.1 }}>{value}</Typography>
        {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
      </Paper>
    </Tooltip>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function OrgStatsPanel({ stats, loading, onRefresh, isAdmin = false }) {
  const [expanded,       setExpanded]       = useState(false)
  const [challengeOpen,  setChallengeOpen]  = useState(false)

  if (loading) {
    return (
      <Paper variant="outlined" sx={{ p: 1.5, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {[1,2,3,4].map(i => <Skeleton key={i} variant="rounded" height={68} sx={{ flex: 1 }} />)}
        </Box>
      </Paper>
    )
  }
  if (!stats) return null

  const { healthScore, healthGrade, healthColor, totalProcesses, completedProcesses,
          weeklyDigest, leaderboard, challenge } = stats

  const weekTrend = weeklyDigest.thisWeek - weeklyDigest.lastWeek
  const TrendIcon = weekTrend > 0 ? TrendingUpIcon : weekTrend < 0 ? TrendingDownIcon : TrendingFlatIcon
  const trendColor = weekTrend > 0 ? '#389e0d' : weekTrend < 0 ? '#cc0000' : '#8c8c8c'

  return (
    <Paper variant="outlined" sx={{ mb: 3, overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 1.75, py: 1, bgcolor: '#fafafa', borderBottom: expanded ? '1px solid' : 'none',
        borderColor: 'divider',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SpeedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="caption" fontWeight={700} color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>
            Organisation Dashboard
          </Typography>
          <Chip label={`Grade ${healthGrade}`} size="small"
            sx={{ height: 18, fontSize: '0.68rem', fontWeight: 800,
                  bgcolor: healthColor + '18', color: healthColor, border: `1px solid ${healthColor}33` }} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {isAdmin && (
            <Tooltip title="Configure challenge">
              <IconButton size="small" onClick={() => setChallengeOpen(true)}>
                <SettingsIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          )}
          <IconButton size="small" onClick={() => setExpanded(e => !e)}>
            {expanded ? <ExpandLessIcon sx={{ fontSize: 15 }} /> : <ExpandMoreIcon sx={{ fontSize: 15 }} />}
          </IconButton>
        </Box>
      </Box>

      {/* Summary row — always visible */}
      <Box sx={{ display: 'flex', gap: 1.5, p: 1.5, flexWrap: 'wrap' }}>
        <MiniCard
          icon={<SpeedIcon sx={{ fontSize: 14 }} />}
          label="Process health"
          value={healthScore !== null ? `${healthScore.toFixed(1)}h avg` : '—'}
          sub={`Grade ${healthGrade} · ${completedProcesses} completed`}
          color={healthColor}
          tooltip="Average hours from invitation start to completed check-in. Lower is better."
        />
        <MiniCard
          icon={<CalendarMonthIcon sx={{ fontSize: 14 }} />}
          label="This week"
          value={weeklyDigest.thisWeek}
          sub={
            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <TrendIcon sx={{ fontSize: 12, color: trendColor }} />
              <span style={{ color: trendColor }}>
                {weekTrend > 0 ? '+' : ''}{weekTrend} vs last week
              </span>
            </Box>
          }
          color="#531dab"
          tooltip="Visitor processes started this calendar week vs last week"
        />
        <MiniCard
          icon={<EmojiEventsIcon sx={{ fontSize: 14 }} />}
          label="Total visits"
          value={totalProcesses}
          sub={`Busiest: ${weeklyDigest.busiestDay}`}
          color="#1677ff"
          tooltip="Total process instances ever created. Busiest day of the week in the last 30 days."
        />
        {challenge && (
          <MiniCard
            icon={<FlagIcon sx={{ fontSize: 14 }} />}
            label={challenge.label}
            value={`${challenge.current} / ${challenge.target}`}
            sub={challenge.deadline ? `Deadline: ${challenge.deadline}` : `${challenge.progress}% complete`}
            color={challenge.progress >= 100 ? '#389e0d' : challenge.progress >= 60 ? '#d46b08' : '#1677ff'}
            tooltip="Seasonal challenge: completed visits this month vs target"
          />
        )}
      </Box>

      {/* Expanded section: leaderboard + digest details */}
      <Collapse in={expanded}>
        <Box sx={{ px: 1.5, pb: 1.5, display: 'flex', gap: 2, flexWrap: 'wrap', borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>

          {/* Leaderboard */}
          <Box sx={{ flex: 1, minWidth: 180 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary"
              sx={{ textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5, display: 'block', mb: 1 }}>
              Top Inviters — This Month
            </Typography>
            {leaderboard.length === 0
              ? <Typography variant="caption" color="text.secondary">No data yet</Typography>
              : leaderboard.map(({ name, count }, i) => (
                <Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="caption" sx={{ minWidth: 16, color: ['#d4af37','#a8a9ad','#cd7f32','#8c8c8c','#8c8c8c'][i], fontWeight: 700 }}>
                    {['🥇','🥈','🥉','4.','5.'][i]}
                  </Typography>
                  <Typography variant="caption" sx={{ flex: 1, fontWeight: i === 0 ? 700 : 400 }}>{name}</Typography>
                  <Chip label={count} size="small" sx={{ height: 16, fontSize: '0.68rem', fontWeight: 700 }} />
                </Box>
              ))}
          </Box>

          {/* Weekly digest */}
          <Box sx={{ flex: 1, minWidth: 180 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary"
              sx={{ textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5, display: 'block', mb: 1 }}>
              Weekly Digest
            </Typography>
            {[
              ['Started this week',  weeklyDigest.thisWeek],
              ['Started last week',  weeklyDigest.lastWeek],
              ['Busiest day (30d)',   weeklyDigest.busiestDay],
              ['Fastest completion',  weeklyDigest.fastestHours !== null
                ? `${weeklyDigest.fastestHours.toFixed(1)}h` : '—'],
            ].map(([k, v]) => (
              <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                <Typography variant="caption" color="text.secondary">{k}</Typography>
                <Typography variant="caption" fontWeight={600}>{v}</Typography>
              </Box>
            ))}
          </Box>

          {/* Challenge progress bar if active */}
          {challenge && (
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" fontWeight={700}>{challenge.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {challenge.current} / {challenge.target} completed visits
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={challenge.progress}
                sx={{
                  height: 8, borderRadius: 4,
                  bgcolor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: challenge.progress >= 100 ? '#389e0d' : '#1677ff',
                    borderRadius: 4,
                  },
                }}
              />
              {challenge.progress >= 100 && (
                <Typography variant="caption" sx={{ color: '#389e0d', fontWeight: 700, mt: 0.5, display: 'block' }}>
                  🎉 Challenge complete!
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Collapse>

      <ChallengeConfigDialog
        open={challengeOpen}
        onClose={() => setChallengeOpen(false)}
        onSave={onRefresh}
      />
    </Paper>
  )
}

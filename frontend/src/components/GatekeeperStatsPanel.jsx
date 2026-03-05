import React from 'react'
import { Box, Typography, Skeleton, Tooltip, LinearProgress, Paper } from '@mui/material'
import TimerIcon              from '@mui/icons-material/Timer'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import EmojiEventsIcon        from '@mui/icons-material/EmojiEvents'
import CheckCircleIcon        from '@mui/icons-material/CheckCircle'
import TodayIcon              from '@mui/icons-material/Today'
import AccessTimeIcon         from '@mui/icons-material/AccessTime'

const MILESTONE_ICONS  = ['🔰','🚪','⭐','🎖️','👑']
const MILESTONE_COLORS = ['#8c8c8c','#1677ff','#d46b08','#531dab','#389e0d']
const GRADE_LABELS     = { S: 'Instant', A: 'Fast', B: 'Good', C: 'Steady', D: 'Slow', '—': '—' }

function StatCard({ icon, label, value, sub, color = '#531dab', tooltip }) {
  return (
    <Tooltip title={tooltip ?? ''} placement="top" arrow>
      <Paper variant="outlined" sx={{
        p: 1.5, flex: 1, minWidth: 0,
        borderColor: color + '40', bgcolor: color + '08',
        cursor: tooltip ? 'help' : 'default',
        '&:hover': tooltip ? { boxShadow: `0 0 0 2px ${color}40` } : {},
        transition: 'box-shadow 0.15s',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
          <Box sx={{ color, display: 'flex' }}>{icon}</Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600}
            sx={{ textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.5 }}>
            {label}
          </Typography>
        </Box>
        <Typography variant="h5" fontWeight={800} sx={{ color, lineHeight: 1.1 }}>{value}</Typography>
        {sub && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>{sub}</Typography>}
      </Paper>
    </Tooltip>
  )
}

export default function GatekeeperStatsPanel({ stats, loading }) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {[1,2,3,4,5].map(i => <Skeleton key={i} variant="rounded" height={80} sx={{ flex: 1 }} />)}
      </Box>
    )
  }
  if (!stats) return null

  const {
    totalCheckins, todayCheckins,
    avgMinutes, speedGrade, speedColor,
    streak, onTimeRate,
    busiestHourLabel, milestone,
  } = stats

  const milestoneColor = MILESTONE_COLORS[milestone.level] ?? '#8c8c8c'
  const milestoneIcon  = MILESTONE_ICONS[milestone.level]  ?? '🔰'
  const progress = milestone.next
    ? Math.min(100, Math.round(((totalCheckins - milestone.min) / (milestone.next - milestone.min)) * 100))
    : 100

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 1.5 }}>

        {/* Today */}
        <StatCard
          icon={<TodayIcon sx={{ fontSize: 16 }} />}
          label="Today"
          value={todayCheckins}
          sub={`of ${totalCheckins} total check-ins`}
          color="#531dab"
          tooltip="Visitors you have processed today vs all time"
        />

        {/* Speed grade */}
        <StatCard
          icon={<TimerIcon sx={{ fontSize: 16 }} />}
          label="Speed grade"
          value={speedGrade}
          sub={avgMinutes !== null
            ? `${GRADE_LABELS[speedGrade]} · avg ${avgMinutes.toFixed(1)} min`
            : 'No data yet'}
          color={speedColor}
          tooltip="Average minutes to process a check-in. S≤2min, A≤5min, B≤15min, C≤30min, D>30min"
        />

        {/* Streak */}
        <StatCard
          icon={<LocalFireDepartmentIcon sx={{ fontSize: 16 }} />}
          label="Streak"
          value={streak > 0 ? `${streak}d` : '—'}
          sub={streak > 0 ? `${streak} day${streak !== 1 ? 's' : ''} in a row` : 'No active streak'}
          color={streak >= 7 ? '#cc0000' : streak >= 3 ? '#d46b08' : '#8c8c8c'}
          tooltip="Consecutive days on which you processed at least one check-in"
        />

        {/* On-time rate */}
        <StatCard
          icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
          label="On-time rate"
          value={onTimeRate !== null ? `${onTimeRate}%` : '—'}
          sub="check-ins on scheduled day"
          color={onTimeRate === null ? '#8c8c8c'
            : onTimeRate >= 80 ? '#389e0d'
            : onTimeRate >= 50 ? '#d46b08' : '#cc0000'}
          tooltip="Percentage of visitors processed on their originally scheduled visit date"
        />

        {/* Busiest hour + milestone */}
        <StatCard
          icon={<AccessTimeIcon sx={{ fontSize: 16 }} />}
          label="Peak hour"
          value={busiestHourLabel}
          sub="your busiest time slot"
          color="#1677ff"
          tooltip="The hour of day when you handle the most check-ins"
        />

      </Box>

      {/* On-time rate bar */}
      {onTimeRate !== null && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 110 }}>
            On-time rate
          </Typography>
          <LinearProgress variant="determinate" value={onTimeRate} sx={{
            flex: 1, height: 6, borderRadius: 3,
            bgcolor: '#ffe7ba',
            '& .MuiLinearProgress-bar': {
              bgcolor: onTimeRate >= 80 ? '#52c41a' : onTimeRate >= 50 ? '#fa8c16' : '#ff4d4f',
              borderRadius: 3,
            },
          }} />
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 36, textAlign: 'right' }}>
            {onTimeRate}%
          </Typography>
        </Box>
      )}

      {/* Milestone progress */}
      {milestone.next && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', minWidth: 110 }}>
            {milestoneIcon} {milestone.label}
          </Typography>
          <LinearProgress variant="determinate" value={progress} sx={{
            flex: 1, height: 6, borderRadius: 3,
            bgcolor: milestoneColor + '20',
            '& .MuiLinearProgress-bar': { bgcolor: milestoneColor, borderRadius: 3 },
          }} />
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 36, textAlign: 'right' }}>
            {progress}%
          </Typography>
        </Box>
      )}
    </Box>
  )
}

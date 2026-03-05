import React from 'react'
import { Box, Typography, Skeleton, Tooltip, LinearProgress, Paper, Chip } from '@mui/material'
import TimerIcon           from '@mui/icons-material/Timer'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import EmojiEventsIcon     from '@mui/icons-material/EmojiEvents'
import VerifiedUserIcon    from '@mui/icons-material/VerifiedUser'
import TodayIcon           from '@mui/icons-material/Today'

const MILESTONE_ICONS  = ['🔰','⭐','🔍','🏅','🛡️']
const MILESTONE_COLORS = ['#8c8c8c','#1677ff','#d46b08','#531dab','#389e0d']
const GRADE_LABELS     = { S: 'Elite', A: 'Fast', B: 'Good', C: 'Steady', D: 'Slow', '—': '—' }

function StatCard({ icon, label, value, sub, color = '#1677ff', tooltip }) {
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

export default function SecurityStatsPanel({ stats, loading }) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {[1,2,3,4,5].map(i => <Skeleton key={i} variant="rounded" height={80} sx={{ flex: 1 }} />)}
      </Box>
    )
  }
  if (!stats) return null

  const {
    totalReviews, todayReviews, avgMinutes, speedGrade, speedColor,
    approved, rejected, approvalRate, reliabilityAvg,
    streak, milestone, scoreCount,
  } = stats

  const milestoneColor = MILESTONE_COLORS[milestone.level] ?? '#8c8c8c'
  const milestoneIcon  = MILESTONE_ICONS[milestone.level]  ?? '🔰'
  const progress = milestone.next
    ? Math.min(100, Math.round(((totalReviews - milestone.min) / (milestone.next - milestone.min)) * 100))
    : 100

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 1.5 }}>

        {/* Today */}
        <StatCard
          icon={<TodayIcon sx={{ fontSize: 16 }} />}
          label="Today"
          value={todayReviews}
          sub={`of ${totalReviews} total reviews`}
          color="#1677ff"
          tooltip="Security reviews you have completed today vs all time"
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
          tooltip="Average minutes from task claim to completion. S≤5min, A≤15min, B≤30min, C≤60min, D>60min"
        />

        {/* Streak */}
        <StatCard
          icon={<LocalFireDepartmentIcon sx={{ fontSize: 16 }} />}
          label="Streak"
          value={streak > 0 ? `${streak}d` : '—'}
          sub={streak > 0 ? `${streak} day${streak !== 1 ? 's' : ''} in a row` : 'No active streak'}
          color={streak >= 7 ? '#cc0000' : streak >= 3 ? '#d46b08' : '#8c8c8c'}
          tooltip="Consecutive days on which you completed at least one security review"
        />

        {/* Approval rate */}
        <StatCard
          icon={<VerifiedUserIcon sx={{ fontSize: 16 }} />}
          label="Approvals"
          value={approvalRate !== null ? `${approvalRate}%` : '—'}
          sub={scoreCount > 0
            ? `${approved} approved · ${rejected} rejected`
            : 'No scored reviews yet'}
          color={approvalRate === null ? '#8c8c8c'
            : approvalRate >= 70 ? '#389e0d'
            : approvalRate >= 40 ? '#d46b08' : '#cc0000'}
          tooltip="Percentage of your reviews where you assigned reliability ≥ 50 (approved)"
        />

        {/* Milestone */}
        <StatCard
          icon={<EmojiEventsIcon sx={{ fontSize: 16 }} />}
          label="Rank"
          value={`${milestoneIcon} ${milestone.label}`}
          sub={milestone.next
            ? `${totalReviews - milestone.min} / ${milestone.next - milestone.min} to ${milestone.nextLabel}`
            : 'Maximum rank reached!'}
          color={milestoneColor}
          tooltip="Rank up by completing more security reviews"
        />
      </Box>

      {/* Score distribution bar */}
      {scoreCount > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 110 }}>
            Score distribution
          </Typography>
          <Box sx={{ flex: 1, display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', bgcolor: '#ffccc7' }}>
            <Box sx={{
              width: `${approvalRate}%`, bgcolor: '#52c41a',
              transition: 'width 0.6s ease', borderRadius: '4px 0 0 4px',
            }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label={`✓ ${approved}`} size="small" sx={{ height: 18, fontSize: '0.68rem', bgcolor: '#f6ffed', color: '#389e0d', border: '1px solid #b7eb8f' }} />
            <Chip label={`✗ ${rejected}`} size="small" sx={{ height: 18, fontSize: '0.68rem', bgcolor: '#fff2f0', color: '#cc0000', border: '1px solid #ffccc7' }} />
            {reliabilityAvg !== null && (
              <Chip label={`avg ${reliabilityAvg}`} size="small" sx={{ height: 18, fontSize: '0.68rem' }} />
            )}
          </Box>
        </Box>
      )}

      {/* Milestone progress bar */}
      {milestone.next && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', minWidth: 110 }}>
            Next: {MILESTONE_ICONS[milestone.level + 1]} {milestone.nextLabel}
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

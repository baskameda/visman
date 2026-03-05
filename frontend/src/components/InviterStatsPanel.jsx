import React from 'react'
import { Box, Typography, Skeleton, Tooltip, LinearProgress, Paper } from '@mui/material'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import EmojiEventsIcon         from '@mui/icons-material/EmojiEvents'
import VerifiedIcon            from '@mui/icons-material/Verified'
import GroupIcon               from '@mui/icons-material/Group'

const MILESTONE_ICONS = ['🌱', '⭐', '🏅', '🏆', '💎']
const MILESTONE_COLORS = ['#8c8c8c', '#1677ff', '#d46b08', '#531dab', '#389e0d']

function StatCard({ icon, label, value, sub, color = '#1677ff', tooltip }) {
  return (
    <Tooltip title={tooltip ?? ''} placement="top" arrow>
      <Paper variant="outlined" sx={{
        p: 1.5, flex: 1, minWidth: 0,
        borderColor: color + '40',
        bgcolor: color + '08',
        cursor: tooltip ? 'help' : 'default',
        transition: 'box-shadow 0.15s',
        '&:hover': tooltip ? { boxShadow: `0 0 0 2px ${color}40` } : {},
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
          <Box sx={{ color, display: 'flex' }}>{icon}</Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600}
            sx={{ textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.5 }}>
            {label}
          </Typography>
        </Box>
        <Typography variant="h5" fontWeight={800} sx={{ color, lineHeight: 1.1 }}>{value}</Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
            {sub}
          </Typography>
        )}
      </Paper>
    </Tooltip>
  )
}

export default function InviterStatsPanel({ stats, loading }) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} variant="rounded" height={80} sx={{ flex: 1 }} />
        ))}
      </Box>
    )
  }
  if (!stats) return null

  const { total, approvalRate, approvalBadge, streak, milestone } = stats
  const milestoneColor = MILESTONE_COLORS[milestone.level] ?? '#8c8c8c'
  const milestoneIcon  = MILESTONE_ICONS[milestone.level] ?? '🌱'

  // Progress toward next milestone
  const prevMin = milestone.min
  const nextMin = milestone.next ?? prevMin
  const progress = milestone.next
    ? Math.min(100, Math.round(((total - prevMin) / (nextMin - prevMin)) * 100))
    : 100

  return (
    <Box sx={{ mb: 3 }}>
      {/* Stat cards row */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 1.5 }}>

        {/* Total invitations */}
        <StatCard
          icon={<GroupIcon sx={{ fontSize: 16 }} />}
          label="Invitations"
          value={total}
          sub="all time"
          color="#1677ff"
          tooltip="Total number of visitor invitations you have ever started"
        />

        {/* Streak */}
        <StatCard
          icon={<LocalFireDepartmentIcon sx={{ fontSize: 16 }} />}
          label="Streak"
          value={streak > 0 ? `${streak}d` : '—'}
          sub={streak > 0 ? `${streak} day${streak !== 1 ? 's' : ''} in a row` : 'No active streak'}
          color={streak >= 7 ? '#cc0000' : streak >= 3 ? '#d46b08' : '#8c8c8c'}
          tooltip="Consecutive calendar days on which you started at least one invitation"
        />

        {/* Approval rate */}
        <StatCard
          icon={<VerifiedIcon sx={{ fontSize: 16 }} />}
          label="Approval rate"
          value={approvalRate !== null ? `${approvalRate}%` : '—'}
          sub={approvalBadge?.label ?? 'Not enough data'}
          color={approvalBadge?.color ?? '#8c8c8c'}
          tooltip="Percentage of your completed invitations that passed the security review (reliability ≥ 50)"
        />

        {/* Milestone */}
        <StatCard
          icon={<EmojiEventsIcon sx={{ fontSize: 16 }} />}
          label="Milestone"
          value={milestoneIcon + ' ' + milestone.label}
          sub={milestone.next
            ? `${total - prevMin} / ${nextMin - prevMin} to ${milestone.nextLabel}`
            : 'Maximum level reached!'}
          color={milestoneColor}
          tooltip="Unlock higher levels by sending more invitations"
        />
      </Box>

      {/* Progress bar toward next milestone */}
      {milestone.next && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', minWidth: 80 }}>
            Next: {MILESTONE_ICONS[milestone.level + 1]} {milestone.nextLabel}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              flex: 1, height: 6, borderRadius: 3,
              bgcolor: milestoneColor + '20',
              '& .MuiLinearProgress-bar': { bgcolor: milestoneColor, borderRadius: 3 },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 36, textAlign: 'right' }}>
            {progress}%
          </Typography>
        </Box>
      )}
    </Box>
  )
}

import React from 'react'
import { Box, Typography, Tooltip, Chip } from '@mui/material'
import { keyframes } from '@mui/system'
import CheckRoundedIcon  from '@mui/icons-material/CheckRounded'
import CloseRoundedIcon  from '@mui/icons-material/CloseRounded'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
import SecurityIcon      from '@mui/icons-material/Security'
import MeetingRoomIcon   from '@mui/icons-material/MeetingRoom'
import HowToRegIcon      from '@mui/icons-material/HowToReg'

const pulseRing = keyframes`
  0%   { transform: scale(1);   opacity: 0.7; }
  70%  { transform: scale(1.9); opacity: 0;   }
  100% { transform: scale(1);   opacity: 0;   }
`
const fadeSlideIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0);   }
`

// ─── Step definitions ─────────────────────────────────────────────────────────

export const FLOW_STEPS = [
  {
    id: 'invite', taskKey: 'Activity_0fze1aq',
    label: 'Invitation', sublabel: 'Invitors',
    color: '#2563eb', glow: 'rgba(37,99,235,0.35)', track: '#bfdbfe',
    Icon: PersonAddAlt1Icon,
  },
  {
    id: 'security', taskKey: 'Activity_1ntxaf8',
    label: 'Security', sublabel: 'Security',
    color: '#d97706', glow: 'rgba(217,119,6,0.35)', track: '#fde68a',
    Icon: SecurityIcon,
  },
  {
    id: 'gate', taskKey: 'Activity_03g8gtv',
    label: 'Gate Entry', sublabel: 'Porters',
    color: '#7c3aed', glow: 'rgba(124,58,237,0.35)', track: '#ddd6fe',
    Icon: MeetingRoomIcon,
  },
  {
    id: 'checkin', taskKey: 'Activity_15y888q',
    label: 'Checked In', sublabel: 'Automated',
    color: '#059669', glow: 'rgba(5,150,105,0.35)', track: '#a7f3d0',
    Icon: HowToRegIcon,
  },
]

export const TASK_KEY_TO_STEP = Object.fromEntries(
  FLOW_STEPS.map((s, i) => [s.taskKey, i])
)

function resolveStepStatus(stepIndex, activeStepIndex, outcome) {
  if (outcome === 'completed') return 'completed'
  if (outcome === 'refused') {
    if (stepIndex < activeStepIndex)  return 'completed'
    if (stepIndex === activeStepIndex) return 'refused'
    return 'pending'
  }
  if (stepIndex < activeStepIndex)  return 'completed'
  if (stepIndex === activeStepIndex) return 'active'
  return 'pending'
}

// ─── Node  (sizes increased 40%) ─────────────────────────────────────────────
// compact: 32 → 45 px,  icon 14 → 20 px
// full:    44 → 62 px,  icon 20 → 28 px

function StepNode({ step, status, compact }) {
  const size   = compact ? 45 : 62
  const iconSz = compact ? 20 : 28

  const bgColor = {
    completed: '#059669',
    active:    step.color,
    pending:   '#e2e8f0',
    refused:   '#dc2626',
  }[status]

  const iconColor = status === 'pending' ? '#94a3b8' : '#fff'

  const iconEl = status === 'completed'
    ? <CheckRoundedIcon sx={{ fontSize: iconSz, color: '#fff' }} />
    : status === 'refused'
    ? <CloseRoundedIcon sx={{ fontSize: iconSz, color: '#fff' }} />
    : <step.Icon sx={{ fontSize: iconSz, color: iconColor }} />

  return (
    <Tooltip title={`${step.label} (${step.sublabel})`} disableHoverListener={!compact}>
      <Box sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75,
        animation: `${fadeSlideIn} 0.35s ease both`,
      }}>
        <Box sx={{ position: 'relative', width: size, height: size }}>
          {status === 'active' && (
            <Box sx={{
              position: 'absolute', inset: 0,
              borderRadius: '50%',
              backgroundColor: step.glow,
              animation: `${pulseRing} 2s ease-out infinite`,
            }} />
          )}
          <Box sx={{
            position: 'relative', zIndex: 1,
            width: size, height: size, borderRadius: '50%',
            backgroundColor: bgColor,
            boxShadow: status === 'active'
              ? `0 0 0 3px #fff, 0 0 0 5px ${step.color}`
              : status === 'refused'
              ? '0 0 0 3px #fff, 0 0 0 5px #dc2626'
              : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}>
            {iconEl}
          </Box>
        </Box>

        {!compact && (
          <Box sx={{ textAlign: 'center', minWidth: 80 }}>
            <Typography variant="caption" sx={{
              fontWeight: status === 'active' ? 700 : 500,
              color: status === 'pending'   ? 'text.disabled'
                   : status === 'refused'   ? '#dc2626'
                   : status === 'active'    ? step.color
                   : 'text.secondary',
              fontSize: '0.72rem', lineHeight: 1.2, display: 'block',
            }}>
              {step.label}
            </Typography>
            {status === 'active' && (
              <Chip label="NOW" size="small" sx={{
                mt: 0.3, height: 16, fontSize: '0.62rem', fontWeight: 700,
                backgroundColor: step.color, color: '#fff',
                '& .MuiChip-label': { px: 0.8 },
              }} />
            )}
          </Box>
        )}
      </Box>
    </Tooltip>
  )
}

// ─── Connector (height also scaled 40%) ──────────────────────────────────────
// compact: 3 → 4 px,  full: 4 → 6 px

function Connector({ leftStatus, rightStatus, leftStep, rightStep, compact }) {
  const height = compact ? 4 : 6
  const id = `grad-${leftStep.id}-${rightStep.id}`

  const col = (status, step) =>
    status === 'completed' ? '#059669'
  : status === 'active'    ? step.color
  : status === 'refused'   ? '#dc2626'
  : '#e2e8f0'

  return (
    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', mx: compact ? 0.5 : 1 }}>
      <svg width="100%" height={height + 2} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={col(leftStatus,  leftStep)}  />
            <stop offset="100%" stopColor={col(rightStatus, rightStep)} />
          </linearGradient>
        </defs>
        <rect x={0} y={1} width="100%" height={height}
          rx={height / 2} ry={height / 2} fill={`url(#${id})`} />
      </svg>
    </Box>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export default function ProcessFlowViz({
  currentTaskKey,
  outcome = 'active',
  compact = false,
  visitorName,
}) {
  const activeStepIndex = currentTaskKey !== undefined
    ? (TASK_KEY_TO_STEP[currentTaskKey] ?? -1)
    : outcome === 'completed' ? FLOW_STEPS.length
    : -1

  const stepStatuses = FLOW_STEPS.map((_, i) =>
    resolveStepStatus(i, activeStepIndex, outcome)
  )

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', py: 0.5 }}>
        {FLOW_STEPS.map((step, i) => (
          <React.Fragment key={step.id}>
            <StepNode step={step} status={stepStatuses[i]} compact />
            {i < FLOW_STEPS.length - 1 && (
              <Connector
                leftStatus={stepStatuses[i]} rightStatus={stepStatuses[i + 1]}
                leftStep={FLOW_STEPS[i]}     rightStep={FLOW_STEPS[i + 1]}
                compact
              />
            )}
          </React.Fragment>
        ))}
      </Box>
    )
  }

  return (
    <Box sx={{
      borderRadius: 3, overflow: 'hidden',
      border: '1px solid', borderColor: 'divider',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    }}>
      <Box sx={{
        px: 2.5, py: 1.5,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Typography variant="caption" sx={{
          color: 'rgba(255,255,255,0.5)', fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.65rem',
        }}>
          Process Flow
        </Typography>
        {outcome === 'completed' && (
          <Chip label="✓ Completed" size="small" sx={{
            bgcolor: '#059669', color: '#fff', fontWeight: 700, fontSize: '0.65rem', height: 18,
          }} />
        )}
        {outcome === 'refused' && (
          <Chip label="✗ Refused" size="small" sx={{
            bgcolor: '#dc2626', color: '#fff', fontWeight: 700, fontSize: '0.65rem', height: 18,
          }} />
        )}
        {visitorName && outcome === 'active' && (
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
            {visitorName}
          </Typography>
        )}
      </Box>

      <Box sx={{ px: 3, py: 3, display: 'flex', alignItems: 'flex-start' }}>
        {FLOW_STEPS.map((step, i) => (
          <React.Fragment key={step.id}>
            <StepNode step={step} status={stepStatuses[i]} compact={false} />
            {i < FLOW_STEPS.length - 1 && (
              <Connector
                leftStatus={stepStatuses[i]} rightStatus={stepStatuses[i + 1]}
                leftStep={FLOW_STEPS[i]}     rightStep={FLOW_STEPS[i + 1]}
                compact={false}
              />
            )}
          </React.Fragment>
        ))}
      </Box>
    </Box>
  )
}

import React from 'react'
import { Box, Typography, Tooltip, Chip } from '@mui/material'
import { keyframes } from '@mui/system'
import CheckRoundedIcon  from '@mui/icons-material/CheckRounded'
import CloseRoundedIcon  from '@mui/icons-material/CloseRounded'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
import SecurityIcon      from '@mui/icons-material/Security'
import MeetingRoomIcon   from '@mui/icons-material/MeetingRoom'
import HowToRegIcon      from '@mui/icons-material/HowToReg'
import { useTranslation } from 'react-i18next'

const pulseRing = keyframes`
  0%   { transform: scale(1);   opacity: 0.7; }
  70%  { transform: scale(1.9); opacity: 0;   }
  100% { transform: scale(1);   opacity: 0;   }
`
const fadeSlideIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0);   }
`

// Step definitions – labels are resolved via i18n keys at render time
const FLOW_STEP_DEFS = [
  { id: 'invite',   taskKey: 'Activity_0fze1aq', labelKey: 'flow.invite_label',   sublabelKey: 'flow.invite_sublabel',   color: '#2563eb', glow: 'rgba(37,99,235,0.35)',  track: '#bfdbfe', Icon: PersonAddAlt1Icon },
  { id: 'security', taskKey: 'Activity_1ntxaf8', labelKey: 'flow.security_label', sublabelKey: 'flow.security_sublabel', color: '#d97706', glow: 'rgba(217,119,6,0.35)',   track: '#fde68a', Icon: SecurityIcon      },
  { id: 'gate',     taskKey: 'Activity_03g8gtv', labelKey: 'flow.gate_label',     sublabelKey: 'flow.gate_sublabel',     color: '#7c3aed', glow: 'rgba(124,58,237,0.35)',  track: '#ddd6fe', Icon: MeetingRoomIcon   },
  { id: 'checkin',  taskKey: 'Activity_15y888q', labelKey: 'flow.checkin_label',  sublabelKey: 'flow.checkin_sublabel',  color: '#059669', glow: 'rgba(5,150,105,0.35)',   track: '#a7f3d0', Icon: HowToRegIcon      },
]

export const TASK_KEY_TO_STEP = Object.fromEntries(
  FLOW_STEP_DEFS.map((s, i) => [s.taskKey, i])
)

// Keep exported FLOW_STEPS for any callers that need it (task keys only)
export const FLOW_STEPS = FLOW_STEP_DEFS

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

function StepNode({ step, status, compact, label, sublabel }) {
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
    <Tooltip title={compact ? `${label} (${sublabel})` : ''} disableHoverListener={!compact}>
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
              {label}
            </Typography>
          </Box>
        )}
      </Box>
    </Tooltip>
  )
}

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

export default function ProcessFlowViz({
  currentTaskKey,
  outcome = 'active',
  compact = false,
  visitorName,
}) {
  const { t } = useTranslation()

  const activeStepIndex = currentTaskKey !== undefined
    ? (TASK_KEY_TO_STEP[currentTaskKey] ?? -1)
    : outcome === 'completed' ? FLOW_STEP_DEFS.length
    : -1

  const stepStatuses = FLOW_STEP_DEFS.map((_, i) =>
    resolveStepStatus(i, activeStepIndex, outcome)
  )

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', py: 0.5 }}>
        {FLOW_STEP_DEFS.map((step, i) => (
          <React.Fragment key={step.id}>
            <StepNode step={step} status={stepStatuses[i]} compact
              label={t(step.labelKey)} sublabel={t(step.sublabelKey)} />
            {i < FLOW_STEP_DEFS.length - 1 && (
              <Connector
                leftStatus={stepStatuses[i]} rightStatus={stepStatuses[i + 1]}
                leftStep={FLOW_STEP_DEFS[i]} rightStep={FLOW_STEP_DEFS[i + 1]}
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
          {t('flow.processFlow')}
        </Typography>
        {outcome === 'completed' && (
          <Chip label={t('flow.completed')} size="small" sx={{
            bgcolor: '#059669', color: '#fff', fontWeight: 700, fontSize: '0.65rem', height: 18,
          }} />
        )}
        {outcome === 'refused' && (
          <Chip label={t('flow.refused')} size="small" sx={{
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
        {FLOW_STEP_DEFS.map((step, i) => (
          <React.Fragment key={step.id}>
            <StepNode step={step} status={stepStatuses[i]} compact={false}
              label={t(step.labelKey)} sublabel={t(step.sublabelKey)} />
            {i < FLOW_STEP_DEFS.length - 1 && (
              <Connector
                leftStatus={stepStatuses[i]} rightStatus={stepStatuses[i + 1]}
                leftStep={FLOW_STEP_DEFS[i]}  rightStep={FLOW_STEP_DEFS[i + 1]}
                compact={false}
              />
            )}
          </React.Fragment>
        ))}
      </Box>
    </Box>
  )
}

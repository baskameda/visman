import React, { useEffect } from 'react'
import { Tooltip, Tag } from 'antd'
import {
  UserAddOutlined, SafetyOutlined, BankOutlined,
  CheckCircleOutlined, CheckOutlined, CloseOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

// ─── Inject CSS animations once ───────────────────────────────────────────────
const STYLE_ID = 'process-flow-viz-styles'
function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return
  const s = document.createElement('style')
  s.id = STYLE_ID
  s.textContent = `
    @keyframes pfv-pulse {
      0%   { transform: scale(1);   opacity: 0.7; }
      70%  { transform: scale(1.9); opacity: 0;   }
      100% { transform: scale(1);   opacity: 0;   }
    }
    @keyframes pfv-fadein {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0);   }
    }
  `
  document.head.appendChild(s)
}

// ─── Step definitions ─────────────────────────────────────────────────────────
const FLOW_STEP_DEFS = [
  { id: 'invite',   taskKey: 'Activity_0fze1aq', labelKey: 'flow.invite_label',   sublabelKey: 'flow.invite_sublabel',   color: '#2563eb', glow: 'rgba(37,99,235,0.35)',  track: '#bfdbfe', Icon: UserAddOutlined       },
  { id: 'security', taskKey: 'Activity_1ntxaf8', labelKey: 'flow.security_label', sublabelKey: 'flow.security_sublabel', color: '#d97706', glow: 'rgba(217,119,6,0.35)',   track: '#fde68a', Icon: SafetyOutlined        },
  { id: 'gate',     taskKey: 'Activity_03g8gtv', labelKey: 'flow.gate_label',     sublabelKey: 'flow.gate_sublabel',     color: '#7c3aed', glow: 'rgba(124,58,237,0.35)',  track: '#ddd6fe', Icon: BankOutlined          },
  { id: 'checkin',  taskKey: 'Activity_15y888q', labelKey: 'flow.checkin_label',  sublabelKey: 'flow.checkin_sublabel',  color: '#059669', glow: 'rgba(5,150,105,0.35)',   track: '#a7f3d0', Icon: CheckCircleOutlined   },
]

export const TASK_KEY_TO_STEP = Object.fromEntries(FLOW_STEP_DEFS.map((s, i) => [s.taskKey, i]))
export const FLOW_STEPS = FLOW_STEP_DEFS

function resolveStepStatus(stepIndex, activeStepIndex, outcome) {
  if (outcome === 'completed') return 'completed'
  if (outcome === 'refused') {
    if (stepIndex < activeStepIndex)   return 'completed'
    if (stepIndex === activeStepIndex) return 'refused'
    return 'pending'
  }
  if (stepIndex < activeStepIndex)   return 'completed'
  if (stepIndex === activeStepIndex) return 'active'
  return 'pending'
}

function StepNode({ step, status, compact, label, sublabel }) {
  const size   = compact ? 45 : 62
  const iconSz = compact ? 18 : 26

  const bgColor = {
    completed: '#059669',
    active:    step.color,
    pending:   '#e2e8f0',
    refused:   '#dc2626',
  }[status]

  const iconColor = status === 'pending' ? '#94a3b8' : '#fff'
  const Icon      = step.Icon

  const innerIcon = status === 'completed'
    ? <CheckOutlined  style={{ fontSize: iconSz, color: '#fff' }} />
    : status === 'refused'
    ? <CloseOutlined  style={{ fontSize: iconSz, color: '#fff' }} />
    : <Icon           style={{ fontSize: iconSz, color: iconColor }} />

  const boxShadow = status === 'active'
    ? `0 0 0 3px #fff, 0 0 0 5px ${step.color}`
    : status === 'refused'
    ? '0 0 0 3px #fff, 0 0 0 5px #dc2626'
    : 'none'

  const node = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, animation: 'pfv-fadein 0.35s ease both' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        {status === 'active' && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            backgroundColor: step.glow,
            animation: 'pfv-pulse 2s ease-out infinite',
          }} />
        )}
        <div style={{
          position: 'relative', zIndex: 1,
          width: size, height: size, borderRadius: '50%',
          backgroundColor: bgColor, boxShadow,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s ease',
        }}>
          {innerIcon}
        </div>
      </div>
      {!compact && (
        <div style={{ textAlign: 'center', minWidth: 80 }}>
          <span style={{
            display: 'block', fontSize: 11, lineHeight: 1.3,
            fontWeight: status === 'active' ? 700 : 500,
            color: status === 'pending'   ? '#94a3b8'
                 : status === 'refused'   ? '#dc2626'
                 : status === 'active'    ? step.color
                 : '#64748b',
          }}>
            {label}
          </span>
        </div>
      )}
    </div>
  )

  return compact
    ? <Tooltip title={`${label} (${sublabel})`}>{node}</Tooltip>
    : node
}

function Connector({ leftStatus, rightStatus, leftStep, rightStep, compact }) {
  const h  = compact ? 4 : 6
  const id = `pfv-grad-${leftStep.id}-${rightStep.id}`
  const col = (st, step) =>
    st === 'completed' ? '#059669'
    : st === 'active'  ? step.color
    : st === 'refused' ? '#dc2626'
    : '#e2e8f0'
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', margin: compact ? '0 4px' : '0 8px' }}>
      <svg width="100%" height={h + 2} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={col(leftStatus,  leftStep)}  />
            <stop offset="100%" stopColor={col(rightStatus, rightStep)} />
          </linearGradient>
        </defs>
        <rect x={0} y={1} width="100%" height={h} rx={h/2} ry={h/2} fill={`url(#${id})`} />
      </svg>
    </div>
  )
}

export default function ProcessFlowViz({ currentTaskKey, outcome = 'active', compact = false, visitorName }) {
  useEffect(() => { ensureStyles() }, [])
  const { t } = useTranslation()

  const activeStepIndex = currentTaskKey !== undefined
    ? (TASK_KEY_TO_STEP[currentTaskKey] ?? -1)
    : outcome === 'completed' ? FLOW_STEP_DEFS.length : -1

  const stepStatuses = FLOW_STEP_DEFS.map((_, i) => resolveStepStatus(i, activeStepIndex, outcome))

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '4px 0' }}>
        {FLOW_STEP_DEFS.map((step, i) => (
          <React.Fragment key={step.id}>
            <StepNode step={step} status={stepStatuses[i]} compact label={t(step.labelKey)} sublabel={t(step.sublabelKey)} />
            {i < FLOW_STEP_DEFS.length - 1 && (
              <Connector leftStatus={stepStatuses[i]} rightStatus={stepStatuses[i+1]}
                leftStep={FLOW_STEP_DEFS[i]} rightStep={FLOW_STEP_DEFS[i+1]} compact />
            )}
          </React.Fragment>
        ))}
      </div>
    )
  }

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #334155', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
      <div style={{
        padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 10 }}>
          {t('flow.processFlow')}
        </span>
        {outcome === 'completed' && (
          <Tag color="success" style={{ fontWeight: 700, fontSize: 10, margin: 0 }}>{t('flow.completed')}</Tag>
        )}
        {outcome === 'refused' && (
          <Tag color="error" style={{ fontWeight: 700, fontSize: 10, margin: 0 }}>{t('flow.refused')}</Tag>
        )}
        {visitorName && outcome === 'active' && (
          <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 12 }}>{visitorName}</span>
        )}
      </div>
      <div style={{ padding: '24px', display: 'flex', alignItems: 'flex-start' }}>
        {FLOW_STEP_DEFS.map((step, i) => (
          <React.Fragment key={step.id}>
            <StepNode step={step} status={stepStatuses[i]} compact={false} label={t(step.labelKey)} sublabel={t(step.sublabelKey)} />
            {i < FLOW_STEP_DEFS.length - 1 && (
              <Connector leftStatus={stepStatuses[i]} rightStatus={stepStatuses[i+1]}
                leftStep={FLOW_STEP_DEFS[i]} rightStep={FLOW_STEP_DEFS[i+1]} compact={false} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

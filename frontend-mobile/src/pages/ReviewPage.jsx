import React, { useState } from 'react'
import {
  NavBar, Button, Checkbox, Slider, TextArea, Toast,
  Dialog, Tag, List, NoticeBar,
} from 'antd-mobile'
import {
  CheckCircleOutline, CloseCircleOutline, StopOutline,
  QuestionCircleOutline, ClockCircleOutline,
  EnvironmentOutline, UserOutline,
} from 'antd-mobile-icons'
import { decideSecurityCheck, claimTask } from '../api/api'
import { useAuth } from '../context/AuthContext'

// ── Section heading ───────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: 0.8, color: '#8c8c8c',
      padding: '16px 16px 6px',
    }}>
      {children}
    </div>
  )
}

// ── Reliability label ─────────────────────────────────────────────────────────
function ReliabilityLabel({ value }) {
  const color = value >= 60 ? '#52c41a' : value >= 30 ? '#faad14' : '#ff4d4f'
  const label = value >= 60 ? 'Low risk' : value >= 30 ? 'Medium risk' : 'High risk'
  return (
    <Tag style={{ background: color + '22', color, border: `1px solid ${color}44`, fontWeight: 600 }}>
      {value} — {label}
    </Tag>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function ReviewPage({ sc, task, onBack, onDone }) {
  const { auth } = useAuth()

  const [confirmed,     setConfirmed]     = useState(false)
  const [reliability,   setReliability]   = useState(70)
  const [note,          setNote]          = useState('')
  const [clarQuestion,  setClarQuestion]  = useState('')
  const [submitting,    setSubmitting]    = useState(false)
  const [validationErr, setValidationErr] = useState('')

  const clarCount  = sc.clarificationCount ?? 0
  const remaining  = 5 - clarCount
  const hasHistory = clarCount > 0 && sc.clarificationQuestion
  const visitorName = `${sc.visitorFirstName ?? ''} ${sc.visitorLastName ?? ''}`.trim() || 'Visitor'
  const period = sc.startDate === sc.endDate
    ? sc.startDate
    : `${sc.startDate} → ${sc.endDate}`

  const validate = (decision) => {
    if (!confirmed) { setValidationErr('You must confirm identity verification.'); return false }
    if ((decision === 'REFUSE' || decision === 'BLACKLIST') && !note.trim()) {
      setValidationErr('A note is required when refusing or blacklisting.'); return false
    }
    if (decision === 'ASK_INVITER' && !clarQuestion.trim()) {
      setValidationErr('A question is required when asking the inviter.'); return false
    }
    return true
  }

  const handleSubmit = async (decision) => {
    if (!validate(decision)) return
    setValidationErr('')

    const labels = {
      APPROVE:    'Approve this visitor?',
      REFUSE:     'Refuse this visitor?',
      BLACKLIST:  'Refuse AND blacklist this visitor?',
      ASK_INVITER:'Send a clarification question to the inviter?',
    }
    const confirmed_ = await Dialog.confirm({
      title: labels[decision],
      content: visitorName,
      confirmText: decision === 'APPROVE' ? 'Approve' : decision === 'REFUSE' ? 'Refuse'
        : decision === 'BLACKLIST' ? 'Blacklist' : 'Send',
    })
    if (!confirmed_) return

    setSubmitting(true)
    try {
      // Claim task first to ensure we own it
      try { await claimTask(auth, task.id) } catch { /* already claimed */ }

      await decideSecurityCheck(auth, sc.id, task.id, {
        decision,
        reliability: decision === 'APPROVE' ? reliability : null,
        note:        note.trim() || null,
        clarificationQuestion: clarQuestion.trim() || null,
      })

      Toast.show({
        icon: decision === 'APPROVE' ? 'success' : 'fail',
        content: decision === 'APPROVE' ? 'Visitor approved!'
          : decision === 'REFUSE' ? 'Visitor refused'
          : decision === 'BLACKLIST' ? 'Visitor refused and blacklisted'
          : 'Question sent to inviter',
      })
      onDone()
    } catch (e) {
      Toast.show({ icon: 'fail', content: 'Failed: ' + (e.response?.data?.message ?? e.message) })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#f5f5f5', paddingBottom: 100 }}>

      <NavBar
        onBack={onBack}
        style={{
          background: '#fff',
          borderBottom: '1px solid #eee',
          '--height': '48px',
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 700 }}>{visitorName}</span>
      </NavBar>

      {/* ── Visitor details ── */}
      <SectionLabel>Visitor Details</SectionLabel>
      <List style={{ '--border-inner': '1px solid #f0f0f0' }}>
        {sc.visitorCompany && (
          <List.Item extra={sc.visitorCompany}>Company</List.Item>
        )}
        {sc.visitorFunction && (
          <List.Item prefix={<UserOutline style={{ color: '#fa8c16' }} />} extra={sc.visitorFunction}>
            Role
          </List.Item>
        )}
        {sc.visitorEmail && (
          <List.Item extra={<a href={`mailto:${sc.visitorEmail}`} style={{ color: '#fa8c16' }}>{sc.visitorEmail}</a>}>
            Email
          </List.Item>
        )}
        {sc.visitorPhone && (
          <List.Item extra={<a href={`tel:${sc.visitorPhone}`} style={{ color: '#fa8c16' }}>{sc.visitorPhone}</a>}>
            Phone
          </List.Item>
        )}
        <List.Item prefix={<ClockCircleOutline style={{ color: '#fa8c16' }} />} extra={period}>
          Period
        </List.Item>
        {sc.entranceName && (
          <List.Item prefix={<EnvironmentOutline style={{ color: '#fa8c16' }} />} extra={sc.entranceName}>
            Entrance
          </List.Item>
        )}
        {sc.inviterUsername && (
          <List.Item prefix={<UserOutline style={{ color: '#8c8c8c' }} />} extra={sc.inviterUsername}>
            Invited by
          </List.Item>
        )}
      </List>

      {/* ── Clarification history ── */}
      {hasHistory && (
        <>
          <SectionLabel>Previous Q&amp;A ({clarCount})</SectionLabel>
          <div style={{
            margin: '0 16px',
            background: '#fff',
            borderRadius: 8,
            border: '1px solid #eee',
            borderLeft: '4px solid #faad14',
            padding: '12px 14px',
          }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>
              <strong>Q:</strong> {sc.clarificationQuestion}
            </div>
            {sc.clarificationAnswer && (
              <div style={{ fontSize: 13, color: '#52c41a' }}>
                <strong>A:</strong> {sc.clarificationAnswer}
              </div>
            )}
          </div>
        </>
      )}

      {clarCount > 0 && (
        <div style={{ margin: '8px 16px 0' }}>
          <NoticeBar
            color={remaining <= 1 ? 'error' : remaining <= 2 ? 'alert' : 'info'}
            content={`${remaining} clarification attempt${remaining !== 1 ? 's' : ''} left (${clarCount} used)`}
          />
        </div>
      )}

      {/* ── Identity confirmation ── */}
      <SectionLabel>Identity Check</SectionLabel>
      <div style={{
        margin: '0 16px',
        background: confirmed ? '#f6ffed' : '#fff',
        borderRadius: 8,
        border: `1px solid ${confirmed ? '#52c41a' : '#eee'}`,
        padding: '14px 16px',
        transition: 'all 0.2s',
      }}>
        <Checkbox checked={confirmed} onChange={setConfirmed}>
          <span style={{ fontSize: 14, fontWeight: confirmed ? 600 : 400 }}>
            I have personally verified the identity of this visitor
          </span>
        </Checkbox>
      </div>

      {/* ── Reliability ── */}
      <SectionLabel>Reliability Score (Approve only)</SectionLabel>
      <div style={{ margin: '0 16px', background: '#fff', borderRadius: 8, border: '1px solid #eee', padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: '#595959' }}>Score</span>
          <ReliabilityLabel value={reliability} />
        </div>
        <Slider
          min={0} max={100} step={5}
          value={reliability}
          onChange={setReliability}
          style={{ '--fill-color': '#fa8c16' }}
        />
      </div>

      {/* ── Note ── */}
      <SectionLabel>Security Note (required when refusing)</SectionLabel>
      <div style={{ margin: '0 16px', background: '#fff', borderRadius: 8, border: '1px solid #eee', padding: '12px' }}>
        <TextArea
          placeholder="Add a note…"
          value={note}
          onChange={setNote}
          rows={3}
          maxLength={500}
          showCount
        />
      </div>

      {/* ── Ask inviter ── */}
      {remaining > 0 && (
        <>
          <SectionLabel>Question for Inviter (Ask Inviter only)</SectionLabel>
          <div style={{ margin: '0 16px', background: '#fff', borderRadius: 8, border: '1px solid #eee', padding: '12px' }}>
            <TextArea
              placeholder="Type your question…"
              value={clarQuestion}
              onChange={setClarQuestion}
              rows={3}
              maxLength={500}
              showCount
            />
          </div>
        </>
      )}

      {/* ── Validation error ── */}
      {validationErr && (
        <div style={{
          margin: '8px 16px',
          background: '#fff2f0', border: '1px solid #ffccc7',
          borderRadius: 8, padding: '10px 14px',
          fontSize: 13, color: '#cf1322',
        }}>
          {validationErr}
        </div>
      )}

      {/* ── Action bar (fixed bottom) ── */}
      <div className="action-bar" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {remaining > 0 && (
          <Button
            block fill="outline" color="primary"
            loading={submitting}
            icon={<QuestionCircleOutline />}
            onClick={() => handleSubmit('ASK_INVITER')}
            style={{ fontSize: 13 }}
          >
            Ask Inviter
          </Button>
        )}
        <Button
          block fill="solid" color="warning"
          loading={submitting}
          icon={<CloseCircleOutline />}
          onClick={() => handleSubmit('REFUSE')}
          style={{ fontSize: 13 }}
        >
          Refuse
        </Button>
        <Button
          block fill="solid" color="danger"
          loading={submitting}
          icon={<StopOutline />}
          onClick={() => handleSubmit('BLACKLIST')}
          style={{ fontSize: 13 }}
        >
          Blacklist
        </Button>
        <Button
          block fill="solid" color="success"
          loading={submitting}
          icon={<CheckCircleOutline />}
          onClick={() => handleSubmit('APPROVE')}
          style={{ fontSize: 13, gridColumn: remaining > 0 ? 'auto' : '1 / -1' }}
        >
          Approve
        </Button>
      </div>

    </div>
  )
}

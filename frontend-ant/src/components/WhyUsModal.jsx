import React from 'react'
import { Modal, Typography } from 'antd'
import { useTranslation } from 'react-i18next'

const { Text, Title, Paragraph } = Typography

const ACCENT   = '#1677ff'
const GOLD     = '#d46b08'
const DARK_BG  = '#0d1117'
const DARK2    = '#161b22'
const CARD_BG  = '#f8faff'
const CARD_BORDER = '#e6eeff'

/* ── Helpers ────────────────────────────────────────────────────────────────── */
function Section({ accent = ACCENT, title, children }) {
  return (
    <div style={{ borderLeft: `4px solid ${accent}`, paddingLeft: 18, marginBottom: 28 }}>
      <Title level={4} style={{ marginBottom: 8, marginTop: 0 }}>{title}</Title>
      {children}
    </div>
  )
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div style={{
      background: CARD_BG, border: `1px solid ${CARD_BORDER}`,
      borderRadius: 10, padding: '16px 18px', flex: '1 1 calc(33% - 12px)',
      minWidth: 200,
    }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>{title}</Text>
      <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.5 }}>{desc}</Text>
    </div>
  )
}

function Stat({ value, label }) {
  return (
    <div style={{ textAlign: 'center', flex: '1 1 120px' }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 }}>{label}</div>
    </div>
  )
}

const FEATURES = [
  { icon: '🔓', tk: 'whyUs.f1title', dk: 'whyUs.f1desc' },
  { icon: '⚙️', tk: 'whyUs.f2title', dk: 'whyUs.f2desc' },
  { icon: '👥', tk: 'whyUs.f3title', dk: 'whyUs.f3desc' },
  { icon: '📋', tk: 'whyUs.f4title', dk: 'whyUs.f4desc' },
  { icon: '🌍', tk: 'whyUs.f5title', dk: 'whyUs.f5desc' },
  { icon: '📶', tk: 'whyUs.f6title', dk: 'whyUs.f6desc' },
]

/* ── Main ───────────────────────────────────────────────────────────────────── */
export default function WhyUsModal({ open, onClose }) {
  const { t } = useTranslation()

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={onClose}
      title={null}
      width={860}
      styles={{ body: { padding: 0, overflowY: 'auto', maxHeight: '82vh' } }}
      footer={null}
    >

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${DARK_BG} 0%, #0f2044 60%, #1a1040 100%)`,
        padding: '40px 48px 36px',
        borderRadius: '8px 8px 0 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`,
        }} />
        <div style={{
          position: 'absolute', bottom: -40, right: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: `${ACCENT}0d`,
        }} />

        <Text style={{ color: '#8b949e', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, display: 'block', marginBottom: 10 }}>
          {t('whyUs.heroSuper')}
        </Text>
        <Title level={2} style={{ color: '#fff', margin: '0 0 10px', lineHeight: 1.2 }}>
          {t('whyUs.heroTitle')}
        </Title>
        <Paragraph style={{ color: '#c9d1d9', fontSize: 14, marginBottom: 0, maxWidth: 580 }}>
          {t('whyUs.heroText')}
        </Paragraph>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: '32px 48px 40px', background: '#fff' }}>

        <Section accent={GOLD} title={t('whyUs.problemTitle')}>
          <Paragraph style={{ fontSize: 13, color: '#4a4a4a', marginBottom: 0 }}>
            {t('whyUs.problemText')}
          </Paragraph>
        </Section>

        <Section accent={ACCENT} title={t('whyUs.solutionTitle')}>
          <Paragraph style={{ fontSize: 13, color: '#4a4a4a', marginBottom: 8 }}>
            {t('whyUs.solutionText1')}
          </Paragraph>
          <Paragraph style={{ fontSize: 13, color: '#4a4a4a', marginBottom: 0 }}>
            {t('whyUs.solutionText2')}
          </Paragraph>
        </Section>

        <Section accent='#531dab' title={t('whyUs.diffTitle')}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
            {FEATURES.map(({ icon, tk, dk }) => (
              <FeatureCard key={tk} icon={icon} title={t(tk)} desc={t(dk)} />
            ))}
          </div>
        </Section>

        <div style={{
          background: DARK2,
          borderRadius: 12,
          padding: '28px 32px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
          justifyContent: 'space-around',
          marginBottom: 28,
        }}>
          <Stat value="6"    label={t('whyUs.statsLocations')} />
          <Stat value="5"    label={t('whyUs.statsRoles')} />
          <Stat value="44K+" label={t('whyUs.statsCheckins')} />
          <Stat value="100%" label={t('whyUs.statsAudit')} />
        </div>

        <Section accent={ACCENT} title={t('whyUs.ctaTitle')}>
          <Paragraph style={{ fontSize: 13, color: '#4a4a4a', marginBottom: 8 }}>
            {t('whyUs.ctaText')}
          </Paragraph>
          <div style={{
            background: `linear-gradient(135deg, ${ACCENT}0f, #531dab0d)`,
            border: `1px solid ${ACCENT}30`,
            borderRadius: 10, padding: '14px 18px',
            fontSize: 13, color: '#1d1d1d', fontStyle: 'italic',
          }}>
            {t('whyUs.ctaQuote')}
          </div>
        </Section>

      </div>
    </Modal>
  )
}

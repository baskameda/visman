import React from 'react'
import { Modal, Tabs, Typography, Tag, Table, Divider } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'

const { Text, Title, Paragraph } = Typography
const Metric = ({ value, label, color = '#1677ff' }) => (
  <div style={{ textAlign: 'center', padding: '12px 20px', background: color + '10', borderRadius: 10, border: `1px solid ${color}30` }}>
    <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
    <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
  </div>
)

const comparisonData = [
  { feature: 'Real-time task updates',          poc: true,  paper: false, saas: true  },
  { feature: 'Role-based workflow',             poc: true,  paper: false, saas: true  },
  { feature: 'Full audit trail',                poc: true,  paper: false, saas: true  },
  { feature: 'On-premise deployment',           poc: true,  paper: true,  saas: false },
  { feature: '6 languages built-in',            poc: true,  paper: false, saas: false },
  { feature: 'Zero vendor lock-in',             poc: true,  paper: true,  saas: false },
  { feature: 'Custom BPMN workflows',           poc: true,  paper: false, saas: false },
  { feature: 'Visitor blacklist & scoring',     poc: true,  paper: false, saas: false },
  { feature: 'Gamification & insights',         poc: true,  paper: false, saas: false },
  { feature: 'Multi-visitor invitations',       poc: true,  paper: false, saas: true  },
  { feature: 'Supervisor override hierarchy',   poc: true,  paper: false, saas: false },
  { feature: 'Multi-location facility support', poc: true,  paper: false, saas: false },
  { feature: 'Interactive map with coordinates',poc: true,  paper: false, saas: false },
  { feature: 'In-browser label editing',        poc: true,  paper: false, saas: false },
  { feature: 'Mobile PWA for security officers',poc: true,  paper: false, saas: false },
  { feature: 'Month-grouped invitation history', poc: true, paper: false, saas: false },
  { feature: 'Offline-first mobile for gatekeepers', poc: true, paper: false, saas: false },
  { feature: 'GPS-stamped check-ins',                poc: true, paper: false, saas: false },
  { feature: 'Multi-site / global deployment',       poc: true, paper: false, saas: true  },
  { feature: 'Location-scoped role assignments & supervisor hierarchies', poc: true, paper: false, saas: false },
  { feature: 'Licence-controlled feature activation (AES-256-GCM .lic file)', poc: true, paper: false, saas: false },
  { feature: 'Admin QA notes & support test summary per role',               poc: true, paper: false, saas: false },
  { feature: 'WCAG 2.1 AA / European Accessibility Act compliant',           poc: true, paper: false, saas: false },
]

const TABS = [
  {
    key: 'exec', label: 'Executive Summary',
    children: (
      <div>
        <Paragraph style={{ fontSize: 13 }}>
          This POC demonstrates a complete, production-ready visitor management workflow built on open-source
          BPM technology. It eliminates the security gaps, compliance risk, and inefficiency of paper-based
          or ad-hoc visitor management — while remaining fully under your control, on your infrastructure.
        </Paragraph>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <Metric value="5" label="Coordinated roles" color="#1677ff" />
          <Metric value="6" label="Global locations" color="#d46b08" />
          <Metric value="214" label="Demo users" color="#531dab" />
          <Metric value="100%" label="Audit trail" color="#389e0d" />
        </div>
        <Paragraph style={{ fontSize: 13 }}>
          The system orchestrates five roles — <strong>Inviter</strong>, <strong>Supervisor</strong>, <strong>Security</strong>, <strong>Gatekeeper</strong>, and <strong>Admin</strong> — through
          a fully automated BPMN process. Every action is logged, every decision is traceable, and every
          escalation path is built in.
        </Paragraph>
        <Paragraph style={{ fontSize: 13 }}>
          The included demo dataset spans <strong>6 global offices</strong>, <strong>60 entrances</strong>, <strong>3 000 visitors</strong>,
          and <strong>~44 000 check-in records</strong> generated across one full year of simulated activity —
          providing a realistic load profile for evaluation and stress testing out of the box.
        </Paragraph>
      </div>
    ),
  },
  {
    key: 'benefits', label: 'Key Benefits',
    children: (
      <div>
        <Title level={5}>Operational</Title>
        {[
          'End-to-end visibility — live process flow visible to all roles at all times',
          'Real-time SSE notifications — instant task updates, no manual polling',
          'Multi-visitor invitations — one form, N visitors, N security checks in parallel',
          'Reliability scoring — data-driven security decisions with historical context',
          'Supervisor oversight — escalation path without disrupting the primary workflow',
          'Multi-site ready — locations with independent entrance rosters, gatekeeper pools, and supervisor hierarchies',
        ].map(b => (
          <div key={b} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <CheckOutlined style={{ color: '#52c41a', marginTop: 2 }} />
            <Text style={{ fontSize: 13 }}>{b}</Text>
          </div>
        ))}
        <Divider />
        <Title level={5}>IT & Compliance</Title>
        {[
          'Full audit trail — every action timestamped and persisted in SQL Server',
          'No vendor lock-in — open-source Operaton BPM engine (Camunda 7 fork)',
          'On-premise deployment — visitor data never leaves your infrastructure',
          'i18n out of the box — 6 languages, labels editable in-browser without deployment',
          'Blacklist enforcement — flagged visitors automatically blocked at invitation creation',
          'Licence management — AES-256-GCM encrypted .lic files control which feature sets are active; admin generates, verifies, and applies licences without code changes',
          'WCAG 2.1 AA / EAA compliant — keyboard navigation, screen-reader landmarks, focus management, skip-to-content, reduced-motion support, and accessible colour contrast across all 6 languages meet European Accessibility Act requirements',
        ].map(b => (
          <div key={b} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <CheckOutlined style={{ color: '#52c41a', marginTop: 2 }} />
            <Text style={{ fontSize: 13 }}>{b}</Text>
          </div>
        ))}
        <Divider />
        <Title level={5}>Organisational</Title>
        {[
          'Flat supervisor hierarchy — managers can answer security questions or take over invitations',
          'Gatekeeper insights — streak tracking, on-time rate, busiest hour, rank progression',
          'Inviter gamification — milestones, approval rate badges, invitation streaks',
          'Org-level dashboard — admin overview of all active processes and user activity',
          'Mobile PWA for Security Officers — native-feel app installable on any smartphone',
          'Month-grouped invitation history — lazy-loaded per month, current month always at top',
          'Offline-first gatekeeper app — check-ins work without internet, GPS coordinates captured',
          'My Performance page — role-specific gamification stats on a dedicated /performance route',
          'Auto-logout after 9 hours — session timer shown in header with colour-coded urgency',
          'Role adoption pages — per-role consensus modals (Inviter / Security / Gatekeeper) listing 5 newly-possible capabilities with mobile-app callout; fully translated in 6 languages',
          'Why Us modal — cinematic brochure-style marketing page on the login screen; translated in 6 languages',
        ].map(b => (
          <div key={b} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <CheckOutlined style={{ color: '#52c41a', marginTop: 2 }} />
            <Text style={{ fontSize: 13 }}>{b}</Text>
          </div>
        ))}
      </div>
    ),
  },
  {
    key: 'supervisor', label: 'Supervisor Feature',
    children: (
      <div>
        <Paragraph style={{ fontSize: 13 }}>
          The supervisor hierarchy addresses a critical operational gap: <em>what happens when a key inviter is
          unavailable and security is waiting for a clarification answer?</em> Instead of escalation by email
          or Slack, the supervisor can step in directly within the system.
        </Paragraph>
        <Title level={5}>How It Works</Title>
        {[
          ['Assigned by admin', 'One supervisor per inviter, configurable at any time. Stored permanently in the database — not a session-level setting.'],
          ['Read-only view', 'Supervisors see all their supervisees\' invitations in a dedicated tab, clearly labelled with the original inviter name.'],
          ['Answer without claiming', 'If security is waiting for a clarification, the supervisor can answer the question directly. The invitation stays with the original inviter.'],
          ['Claim when needed', 'If the inviter is unavailable for the entire process, the supervisor can permanently claim the invitation. The original inviter sees it as read-only.'],
          ['No unclaim', 'Claims are permanent — creating an unambiguous ownership trail for audit purposes.'],
        ].map(([title, desc]) => (
          <div key={title} style={{ marginBottom: 12 }}>
            <Text strong style={{ fontSize: 13 }}>{title}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{desc}</Text>
          </div>
        ))}
      </div>
    ),
  },
  {
    key: 'comparison', label: 'Competitive Edge',
    children: (
      <div>
        <Table
          size="small"
          dataSource={comparisonData}
          pagination={false}
          columns={[
            { title: 'Feature', dataIndex: 'feature', key: 'feature', render: v => <Text style={{ fontSize: 13 }}>{v}</Text> },
            { title: 'This POC', dataIndex: 'poc',   key: 'poc',   render: v => v ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CloseOutlined style={{ color: '#ff4d4f' }} /> },
            { title: 'Paper/Email', dataIndex: 'paper', key: 'paper', render: v => v ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CloseOutlined style={{ color: '#ff4d4f' }} /> },
            { title: 'Generic SaaS', dataIndex: 'saas', key: 'saas', render: v => v ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CloseOutlined style={{ color: '#ff4d4f' }} /> },
          ]}
          rowKey="feature"
        />
      </div>
    ),
  },
  {
    key: 'roadmap', label: 'Adoption Path',
    children: (
      <div>
        {[
          {
            phase: 'POC (Now)', color: '#1677ff',
            items: [
              'React + Spring Boot + Operaton (open-source)',
              'Multi-visitor invitations with parallel security checks',
              'Full clarification loop with auto-refuse at 5 attempts',
              'Supervisor hierarchy (Inviter, Security, Gatekeeper) — oversight without disruption',
              'Multi-location support — each location has its own entrances and gatekeepers',
              'Interactive location map with coordinate picker (Leaflet, centered on Europe)',
              'Check-in analytics chart per entrance per day (D3 stacked bar)',
              'Gatekeeper lazy-loading weekly calendar',
              '6 languages + live label editor',
              'Gamification & org dashboard',
              'Mobile PWA for Security Officers — installable, works offline, HTTPS',
              'Month-grouped invitation history with lazy loading per month',
              'Login role filter — location → role → name search for fast user selection',
              'Offline-first gatekeeper PWA — check-ins work without internet, GPS coordinates captured, auto-sync on reconnect',
              'Multi-site deployment — 6 global offices pre-loaded (Commanders Desk, Paris, Rome, London, Beijing, Los Angeles); 214 users, 60 entrances, ~44 000 check-in records across one year of simulated activity',
              'Licence management — admin generates encrypted .lic files (AES-256-GCM) to control which of the four feature sets (Security, Inviter, Gatekeeper, Gamification) are active; feature gating enforced at route, nav, and API layers with auto-logout on deactivation',
              'QA documentation — role-aware test summary modal for support staff classifying regressions vs. new defects',
            ],
          },
          {
            phase: 'Pilot', color: '#d46b08',
            items: [
              'Docker Compose one-command deployment',
              'AD / LDAP integration for user provisioning',
              'Email notifications at key workflow steps',
              'HTTPS + reverse proxy configuration',
              'Multi-level supervisor hierarchy (if needed)',
              'Extended reporting & CSV export',
            ],
          },
          {
            phase: 'Production', color: '#389e0d',
            items: [
              'Custom BPMN extensions for organisation-specific rules',
              'Badge / QR-code reader integration for gatekeeper',
              'SLA monitoring & automated escalation alerts',
              'Backup, DR, and data retention policies',
              'Full audit export for compliance reporting',
              'SSO / OAuth2 for enterprise login',
            ],
          },
        ].map(({ phase, color, items }) => (
          <div key={phase} style={{ marginBottom: 20 }}>
            <Tag color={color} style={{ fontWeight: 700, marginBottom: 8 }}>{phase}</Tag>
            {items.map(item => (
              <div key={item} style={{ display: 'flex', gap: 8, marginBottom: 4, paddingLeft: 8 }}>
                <Text style={{ color, fontSize: 13 }}>›</Text>
                <Text style={{ fontSize: 13 }}>{item}</Text>
              </div>
            ))}
          </div>
        ))}
      </div>
    ),
  },
]

export default function SalesDocsModal({ open, onClose }) {
  return (
    <Modal open={open} onCancel={onClose} onOk={onClose} title="Sales & Marketing" width={820}
      styles={{ body: { maxHeight: '75vh', overflowY: 'auto', padding: '0 24px 16px' } }}>
      <Tabs items={TABS} size="small" />
    </Modal>
  )
}

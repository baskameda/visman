import React from 'react'
import { Modal, Tabs, Typography, Tag, Table, Alert, Divider } from 'antd'
import {
  CheckCircleOutlined, CloseCircleOutlined, WarningOutlined,
  BugOutlined, ApiOutlined,
} from '@ant-design/icons'

const { Text, Title, Paragraph } = Typography

const C   = ({ children }) => <code style={{ background: '#f5f5f5', padding: '1px 5px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace' }}>{children}</code>
const Pre = ({ n, result, children }) => (
  <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
    <Tag style={{ minWidth: 24, textAlign: 'center', fontWeight: 700, flexShrink: 0 }}>{n}</Tag>
    <div style={{ flex: 1 }}>
      <Text style={{ fontSize: 13 }}>{children}</Text>
      {result && (
        <div style={{ marginTop: 4, paddingLeft: 8, borderLeft: '2px solid #52c41a' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
            {result}
          </Text>
        </div>
      )}
    </div>
  </div>
)

const Scenario = ({ id, title, steps, expected, severity = 'error' }) => {
  const color = severity === 'error' ? '#ff4d4f' : severity === 'warning' ? '#fa8c16' : '#d46b08'
  const icon  = severity === 'error' ? <CloseCircleOutlined /> : <WarningOutlined />
  return (
    <div style={{ marginBottom: 20, background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8, padding: '14px 16px' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
        <Tag color={color} style={{ fontWeight: 700 }}>CP-{id}</Tag>
        <Text strong style={{ fontSize: 13 }}>{title}</Text>
        <span style={{ marginLeft: 'auto', color, fontSize: 13 }}>{icon}</span>
      </div>
      <div style={{ marginBottom: 8 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            <Text type="secondary" style={{ fontSize: 12, minWidth: 16 }}>{i + 1}.</Text>
            <Text style={{ fontSize: 12 }}>{s}</Text>
          </div>
        ))}
      </div>
      <div style={{ paddingLeft: 8, borderLeft: `2px solid ${color}` }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          <strong>Expected: </strong>{expected}
        </Text>
      </div>
    </div>
  )
}

// ── Overview ──────────────────────────────────────────────────────────────────
const devTestData = [
  { file: 'SillyBlacklistCheckerTest',     type: 'Unit',       methods: 11,   executions: '~17', target: '100%', covers: 'Blacklist delegate: reliability=70, null/empty names, BPMN gateway (>30)' },
  { file: 'SillyCheckinServiceTest',       type: 'Unit',       methods: '~10',executions: '~10', target: '100%', covers: 'Check-in delegate: checkedIn=true, reads VName/VDate/reliability' },
  { file: 'TaskEventServiceTest',          type: 'Unit',       methods: '~15',executions: '~15', target: '≥95%', covers: 'SSE service: subscribe, detectAndBroadcast, snapshot diff' },
  { file: 'SseControllerTest',             type: 'Unit',       methods: '~8', executions: '~8',  target: '≥85%', covers: 'GET /api/sse/tasks: emitter creation, headers' },
  { file: 'WebSecurityConfigTest',         type: 'Unit',       methods: '~6', executions: '~6',  target: '≥85%', covers: 'CORS, permitAll /api/**, CSRF disabled' },
  { file: 'AppConfigTest',                 type: 'Unit',       methods: '~4', executions: '~4',  target: '≥85%', covers: 'Spring context beans' },
  { file: 'OperatonInitializerConfigTest', type: 'Unit',       methods: '~4', executions: '~4',  target: '≥85%', covers: 'BPM engine initialization' },
  { file: 'VisitorApplicationTest',        type: 'Structural', methods: 4,    executions: 4,     target: '100%', covers: '@SpringBootApplication, main()' },
]
const devTestColumns = [
  { title: 'Test Class', dataIndex: 'file', key: 'file', render: v => <C>{v}</C>, width: 220 },
  { title: 'Type', dataIndex: 'type', key: 'type', width: 80, render: v => <Tag>{v}</Tag> },
  { title: '@Test', dataIndex: 'methods', key: 'methods', width: 70, align: 'center' },
  { title: 'Coverage target', dataIndex: 'target', key: 'target', width: 120 },
  { title: 'What it covers', dataIndex: 'covers', key: 'covers', render: v => <Text style={{ fontSize: 12 }}>{v}</Text> },
]

const OverviewTab = () => (
  <div>
    <Title level={5}>Scope</Title>
    <Paragraph style={{ fontSize: 13 }}>
      This manual test plan covers the <strong>Gatekeeper Dashboard</strong> (<C>/gatekeeper</C>) and the backend
      REST endpoints it exercises. It verifies the two-tier lazy-loading calendar, the check-in flow, and
      the date-discrepancy safeguards.
    </Paragraph>
    <Title level={5}>Pre-conditions</Title>
    {[
      'Backend running on http://localhost:8080',
      'Frontend running on http://localhost:5174',
      'SQL Server reachable; Liquibase migrations 001–019 applied',
      'gatekeeper1 is assigned to at least one entrance; at least one PENDING visit exists for that entrance',
      'Test accounts: gatekeeper1 / porter123 (Porters group), inviter1 / inviter123',
      'Browser DevTools available (Network, Application tabs)',
      'For licence feature gating tests: a .lic file with Gatekeeper disabled and/or Gamification disabled is required',
    ].map((p, i) => (
      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>{i + 1}.</Text>
        <Text style={{ fontSize: 12 }}>{p}</Text>
      </div>
    ))}
    <Divider />
    <Title level={5}>
      <BugOutlined style={{ marginRight: 6, color: '#d46b08' }} />
      Developer Test Coverage — as of 2026-03-08
    </Title>
    <Alert
      type="error" showIcon style={{ marginBottom: 12 }}
      message="Coverage gap — no VisitController or repository tests"
      description={
        <Text style={{ fontSize: 12 }}>
          All 8 existing test classes target infrastructure and delegate classes. There are{' '}
          <strong>zero tests</strong> for VisitController, VisitRepository, the date-index query, or the
          check-in endpoint. Manual testing is the only verification gate for the Gatekeeper workflow.
        </Text>
      }
    />
    <Table dataSource={devTestData} columns={devTestColumns} size="small" pagination={false} rowKey="file" scroll={{ x: 800 }} />
    <Text type="secondary" style={{ fontSize: 11, marginTop: 8, display: 'block' }}>
      Run <C>./gradlew test jacocoTestReport</C> — report at <C>backend/build/reports/jacoco/test/html/index.html</C>
    </Text>
  </div>
)

// ── Happy Path ────────────────────────────────────────────────────────────────
const HappyPathTab = () => (
  <div>
    <Alert type="info" showIcon style={{ marginBottom: 16 }}
      message="Execute steps in order. At least one approved, PENDING visit must exist before starting." />

    <Title level={5}>HP-1 — Login & Dashboard Load</Title>
    <Pre n={1} result="Gatekeeper Dashboard renders. 'My Entrances' card shows assigned entrance(s). Month accordion visible.">
      Open <C>http://localhost:5174</C>. Log in as <C>gatekeeper1 / porter123</C>.
    </Pre>
    <Pre n={2} result="GET /api/visits/my/date-index returns 200. GET /api/entrances/my returns 200. No JS errors.">
      Open DevTools → Network. Verify both API calls complete.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-2 — Month & Week Auto-expand</Title>
    <Pre n={3} result="The month containing today (or the closest month with visits) is expanded automatically. The week closest to today is also pre-expanded.">
      Observe the accordion without clicking anything.
    </Pre>
    <Pre n={4} result="GET /api/visits/my?from=...&to=... fires for the auto-expanded week. Visit rows appear in the table.">
      Check DevTools → Network for the week-range fetch triggered on mount.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-3 — Lazy Load Another Week</Title>
    <Pre n={5} result="GET /api/visits/my?from=...&to=... fires only once for that week. Data cached — no duplicate request on collapse+expand.">
      Click a different week to expand it.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-4 — Check In a Visitor</Title>
    <Pre n={6} result="Check-in modal opens showing visitor name, company, date, entrance, and invited-by fields.">
      Find a PENDING visit for today. Click <strong>Check In</strong>.
    </Pre>
    <Pre n={7} result="PUT /api/visits/{id}/checkin returns 200. Modal closes. Row status changes to CHECKED_IN (green). Date-index refreshes (pending count decreases by 1).">
      Click <strong>Confirm Check In</strong> in the modal.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-5 — Auto-refresh</Title>
    <Pre n={8} result="After 60 seconds, GET /api/visits/my/date-index fires automatically. Open week data is refreshed silently in the background.">
      Wait 60 seconds without clicking anything. Observe Network tab.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-6 — Performance Panel</Title>
    <Pre n={9} result="Panel expands. Stats load: check-in streak, count today, on-time rate, busiest hour. No errors.">
      If a Performance panel is shown (collapsed by default), expand it.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-7 — Licence Status Box on Login</Title>
    <Pre n={10} result="Green 'PoC mode' banner visible on login page when no licence is loaded.">
      Log out. Verify Admin → Licence Mgmt shows no file. Observe login page.
    </Pre>
    <Pre n={11} result="Blue licence box shows 'Licensed to: [issuer]' + date + Gatekeeper tag with green checkmark.">
      As admin, upload a .lic file with Gatekeeper enabled. Log back in as <C>gatekeeper1</C>.
    </Pre>

    <Divider />
    <Text type="secondary" style={{ fontSize: 12 }}>
      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
      Happy path complete. All 11 steps passed = release gate cleared for the nominal Gatekeeper flow.
    </Text>
  </div>
)

// ── Critical Path ─────────────────────────────────────────────────────────────
const CriticalPathTab = () => (
  <div>
    <Alert type="warning" showIcon style={{ marginBottom: 16 }}
      message="Reset to clean state (logout/login) between scenarios where indicated." />

    <Scenario
      id="01" severity="warning"
      title="Check in on a past date — warning shown"
      steps={[
        'Locate a PENDING visit whose visitDate is earlier than today (use seed data or create a visit in the past).',
        'Click Check In.',
      ]}
      expected="Modal opens. A warning Alert appears: 'This visit was scheduled N day(s) ago… Are you sure?'. Check-in is still possible after reading the warning. Confirmation proceeds normally."
    />

    <Scenario
      id="02" severity="warning"
      title="Check in on a future date — warning shown"
      steps={[
        'Locate a PENDING visit whose visitDate is in the future.',
        'Click Check In.',
      ]}
      expected="Modal shows Alert: 'This visit is scheduled N day(s) in the future… Are you sure?'. Check-in can still be confirmed. Visit status updates to CHECKED_IN."
    />

    <Scenario
      id="03" severity="error"
      title="Double check-in — 409 Conflict"
      steps={[
        'Check in a visit normally (HP-4).',
        'Without refreshing, attempt to click Check In on the same visit row.',
      ]}
      expected="Check In button is absent (status = CHECKED_IN — no button rendered). If somehow triggered: PUT /api/visits/{id}/checkin returns 409. Error shown: 'This visit is already checked in.'"
    />

    <Scenario
      id="04" severity="warning"
      title="No entrances assigned — empty state"
      steps={[
        'As admin, remove gatekeeper1 from all entrance assignments.',
        'Log in as gatekeeper1.',
      ]}
      expected="'My Entrances' card shows: 'No entrances assigned yet.' Month accordion is empty or shows no pending visits. No error thrown."
    />

    <Scenario
      id="05" severity="warning"
      title="No visits for current week — empty table"
      steps={[
        'Expand the current week in the accordion when no visits exist for that week.',
      ]}
      expected="GET /api/visits/my?from=...&to=... returns empty array. Table renders with 'No visits for this week.' locale text. No crash."
    />

    <Scenario
      id="06" severity="error"
      title="Network failure during check-in"
      steps={[
        'Open the check-in modal for a PENDING visit.',
        'Open DevTools → Network → set throttling to Offline.',
        'Click Confirm Check In.',
      ]}
      expected="Error Alert shown in modal: 'Failed to check in…'. Visit status remains PENDING. Modal stays open so the user can retry once network is restored."
    />

    <Scenario
      id="07" severity="warning"
      title="Supervisor tab — check in on supervisee's visit"
      steps={[
        'Ensure gatekeeper1 has a gatekeeper supervisor assigned.',
        'Log in as the supervisor.',
        'Switch to the Supervised tab. Find a PENDING visit belonging to a supervisee.',
        'Click Check In.',
      ]}
      expected="PUT /api/visits/{id}/checkin returns 200. checked_in_by in DB records the supervisor's username (not the supervisee's). Visit status = CHECKED_IN in both Supervised and the supervisee's My Visits tab."
    />

    <Scenario
      id="08" severity="warning"
      title="loadingLock prevents duplicate week fetch"
      steps={[
        'Collapse and immediately re-expand the same week panel twice in rapid succession.',
      ]}
      expected="Only one GET /api/visits/my?from=...&to=... request fires (not two). DevTools Network shows a single call. The loadingLock ref blocks the second fetch while the first is in flight."
    />

    <Scenario
      id="09" severity="error"
      title="Gatekeeper feature disabled — workflow blocked"
      steps={[
        'Log in as admin. Upload a .lic file with Gatekeeper disabled.',
        'Log out. Log in as gatekeeper1.',
      ]}
      expected="The /gatekeeper route renders the FeatureNotLicensed page ('Gate Entry is not enabled'). Sidebar hides the Gatekeeper nav item. Axios interceptor blocks /api/visits/my** and /api/entrances/my calls with 403 isLicenceBlock."
    />

    <Scenario
      id="10" severity="error"
      title="Auto-logout when Gatekeeper feature deactivated mid-session"
      steps={[
        'Log in as gatekeeper1 in Tab A. In Tab B, log in as admin.',
        'In Tab B: Licence Mgmt → Verify card → disable Gatekeeper feature toggle.',
        'Switch to Tab A.',
      ]}
      expected="gatekeeper1 is automatically logged out and redirected to /login."
    />

    <Scenario
      id="11" severity="warning"
      title="Gamification feature disabled — My Performance blocked"
      steps={[
        'Upload a .lic file with Gamification feature disabled.',
        'Log in as gatekeeper1.',
        'Click the My Performance nav item (if visible).',
      ]}
      expected="The My Performance nav item is hidden from the sidebar (ITEM_FEATURE map filters it). Navigating to /performance directly renders the FeatureNotLicensed page. GreetingOverlay does not appear on login."
    />

    <Scenario
      id="12" severity="warning"
      title="Login page quick-fill hides unlicensed Gatekeeper role"
      steps={[
        'Ensure a licence is loaded with Gatekeeper disabled.',
        'On the login page, select a location in the quick-fill.',
        'Observe the role filter pills.',
      ]}
      expected="Gatekeeper role pill is absent. Licence box shows grey lock on the Gatekeeper tag."
    />

    <Divider orientation="left" style={{ fontSize: 12, color: '#595959' }}>Accessibility</Divider>

    <Scenario
      id="A1" severity="warning"
      title="Check-in confirmation modal keyboard operation"
      steps={[
        'Log in as gatekeeper1. Navigate to a PENDING visit using Tab.',
        'Press Enter on the Check In button to open the confirmation modal.',
        'Tab to "Confirm Check In" and press Enter.',
      ]}
      expected="Modal opens and receives focus. Both Confirm and Cancel are reachable via Tab. Enter on Confirm submits the check-in. Focus returns to the calendar after close."
    />

    <Scenario
      id="A2" severity="warning"
      title="Auto-refresh pause button keyboard toggle"
      steps={[
        'Log in as gatekeeper1.',
        'Find the auto-refresh pause button in the dashboard header.',
        'Tab to it and press Space or Enter to toggle pause.',
        'Observe aria-pressed value (DevTools → Accessibility tree).',
      ]}
      expected="Button is reachable via Tab. Space/Enter toggles the paused state. aria-pressed changes from false to true (paused) and back. The 60-second refresh interval stops when paused."
    />

    <Scenario
      id="A3" severity="warning"
      title="Skip-to-content and page title announcement"
      steps={[
        'Load the Gatekeeper Dashboard. Press Tab once before clicking anything.',
        'Press Enter on the skip link.',
      ]}
      expected="Skip-to-content link visible at top of viewport on first Tab. Enter moves focus to id='main-content' (the calendar area). Browser tab title reads 'Gatekeeper Dashboard — VisMan' (or locale equivalent)."
    />

    <Divider />
    <Text type="secondary" style={{ fontSize: 12 }}>
      <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 4 }} />
      Any CP scenario that does not produce the expected result must be logged as a <strong>blocking bug</strong> before release.
    </Text>
  </div>
)

// ── API Coverage ──────────────────────────────────────────────────────────────
const apiData = [
  { method: 'GET', path: '/api/visits/my/date-index',           happy: 'HP-1,5', critical: '—',     notes: 'Lightweight count-per-date index; drives accordion structure' },
  { method: 'GET', path: '/api/visits/my?from=&to=',           happy: 'HP-2,3',  critical: 'CP-05', notes: 'Full visit rows for a single week; lazy-loaded on expand' },
  { method: 'GET', path: '/api/entrances/my',                   happy: 'HP-1',   critical: 'CP-04', notes: 'Entrances assigned to the logged-in gatekeeper' },
  { method: 'PUT', path: '/api/visits/{id}/checkin',            happy: 'HP-4',   critical: 'CP-03,06', notes: 'Mark visit CHECKED_IN; records checked_in_by, timestamp' },
  { method: 'GET', path: '/api/visits/supervisees',             happy: '—',      critical: 'CP-07', notes: 'Supervisor only: visits for all supervisee entrances' },
  { method: 'GET', path: '/api/supervisor/gatekeeper/supervisees', happy: '—',  critical: 'CP-07', notes: 'List of supervisee usernames for the logged-in supervisor' },
  { method: 'GET', path: '/engine-rest/identity/verify',        happy: 'HP-1',   critical: '—',     notes: 'Credential check on login' },
]

const apiColumns = [
  { title: 'Method', dataIndex: 'method', key: 'method', width: 80,
    render: v => <Tag color={{ GET:'blue', PUT:'orange' }[v] ?? 'green'} style={{ fontWeight: 700, fontSize: 11 }}>{v}</Tag> },
  { title: 'Endpoint', dataIndex: 'path', key: 'path', render: v => <C>{v}</C> },
  { title: 'Happy Path', dataIndex: 'happy', key: 'happy', width: 90, render: v => <Text style={{ fontSize: 12, color: '#389e0d' }}>{v}</Text> },
  { title: 'Critical Path', dataIndex: 'critical', key: 'critical', width: 120, render: v => <Text style={{ fontSize: 12, color: '#d46b08' }}>{v}</Text> },
  { title: 'Notes', dataIndex: 'notes', key: 'notes', render: v => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text> },
]

const ApiTab = () => (
  <div>
    <Alert type="info" showIcon style={{ marginBottom: 14 }}
      message="All endpoints are REST (HTTP/JSON). Authentication: HTTP Basic on every request." />
    <Table dataSource={apiData} columns={apiColumns} size="small" pagination={false} rowKey="path" scroll={{ x: 800 }} />
    <Divider />
    <Title level={5}><ApiOutlined style={{ marginRight: 6 }} />Not covered by this test plan</Title>
    {[
      'Inviter and Security workflows — covered in their respective test plans',
      'Admin CRUD endpoints (/api/locations, /api/entrances, /api/supervisor/assignments)',
      'Mobile PWA offline check-in sync (frontend-gate) — tested separately',
      'GPS coordinate capture — only available in the mobile PWA',
      'Licence Management page (generate + verify) — covered in Admin test plan',
      'Licence interceptor: /api/visits/my**, /api/entrances/my**, /api/supervisor/gatekeeper** blocked client-side when Gatekeeper feature is off — no server-side enforcement (PoC scope)',
      'Gamification feature: /api/visits/my-checkins and /api/visits/stats blocked when Gamification feature is off',
    ].map((s, i) => (
      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
        <Text style={{ fontSize: 12 }}>{s}</Text>
      </div>
    ))}
  </div>
)

const TABS = [
  { key: 'overview', label: 'Overview & Coverage', children: <OverviewTab /> },
  { key: 'happy',    label: 'Happy Path',          children: <HappyPathTab /> },
  { key: 'critical', label: 'Critical Path',        children: <CriticalPathTab /> },
  { key: 'api',      label: 'API Coverage',         children: <ApiTab /> },
]

export default function QATestPlanGatekeeperModal({ open, onClose }) {
  return (
    <Modal
      open={open} onCancel={onClose} onOk={onClose}
      title={
        <span>
          <BugOutlined style={{ marginRight: 8, color: '#531dab' }} />
          QA Test Plan — Gatekeeper Workflow
          <Tag color="purple" style={{ marginLeft: 10, fontSize: 11, fontWeight: 600 }}>Manual</Tag>
          <Tag style={{ marginLeft: 4, fontSize: 11 }}>v1.2 · 2026-03-10</Tag>
        </span>
      }
      width={960}
      styles={{ body: { maxHeight: '78vh', overflowY: 'auto', padding: '0 24px 16px' } }}
    >
      <Tabs items={TABS} size="small" />
    </Modal>
  )
}

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

// ── Tab: Overview ─────────────────────────────────────────────────────────────
const devTestData = [
  {
    file: 'SillyBlacklistCheckerTest',
    type: 'Unit',
    methods: 11,
    executions: '~17 (7 parameterised)',
    target: '100% line + branch',
    covers: 'Blacklist delegate: reliability=70 always, null/empty/unicode names, BPMN gateway condition (>30), type=Long',
  },
  {
    file: 'SillyCheckinServiceTest',
    type: 'Unit',
    methods: '~10',
    executions: '~10',
    target: '100% line + branch',
    covers: 'Check-in delegate: sets checkedIn=true, reads VName/VDate/AVDate/reliability/processInstanceId for logging',
  },
  {
    file: 'TaskEventServiceTest',
    type: 'Unit',
    methods: '~15',
    executions: '~15',
    target: '≥ 95% line + branch',
    covers: 'SSE service: subscribe(), detectAndBroadcast(), snapshot diff, broadcast() to emitters, stale emitter cleanup',
  },
  {
    file: 'SseControllerTest',
    type: 'Unit',
    methods: '~8',
    executions: '~8',
    target: '≥ 85%',
    covers: 'GET /api/sse/tasks: emitter creation, subscription registration, response headers',
  },
  {
    file: 'WebSecurityConfigTest',
    type: 'Unit',
    methods: '~6',
    executions: '~6',
    target: '≥ 85%',
    covers: 'CORS allowedOrigins, permitAll on /api/**, HTTP Basic disabled, CSRF disabled',
  },
  {
    file: 'AppConfigTest',
    type: 'Unit',
    methods: '~4',
    executions: '~4',
    target: '≥ 85%',
    covers: 'Spring context beans, @Configuration presence',
  },
  {
    file: 'OperatonInitializerConfigTest',
    type: 'Unit',
    methods: '~4',
    executions: '~4',
    target: '≥ 85%',
    covers: 'BPM engine initialization, ProcessEngineConfiguration bean wiring',
  },
  {
    file: 'VisitorApplicationTest',
    type: 'Structural',
    methods: 4,
    executions: 4,
    target: '100% of testable code',
    covers: '@SpringBootApplication annotation, main() public/static/void, String[] param, package eu.poc.claude',
  },
]

const devTestColumns = [
  { title: 'Test Class', dataIndex: 'file', key: 'file', render: v => <C>{v}</C>, width: 220 },
  { title: 'Type', dataIndex: 'type', key: 'type', width: 80, render: v => <Tag>{v}</Tag> },
  { title: '@Test methods', dataIndex: 'methods', key: 'methods', width: 110, align: 'center' },
  { title: 'Executions', dataIndex: 'executions', key: 'executions', width: 160 },
  { title: 'Coverage target', dataIndex: 'target', key: 'target', width: 160 },
  { title: 'What it covers', dataIndex: 'covers', key: 'covers', render: v => <Text style={{ fontSize: 12 }}>{v}</Text> },
]

const OverviewTab = () => (
  <div>
    <Alert
      type="warning"
      showIcon
      icon={<WarningOutlined />}
      style={{ marginBottom: 16 }}
      message="REST API — not GraphQL"
      description={
        <Text style={{ fontSize: 12 }}>
          The requirement references "GraphQL endpoints." This application exposes <strong>REST endpoints exclusively</strong> via
          Spring Boot controllers. There is no GraphQL layer. All API calls in this test plan refer to REST endpoints.
          If a GraphQL layer is planned for a future release, this test plan must be extended accordingly.
        </Text>
      }
    />

    <Title level={5}>Scope</Title>
    <Paragraph style={{ fontSize: 13 }}>
      This manual test plan covers the <strong>Inviter Dashboard</strong> (<C>/inviter</C>) and the backend REST
      endpoints it exercises. It is intended for pre-release verification to catch production failures and
      critical bugs before they reach end users. The plan defines a <strong>Happy Path</strong> (normal
      operation) and a <strong>Critical Path</strong> (error conditions and edge cases).
    </Paragraph>

    <Title level={5}>Pre-conditions</Title>
    {[
      'Backend running on http://localhost:8080',
      'Frontend running on http://localhost:5174',
      'SQL Server reachable; Liquibase migrations 001–019 applied',
      'At least one Location and one Entrance exist in the database',
      'Test accounts available: inviter1 / inviter123 (Invitors group), security1 / security123 (Security group)',
      'Browser DevTools available (Network, Application, Console tabs)',
      'For licence feature gating tests: a .lic file generated from Admin → Licence Mgmt with the Inviter feature toggled off is required',
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
      type="error"
      showIcon
      style={{ marginBottom: 12 }}
      message="Coverage gap — no controller or repository tests"
      description={
        <Text style={{ fontSize: 12 }}>
          All 8 existing test classes are <strong>unit tests targeting infrastructure and delegate classes</strong>.
          There are <strong>zero tests</strong> for InvitationController, VisitorController, SecurityCheckController,
          VisitController, or any JdbcTemplate repository. The invitation creation flow, blacklist enforcement,
          and BPMN process start are <strong>not covered by automated tests</strong>. JaCoCo's 85% floor is
          met by delegate and SSE classes alone; controller-level coverage is unmeasured. Manual testing is
          therefore the only verification gate for the Inviter workflow.
        </Text>
      }
    />
    <Table
      dataSource={devTestData}
      columns={devTestColumns}
      size="small"
      pagination={false}
      rowKey="file"
      scroll={{ x: 900 }}
      style={{ fontSize: 12 }}
    />
    <Text type="secondary" style={{ fontSize: 11, marginTop: 8, display: 'block' }}>
      * Method count estimated from source line count and class structure. Run{' '}
      <C>./gradlew test jacocoTestReport</C> for exact figures.
      Report: <C>backend/build/reports/jacoco/test/html/index.html</C>
    </Text>
  </div>
)

// ── Tab: Happy Path ───────────────────────────────────────────────────────────
const HappyPathTab = () => (
  <div>
    <Alert type="info" showIcon style={{ marginBottom: 16 }}
      message="Execute these steps in order. Do not proceed to the next step if the expected result is not met." />

    <Title level={5}>HP-1 — Login & Dashboard Load</Title>
    <Pre n={1} result="Inviter Dashboard renders; pending task list visible; SSE status shows 'Live · updated [time]'">
      Open <C>http://localhost:5174</C>. Log in as <C>inviter1 / inviter123</C>.
    </Pre>
    <Pre n={2} result="No JS errors in console. Network tab shows GET /api/invitations/my and GET /engine-rest/task completing with 200.">
      Open browser DevTools → Console. Verify no errors on load.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-2 — Open New Invitation Form</Title>
    <Pre n={3} result="Modal opens. Entrance dropdown is populated (GET /api/entrances returned data). Date pickers visible. Visitor search field empty.">
      Click <strong>New Invitation</strong> button.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-3 — Search and Select a Visitor</Title>
    <Pre n={4} result="Dropdown shows matching results from GET /api/visitors/search?q=...">
      Type at least 2 characters in the visitor search field (e.g. "Test").
    </Pre>
    <Pre n={5} result="Visitor tag appears in the selection area. Search field clears.">
      Select a visitor from the results.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-4 — Fill and Submit Invitation</Title>
    <Pre n={6} result="Date fields populated; no validation error shown.">
      Set start date = today, end date = today + 2. Select any entrance from the dropdown.
    </Pre>
    <Pre n={7} result="POST /api/invitations returns 201. Modal closes. Success notification displayed. BPMN process instance created (verify in Operaton Cockpit if needed).">
      Click <strong>Submit Invitation</strong>.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-5 — SSE Live Update</Title>
    <Pre n={8} result="New task card appears without page refresh. Card shows visitor name and planned date. SSE timestamp updates.">
      Observe the dashboard (do not refresh). Wait up to 5 seconds.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-6 — Complete the Invitation Form Task</Title>
    <Pre n={9} result="Task form modal opens with the invitation details pre-filled.">
      Click <strong>Fill Invitation Form</strong> on the new task card.
    </Pre>
    <Pre n={10} result="POST /engine-rest/task/{id}/complete returns 204. Task card disappears from 'Pending' list. Security check created (visible to security1).">
      Complete the form and submit.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-7 — Verify Invitation History</Title>
    <Pre n={11} result="Current month panel shows the new invitation. Status = 'In Progress'. Visitor name and date range correct.">
      Navigate to <strong>History</strong> in the sidebar. Expand the current month.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-8 — Licence Status Box on Login</Title>
    <Pre n={12} result="A green 'PoC mode — no licence loaded, all features available' banner is visible inside the login card, above the Sign In heading.">
      Log out. Verify no licence file is loaded (Admin → Licence Mgmt shows 'NO LICENCE UPLOADED'). Observe the login page.
    </Pre>
    <Pre n={13} result="The licence box turns blue: 'Licensed to: [issuer]' + issue date (right-aligned) + four feature tags with green checkmarks or grey lock icons matching the file's feature settings.">
      As admin, upload a .lic file. Log out and back in as <C>inviter1</C>. Observe the licence status box on the login page.
    </Pre>

    <Divider />
    <Text type="secondary" style={{ fontSize: 12 }}>
      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
      Happy path complete. All 13 steps passed = release gate cleared for the nominal flow.
    </Text>
  </div>
)

// ── Tab: Critical Path ────────────────────────────────────────────────────────
const CriticalPathTab = () => (
  <div>
    <Alert type="warning" showIcon style={{ marginBottom: 16 }}
      message="Each scenario is independent. Reset to a clean state (logout/login) between scenarios where indicated." />

    <Scenario
      id="01" severity="error"
      title="Required fields — empty form submission"
      steps={[
        'Click New Invitation.',
        'Click Submit Invitation without filling any field.',
      ]}
      expected="Form validation fires client-side. Required field errors displayed inline. No network request to POST /api/invitations. Modal remains open."
    />

    <Scenario
      id="02" severity="error"
      title="Blacklisted visitor — invitation blocked"
      steps={[
        'Open New Invitation.',
        'Search for a visitor who is marked blacklisted (check DB: poc_visitor.blacklisted = 1).',
        'Attempt to add the visitor to the invitation.',
      ]}
      expected="Visitor appears with a red BLACKLISTED badge. Cannot be selected / added. Submission with that visitor is blocked. No process instance created."
    />

    <Scenario
      id="03" severity="error"
      title="Invalid date range — end before start"
      steps={[
        'Open New Invitation.',
        'Set start date = today + 5, end date = today + 1.',
        'Fill remaining fields and click Submit.',
      ]}
      expected="Date validation error shown. Submission blocked. POST /api/invitations not called."
    />

    <Scenario
      id="04" severity="error"
      title="Network failure during submission"
      steps={[
        'Open New Invitation and fill all fields correctly.',
        'Open DevTools → Network → set throttling to Offline.',
        'Click Submit Invitation.',
      ]}
      expected="Error toast shown: 'Could not reach the server…'. Form is NOT cleared (user can retry). No process instance created."
    />

    <Scenario
      id="05" severity="error"
      title="Session expiry — auto-logout enforced"
      steps={[
        'Log in as inviter1.',
        'Open DevTools → Application → Local Storage → set loginAt to Date.now() - (9 * 3600 * 1000 + 1000).',
        'Interact with the page (navigate or wait for next timer tick).',
      ]}
      expected="User is automatically logged out and redirected to /login. No invitation data visible after redirect. loginAt cleared from localStorage."
    />

    <Scenario
      id="06" severity="warning"
      title="SSE fan-out — concurrent tab update"
      steps={[
        'Open two browser tabs logged in as inviter1.',
        'In Tab 1: create and submit a new invitation.',
        'Observe Tab 2 within 5 seconds (do not refresh).',
      ]}
      expected="Tab 2 receives the SSE event and the new task card appears automatically. No duplicate process instance created (verify in Operaton Cockpit). SSE status remains 'Live' in both tabs."
    />

    <Scenario
      id="07" severity="error"
      title="Clarification loop — max 5 attempts then auto-refuse"
      steps={[
        'As security1, open a pending security check and select Ask Inviter (repeat this step 5 times with different questions).',
        'As inviter1, answer each clarification question.',
        'After the 5th answer is submitted, observe the invitation status.',
      ]}
      expected="On the 5th loop: clarificationCount reaches 5 in the BPMN process. ScriptTask fires and auto-refuses the invitation. Security check status = REFUSED. No further clarification task created. Invitation moves to history with status Refused."
    />

    <Scenario
      id="08" severity="warning"
      title="Supervisor step-in — answer without claiming"
      steps={[
        'Ensure inviter1 has a supervisor assigned in Supervisor Assignments.',
        'Log in as the supervisor.',
        'Open the Supervised tab. Find an invitation pending clarification.',
        'Answer the security question without clicking Claim.',
      ]}
      expected="Answer is submitted successfully. Invitation remains under inviter1's name. Supervisor sees it as supervisee invitation (not their own). inviter1 can still see and interact with the invitation."
    />

    <Scenario
      id="09" severity="error"
      title="Inviter feature disabled — workflow blocked"
      steps={[
        'Log in as admin. Go to Licence Mgmt → Verify card. Upload a .lic file with the Inviter feature disabled.',
        'Log out. Log in as inviter1.',
      ]}
      expected="The /inviter route renders the FeatureNotLicensed page ('Invitation Management is not enabled'). Sidebar hides the Inviter nav items. 'Return to dashboard' button navigates back to /login. No invitation data is accessible."
    />

    <Scenario
      id="10" severity="error"
      title="Auto-logout when Inviter feature deactivated mid-session"
      steps={[
        'Log in as inviter1 in Tab A. In Tab B, log in as admin.',
        'In Tab B: Licence Mgmt → Verify card → disable the Inviter feature toggle.',
        'Switch to Tab A.',
      ]}
      expected="inviter1 is automatically logged out and redirected to /login on the next React render cycle. No invitation data remains accessible after redirect."
    />

    <Scenario
      id="11" severity="warning"
      title="Login page quick-fill hides unlicensed role"
      steps={[
        'Ensure a licence is loaded with the Inviter feature disabled.',
        'On the login page, select any location in the quick-fill selector.',
        'Observe the role filter pills.',
      ]}
      expected="The Inviter role pill is absent from the role filter. Only Security and/or Gatekeeper pills are shown (for present users). The licence status box shows a grey locked Inviter tag."
    />

    <Divider orientation="left" style={{ fontSize: 12, color: '#595959' }}>Accessibility</Divider>

    <Scenario
      id="A1" severity="warning"
      title="Keyboard-only invitation workflow"
      steps={[
        'Log in as inviter1. Press Tab to navigate — do not use the mouse.',
        'Reach "New Invitation" via Tab + Enter. Fill all fields using Tab, Space (checkboxes), and Enter.',
        'Submit the form using Enter on the Submit button.',
      ]}
      expected="Every interactive element is reachable and operable by keyboard alone. No focus trap occurs outside a modal. After submission, focus returns to the main dashboard."
    />

    <Scenario
      id="A2" severity="warning"
      title="Skip-to-content link visibility"
      steps={[
        'Load the Inviter Dashboard. Immediately press Tab once (do not click anywhere first).',
        'Observe the top of the page.',
      ]}
      expected="A 'Skip to main content' link becomes visually visible at the top of the viewport. Pressing Enter moves keyboard focus to the main content area (id='main-content'), bypassing the sidebar navigation."
    />

    <Scenario
      id="A3" severity="warning"
      title="Session timeout warning keyboard access"
      steps={[
        'Log in as inviter1.',
        'Open DevTools → Application → Local Storage → set loginAt to Date.now() - (9 * 3600 * 1000 - 4 * 60 * 1000) (4 minutes remaining).',
        'Wait for the next timer tick (up to 60 seconds) or navigate to trigger re-render.',
        'When the timeout warning modal appears, use Tab and Enter/Space to interact with it.',
      ]}
      expected="The timeout warning modal receives focus automatically. Both 'Extend session' and 'Log out' buttons are reachable via Tab and activatable with Enter/Space. 'Extend session' resets the countdown; modal closes."
    />

    <Divider />
    <Text type="secondary" style={{ fontSize: 12 }}>
      <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 4 }} />
      Any CP scenario that does not produce the expected result must be logged as a <strong>blocking bug</strong> before release.
    </Text>
  </div>
)

// ── Tab: API Coverage ─────────────────────────────────────────────────────────
const apiData = [
  { method: 'GET',  path: '/engine-rest/identity/verify',       happy: '—',        critical: 'CP-05',              notes: 'Credential check on login' },
  { method: 'GET',  path: '/engine-rest/task?assignee={u}',     happy: 'HP-1',     critical: '—',                  notes: 'Load pending invitation tasks' },
  { method: 'GET',  path: '/api/entrances',                     happy: 'HP-2',     critical: '—',                  notes: 'Populate entrance dropdown' },
  { method: 'GET',  path: '/api/visitors/search?q=',            happy: 'HP-3',     critical: 'CP-02',              notes: 'Visitor search; blacklist flag checked' },
  { method: 'POST', path: '/api/visitors',                      happy: 'HP-3*',    critical: '—',                  notes: '*If creating a new visitor rather than selecting existing' },
  { method: 'POST', path: '/api/invitations',                   happy: 'HP-4',     critical: 'CP-01, CP-03, CP-04', notes: 'Start BPMN process; assignLeastLoaded() called' },
  { method: 'GET',  path: '/api/sse/tasks',                     happy: 'HP-5',     critical: 'CP-06',              notes: 'EventSource connection; fan-out on task change' },
  { method: 'POST', path: '/engine-rest/task/{id}/complete',    happy: 'HP-6',     critical: 'CP-07',              notes: 'Complete invitation form task or clarification task' },
  { method: 'GET',  path: '/api/invitations/my/months',         happy: 'HP-7',     critical: '—',                  notes: 'Month index for history page' },
  { method: 'GET',  path: '/api/invitations/my',               happy: 'HP-7',     critical: '—',                  notes: 'Invitations for selected month' },
  { method: 'POST', path: '/engine-rest/task/{id}/claim',       happy: '—',        critical: 'CP-08',              notes: 'Supervisor claim (no-op for answer-without-claim)' },
  { method: 'GET',  path: '/api/supervisor/supervisee-invitations', happy: '—',    critical: 'CP-08',              notes: 'Supervisor: list supervisee invitations' },
]

const apiColumns = [
  {
    title: 'Method', dataIndex: 'method', key: 'method', width: 72,
    render: v => {
      const color = v === 'GET' ? 'blue' : v === 'POST' ? 'green' : 'orange'
      return <Tag color={color} style={{ fontWeight: 700, fontSize: 11 }}>{v}</Tag>
    },
  },
  { title: 'Endpoint', dataIndex: 'path', key: 'path', render: v => <C>{v}</C> },
  { title: 'Happy Path', dataIndex: 'happy',    key: 'happy',    width: 90,  render: v => <Text style={{ fontSize: 12, color: '#389e0d' }}>{v}</Text> },
  { title: 'Critical Path', dataIndex: 'critical', key: 'critical', width: 160, render: v => <Text style={{ fontSize: 12, color: '#d46b08' }}>{v}</Text> },
  { title: 'Notes', dataIndex: 'notes', key: 'notes', render: v => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text> },
]

const ApiTab = () => (
  <div>
    <Alert type="info" showIcon style={{ marginBottom: 14 }}
      message="All endpoints are REST (HTTP/JSON). No GraphQL. Authentication: HTTP Basic on every request." />
    <Table
      dataSource={apiData}
      columns={apiColumns}
      size="small"
      pagination={false}
      rowKey="path"
      scroll={{ x: 800 }}
    />
    <Divider />
    <Title level={5}><ApiOutlined style={{ marginRight: 6 }} />Not covered by this test plan</Title>
    {[
      'PUT /api/invitations/{id} — no update endpoint exists for invitations (immutable after creation)',
      'DELETE — invitations cannot be deleted; process is ended by the BPMN engine',
      'Admin endpoints (/api/locations, /api/entrances CRUD, /api/supervisor/assignments) — separate test plan required',
      'Licence Management page (generate + verify) — covered in Admin test plan',
      'Licence interceptor: /api/invitations** and /api/visitors** blocked client-side when Inviter feature is off — no server-side enforcement (PoC scope)',
      'Security Officer and Gatekeeper workflows — separate test plans required',
      'Mobile PWA endpoints — tested via frontend-mobile and frontend-gate apps',
    ].map((s, i) => (
      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
        <Text style={{ fontSize: 12 }}>{s}</Text>
      </div>
    ))}
  </div>
)

// ── Modal ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'overview',  label: 'Overview & Coverage', children: <OverviewTab /> },
  { key: 'happy',     label: 'Happy Path',          children: <HappyPathTab /> },
  { key: 'critical',  label: 'Critical Path',        children: <CriticalPathTab /> },
  { key: 'api',       label: 'API Coverage',         children: <ApiTab /> },
]

export default function QATestPlanModal({ open, onClose }) {
  return (
    <Modal
      open={open} onCancel={onClose} onOk={onClose}
      title={
        <span>
          <BugOutlined style={{ marginRight: 8, color: '#d46b08' }} />
          QA Test Plan — Inviter Workflow
          <Tag color="orange" style={{ marginLeft: 10, fontSize: 11, fontWeight: 600 }}>Manual</Tag>
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

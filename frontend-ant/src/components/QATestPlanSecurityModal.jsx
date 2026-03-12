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
  {
    file: 'SillyBlacklistCheckerTest', type: 'Unit', methods: '10 (8 + 2 param.)', executions: '16 (8 regular + 7 value params + 1 null)',
    target: '100% line + branch',
    covers: 'SillyBlacklistChecker.execute() [37 lines]: always sets reliability=70L; reads VName for logging; Long type assertion; BPMN >30 gateway; 7 visitor name variants (ASCII, unicode, empty, whitespace, long); null VName; idempotency',
  },
  {
    file: 'SillyCheckinServiceTest', type: 'Unit', methods: 18, executions: 18,
    target: '100% line + branch',
    covers: 'SillyCheckinService.execute() [40 lines]: sets checkedIn=Boolean.TRUE; reads VName, VDate, AVDate, reliability, processInstanceId; null safety for each of the 5 variables independently + all-null; Integer reliability; java.util.Date VDate/AVDate; idempotency',
  },
  {
    file: 'TaskEventServiceTest', type: 'Unit', methods: '22 (nested)', executions: 22,
    target: '≥95% line + branch',
    covers: 'TaskEventService [92 lines]: subscribe()×5 (emitter creation, distinct instances, list registration, onCompletion/onError removal); detectAndBroadcast()×15 (no-op when no subscribers, processDefinitionKey/orderByTaskId/asc chain, no broadcast on unchanged snapshot, broadcast on new task/removal/assignee change, snapshot format, TaskService exception swallowed, dead emitter cleanup, fan-out to all subscribers, first-poll edge cases); Concurrency×2 (CopyOnWriteArrayList, volatile lastSnapshot)',
  },
  {
    file: 'SseControllerTest', type: 'Unit', methods: 7, executions: 7,
    target: '100% line + branch',
    covers: 'SseController [33 lines]: delegation to TaskEventService.subscribe(); exact emitter returned; 2 calls → 2 subscriptions; @RestController, @RequestMapping("/api/sse"), @CrossOrigin (localhost:5173 + localhost:3000), GET /tasks produces TEXT_EVENT_STREAM',
  },
  {
    file: 'WebSecurityConfigTest', type: 'Unit', methods: 23, executions: 23,
    target: '100% CORS config; annotations for security chain',
    covers: 'WebSecurityConfig [50 lines]: corsConfigurationSource()×15 via reflection (allowCredentials, 2 origins exactly, wildcard headers, 6 HTTP methods, maxAge=3600, /**); corsFilter() bean×3 (non-null, CorsFilter type, new instance each call); annotations×5 (@Configuration, @EnableWebSecurity, filterChain @Bean @Order(1), corsFilter @Bean). Note: restApiSecurityFilterChain body not executed — requires HttpSecurity (Spring integration test scope)',
  },
  {
    file: 'AppConfigTest', type: 'Unit', methods: 4, executions: 4,
    target: '100% of testable code',
    covers: 'AppConfig [13 lines, annotation-only]: @Configuration present; @EnableScheduling present; instantiation; package eu.poc.claude.config',
  },
  {
    file: 'OperatonInitializerConfigTest', type: 'Unit', methods: '28 (4 nested scenarios)', executions: 28,
    target: '100% line + branch',
    covers: 'OperatonInitializerConfig [108 lines]: 4 scenarios covering all 3 private method branches — FreshInstall×18 (4 groups with WORKFLOW type + descriptive names; 3 users inviter1/security1/gatekeeper1; firstName/lastName/password/email; 4 memberships); Rerun×3 (no creates, no saves, no memberships); Mixed×2 (groups exist, users new); AdminNotMember×3 (only admin→webAdmins created); top-level×2 (@Component, @EventListener ApplicationReadyEvent)',
  },
  {
    file: 'VisitorApplicationTest', type: 'Structural', methods: 4, executions: 4,
    target: '100% of testable code',
    covers: 'VisitorApplication [12 lines]: @SpringBootApplication; main() public + static + void; String[] parameter; package eu.poc.claude',
  },
]

const TOTAL_METHODS = 116    // 10+18+22+7+23+4+28+4
const TOTAL_EXECUTIONS = 122 // 16+18+22+7+23+4+28+4

const devTestColumns = [
  { title: 'Test Class', dataIndex: 'file', key: 'file', render: v => <C>{v}</C>, width: 200 },
  { title: 'Type', dataIndex: 'type', key: 'type', width: 75, render: v => <Tag>{v}</Tag> },
  { title: '@Test methods', dataIndex: 'methods', key: 'methods', width: 140 },
  { title: 'Executions', dataIndex: 'executions', key: 'executions', width: 110 },
  { title: 'Coverage target', dataIndex: 'target', key: 'target', width: 200 },
  { title: 'What it covers', dataIndex: 'covers', key: 'covers', render: v => <Text style={{ fontSize: 12 }}>{v}</Text> },
]

const OverviewTab = () => (
  <div>
    <Title level={5}>Scope</Title>
    <Paragraph style={{ fontSize: 13 }}>
      This manual test plan covers the <strong>Security Dashboard</strong> (<C>/security</C>) and the backend REST
      endpoints it exercises. It verifies the nominal review workflow and critical error conditions that
      must not reach production.
    </Paragraph>
    <Title level={5}>Pre-conditions</Title>
    {[
      'Backend running on http://localhost:8080',
      'Frontend running on http://localhost:5174',
      'SQL Server reachable; Liquibase migrations 001–019 applied',
      'At least one pending invitation with at least one visitor exists (created by inviter1)',
      'Test accounts: security1 / security123 (Security group), inviter1 / inviter123',
      'Browser DevTools available (Network, Application tabs)',
      'For licence feature gating tests: a .lic file generated from Admin → Licence Mgmt with the Security feature toggled off is required',
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
      message="Coverage gap — SecurityCheckController (8 endpoints) and SecurityCheckRepository (15 methods): 0 tests"
      description={
        <div style={{ fontSize: 12 }}>
          <Text style={{ fontSize: 12 }}>
            All 8 existing test classes target infrastructure/delegate classes only.
            <strong> Zero tests</strong> exist for <C>SecurityCheckController</C> (~87 lines of logic)
            or <C>SecurityCheckRepository</C> (15 methods, ~130 lines of SQL). Specific untested paths:
          </Text>
          <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
            <li><C>decide</C> — 409 conflict guard: <C>securityReviewer != null {'&&'} != username</C></li>
            <li><C>decide</C> — 4 decision branches; <C>incrementClarificationCount</C> only called for <C>ASK_INVITER</C></li>
            <li><C>clarify</C> — inviter completes BPMN clarification task via this endpoint (not the Security officer)</li>
            <li><C>pendingSupervisees</C> / <C>claim</C> — 403 guard when <C>isSupervisor(username)</C> is false</li>
            <li><C>claimCheck</C> — optimistic UPDATE row-count guard (returns false → controller throws 409)</li>
            <li><C>updateDecision</C> — conditional <C>clarAnswer != null</C> branch</li>
            <li><C>findPendingBySupervisees</C> — early return on empty supervisee list</li>
            <li><C>requireUsername</C> — null header path and bad Base64 path (both → 401)</li>
          </ul>
        </div>
      }
    />
    <Table dataSource={devTestData} columns={devTestColumns} size="small" pagination={false} rowKey="file" scroll={{ x: 1100 }}
      summary={() => (
        <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 700 }}>
          <Table.Summary.Cell index={0}><Text strong style={{ fontSize: 12 }}>Total</Text></Table.Summary.Cell>
          <Table.Summary.Cell index={1} />
          <Table.Summary.Cell index={2}><Text strong style={{ fontSize: 12 }}>{TOTAL_METHODS}</Text></Table.Summary.Cell>
          <Table.Summary.Cell index={3}><Text strong style={{ fontSize: 12 }}>{TOTAL_EXECUTIONS}</Text></Table.Summary.Cell>
          <Table.Summary.Cell index={4} colSpan={2}>
            <Text type="secondary" style={{ fontSize: 11 }}>SecurityCheckController + SecurityCheckRepository: 0 of 23 public methods covered</Text>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      )}
    />
    <Text type="secondary" style={{ fontSize: 11, marginTop: 8, display: 'block' }}>
      Figures verified from source. Run <C>./gradlew test jacocoTestReport</C> for exact line/branch percentages —
      report at <C>backend/build/reports/jacoco/test/html/index.html</C>
    </Text>
  </div>
)

// ── Happy Path ────────────────────────────────────────────────────────────────
const HappyPathTab = () => (
  <div>
    <Alert type="info" showIcon style={{ marginBottom: 16 }}
      message="Execute steps in order. A passing invitation from inviter1 must exist before starting." />

    <Title level={5}>HP-1 — Login & Dashboard Load</Title>
    <Pre n={1} result="Security Dashboard renders. 'My Checks' tab is active. SSE status shows 'Live'.">
      Open <C>http://localhost:5174</C>. Log in as <C>security1 / security123</C>.
    </Pre>
    <Pre n={2} result="Network tab shows GET /api/security-checks/pending/mine returning 200.">
      Open DevTools → Network. Verify API calls complete without error.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-2 — Open a Pending Check</Title>
    <Pre n={3} result="Modal opens. Visitor name, company, date range, entrance, and inviter shown in Descriptions panel. Identity Confirmed checkbox unchecked. Reliability slider at 70.">
      Find a card in 'My Checks' and click <strong>Action</strong>.
    </Pre>
    <Pre n={4} result="POST /engine-rest/task/{id}/claim returns 204. Check is now claimed by security1.">
      Observe the Network tab — claim call fires automatically on modal open.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-3 — Approve a Visitor</Title>
    <Pre n={5} result="Checkbox turns green; Identity Confirmed section highlighted.">
      Tick <strong>Identity Confirmed</strong>.
    </Pre>
    <Pre n={6} result="Slider reflects new value; coloured tag updates to green.">
      Adjust reliability score to 85.
    </Pre>
    <Pre n={7} result="POST /api/security-checks/{id}/decide returns 200. Modal closes. Card disappears from 'My Checks'. Success notification shown.">
      Click <strong>Approve</strong>.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-4 — Verify Others Tab</Title>
    <Pre n={8} result="Approved check is no longer listed. Other officers' checks visible as read-only (Action button disabled).">
      Switch to the <strong>Others</strong> tab. Verify the check processed in HP-3 is absent.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-5 — Ask Inviter</Title>
    <Pre n={9} result="Action modal opens for the check.">
      Find another pending check. Click <strong>Action</strong>.
    </Pre>
    <Pre n={10} result="POST /api/security-checks/{id}/decide with decision=ASK_INVITER returns 200. Modal closes. Task moves to inviter's dashboard.">
      Tick Identity Confirmed. Type a clarification question. Click <strong>Ask Inviter</strong>.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-6 — Blacklist Management</Title>
    <Pre n={11} result="Blacklist tab renders. If no blacklisted visitors: empty state shown. If visitors exist: table renders with Name, Company, Added by columns.">
      Scroll to the <strong>Blacklist</strong> tab below the Active Checks panel.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-7 — Licence Status Box on Login</Title>
    <Pre n={12} result="Green 'PoC mode' banner visible on login page. No feature restrictions apply.">
      Log out. Verify no licence is loaded (Admin → Licence Mgmt shows 'NO LICENCE UPLOADED'). Open login page.
    </Pre>
    <Pre n={13} result="Blue licence box shows 'Licensed to: [issuer]' + date + four feature tags. Security tag is green. All security API calls succeed.">
      As admin, upload a .lic file with Security feature enabled. Log back in as <C>security1</C>. Observe the licence box.
    </Pre>

    <Divider />
    <Text type="secondary" style={{ fontSize: 12 }}>
      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
      Happy path complete. All 13 steps passed = release gate cleared for the nominal Security flow.
    </Text>
  </div>
)

// ── Critical Path ─────────────────────────────────────────────────────────────
const CriticalPathTab = () => (
  <div>
    <Alert type="warning" showIcon style={{ marginBottom: 16 }}
      message="Reset to clean state (logout/login) between scenarios where indicated." />

    <Scenario
      id="01" severity="error"
      title="Submit decision without confirming identity"
      steps={[
        'Click Action on any pending check.',
        'Do NOT tick Identity Confirmed.',
        'Click Approve (or Refuse or Blacklist).',
      ]}
      expected="Validation error: 'Identity confirmation required' shown inline. No POST to /api/security-checks/{id}/decide. Modal remains open."
    />

    <Scenario
      id="02" severity="error"
      title="Refuse without a note"
      steps={[
        'Click Action on any pending check.',
        'Tick Identity Confirmed.',
        'Click Refuse without entering a note.',
      ]}
      expected="Validation error: 'A note is required when refusing' shown. No API call made. Modal stays open."
    />

    <Scenario
      id="03" severity="error"
      title="Blacklist without a note"
      steps={[
        'Click Action on any pending check.',
        'Tick Identity Confirmed.',
        'Click Blacklist without entering a note.',
      ]}
      expected="Validation error shown. No API call made. Visitor not blacklisted."
    />

    <Scenario
      id="04" severity="error"
      title="Ask Inviter without a clarification question"
      steps={[
        'Click Action on any pending check.',
        'Tick Identity Confirmed.',
        'Click Ask Inviter leaving the clarification question field empty.',
      ]}
      expected="Validation error: 'Clarification question is required' shown. No API call made."
    />

    <Scenario
      id="05" severity="error"
      title="Ask Inviter 5 times — auto-refuse triggered"
      steps={[
        'As security1, select Ask Inviter on the same check 5 times (inviter1 must answer each time).',
        'After the 5th Ask Inviter decision, observe the check status.',
      ]}
      expected="After the 5th loop, the BPMN ScriptTask fires: check moves to REFUSED automatically. clarificationCount = 5 in the database. No further Ask Inviter option shown. Invitation visible in history with Refused outcome."
    />

    <Scenario
      id="06" severity="error"
      title="Concurrent claim conflict — 409 on decide"
      steps={[
        'Log in as security1 in Tab A and security2 in Tab B.',
        'In Tab A: open the Action modal for the same check (claim is sent automatically).',
        'In Tab B: also open the same check and attempt to decide.',
      ]}
      expected="Tab B receives a 409 Conflict response when POSTing decide. Error message displayed: 'already claimed by another officer'. security_reviewer column in DB shows security1 only."
    />

    <Scenario
      id="07" severity="warning"
      title="Session expiry during review"
      steps={[
        'Log in as security1.',
        'Open DevTools → Application → Local Storage → set loginAt to Date.now() - (9 * 3600 * 1000 + 1000).',
        'Open the Action modal and attempt to submit a decision.',
      ]}
      expected="Auto-logout triggers. User redirected to /login. No partial decision persisted. loginAt cleared."
    />

    <Scenario
      id="08" severity="warning"
      title="Supervisor claim — check transferred to supervisor"
      steps={[
        'Ensure security1 has a supervisor assigned in Supervisor Assignments.',
        'Log in as the supervisor.',
        'Open the Supervised tab. Find a pending check assigned to security1.',
        'Click Claim on the check.',
      ]}
      expected="PATCH /api/security-checks/{id}/claim returns 200. security_reviewer in DB updated to supervisor username. Check moves from security1's My Checks to supervisor's My Checks. security1 can no longer decide it."
    />

    <Scenario
      id="09" severity="error"
      title="Security feature disabled — workflow blocked"
      steps={[
        'Log in as admin. Go to Licence Mgmt → Verify card. Upload a .lic file with the Security feature disabled.',
        'Log out. Log in as security1.',
      ]}
      expected="The /security route renders the FeatureNotLicensed page ('Security Review is not enabled'). Sidebar hides the Security nav items. The axios interceptor blocks any call to /api/security-checks** before it leaves the browser (403 with isLicenceBlock flag)."
    />

    <Scenario
      id="10" severity="error"
      title="Auto-logout when Security feature deactivated mid-session"
      steps={[
        'Log in as security1 in Tab A. In Tab B, log in as admin.',
        'In Tab B: Licence Mgmt → Verify card → disable the Security feature toggle.',
        'Switch to Tab A.',
      ]}
      expected="security1 is automatically logged out and redirected to /login. LicenceWatcher detects featureActive.security = false while auth.role = SECURITY and triggers logout() + navigate('/login')."
    />

    <Scenario
      id="11" severity="warning"
      title="Login page quick-fill hides unlicensed Security role"
      steps={[
        'Ensure a licence is loaded with Security feature disabled.',
        'On the login page, select a location in the quick-fill.',
        'Observe the role filter pills.',
      ]}
      expected="The Security role pill is absent. Only Inviter and/or Gatekeeper pills appear. The licence box shows the Security tag with a grey lock icon."
    />

    <Divider orientation="left" style={{ fontSize: 12, color: '#595959' }}>Accessibility</Divider>

    <Scenario
      id="A1" severity="warning"
      title="Keyboard-only security review workflow"
      steps={[
        'Log in as security1. Do not use the mouse.',
        'Tab to the first pending check in My Checks. Press Enter to open it.',
        'Tab through: Identity Confirmed checkbox (Space to tick), decision radio buttons (arrow keys), note textarea, submit button.',
        'Press Enter on the submit button.',
      ]}
      expected="Every element reachable via Tab/arrow keys. Space toggles Identity Confirmed checkbox. Decision radios navigated by arrow keys. Form submits successfully without mouse interaction."
    />

    <Scenario
      id="A2" severity="warning"
      title="Greeting overlay keyboard dismiss"
      steps={[
        'Log out and log back in as security1 (triggers greeting_pending flag).',
        'When the greeting overlay appears, press Escape.',
      ]}
      expected="Overlay closes with fade-out animation on Escape keypress. Also verify Enter and Space dismiss it. Focus returns to the underlying page."
    />

    <Scenario
      id="A3" severity="warning"
      title="Session timeout warning keyboard access"
      steps={[
        'Log in as security1.',
        'Set loginAt to Date.now() - (9 * 3600 * 1000 - 4 * 60 * 1000) in Local Storage.',
        'Wait or navigate to trigger the warning modal.',
        'Use Tab and Enter/Space only to interact with it.',
      ]}
      expected="Warning modal gains focus. 'Extend session' resets the timer. 'Log out' redirects to /login. Both buttons operable by keyboard alone."
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
  { method: 'GET',    path: '/api/security-checks/pending/mine',        happy: 'HP-1',   critical: '—',        notes: 'My assigned checks (assigned_to = me) + unassigned (IS NULL)' },
  { method: 'GET',    path: '/api/security-checks/pending/others',      happy: 'HP-4',   critical: '—',        notes: 'Checks assigned to other officers — read-only tab' },
  { method: 'GET',    path: '/api/security-checks/pending/supervisees', happy: '—',      critical: 'CP-08',    notes: 'Supervisor only: 403 if not supervisor; queries supervisees list then DB' },
  { method: 'GET',    path: '/api/security-checks/my-decisions',        happy: '—',      critical: '—',        notes: 'Completed checks where security_reviewer = me (history / stats)' },
  { method: 'GET',    path: '/api/security-checks/{id}',                happy: '—',      critical: '—',        notes: 'Single check by ID; 404 if not found' },
  { method: 'POST',   path: '/engine-rest/task/{id}/claim',             happy: 'HP-2',   critical: 'CP-06',    notes: 'Claim BPMN task on modal open (auto); runs before decide' },
  { method: 'POST',   path: '/api/security-checks/{id}/decide',         happy: 'HP-3,5', critical: 'CP-01–06', notes: 'APPROVE/REFUSE/BLACKLIST/ASK_INVITER; 409 if securityReviewer ≠ caller' },
  { method: 'POST',   path: '/api/security-checks/{id}/clarify',        happy: 'HP-5',   critical: '—',        notes: 'Called by the INVITER (not Security) to submit clarification answer; completes BPMN clarification task' },
  { method: 'POST',   path: '/api/security-checks/{id}/claim',          happy: '—',      critical: 'CP-08',    notes: 'Supervisor preemptive claim; optimistic UPDATE (rows=0 → 409)' },
  { method: 'GET',    path: '/api/visitors/blacklisted',                happy: 'HP-6',   critical: '—',        notes: 'Load blacklist tab content' },
  { method: 'DELETE', path: '/api/visitors/{id}/blacklist',             happy: '—',      critical: '—',        notes: 'Remove visitor from blacklist (Unlock button)' },
  { method: 'GET',    path: '/api/supervisor/security/supervisees',     happy: '—',      critical: 'CP-08',    notes: 'List supervisee usernames for the logged-in security supervisor' },
  { method: 'GET',    path: '/api/sse/tasks',                           happy: 'HP-1',   critical: 'CP-07',    notes: 'EventSource for live task updates' },
]

const apiColumns = [
  { title: 'Method', dataIndex: 'method', key: 'method', width: 80,
    render: v => <Tag color={{ GET:'blue', POST:'green', DELETE:'red' }[v] ?? 'orange'} style={{ fontWeight: 700, fontSize: 11 }}>{v}</Tag> },
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
      'Inviter and Gatekeeper workflows — covered in their respective test plans',
      'Admin CRUD endpoints (/api/locations, /api/entrances, /api/supervisor/assignments)',
      'Mobile PWA (frontend-mobile) — tested separately',
      'Licence Management page (generate + verify) — covered in Admin test plan',
      'Licence interceptor: /api/security-checks** and /api/supervisor/security** blocked client-side when Security feature is off — no server-side enforcement (PoC scope)',
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

export default function QATestPlanSecurityModal({ open, onClose }) {
  return (
    <Modal
      open={open} onCancel={onClose} onOk={onClose}
      title={
        <span>
          <BugOutlined style={{ marginRight: 8, color: '#d46b08' }} />
          QA Test Plan — Security Workflow
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

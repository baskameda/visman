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

// Tests ordered: Admin-relevant first, then BPMN/SSE infrastructure
const devTestData = [
  {
    file: 'OperatonInitializerConfigTest', rel: 'Admin', type: 'Unit',
    methods: '28 (4 nested scenarios)', executions: 28,
    target: '100% line + branch',
    covers: 'OperatonInitializerConfig [108 lines] — directly seeds the webAdmins group and demo users the Admin page depends on. 4 scenarios: FreshInstall×18 (4 groups + 3 users + 4 memberships; names, passwords, emails, WORKFLOW type); Rerun×3 (idempotent — no duplicates); GroupsExistUsersNew×2 (mixed branch); AdminNotInWebAdmins×3 (ensureMembership branch). All 3 private method branches covered.',
  },
  {
    file: 'WebSecurityConfigTest', rel: 'Admin', type: 'Unit',
    methods: '23 (3 nested classes)', executions: 23,
    target: '100% CORS config; annotations for security chain',
    covers: 'WebSecurityConfig [50 lines] — CORS config for /engine-rest/** and /api/** (Admin page calls both). CorsConfigurationSourceTests×15 via reflection (allowCredentials, origins, headers, 6 HTTP methods, maxAge=3600, /**); CorsFilterBean×3; Annotations×5 (@Configuration, @EnableWebSecurity, @Bean, @Order(1)). ⚠ 1 test STALE: exactlyTwoOrigins asserts hasSize(2) but production now declares 12 origins (ports 5173–5177 + https variants). restApiSecurityFilterChain body not exercised — requires live HttpSecurity.',
  },
  {
    file: 'AppConfigTest', rel: 'Admin', type: 'Unit',
    methods: 4, executions: 4,
    target: '100% of testable code',
    covers: 'AppConfig [13 lines] — @EnableScheduling enables useAutoRefresh(load, 15000) used by AdminDashboard for its 15-second poll. @Configuration present; @EnableScheduling present; instantiation; package.',
  },
  {
    file: 'VisitorApplicationTest', rel: 'Admin', type: 'Structural',
    methods: 4, executions: 4,
    target: '100% of testable code',
    covers: 'VisitorApplication [12 lines] — @SpringBootApplication; main() public + static + void; String[]; package eu.poc.claude.',
  },
  {
    file: 'SseControllerTest', rel: 'SSE', type: 'Unit',
    methods: 7, executions: 7,
    target: '100% line + branch',
    covers: 'SseController [33 lines] — Not used by Admin page. Delegation to TaskEventService.subscribe(); return value identity; 2 calls → 2 subscriptions; @RestController, @RequestMapping("/api/sse"), GET /tasks TEXT_EVENT_STREAM. ⚠ 1 test STALE: crossOriginConfigured asserts @CrossOrigin exists on SseController — production source has no @CrossOrigin annotation (CORS handled by WebSecurityConfig). Test will FAIL.',
  },
  {
    file: 'TaskEventServiceTest', rel: 'SSE', type: 'Unit',
    methods: '22 (3 nested classes)', executions: 22,
    target: '≥95% line + branch',
    covers: 'TaskEventService [92 lines] — Not used by Admin page. subscribe()×5; detectAndBroadcast()×15 (processDefinitionKey chain, snapshot diff, no-op/broadcast/error/dead-emitter/fan-out); Concurrency×2 (CopyOnWriteArrayList, volatile).',
  },
  {
    file: 'SillyBlacklistCheckerTest', rel: 'BPMN', type: 'Unit',
    methods: '10 (8 + 2 param.)', executions: '16 (8 + 7 values + 1 null)',
    target: '100% line + branch',
    covers: 'SillyBlacklistChecker.execute() [37 lines] — Not used by Admin page. Sets reliability=70L; reads VName; Long type; BPMN >30 gateway; 7 name variants; null safety; idempotency.',
  },
  {
    file: 'SillyCheckinServiceTest', rel: 'BPMN', type: 'Unit',
    methods: 18, executions: 18,
    target: '100% line + branch',
    covers: 'SillyCheckinService.execute() [40 lines] — Not used by Admin page. Sets checkedIn=Boolean.TRUE; reads 5 variables; null safety per-variable + all-null; Integer/Date type variants; idempotency.',
  },
]

const REL_COLORS = { Admin: 'green', SSE: 'blue', BPMN: 'orange' }

const devTestColumns = [
  { title: 'Test Class',      dataIndex: 'file', key: 'file', render: v => <C>{v}</C>, width: 210 },
  { title: 'Rel.',            dataIndex: 'rel',  key: 'rel',  width: 66,
    render: v => <Tag color={REL_COLORS[v]} style={{ fontSize: 10, fontWeight: 700 }}>{v}</Tag> },
  { title: 'Type',            dataIndex: 'type', key: 'type', width: 75, render: v => <Tag>{v}</Tag> },
  { title: '@Test methods',   dataIndex: 'methods',    key: 'methods',    width: 130 },
  { title: 'Executions',      dataIndex: 'executions', key: 'executions', width: 100 },
  { title: 'Coverage target', dataIndex: 'target',     key: 'target',     width: 195 },
  { title: 'What it covers',  dataIndex: 'covers',     key: 'covers',
    render: v => <Text style={{ fontSize: 11 }}>{v}</Text> },
]

const TOTAL_METHODS    = 116  // 28+23+4+4+7+22+10+18
const TOTAL_EXECUTIONS = 122  // 28+23+4+4+7+22+16+18
const ADMIN_METHODS    = 59   // 28+23+4+4
const ADMIN_EXECUTIONS = 59   // 28+23+4+4
const STALE_TESTS      = 2    // exactlyTwoOrigins + crossOriginConfigured

const OverviewTab = () => (
  <div>
    <Title level={5}>Scope</Title>
    <Paragraph style={{ fontSize: 13 }}>
      This manual test plan covers the <strong>Admin Dashboard</strong> (<C>/admin</C>) and the Operaton Identity REST
      endpoints it exercises for user and group management. It verifies the nominal administration workflow
      and critical error conditions.
    </Paragraph>

    <Alert
      type="info" showIcon style={{ marginBottom: 16 }}
      message="Admin page has no custom Spring controller"
      description={
        <Text style={{ fontSize: 12 }}>
          All admin operations (user CRUD, group CRUD, membership management, historic process data) call
          Operaton's built-in <C>/engine-rest/**</C> API directly — there is <strong>no custom AdminController
          in this codebase</strong>. The only custom backend code relevant to admin is the initializer
          that seeds groups and demo users (<C>OperatonInitializerConfig</C>), the CORS filter
          (<C>WebSecurityConfig</C>), and the scheduling config (<C>AppConfig</C>).
        </Text>
      }
    />

    <Title level={5}>Pre-conditions</Title>
    {[
      'Backend running on http://localhost:8080',
      'Frontend running on http://localhost:5174',
      'SQL Server reachable; Liquibase migrations 001–019 applied',
      'Admin account: superhero / test123 (webAdmins group)',
      'At least the four built-in groups exist: Invitors, Security, Porters, webAdmins',
      'At least one non-admin user exists (e.g. inviter1)',
      'Browser DevTools available (Network, Application tabs)',
      'For licence tests: no prior .lic file needed — the page can generate its own. Have a text editor available to corrupt a file for CP-10.',
    ].map((p, i) => (
      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>{i + 1}.</Text>
        <Text style={{ fontSize: 12 }}>{p}</Text>
      </div>
    ))}

    <Divider />
    <Title level={5}>
      <BugOutlined style={{ marginRight: 6, color: '#389e0d' }} />
      Developer Test Coverage — as of 2026-03-08
    </Title>

    <Alert
      type="error" showIcon style={{ marginBottom: 8 }}
      message={`${STALE_TESTS} stale tests confirmed broken against current source`}
      description={
        <div style={{ fontSize: 12 }}>
          <div style={{ marginBottom: 4 }}>
            <Tag color="red" style={{ fontSize: 10 }}>FAILS</Tag>{' '}
            <C>WebSecurityConfigTest.exactlyTwoOrigins</C> — asserts <C>hasSize(2)</C> but
            production <C>WebSecurityConfig</C> declares <strong>12 allowed origins</strong>{' '}
            (ports 5173–5177 plus https variants, added for mobile PWA support). Test was not updated.
          </div>
          <div>
            <Tag color="red" style={{ fontSize: 10 }}>FAILS</Tag>{' '}
            <C>SseControllerTest.crossOriginConfigured</C> — asserts <C>@CrossOrigin</C> annotation
            exists on <C>SseController</C> and contains 2 origins, but production <C>SseController</C>{' '}
            has <strong>no <C>@CrossOrigin</C> annotation</strong> (CORS is handled globally by{' '}
            <C>WebSecurityConfig.corsFilter()</C>). <C>getAnnotation(CrossOrigin.class)</C> returns null →{' '}
            <C>assertThat(cors).isNotNull()</C> fails.
          </div>
        </div>
      }
    />

    <Alert
      type="warning" showIcon style={{ marginBottom: 12 }}
      message="No integration tests for engine-rest admin operations"
      description={
        <Text style={{ fontSize: 12 }}>
          User CRUD (<C>/engine-rest/user/**</C>), group CRUD (<C>/engine-rest/group/**</C>),
          and membership management are Operaton's own API — not our code to unit-test. However,
          there are <strong>zero integration tests</strong> verifying that the diff-save membership
          logic in <C>AdminDashboard.jsx</C> (added/removed arrays computed client-side) produces
          the correct sequence of add/remove calls against a real Operaton instance.
          Manual testing is the only verification gate.
        </Text>
      }
    />

    <Table
      dataSource={devTestData}
      columns={devTestColumns}
      size="small"
      pagination={false}
      rowKey="file"
      scroll={{ x: 1200 }}
      rowClassName={r => r.rel === 'Admin' ? '' : 'ant-table-row-muted'}
      summary={() => (
        <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 700 }}>
          <Table.Summary.Cell index={0}><Text strong style={{ fontSize: 12 }}>Total</Text></Table.Summary.Cell>
          <Table.Summary.Cell index={1} />
          <Table.Summary.Cell index={2} />
          <Table.Summary.Cell index={3}>
            <Text strong style={{ fontSize: 12 }}>{TOTAL_METHODS}</Text>
            <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>{ADMIN_METHODS} Admin-rel.</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={4}>
            <Text strong style={{ fontSize: 12 }}>{TOTAL_EXECUTIONS}</Text>
            <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>{ADMIN_EXECUTIONS} Admin-rel.</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={5} colSpan={2}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {STALE_TESTS} tests confirmed broken · No custom AdminController · engine-rest not integration-tested
            </Text>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      )}
    />
    <Text type="secondary" style={{ fontSize: 11, marginTop: 8, display: 'block' }}>
      Rel. column: <Tag color="green" style={{ fontSize: 10 }}>Admin</Tag> = relevant to this page ·{' '}
      <Tag color="blue" style={{ fontSize: 10 }}>SSE</Tag> = SSE infrastructure ·{' '}
      <Tag color="orange" style={{ fontSize: 10 }}>BPMN</Tag> = BPMN delegate · not exercised by Admin page.
      Run <C>./gradlew test jacocoTestReport</C> — report at <C>backend/build/reports/jacoco/test/html/index.html</C>
    </Text>
  </div>
)

// ── Happy Path ────────────────────────────────────────────────────────────────
const HappyPathTab = () => (
  <div>
    <Alert type="info" showIcon style={{ marginBottom: 16 }}
      message="Execute steps in order. Use the superhero account throughout." />

    <Title level={5}>HP-1 — Login & Dashboard Load</Title>
    <Pre n={1} result="Admin Dashboard renders. Four stat cards visible: Active Processes, Checked In Today, Refused Today, Total Users.">
      Open <C>http://localhost:5174</C>. Log in as <C>superhero / test123</C>.
    </Pre>
    <Pre n={2} result="GET /engine-rest/task, GET /engine-rest/history/process-instance, GET /engine-rest/user, GET /engine-rest/group all return 200.">
      Open DevTools → Network. Verify all four initial API calls complete without error.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-2 — Users Tab</Title>
    <Pre n={3} result="Users tab renders. Each row shows avatar, full name, username, email, groups (coloured tags), task count, and three action buttons.">
      Click the <strong>Users</strong> tab.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-3 — Create a New User</Title>
    <Pre n={4} result="Create User modal opens with Username, First Name, Last Name, Email, Password, and optional Groups fields.">
      Click <strong>New User</strong>.
    </Pre>
    <Pre n={5} result="POST /engine-rest/user/create returns 200. Modal closes. New user appears in the table immediately (refreshUsers() called).">
      Fill in username <C>testqa1</C>, first name <C>QA</C>, last name <C>Tester</C>, password <C>qatester123</C>. Click <strong>Create User</strong>.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-4 — Manage User Groups</Title>
    <Pre n={6} result="Manage Groups modal opens. All groups listed with checkboxes. testqa1's current groups pre-checked.">
      Find <C>testqa1</C> in the table. Click the <strong>Manage Groups</strong> (teams icon) button.
    </Pre>
    <Pre n={7} result="POST /engine-rest/group/Invitors/members/testqa1 returns 204. Modal closes. testqa1 row now shows Invitors tag. refreshUsers() fires.">
      Tick <strong>Invitors</strong>. Click <strong>Save</strong>.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-5 — Groups Tab</Title>
    <Pre n={8} result="Groups tab renders. Each row shows Group ID, Name, Members (tags), Count, and action buttons.">
      Click the <strong>Groups</strong> tab.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-6 — Manage Group Members</Title>
    <Pre n={9} result="Manage Members modal opens with checkbox list of all users. Current members pre-checked.">
      Find the <strong>Invitors</strong> group. Click the <strong>Manage Members</strong> button.
    </Pre>
    <Pre n={10} result="DELETE /engine-rest/group/Invitors/members/testqa1 returns 204. testqa1 removed from Invitors. Count decrements by 1.">
      Untick <C>testqa1</C>. Click <strong>Save</strong>.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-7 — Delete User</Title>
    <Pre n={11} result="DELETE /engine-rest/user/testqa1 returns 200/204. testqa1 disappears from the table. Success message shown.">
      Find <C>testqa1</C>. Click the red delete button. Confirm the Popconfirm.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-8 — Auto-refresh</Title>
    <Pre n={12} result="After 15 seconds, task counts update automatically without a manual page reload. 'Updated [time] · auto-refreshes every 15s' label updates.">
      Wait 15 seconds without interacting. Observe the status line and stat cards.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-9 — Navigate to Licence Management</Title>
    <Pre n={13} result="Licence Management page loads. PoC warning banner visible at top. Two cards shown: 'Generate Licence' and 'Verify Licence'. Verify card shows 'NO LICENCE UPLOADED — For PoC only: all features are available' with all 4 feature toggles on and editable.">
      Click <strong>Licence Mgmt</strong> in the sidebar.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-10 — Generate a Licence File</Title>
    <Pre n={14} result="Issuer field shows the logged-in username (read-only). Issue Date shows today (read-only).">
      Observe the Generate card fields.
    </Pre>
    <Pre n={15} result="Gatekeeper row shows a disabled lock icon and tooltip 'Contact your vendor for a demo today!' — cannot be re-enabled.">
      Toggle <strong>Gatekeeper</strong> off. Leave Security, Inviter, and Gamification on.
    </Pre>
    <Pre n={16} result="A file named visman-[today].lic downloads automatically. Opening it in a hex editor shows: bytes 0x56 0x4D 0x4C 0x31 (VML1 magic) at offset 0, followed by 12 IV bytes, then AES-GCM ciphertext — not plain JSON.">
      Click <strong>Create Licence</strong>.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-11 — Upload and Verify the Licence</Title>
    <Pre n={17} result="Success banner: 'Licensed to: [your username]' + today's date. Feature tags: Security ✓ (green), Inviter ✓ (green), Gatekeeper 🔒 (grey, disabled), Gamification ✓ (green).">
      In the Verify card, drag and drop (or click to browse) the downloaded .lic file.
    </Pre>
    <Pre n={18} result="Gatekeeper toggle is greyed out and locked. Tooltip: 'Contact your vendor for a demo today!'. Inviter, Security, Gamification toggles are active and editable.">
      Attempt to change the Gatekeeper toggle.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-12 — Feature Toggle Disables Nav and API</Title>
    <Pre n={19} result="The Inviter nav items (/inviter, /history) disappear from the sidebar immediately. The Inviter API interceptor would block any call to /api/invitations**.">
      Toggle the <strong>Inviter</strong> feature off in the Verify card.
    </Pre>
    <Pre n={20} result="Inviter nav items reappear. The sidebar is restored to its full state.">
      Toggle <strong>Inviter</strong> back on.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-13 — Remove Licence</Title>
    <Pre n={21} result="Verify card returns to 'NO LICENCE UPLOADED' state. All 4 feature toggles are enabled and editable. Login page (on next login) would show the green PoC mode banner.">
      Click <strong>Remove licence</strong>.
    </Pre>

    <Title level={5} style={{ marginTop: 16 }}>HP-14 — Login Page Licence Status Box</Title>
    <Pre n={22} result="Green banner 'PoC mode — no licence loaded, all features available' visible inside the login card, above Sign In, when no licence is loaded.">
      Log out. Observe the login page.
    </Pre>
    <Pre n={23} result="Blue box shows 'Licensed to: [issuer]' + date + four feature tags matching the file contents.">
      Log in as admin. Upload a .lic file. Log out. Observe the licence status box on the login page.
    </Pre>

    <Divider />
    <Text type="secondary" style={{ fontSize: 12 }}>
      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
      Happy path complete. All 23 steps passed = release gate cleared for the nominal Admin flow.
    </Text>
  </div>
)

// ── Critical Path ─────────────────────────────────────────────────────────────
const CriticalPathTab = () => (
  <div>
    <Alert type="warning" showIcon style={{ marginBottom: 16 }}
      message="Clean up test data (delete testqa1/testgroup-qa) after each scenario." />

    <Scenario
      id="01" severity="error"
      title="Create user with duplicate username"
      steps={[
        'Click New User.',
        'Enter username inviter1 (already exists).',
        'Fill remaining required fields. Click Create User.',
      ]}
      expected="POST /engine-rest/user/create returns 4xx. Error message displayed: 'Failed: …'. Modal remains open. No duplicate user created."
    />

    <Scenario
      id="02" severity="error"
      title="Create user — required fields missing"
      steps={[
        'Click New User.',
        'Leave Username or First Name blank.',
        'Click Create User.',
      ]}
      expected="Ant Design Form validation fires client-side. Inline error under the empty field. No API call made."
    />

    <Scenario
      id="03" severity="error"
      title="Create group with duplicate ID"
      steps={[
        'Click New Group.',
        'Enter Group ID Invitors (already exists).',
        'Fill Name. Click Create Group.',
      ]}
      expected="POST /engine-rest/group/create returns 4xx. Error message shown. No duplicate group created."
    />

    <Scenario
      id="04" severity="warning"
      title="Delete user who is the only member of webAdmins"
      steps={[
        'Verify superhero is the only member of webAdmins.',
        'Attempt to delete superhero.',
      ]}
      expected="DELETE /engine-rest/user/superhero may succeed (Operaton does not enforce this constraint). Document the result. Recommend adding a client-side guard to prevent self-deletion or removal of the last admin."
    />

    <Scenario
      id="05" severity="warning"
      title="Manage Groups modal reflects save immediately"
      steps={[
        'Open Manage Groups for any user. Add them to Security.',
        'Close and re-open Manage Groups for the same user.',
      ]}
      expected="Security checkbox is pre-checked. refreshUsers() was called on save, so groupMembers map is up to date. No stale state displayed."
    />

    <Scenario
      id="06" severity="warning"
      title="Manage Members modal reflect save immediately"
      steps={[
        'Open Manage Members for the Porters group. Remove any member.',
        'Close and re-open Manage Members for Porters.',
      ]}
      expected="Removed member is now unchecked. Count tag decrements. State is fresh after refreshUsers()."
    />

    <Scenario
      id="07" severity="warning"
      title="Session expiry during admin operation"
      steps={[
        'Log in as superhero.',
        'Open DevTools → Local Storage → set loginAt to Date.now() - (9 * 3600 * 1000 + 1000).',
        'Attempt to create a user.',
      ]}
      expected="Auto-logout triggers before or during the save. User redirected to /login. No partial user created."
    />

    <Scenario
      id="08" severity="warning"
      title="History tab — historic variable resolution"
      steps={[
        'Click the History tab.',
        'Verify completed process instances show either Checked In or Refused outcomes.',
      ]}
      expected="GET /engine-rest/history/variable-instance?processInstanceId={id} called for each instance. Outcome column shows correct tag based on checkedIn variable. No blank rows for completed processes."
    />

    <Scenario
      id="09" severity="error"
      title="Upload invalid file — wrong format"
      steps={[
        'In the Verify card, upload any non-.lic file (e.g. a .txt or .png file).',
      ]}
      expected="Red error banner: 'Not a valid VisMan licence file — header mismatch'. Upload area reappears for retry. No feature state is changed. All toggles remain in their previous state."
    />

    <Scenario
      id="10" severity="error"
      title="Upload corrupted .lic file — decryption failure"
      steps={[
        'Open a valid .lic file in a text editor. Modify 2–3 characters in the middle. Save.',
        'Upload the corrupted file to the Verify card.',
      ]}
      expected="Red error banner: 'Decryption failed — wrong seed or corrupted file'. Retry upload area shown. Feature state unchanged."
    />

    <Scenario
      id="11" severity="error"
      title="Active role user auto-logged out when their feature is disabled"
      steps={[
        'Log in as security1 in Tab A.',
        'In Tab B (as admin): Licence Mgmt → upload a .lic file → disable Security feature toggle.',
        'Switch to Tab A.',
      ]}
      expected="security1 is automatically logged out and redirected to /login. LicenceWatcher fires: featureActive.security = false while auth.role = SECURITY → logout() + navigate('/login')."
    />

    <Scenario
      id="12" severity="warning"
      title="Login page quick-fill hides roles for disabled features"
      steps={[
        'Load a .lic file with Gatekeeper disabled.',
        'Log out. On the login page, select any location in the quick-fill.',
        'Observe the role filter pills.',
      ]}
      expected="Gatekeeper pill is absent from the role selector. Licence box shows grey Gatekeeper lock tag. No Gatekeeper users appear in the user list even if assigned to the location."
    />

    <Scenario
      id="13" severity="warning"
      title="'Load a different licence' replaces the current one"
      steps={[
        'Upload licence A (Gatekeeper disabled).',
        'Click "Load a different licence". Upload licence B (all features enabled).',
      ]}
      expected="Verify card resets to upload state, then shows licence B's metadata after upload. All 4 feature toggles are now enabled. No stale state from licence A persists."
    />

    <Divider orientation="left" style={{ fontSize: 12, color: '#595959' }}>Accessibility</Divider>

    <Scenario
      id="A1" severity="warning"
      title="Manage Groups / Manage Members checkboxes — keyboard Space"
      steps={[
        'Log in as superhero. Open the Users tab.',
        'Click "Manage Groups" for any user. Do not use the mouse inside the modal.',
        'Tab to a group checkbox. Press Space to toggle it.',
        'Tab to Save and press Enter.',
      ]}
      expected="Each checkbox toggles on Space keypress (Ant Design onChange wired). The diff-save logic fires the correct add/remove calls. Repeat test with Manage Members in the Groups tab."
    />

    <Scenario
      id="A2" severity="warning"
      title="Supervisor Assignment icicle chart — keyboard drilldown"
      steps={[
        'Navigate to Admin → Supervisor Assignments → Icicle view tab.',
        'Tab to a supervisor node that has children (shown as a coloured rectangle).',
        'Press Enter or Space to drill into it.',
        'Press Escape (or Tab back) to return.',
      ]}
      expected="Supervisor nodes with children have tabIndex=0 and role='button'. Enter/Space triggers the drill-down (IcicleChart handleClick). Leaf nodes (supervisees) are not in the tab order (tabIndex=-1)."
    />

    <Scenario
      id="A3" severity="warning"
      title="Tangled-tree supervisor filter — keyboard toggle and aria-pressed"
      steps={[
        'Navigate to Admin → Supervisor Assignments → Tangled tree tab.',
        'Tab to a supervisor name label (coloured text node).',
        'Press Enter or Space to activate the filter.',
        'Inspect aria-pressed in DevTools → Accessibility tree.',
        'Press Enter/Space again to clear the filter.',
      ]}
      expected="Supervisor labels have role='button', tabIndex=0. aria-pressed='true' when filter is active; 'false' when cleared. Lines and supervisee nodes visually reflect the filter state."
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
  { method: 'GET',    path: '/engine-rest/task',                           happy: 'HP-1', critical: '—',         notes: 'All active tasks (Active tab count)' },
  { method: 'GET',    path: '/engine-rest/history/process-instance',       happy: 'HP-1', critical: 'CP-08',     notes: 'Last 30 completed processes (History tab)' },
  { method: 'GET',    path: '/engine-rest/history/variable-instance',      happy: 'HP-1', critical: 'CP-08',     notes: 'Variables per process instance (outcome resolution)' },
  { method: 'GET',    path: '/engine-rest/task?assignee={u}',              happy: 'HP-2', critical: '—',         notes: 'Task count per user (Tasks column)' },
  { method: 'GET',    path: '/engine-rest/user',                           happy: 'HP-2', critical: '—',         notes: 'All Operaton users' },
  { method: 'GET',    path: '/engine-rest/group',                          happy: 'HP-5', critical: '—',         notes: 'All Operaton groups' },
  { method: 'GET',    path: '/engine-rest/group/{id}/members',             happy: 'HP-5', critical: 'CP-05,06',  notes: 'Members of a specific group' },
  { method: 'POST',   path: '/engine-rest/user/create',                    happy: 'HP-3', critical: 'CP-01,02',  notes: 'Create new user' },
  { method: 'PUT',    path: '/engine-rest/user/{id}/profile',              happy: '—',    critical: '—',         notes: 'Edit existing user profile (Edit button)' },
  { method: 'DELETE', path: '/engine-rest/user/{id}',                      happy: 'HP-7', critical: 'CP-04',     notes: 'Delete user' },
  { method: 'POST',   path: '/engine-rest/group/create',                   happy: '—',    critical: 'CP-03',     notes: 'Create new group' },
  { method: 'DELETE', path: '/engine-rest/group/{id}',                     happy: '—',    critical: '—',         notes: 'Delete group (Delete button in Groups tab)' },
  { method: 'POST',   path: '/engine-rest/group/{id}/members/{userId}',    happy: 'HP-4,6', critical: 'CP-05',   notes: 'Add user to group (diff-save: added list)' },
  { method: 'DELETE', path: '/engine-rest/group/{id}/members/{userId}',    happy: 'HP-4,6', critical: 'CP-06',   notes: 'Remove user from group (diff-save: removed list)' },
]

const apiColumns = [
  { title: 'Method', dataIndex: 'method', key: 'method', width: 80,
    render: v => <Tag color={{ GET:'blue', POST:'green', PUT:'orange', DELETE:'red' }[v] ?? 'default'} style={{ fontWeight: 700, fontSize: 11 }}>{v}</Tag> },
  { title: 'Endpoint', dataIndex: 'path', key: 'path', render: v => <C>{v}</C> },
  { title: 'Happy Path', dataIndex: 'happy', key: 'happy', width: 90, render: v => <Text style={{ fontSize: 12, color: '#389e0d' }}>{v}</Text> },
  { title: 'Critical Path', dataIndex: 'critical', key: 'critical', width: 120, render: v => <Text style={{ fontSize: 12, color: '#d46b08' }}>{v}</Text> },
  { title: 'Notes', dataIndex: 'notes', key: 'notes', render: v => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text> },
]

const ApiTab = () => (
  <div>
    <Alert type="info" showIcon style={{ marginBottom: 14 }}
      message="All endpoints are Operaton REST API (proxied through the browser directly). Authentication: HTTP Basic on every request." />
    <Table dataSource={apiData} columns={apiColumns} size="small" pagination={false} rowKey="path" scroll={{ x: 800 }} />
    <Divider />
    <Title level={5}><ApiOutlined style={{ marginRight: 6 }} />Not covered by this test plan</Title>
    {[
      'Inviter, Security, and Gatekeeper workflows — covered in their respective test plans',
      '/api/locations and /api/entrances CRUD (Locations page, Entrances page)',
      '/api/supervisor/assignments — Supervisor Assignment page test plan required separately',
      'Operaton Cockpit and Tasklist UI (/operaton/app/*)',
      'Licence crypto operations (generate + verify) are fully client-side Web Crypto API — no server endpoints involved. Verify via DevTools Network: no requests should fire when clicking Create Licence or uploading a .lic file.',
      'Licence enforcement is client-side only (PoC scope). A determined user can bypass the interceptor by calling the API directly — no server-side feature check exists.',
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

export default function QATestPlanAdminModal({ open, onClose }) {
  return (
    <Modal
      open={open} onCancel={onClose} onOk={onClose}
      title={
        <span>
          <BugOutlined style={{ marginRight: 8, color: '#389e0d' }} />
          QA Test Plan — Admin Workflow
          <Tag color="green" style={{ marginLeft: 10, fontSize: 11, fontWeight: 600 }}>Manual</Tag>
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

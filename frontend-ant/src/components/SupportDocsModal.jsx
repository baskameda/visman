import React from 'react'
import { Modal, Tabs, Typography, Tag, Alert, Divider } from 'antd'

const { Text, Title, Paragraph } = Typography
const C = ({ children }) => <code style={{ background: '#f5f5f5', padding: '1px 5px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace' }}>{children}</code>
const Step = ({ n, children }) => <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}><Tag style={{ minWidth: 24, textAlign: 'center', fontWeight: 700 }}>{n}</Tag><Text style={{ fontSize: 13 }}>{children}</Text></div>
const Issue = ({ title, cause, fix }) => (
  <div style={{ marginBottom: 14 }}>
    <Text strong style={{ fontSize: 13 }}>🔴 {title}</Text>
    <div style={{ paddingLeft: 16, marginTop: 4 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>Cause: </Text><Text style={{ fontSize: 12 }}>{cause}</Text><br />
      <Text type="secondary" style={{ fontSize: 12 }}>Fix: </Text><Text style={{ fontSize: 12 }}>{fix}</Text>
    </div>
  </div>
)

const TABS = [
  {
    key: 'prereqs', label: 'Prerequisites',
    children: (
      <div>
        {[['Java 21+','java -version'],['Gradle 8+','gradle -v'],['Node 18+','node -v'],['SQL Server','localhost:1433 reachable'],['Git','git -v']].map(([dep, cmd]) => (
          <div key={dep} style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
            <Text strong style={{ minWidth: 120, fontSize: 13 }}>{dep}</Text>
            <C>{cmd}</C>
          </div>
        ))}
      </div>
    ),
  },
  {
    key: 'install', label: 'Installation',
    children: (
      <div>
        <Title level={5}>Backend</Title>
        <Step n={1}>Clone the repository: <C>git clone {'<repo-url>'}</C></Step>
        <Step n={2}>Create database and configure <C>application.yaml</C> with your SQL Server credentials</Step>
        <Step n={3}>Run: <C>./gradlew bootRun</C> — backend starts on <C>localhost:8080</C></Step>
        <Divider />
        <Title level={5}>Frontend (Ant — this build)</Title>
        <Step n={4}><C>cd frontend-ant && npm install && npm run dev</C> — runs on <C>localhost:5174</C></Step>
        <Title level={5}>Mobile PWA (Security Officers)</Title>
        <Step n={5}><C>cd frontend-mobile && npm install && npm run dev</C> — runs on <C>https://localhost:5176</C> (self-signed cert)</Step>
        <Title level={5}>Mobile PWA (Gatekeepers)</Title>
        <Step n={6}><C>cd frontend-gate && npm install && npm run dev</C> — runs on <C>https://localhost:5177</C> (self-signed cert, purple theme)</Step>
        <Title level={5}>Frontend (MUI — original)</Title>
        <Step n={7}><C>cd frontend && npm install && npm run dev</C> — runs on <C>localhost:5173</C></Step>
      </div>
    ),
  },
  {
    key: 'firstrun', label: 'First Run',
    children: (
      <div>
        <Alert type="info" showIcon message="Default Operaton admin: admin / admin (change immediately)" style={{ marginBottom: 16 }} />
        <Step n={1}>Open <C>http://localhost:5174</C></Step>
        <Step n={2}>Click <strong>Create Admin User</strong> to create the <C>superhero</C> webAdmin account</Step>
        <Step n={3}>Log in as <C>superhero / test123</C></Step>
        <Step n={4}>Use quick-fill buttons to log in as inviter1, security1, or gatekeeper1</Step>
        <Step n={5}>Operaton Cockpit: <C>http://localhost:8080/operaton/app/cockpit</C></Step>
      </div>
    ),
  },
  {
    key: 'users', label: 'User Setup',
    children: (
      <div>
        <Title level={5}>Built-in Groups → Roles</Title>
        {[
          ['Invitors',  'INVITER',    '#1677ff', 'Creates multi-visitor invitations, answers security clarification questions'],
          ['Security',  'SECURITY',   '#d46b08', 'Reviews visitor security checks — approve, refuse, blacklist, or ask for clarification'],
          ['Porters',   'GATEKEEPER', '#531dab', 'Checks in arriving visitors; sees scheduled visits grouped by week'],
          ['webAdmins', 'ADMIN',      '#389e0d', 'Manages users, groups, entrances, and supervisor assignments'],
        ].map(([g, r, color, d]) => (
          <div key={g} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
              <Tag style={{ fontWeight: 700, fontSize: 11, minWidth: 80, textAlign: 'center' }}>{g}</Tag>
              <Tag color={color} style={{ fontSize: 11 }}>{r}</Tag>
            </div>
            <Text type="secondary" style={{ fontSize: 12, paddingLeft: 4 }}>{d}</Text>
          </div>
        ))}
        <Divider />
        <Title level={5}>Default Demo Accounts</Title>
        {[['inviter1','inviter123','Invitors'],['security1','security123','Security'],['gatekeeper1','porter123','Porters']].map(([u,p,g]) => (
          <div key={u} style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
            <C>{u}</C><Text type="secondary" style={{ fontSize: 12 }}>{p}</Text><Tag style={{ fontSize: 11 }}>{g}</Tag>
          </div>
        ))}
        <Divider />
        <Title level={5}>Setting Up Supervisors</Title>
        <Paragraph style={{ fontSize: 13 }}>
          A supervisor is an inviter who has been assigned to oversee one or more other inviters.
          Supervisors are configured by the admin and stored permanently in the database.
        </Paragraph>
        <Step n={1}>Log in as admin and navigate to <strong>Supervisor Assignments</strong> in the sidebar</Step>
        <Step n={2}>Click <strong>Add Assignment</strong> — select the inviter to be supervised and their supervisor</Step>
        <Step n={3}>Both users must already be members of the <C>Invitors</C> group in Operaton</Step>
        <Step n={4}>The supervisor will see the <strong>Supervised</strong> tab in their Inviter Dashboard on next login</Step>
        <Alert type="info" showIcon style={{ marginTop: 12 }}
          message="Claiming an invitation is permanent and cannot be undone. The original inviter loses write access." />
      </div>
    ),
  },
  {
    key: 'workflows', label: 'Workflows',
    children: (
      <div>
        <Title level={5}>Initial Setup — Locations & Entrances</Title>
        {[
          'Admin navigates to Locations in the sidebar and creates at least one location (name + coordinates)',
          'Admin navigates to Entrances, selects the location, and creates the physical entrance points',
          'Admin opens the entrance\'s gatekeeper assignment modal and assigns Porters group members',
          'Gatekeepers now see their scheduled visits scoped to their assigned entrances',
        ].map((s, i) => <Step key={i} n={i + 1}>{s}</Step>)}
        <Divider />
        <Title level={5}>Standard Invitation Flow</Title>
        {[
          'Inviter creates an invitation: selects entrance, date range, and one or more visitors',
          'For each visitor a security check task is created and assigned to the Security group',
          'Security officer reviews and selects: Approve, Refuse, Blacklist, or Ask Inviter',
          'If Ask Inviter: a Clarification task is assigned back to the original inviter (max 5 attempts)',
          'On Approve: visit records are created for each day in the range — gatekeeper can check in',
          'On Refuse/Blacklist: process ends; blacklisted visitors are blocked from future invitations',
        ].map((s, i) => <Step key={i} n={i + 1}>{s}</Step>)}
        <Divider />
        <Title level={5}>Supervisor Override Flow</Title>
        {[
          'Admin assigns a supervisor to one or more inviters in Supervisor Assignments',
          'Supervisor logs in — "Supervised" tab appears in Inviter Dashboard',
          'Supervisor sees all supervisee invitations grouped in that tab',
          'For IN_REVIEW invitations: supervisor can answer the clarification without claiming',
          'To take full control: click Claim, select the visitor that triggered the need, confirm',
          'Claimed invitation is immediately transferred — original inviter sees it as read-only',
        ].map((s, i) => <Step key={i} n={i + 1}>{s}</Step>)}
      </div>
    ),
  },
  {
    key: 'mockdata', label: 'Mock Data',
    children: (
      <div>
        <Alert type="info" showIcon style={{ marginBottom: 16 }}
          message="The seed data is loaded automatically at first startup via Liquibase changesets 013–019. No manual step required." />
        <Title level={5}>Scale — Stress Test Baseline</Title>
        {[
          ['Locations',              '6',       'Commanders Desk · Paris · Rome · London · Beijing · Los Angeles'],
          ['Entrances',             '60',       '10 per location — Main Entrance, North/South Gate, East/West Wing Lobby, Loading Docks α/β, Executive Floor, Server Room, Staff Canteen'],
          ['Users',                '214',       '61 inviters (inviter1–61) · 121 gatekeepers (gatekeeper1–121) · 31 security officers (security1–31) · 1 admin (superhero)'],
          ['Visitors',           '3 000',       '500-person registry per location — synthetic names, companies, and functions'],
          ['Invitations',       '~15 600',      '261 working days × ~10 per day × 6 locations (one full year of activity)'],
          ['Security checks',   '~47 000',      'One per visitor per invitation — 2 % BLACKLISTED, 5 % REFUSED, 93 % APPROVED'],
          ['Check-in records',  '~44 000',      'All APPROVED security checks resolved as CHECKED_IN with timestamps and gatekeeper assignments'],
          ['Supervisor hierarchies', '18',      '1 supervisor per role (Inviter / Security / Gatekeeper) per location · each covers up to 10 supervisees'],
        ].map(([label, value, note]) => (
          <div key={label} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
              <Text strong style={{ minWidth: 190, fontSize: 13 }}>{label}</Text>
              <Text style={{ fontSize: 18, fontWeight: 800, color: '#1677ff', minWidth: 64 }}>{value}</Text>
            </div>
            <Text type="secondary" style={{ fontSize: 12, paddingLeft: 4 }}>{note}</Text>
          </div>
        ))}
        <Divider />
        <Title level={5}>Login Credentials</Title>
        <Paragraph style={{ fontSize: 13 }}>
          All seeded accounts follow the pattern <C>[role][N] / [role][N]123</C> — e.g. <C>inviter7 / inviter7123</C>,{' '}
          <C>gatekeeper42 / gatekeeper42123</C>, <C>security15 / security15123</C>.<br />
          The login page auto-resets passwords to <strong>username = password</strong> on first load for quick-fill convenience.
        </Paragraph>
        <Divider />
        <Title level={5}>Stress Testing Tips</Title>
        {[
          'Use inviter1–61 spread across all 6 locations to simulate concurrent invitation creation',
          'Security group (security1–31) can be used to test parallel task assignment and SSE fan-out',
          'The ~44 000 check-in rows provide a realistic D3 chart and stats query load — navigate to Entrances → select any location to see the stacked bar chart',
          'Supervisor tabs load supervisee invitation lists — test with supervisors at high-volume locations (Paris, London)',
          'Gatekeeper mobile PWA: disable network after fetching the current week, perform check-ins offline, re-enable to verify auto-sync queue drain',
        ].map((tip, i) => <Step key={i} n={i + 1}>{tip}</Step>)}
      </div>
    ),
  },
  {
    key: 'troubleshoot', label: 'Troubleshooting',
    children: (
      <div>
        <Issue title="Datasource error on startup" cause="SQL Server not running or wrong credentials in application.yaml" fix="Check spring.datasource.url, username, password" />
        <Issue title="CORS errors in browser" cause="Frontend origin not in WebSecurityConfig allowedOrigins" fix="Add your origin (e.g. localhost:5174) to the CORS config and restart backend" />
        <Issue title="Login fails with 401" cause="Wrong credentials or user not in Operaton" fix="Use Operaton admin UI to verify user exists and has correct group membership" />
        <Issue title="SSE disconnects frequently" cause="Proxy timeout or keep-alive not configured" fix="Check vite proxy settings; backend SSE endpoint is /api/sse/tasks" />
        <Issue title="Liquibase lock error" cause="Previous failed migration left lock in databasechangeloglock" fix="Run: UPDATE databasechangeloglock SET locked=0; then restart" />
        <Issue title="Supervisor tab not visible after login" cause="isSupervisor is checked once at login time" fix="Log out and log back in after the admin assigns you as a supervisor" />
        <Issue title="Claim button returns 403" cause="The invitation's current inviter_username is not in your supervisees list" fix="Verify the assignment exists in Supervisor Assignments page; invitation may have already been claimed" />
        <Issue title="No clarification tasks found when clicking Answer" cause="The task may have been completed or the process instance ID is null" fix="Refresh the supervised tab to get the latest status; check the invitation's process instance in Operaton Cockpit" />
        <Issue title="Entrances page shows empty state" cause="No location is selected in the location dropdown" fix="Select a location from the dropdown at the top of the Entrances page; use the URL param ?location=ID to bookmark a specific location" />
        <Issue title="Delete location returns 409 Conflict" cause="The location still has entrances assigned" fix="Go to the Entrances page, select that location, and delete all its entrances first" />
        <Issue title="Gatekeeper assign modal shows 'other location' greyed out" cause="That porter is already assigned to an entrance at a different location" fix="Unassign the porter from their current entrance before assigning them here; a gatekeeper may only belong to one location" />
        <Issue title="Mobile PWA: browser shows 'NET::ERR_CERT_AUTHORITY_INVALID'" cause="@vitejs/plugin-basic-ssl generates a self-signed certificate not trusted by the OS" fix="Open https://localhost:5176 in a browser tab, click Advanced → Proceed. On Android, add the cert exception via Chrome settings. iOS requires installing the mkcert root CA." />
        <Issue title="Mobile PWA: CORS error from frontend-mobile" cause="Port 5176 (http or https) not in WebSecurityConfig allowedOrigins" fix="Add the missing origin to the CORS config in WebSecurityConfig.java and restart the backend. Both http://localhost:5176 and https://localhost:5176 must be listed." />
        <Issue title="Invitations tab shows empty current month" cause="The /my/months call returned no entry for the current month (no invitations yet this month)" fix="This is expected — the current month panel is always shown even with 0 invitations. Creating an invitation will populate it immediately." />
        <Issue title="Past months not loading when expanded" cause="The /my?year=Y&month=M request fails or returns 401" fix="Verify the backend is running and the user session is still valid. Re-login if needed — the month index and lazy fetch both require a valid Authorization header." />
        <Issue title="Liquibase 019 fails with 'Conversion failed converting nvarchar to int'" cause="SQL Server evaluated CAST(SUBSTRING(u.ID_,...) AS INT) on all users before the GROUP_ID filter, hitting non-numeric suffixes like 'per1' in 'gatekeeper1'" fix="Ensure changeset 019 uses TRY_CAST instead of CAST. If the changeset already ran with errors, delete the DATABASECHANGELOG rows for 019-1/2/3, fix the SQL, then restart." />
        <Issue title="Session timer not showing in header" cause="loginAt key missing from localStorage — happens if user was already logged in before this feature was deployed" fix="Log out and log back in. The loginAt key is written by AuthContext.login() on every successful login." />
        <Issue title="User is not redirected after login (stays on /login)" cause="login() is async (awaits getUserProfile); if called without await the navigate() fires before auth state is set, RequireAuth bounces back" fix="All three LoginPage.jsx files must use: await login({...}) before navigate(). Verify with browser dev tools — auth should be non-null before the navigate event." />
        <Issue title="Greeting does not appear after login" cause="greeting_pending flag not set — either the login page skipped await on login(), or sessionStorage was cleared" fix="Confirm AuthContext.login() sets sessionStorage.greeting_pending = '1'. Force-set it in DevTools → Application → Session Storage and refresh to test the overlay independently." />
        <Issue title="Role adoption sidebar link not visible" cause="Link is hidden when the sidebar is collapsed or when the logged-in user is ADMIN" fix="Expand the sidebar (collapse toggle) and verify the user is not in the webAdmins group. The link renders only for INVITER, SECURITY, and GATEKEEPER roles." />
        <Issue title="'Feature not licensed' page shown instead of dashboard" cause="A licence file is loaded and the feature toggle for this role is disabled in the Verify Licence card on the Licence Mgmt page" fix="Log in as admin, go to Licence Mgmt → Verify Licence, and enable the toggle for the affected feature. If no licence file is loaded, all features are enabled by default." />
        <Issue title="Feature toggle is greyed out and cannot be changed" cause="A licence file is loaded and the feature is not licensed in that file — the toggle is intentionally locked" fix="The feature is not included in the current licence. The vendor must issue a new licence file with the feature enabled. Upload the new file via Licence Mgmt → Verify Licence → Load a different licence." />
        <Issue title="User is automatically logged out when admin changes a feature toggle" cause="LicenceWatcher detects that the user's own role feature was deactivated mid-session and triggers an automatic logout" fix="This is expected behaviour. Ask the user to log in again once the licence configuration is set correctly." />
        <Issue title="API calls return 403 with isLicenceBlock flag" cause="The axios licence interceptor is blocking requests because the corresponding feature toggle is off" fix="Enable the feature in Licence Mgmt → Verify Licence. If the page shows no licence uploaded, all features should be on — check that LicenceContext state has not been corrupted by a hard page refresh. If the problem persists, log out and back in." />
        <Issue title="Uploaded .lic file shows 'Invalid file format'" cause="The file does not start with the VML1 magic bytes (0x56 0x4D 0x4C 0x31) — either the wrong file was selected or the file was corrupted during transfer" fix="Ensure the .lic file was generated by the VisMan Licence Mgmt page and was not renamed, truncated, or modified. Re-download the file from the admin who generated it." />
        <Issue title="Uploaded .lic file shows decryption error" cause="The file was generated with a different seed (password) or a different PBKDF2 salt — the decryption key does not match" fix="For this PoC the seed is fixed as 'myLicense'. Ensure the file was generated by this system and has not been tampered with. Regenerate the licence from the Licence Mgmt page." />
        <Issue title="'Remove licence' resets all features to ON" cause="Removing the licence returns the system to the no-licence state where all four feature toggles are enabled by default" fix="This is expected. If the intent was to restrict features, a valid licence must be uploaded with the desired features disabled." />
      </div>
    ),
  },
]

export default function SupportDocsModal({ open, onClose }) {
  return (
    <Modal open={open} onCancel={onClose} onOk={onClose} title="Support Documentation" width={780}
      styles={{ body: { maxHeight: '75vh', overflowY: 'auto', padding: '0 24px 16px' } }}>
      <Tabs items={TABS} size="small" />
    </Modal>
  )
}

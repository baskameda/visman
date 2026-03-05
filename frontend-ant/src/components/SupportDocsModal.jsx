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
        <Title level={5}>Frontend (MUI — original)</Title>
        <Step n={5}><C>cd frontend && npm install && npm run dev</C> — runs on <C>localhost:5173</C></Step>
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
        <Step n={1}>Log in as admin and navigate to <strong>Supervisor Assignments</strong> (button in Admin Overview header)</Step>
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

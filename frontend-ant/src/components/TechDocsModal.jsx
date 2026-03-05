import React, { useState } from 'react'
import { Modal, Tabs, Typography, Tag, Divider } from 'antd'

const { Text, Title, Paragraph } = Typography

const C = ({ children }) => <code style={{ background: '#f5f5f5', padding: '1px 5px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace' }}>{children}</code>
const Row = ({ k, v }) => <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}><Text style={{ minWidth: 180, fontWeight: 600, fontSize: 13 }}>{k}</Text><Text style={{ fontSize: 13 }}>{v}</Text></div>

function ApiRow({ method, path, desc }) {
  const color = method === 'GET' ? 'blue' : method === 'POST' ? 'green' : method === 'PUT' ? 'orange' : 'red'
  return (
    <div style={{ marginBottom: 6 }}>
      <Tag color={color} style={{ fontWeight: 700, fontSize: 11, minWidth: 52, textAlign: 'center' }}>{method}</Tag>{' '}
      <C>{path}</C>{' '}
      <Text type="secondary" style={{ fontSize: 12 }}>{desc}</Text>
    </div>
  )
}

const TABS = [
  {
    key: 'stack', label: 'Stack Overview',
    children: (
      <div>
        <Title level={5}>Backend</Title>
        <Row k="Runtime"      v="Java 21" />
        <Row k="Framework"    v="Spring Boot 3.5.9" />
        <Row k="BPM Engine"   v="Operaton 1.0.0-beta-5 (Camunda 7 fork)" />
        <Row k="Database"     v="SQL Server (Liquibase migrations, 009 changesets)" />
        <Row k="Auth"         v="HTTP Basic — decoded manually per controller" />
        <Divider />
        <Title level={5}>Frontend</Title>
        <Row k="Framework"    v="React 18.3 + Vite 5.4" />
        <Row k="UI Library"   v="Ant Design 5 (this build) / MUI v6 (original)" />
        <Row k="i18n"         v="react-i18next 15 — 6 languages" />
        <Row k="HTTP"         v="axios — all API calls" />
        <Row k="State"        v="React hooks only — no Redux" />
      </div>
    ),
  },
  {
    key: 'db', label: 'Database Schema',
    children: (
      <div>
        <Title level={5}>Custom Tables</Title>
        {[
          ['poc_visitor',                'Visitor registry (name, company, function, email, phone, blacklisted)'],
          ['poc_entrance',               'Physical entrances with name and description'],
          ['poc_entrance_gatekeeper',    'M-to-N: gatekeepers assigned to entrances'],
          ['poc_invitation',             'One invitation per inviter (date range, entrance, company)'],
          ['poc_invitation_visitor',     'M-to-N: visitors linked to an invitation'],
          ['poc_security_check',         'One row per (invitation, visitor) — holds decision, note, reliability'],
          ['poc_visit',                  'One row per (visitor, date) — created on approval, check-in status'],
          ['poc_supervisor_assignment',  'Flat hierarchy: inviter_username (PK) → supervisor_username'],
        ].map(([t, d]) => (
          <div key={t} style={{ marginBottom: 6 }}>
            <C>{t}</C>
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>{d}</Text>
          </div>
        ))}
        <Divider />
        <Title level={5}>Operaton Engine Tables</Title>
        <Text style={{ fontSize: 13 }}>All <C>ACT_*</C> and <C>ACT_HI_*</C> tables managed by Operaton — process instances, user tasks, variables, history.</Text>
      </div>
    ),
  },
  {
    key: 'bpmn', label: 'BPMN Process',
    children: (
      <div>
        <Title level={5}>VisitProcess_2.0 — per-visitor multi-instance</Title>
        <Paragraph style={{ fontSize: 13 }}>
          One process instance per invitation. A multi-instance sub-process loops once per visitor.
          Each iteration runs an independent security check cycle.
        </Paragraph>
        <Row k="Security Check"       v="User Task — Security group, candidateGroup=Security" />
        <Row k="securityDecision"     v="APPROVE | REFUSE | BLACKLIST | ASK_INVITER" />
        <Row k="ASK_INVITER branch"   v="Clarification counter → Provide Clarification task (assigned to starter)" />
        <Row k="Auto-refuse"          v="clarificationCount ≥ 5 → ScriptTask refuses automatically" />
        <Row k="APPROVE branch"       v="SecurityTaskAssignmentListener creates poc_visit rows (one per day)" />
        <Divider />
        <Title level={5}>Key Process Variables</Title>
        {[
          ['invitationId',          'Long — links process to poc_invitation'],
          ['visitorIds',            'List<Long> — drives multi-instance loop'],
          ['entranceId',            'Long — target entrance'],
          ['starter',               'String — username who created the invitation'],
          ['securityDecision',      'String — outcome of Security Check task'],
          ['securityReviewer',      'String — username set on ASK_INVITER for re-assignment'],
          ['clarificationQuestion', 'String — question posed by security'],
          ['clarificationAnswer',   'String — answer provided by inviter'],
          ['clarificationCount',    'Integer — auto-incremented by ScriptTask'],
        ].map(([k, v]) => <Row key={k} k={<C>{k}</C>} v={v} />)}
        <Divider />
        <Title level={5}>Java Delegates & Listeners</Title>
        {[
          ['SillyBlacklistChecker',            'Service Task — checks blacklist flag, sets process variable'],
          ['SecurityTaskAssignmentListener',   'Task Listener (create) — assigns security check task to reviewer on loop-back'],
        ].map(([k, v]) => <Row key={k} k={<C>{k}</C>} v={v} />)}
      </div>
    ),
  },
  {
    key: 'api', label: 'API Reference',
    children: (
      <div>
        <Title level={5}>Operaton REST (proxied via /engine-rest)</Title>
        {[
          ['POST', '/identity/verify',                              'Verify credentials'],
          ['GET',  '/group?member={u}',                            'Get user groups'],
          ['GET',  '/task?assignee={u}',                           'Get tasks assigned to user'],
          ['GET',  '/task?candidateGroup={g}',                     'Get tasks for a group'],
          ['GET',  '/task?processInstanceId={id}',                 'Get tasks for a process instance'],
          ['POST', '/task/{id}/claim',                             'Claim task'],
          ['POST', '/task/{id}/complete',                          'Complete task with variables'],
          ['GET',  '/task/{id}/localVariables/{name}',             'Read task-local variable'],
          ['GET',  '/process-instance/{id}/variables',             'Get active process variables'],
          ['GET',  '/history/process-instance',                    'Historic process list'],
          ['GET',  '/history/variable-instance',                   'Historic variables by process'],
          ['GET',  '/history/task',                                'Historic completed tasks'],
          ['GET',  '/user',                                        'List users (with memberOfGroup filter)'],
          ['GET',  '/group',                                       'List groups'],
        ].map(([m, p, d]) => <ApiRow key={p} method={m} path={p} desc={d} />)}

        <Divider />
        <Title level={5}>Custom Backend REST (/api)</Title>
        <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4, color: '#8c8c8c' }}>VISITORS</Text>
        {[
          ['POST',   '/visitors',                  'Create visitor'],
          ['GET',    '/visitors/search?q=',        'Search own visitors (scoped to inviter)'],
          ['GET',    '/visitors/blacklisted',       'List all blacklisted visitors'],
          ['PUT',    '/visitors/{id}/blacklist',    'Blacklist a visitor'],
          ['DELETE', '/visitors/{id}/blacklist',    'Unblacklist a visitor'],
        ].map(([m, p, d]) => <ApiRow key={p} method={m} path={p} desc={d} />)}

        <Text strong style={{ fontSize: 12, display: 'block', margin: '8px 0 4px', color: '#8c8c8c' }}>ENTRANCES</Text>
        {[
          ['GET',  '/entrances',                      'List all entrances'],
          ['POST', '/entrances',                      'Create entrance (admin only)'],
          ['PUT',  '/entrances/{id}',                 'Update entrance (admin only)'],
          ['DELETE','/entrances/{id}',                'Delete entrance (admin only)'],
          ['GET',  '/entrances/my',                   'Entrances assigned to authenticated gatekeeper'],
          ['GET',  '/entrances/{id}/gatekeepers',     'List gatekeepers for entrance'],
          ['PUT',  '/entrances/{id}/gatekeepers',     'Set gatekeepers for entrance'],
        ].map(([m, p, d]) => <ApiRow key={p} method={m} path={p} desc={d} />)}

        <Text strong style={{ fontSize: 12, display: 'block', margin: '8px 0 4px', color: '#8c8c8c' }}>INVITATIONS</Text>
        {[
          ['POST', '/invitations',        'Create invitation + start BPMN process'],
          ['GET',  '/invitations/my',     'Own invitations with computed status'],
          ['GET',  '/invitations/{id}',   'Full invitation detail with visitors, security checks, visits'],
        ].map(([m, p, d]) => <ApiRow key={p} method={m} path={p} desc={d} />)}

        <Text strong style={{ fontSize: 12, display: 'block', margin: '8px 0 4px', color: '#8c8c8c' }}>SECURITY CHECKS</Text>
        {[
          ['GET',  '/security-checks/my-decisions',  'Security checks decided by current user'],
          ['GET',  '/security-checks/{id}',           'Security check detail'],
          ['POST', '/security-checks/{id}/decide',    'Submit decision + complete BPMN task'],
          ['POST', '/security-checks/{id}/clarify',   'Submit clarification answer + complete BPMN task'],
        ].map(([m, p, d]) => <ApiRow key={p} method={m} path={p} desc={d} />)}

        <Text strong style={{ fontSize: 12, display: 'block', margin: '8px 0 4px', color: '#8c8c8c' }}>VISITS</Text>
        {[
          ['GET', '/visits/my',              'Visits for gatekeeper entrances (optional ?from=&to=)'],
          ['GET', '/visits/my/date-index',   'Lightweight count-per-date index for gatekeeper'],
          ['GET', '/visits/my-checkins',     'All visits checked in by current gatekeeper'],
          ['PUT', '/visits/{id}/checkin',    'Mark visit CHECKED_IN'],
          ['GET', '/visits/{id}',            'Visit detail'],
        ].map(([m, p, d]) => <ApiRow key={p} method={m} path={p} desc={d} />)}

        <Text strong style={{ fontSize: 12, display: 'block', margin: '8px 0 4px', color: '#8c8c8c' }}>SUPERVISOR</Text>
        {[
          ['GET',    '/supervisor/am-i-supervisor',                       '→ { supervisor: bool }'],
          ['GET',    '/supervisor/supervisee-invitations',                'Supervisees\' invitations (supervisor only)'],
          ['POST',   '/supervisor/claim/{invId}/visitor/{visitorId}',     'Claim & reassign invitation (supervisor only)'],
          ['GET',    '/supervisor/assignments',                           'All assignments (admin only)'],
          ['PUT',    '/supervisor/assignments',                           'Assign supervisor to inviter (admin only)'],
          ['DELETE', '/supervisor/assignments/{inviterUsername}',         'Remove assignment (admin only)'],
          ['GET',    '/supervisor/inviters',                              'Invitors group members (admin only)'],
        ].map(([m, p, d]) => <ApiRow key={p} method={m} path={p} desc={d} />)}

        <Text strong style={{ fontSize: 12, display: 'block', margin: '8px 0 4px', color: '#8c8c8c' }}>SSE</Text>
        <ApiRow method="GET" path="/api/sse/tasks" desc="Server-Sent Events — task change notifications" />
      </div>
    ),
  },
  {
    key: 'roles', label: 'Roles & Auth',
    children: (
      <div>
        <Title level={5}>Role Mapping (Operaton Groups)</Title>
        {[
          ['Invitors',  'INVITER',    'Creates invitations, answers clarification questions'],
          ['Security',  'SECURITY',   'Reviews visitors, approves / refuses / asks for clarification'],
          ['Porters',   'GATEKEEPER', 'Checks in visitors on arrival date'],
          ['webAdmins', 'ADMIN',      'Manages users, groups, entrances, supervisor assignments'],
        ].map(([g, r, d]) => (
          <div key={g} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
            <Tag style={{ minWidth: 80, textAlign: 'center', fontWeight: 700 }}>{g}</Tag>
            <Tag color="blue" style={{ minWidth: 80, textAlign: 'center' }}>{r}</Tag>
            <Text style={{ fontSize: 13 }}>{d}</Text>
          </div>
        ))}
        <Divider />
        <Title level={5}>Supervisor Hierarchy</Title>
        <Paragraph style={{ fontSize: 13 }}>
          A supervisor is an <Tag>INVITER</Tag> with one or more supervisees assigned via the admin page
          (<C>/supervisor-admin</C>). Stored in <C>poc_supervisor_assignment</C>. One supervisor per inviter (flat, two levels).
        </Paragraph>
        {[
          ['isSupervisor flag', 'Set at login by calling GET /api/supervisor/am-i-supervisor'],
          ['View supervisees',  'Supervised tab in InviterDashboard — separate section'],
          ['Answer questions',  'Supervisor can clarify without claiming — loads Operaton tasks for process instance'],
          ['Claim invitation',  'Permanently reassigns inviter_username to supervisor — cannot be undone'],
        ].map(([k, v]) => <Row key={k} k={k} v={v} />)}
        <Divider />
        <Title level={5}>Authentication</Title>
        <Paragraph style={{ fontSize: 13 }}>
          All requests use HTTP Basic Auth. The backend decodes the <C>Authorization</C> header manually
          in each controller via a private <C>requireUsername()</C> helper. No Spring Security session — all routes are
          <C> permitAll()</C>. Admin-guarded endpoints check <C>identityService.createGroupQuery().groupMember().groupId("webAdmins")</C>.
        </Paragraph>
      </div>
    ),
  },
  {
    key: 'i18n', label: 'i18n & Labels',
    children: (
      <div>
        <Title level={5}>Supported Languages</Title>
        {[['en','🇬🇧 English'],['de','🇩🇪 Deutsch'],['it','🇮🇹 Italiano'],['fr','🇫🇷 Français'],['zh','🇨🇳 中文'],['ru','🇷🇺 Русский']].map(([code, label]) => (
          <Row key={code} k={<C>{code}</C>} v={label} />
        ))}
        <Divider />
        <Title level={5}>Override System</Title>
        <Paragraph style={{ fontSize: 13 }}>
          Labels can be edited in-browser via the <Tag>Edit Labels</Tag> mode (click the coloured logo in the sidebar).
          Overrides are stored in <C>localStorage</C> as <C>i18n_overrides:{'{'}lang{'}'}</C> and applied on load.
        </Paragraph>
        <Title level={5}>Tx Component</Title>
        <Paragraph style={{ fontSize: 13 }}>
          Use <C>{'<Tx k="some.key" />'}</C> instead of <C>{'{t("some.key")}'}</C> for any label that should be editable.
          In edit mode the span shows a dashed outline; clicking opens a prompt.
        </Paragraph>
      </div>
    ),
  },
]

export default function TechDocsModal({ open, onClose }) {
  return (
    <Modal open={open} onCancel={onClose} onOk={onClose} title="Technical Documentation" width={900}
      styles={{ body: { maxHeight: '75vh', overflowY: 'auto', padding: '0 24px 16px' } }}>
      <Tabs items={TABS} size="small" />
    </Modal>
  )
}

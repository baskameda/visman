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
        <Row k="Database"     v="SQL Server (Liquibase migrations, 020 changesets)" />
        <Row k="Auth"         v="HTTP Basic — decoded manually per controller" />
        <Divider />
        <Title level={5}>Frontend (Desktop)</Title>
        <Row k="Framework"    v="React 18.3 + Vite 5.4" />
        <Row k="UI Library"   v="Ant Design 5 (this build) / MUI v6 (original)" />
        <Row k="i18n"         v="react-i18next 15 — 6 languages" />
        <Row k="HTTP"         v="axios — all API calls" />
        <Row k="State"        v="React hooks only — no Redux" />
        <Divider />
        <Title level={5}>Mobile PWA — Security (frontend-mobile/)</Title>
        <Row k="UI Library"   v="antd-mobile 5 — touch-optimised components" />
        <Row k="PWA"          v="vite-plugin-pwa 0.20 — service worker + Web App Manifest" />
        <Row k="HTTPS"        v="@vitejs/plugin-basic-ssl 1.x — dev HTTPS on port 5176" />
        <Row k="Auth"         v="localStorage persistence (key: secmobile_auth)" />
        <Row k="Target role"  v="Security Officers — task list, claim, and decide flows" />
        <Divider />
        <Title level={5}>Mobile PWA — Gatekeeper (frontend-gate/)</Title>
        <Row k="UI Library"   v="antd-mobile 5 — same stack as Security mobile" />
        <Row k="HTTPS"        v="port 5177 (https), purple theme" />
        <Row k="Auth"         v="localStorage persistence (key: gate_auth)" />
        <Row k="Offline"      v="localStorage cache (visits) + queue (pending check-ins)" />
        <Row k="GPS"          v="navigator.geolocation at check-in time — stored in poc_visit" />
        <Row k="Sync"         v="useSyncQueue — auto-drains queue on navigator.onLine event" />
        <Row k="Target role"  v="Gatekeepers — offline-first check-in for current week's visits" />
      </div>
    ),
  },
  {
    key: 'db', label: 'Database Schema',
    children: (
      <div>
        <Title level={5}>Custom Tables</Title>
        {[
          ['poc_location',               'Facility locations (name, description, latitude/longitude, created_at)'],
          ['poc_visitor',                'Visitor registry (name, company, function, email, phone, blacklisted)'],
          ['poc_entrance',               'Physical entrances with name, description and location_id FK'],
          ['poc_entrance_gatekeeper',    'M-to-N: gatekeepers assigned to entrances'],
          ['poc_invitation',             'One invitation per inviter (date range, entrance, inviter_username)'],
          ['poc_invitation_visitor',     'M-to-N: visitors linked to an invitation'],
          ['poc_security_check',         'One row per (invitation, visitor) — holds decision, note, reliability, assigned_to'],
          ['poc_visit',                  'One row per (visitor, date) — created on approval; PENDING → CHECKED_IN; checkin_lat/lng store GPS from mobile'],
          ['poc_supervisor_assignment',  'Flat hierarchy: inviter_username (PK) → supervisor_username'],
          ['poc_security_supervisor_assignment',   'Same structure for Security role'],
          ['poc_gatekeeper_supervisor_assignment', 'Same structure for Gatekeeper role'],
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
        ].map(([m, p, d]) => <ApiRow key={`${m} ${p}`} method={m} path={p} desc={d} />)}

        <Divider />
        <Title level={5}>Custom Backend REST (/api)</Title>
        <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4, color: '#8c8c8c' }}>LOCATIONS</Text>
        {[
          ['GET',    '/locations',            'List all locations (with entrance count)'],
          ['POST',   '/locations',             'Create location (admin only)'],
          ['PUT',    '/locations/{id}',        'Update location (admin only)'],
          ['DELETE', '/locations/{id}',        'Delete location — 409 if entrances exist (admin only)'],
          ['GET',    '/locations/{id}/users',  'Users assigned to a location (for login role/search filter)'],
        ].map(([m, p, d]) => <ApiRow key={`${m} ${p}`} method={m} path={p} desc={d} />)}

        <Text strong style={{ fontSize: 12, display: 'block', margin: '8px 0 4px', color: '#8c8c8c' }}>VISITORS</Text>
        {[
          ['POST',   '/visitors',                  'Create visitor'],
          ['GET',    '/visitors/search?q=',        'Search own visitors (scoped to inviter)'],
          ['GET',    '/visitors/blacklisted',       'List all blacklisted visitors'],
          ['PUT',    '/visitors/{id}/blacklist',    'Blacklist a visitor'],
          ['DELETE', '/visitors/{id}/blacklist',    'Unblacklist a visitor'],
        ].map(([m, p, d]) => <ApiRow key={`${m} ${p}`} method={m} path={p} desc={d} />)}

        <Text strong style={{ fontSize: 12, display: 'block', margin: '8px 0 4px', color: '#8c8c8c' }}>ENTRANCES</Text>
        {[
          ['GET',    '/entrances',                                    'List entrances (optional ?locationId=X)'],
          ['POST',   '/entrances',                                    'Create entrance — requires locationId (admin only)'],
          ['PUT',    '/entrances/{id}',                               'Update entrance (admin only)'],
          ['DELETE', '/entrances/{id}',                               'Delete entrance (admin only)'],
          ['GET',    '/entrances/my',                                 'Entrances assigned to authenticated gatekeeper'],
          ['GET',    '/entrances/{id}/gatekeepers',                   'List gatekeepers for entrance'],
          ['PUT',    '/entrances/{id}/gatekeepers',                   'Set gatekeepers — 409 if cross-location conflict'],
          ['GET',    '/entrances/gatekeepers-in-other-locations',     'Gatekeepers assigned to a different location (admin only, ?locationId=X)'],
        ].map(([m, p, d]) => <ApiRow key={`${m} ${p}`} method={m} path={p} desc={d} />)}

        <Text strong style={{ fontSize: 12, display: 'block', margin: '8px 0 4px', color: '#8c8c8c' }}>INVITATIONS</Text>
        {[
          ['POST', '/invitations',              'Create invitation + start BPMN process'],
          ['GET',  '/invitations/my/months',    'Month index for current user — [{year,month,count}] newest first'],
          ['GET',  '/invitations/my',           'Own invitations for current month (or ?year=Y&month=M for a specific month)'],
          ['GET',  '/invitations/{id}',         'Full invitation detail with visitors, security checks, visits'],
        ].map(([m, p, d]) => <ApiRow key={`${m} ${p}`} method={m} path={p} desc={d} />)}

        <Text strong style={{ fontSize: 12, display: 'block', margin: '8px 0 4px', color: '#8c8c8c' }}>SECURITY CHECKS</Text>
        {[
          ['GET',  '/security-checks/my-decisions',  'Security checks decided by current user'],
          ['GET',  '/security-checks/{id}',           'Security check detail'],
          ['POST', '/security-checks/{id}/decide',    'Submit decision + complete BPMN task'],
          ['POST', '/security-checks/{id}/clarify',   'Submit clarification answer + complete BPMN task'],
        ].map(([m, p, d]) => <ApiRow key={`${m} ${p}`} method={m} path={p} desc={d} />)}

        <Text strong style={{ fontSize: 12, display: 'block', margin: '8px 0 4px', color: '#8c8c8c' }}>VISITS</Text>
        {[
          ['GET', '/visits/my',                              'Visits for gatekeeper entrances (optional ?from=&to=)'],
          ['GET', '/visits/my/date-index',                   'Lightweight count-per-date index for gatekeeper'],
          ['GET', '/visits/supervisees',                     'Visits for all supervisees\' entrances (gatekeeper supervisor only)'],
          ['GET', '/visits/my-checkins',                     'All visits checked in by current gatekeeper'],
          ['GET', '/visits/stats/checkins-per-entrance-day', 'Check-in counts by entrance+day — ?days=30&locationId=X (admin only)'],
          ['PUT', '/visits/{id}/checkin',                    'Mark visit CHECKED_IN — optional body {latitude, longitude, checkinTime} for mobile GPS check-ins'],
          ['GET', '/visits/{id}',                            'Visit detail'],
        ].map(([m, p, d]) => <ApiRow key={`${m} ${p}`} method={m} path={p} desc={d} />)}

        <Text strong style={{ fontSize: 12, display: 'block', margin: '8px 0 4px', color: '#8c8c8c' }}>SUPERVISOR</Text>
        {[
          ['GET',    '/supervisor/am-i-supervisor',                       '→ { supervisor: bool }'],
          ['GET',    '/supervisor/supervisee-invitations',                'Supervisees\' invitations (supervisor only)'],
          ['POST',   '/supervisor/claim/{invId}/visitor/{visitorId}',     'Claim & reassign invitation (supervisor only)'],
          ['GET',    '/supervisor/assignments',                           'All assignments (admin only)'],
          ['PUT',    '/supervisor/assignments',                           'Assign supervisor to inviter (admin only)'],
          ['DELETE', '/supervisor/assignments/{inviterUsername}',         'Remove assignment (admin only)'],
          ['GET',    '/supervisor/inviters',                              'Invitors group members (admin only)'],
        ].map(([m, p, d]) => <ApiRow key={`${m} ${p}`} method={m} path={p} desc={d} />)}

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
  {
    key: 'licensing', label: 'Licensing',
    children: (
      <div>
        <Title level={5}>File Format (.lic)</Title>
        <Paragraph style={{ fontSize: 13 }}>
          A <C>.lic</C> file is a base64-encoded binary blob with the layout:<br />
          <C>[4-byte magic "VML1" = 0x56 0x4D 0x4C 0x31] [12-byte random IV] [AES-GCM ciphertext]</C>
        </Paragraph>
        <Title level={5}>Crypto Specification</Title>
        {[
          ['Algorithm',    'AES-256-GCM via Web Crypto API (SubtleCrypto) — no external dependencies'],
          ['Key derivation','PBKDF2, SHA-256, 100 000 iterations, fixed salt "visman-licence-v1"'],
          ['Seed (PoC)',   '"myLicense" — hardcoded; password field on generate page is decorative only'],
          ['IV',           '12 random bytes prepended to ciphertext in the .lic binary'],
          ['Payload',      'JSON: { issuer, issueDate, version, features: { security, inviter, gatekeeper, gamification } }'],
        ].map(([k, v]) => <Row key={k} k={k} v={v} />)}
        <Divider />
        <Title level={5}>LicenceContext Architecture</Title>
        <Paragraph style={{ fontSize: 13 }}>
          <C>LicenceContext.jsx</C> provides global licence state. Key exports:
        </Paragraph>
        {[
          ['licenceMeta',       'null when no file loaded; { issuer, issueDate, version } when loaded'],
          ['featureLicenced',   'null when no file; { security, inviter, gatekeeper, gamification } booleans from the decrypted payload'],
          ['featureActive',     'Current effective toggle values — defaults to all-true when no file loaded'],
          ['loadLicence(file)', 'Reads ArrayBuffer, validates magic, decrypts, parses JSON, updates all state'],
          ['clearLicence()',    'Resets all state to all-true defaults — effectively removes the file'],
          ['setFeatureActive',  'Silently ignores calls on unlicensed features when a file is loaded'],
        ].map(([k, v]) => <Row key={k} k={<C>{k}</C>} v={v} />)}
        <Divider />
        <Title level={5}>activeFeaturesRef (Module-Level Export)</Title>
        <Paragraph style={{ fontSize: 13 }}>
          <C>export const activeFeaturesRef = {'{ current: { security: true, ... } }'}</C> is kept in sync
          by a <C>useEffect</C> inside the provider. It allows non-React code (e.g. the axios interceptor)
          to read the current feature flags without traversing the context tree.
        </Paragraph>
        <Divider />
        <Title level={5}>Feature Gating Implementation</Title>
        {[
          ['licenceInterceptor.js', 'Global axios interceptor; reads activeFeaturesRef; blocks matching /api/** prefixes with a 403 isLicenceBlock error before the request leaves the browser'],
          ['LicenceGuard (App.jsx)', 'Route wrapper: featureActive[feature] ? children : <FeatureNotLicensed /> — applied to /inviter, /security, /gatekeeper, /history, /performance'],
          ['LicenceWatcher (App.jsx)', 'Null-rendering component; auto-logouts the current user when their own role feature is deactivated mid-session'],
          ['ITEM_FEATURE (Layout.jsx)', 'Map of nav route → feature key; nav items for inactive features are hidden from the sidebar'],
          ['GreetingOverlay.jsx', 'Gamification guard: suppresses greeting_pending flag and hides any visible overlay when gamification is turned off'],
        ].map(([k, v]) => <Row key={k} k={<C>{k}</C>} v={v} />)}
        <Divider />
        <Title level={5}>Interceptor Feature-to-Prefix Mapping</Title>
        {[
          ['security',     '/api/security-checks, /api/supervisor/security'],
          ['inviter',      '/api/invitations, /api/visitors, /api/supervisor/supervisee-invitations, /api/supervisor/claim/'],
          ['gatekeeper',   '/api/visits/my, /api/visits/supervisees, /api/entrances/my, /api/supervisor/gatekeeper'],
          ['gamification', '/api/visits/my-checkins, /api/security-checks/my-decisions, /api/visits/stats'],
        ].map(([k, v]) => <Row key={k} k={<C>{k}</C>} v={v} />)}
        <Paragraph style={{ fontSize: 12, color: '#8c8c8c', marginTop: 8 }}>
          Note: <C>engine-rest/**</C> calls via <C>axios.create()</C> instances are not intercepted — covered by UI route guards and nav filtering.
        </Paragraph>
      </div>
    ),
  },
  {
    key: 'a11y', label: 'Accessibility',
    children: (
      <div>
        <Title level={5}>Standard</Title>
        <Paragraph style={{ fontSize: 13 }}>
          WCAG 2.1 AA — aligned with the <strong>European Accessibility Act (EAA)</strong> requirements
          for digital software products. All 9 implementation categories below are active in{' '}
          <C>frontend-ant/</C>.
        </Paragraph>
        <Row k="Global stylesheet"  v="frontend-ant/src/a11y.css — sr-only utility, skip-link focus-visible, reduced-motion media query" />
        <Row k="Lang sync"          v="LangSync component in main.jsx syncs <html lang> attribute with active i18next language" />
        <Row k="Skip link"          v="Skip-to-content <a> at top of Layout; visually hidden until keyboard-focused via .skip-link:focus-visible" />
        <Row k="Main landmark"      v={<><C>{'<Content id="main-content" role="main">'}</C> wraps every page; skip link targets this id</>} />
        <Row k="Nav landmark"       v={<><C>{'<nav aria-label="…">'}</C> on sidebar; unique aria-label per region</>} />
        <Divider />
        <Title level={5}>Implemented Categories</Title>
        {[
          ['Cat 1 — Page titles',       'document.title updated per route via PAGE_TITLE_KEYS map in Layout.jsx; each page has a unique descriptive title'],
          ['Cat 2 — Colour contrast',   'textSub tokens: #a0a0a0 (dark) / #6b6b6b (light) — both pass AA 4.5:1. Role badge textColor is a darker accessible variant separate from the brand hue used for backgrounds'],
          ['Cat 3 — Focus / keyboard',  'GreetingOverlay: role="dialog", aria-modal="true", tabIndex={0}, auto-focus on show, Escape/Enter/Space dismiss. Checkboxes in AdminDashboard and EntrancesPage have onChange so keyboard Space activates them natively. SupervisorAssignmentPage SVG <g> nodes: role="button", tabIndex, onKeyDown (Enter/Space), aria-pressed on TangledTree toggle. EntrancesPage chart SVG: role="img" + aria-label'],
          ['Cat 4 — Live update pause', 'GatekeeperDashboard 60-second refresh gated by a paused boolean; pause/resume button carries aria-pressed reflecting current state'],
          ['Cat 5 — Reduced motion',    '@media (prefers-reduced-motion: reduce) in a11y.css sets animation-duration: 0.01ms and transition-duration: 0.01ms — applies globally'],
          ['Cat 6 — Form labels',       'aria-label on all bare inputs, textareas, selects, checkboxes, and sliders outside a labelled Form.Item: SecurityDashboard note + clarification textareas; InviterDashboard clarification textarea + Radio.Group; AdminDashboard Checkboxes; LocationsPage delete confirm Input; EntrancesPage location Select + gatekeeper Checkbox; LicencePage feature Switches; Sliders carry aria-valuetext'],
          ['Cat 7 — Session warning',   'Modal fires at ≤5 minutes remaining with "You will be logged out in X minutes." message; "Extend session" button resets localStorage.loginAt and invokes extendSession() callback from AuthContext, rearming the 9-hour timer'],
          ['Cat 8 — Data tables',       'aria-label added to every Ant Design <Table> component (visitors, security checks, visits, users, groups, entrances, locations, supervisor assignments, etc.)'],
          ['Cat 9 — Decorative icons',  'aria-hidden="true" on all purely decorative Ant Design icon spans wrapped in <Text type="secondary">; role="img" on standalone meaningful SVGs (ProcessFlowViz, D3 chart)'],
        ].map(([k, v]) => <Row key={k} k={k} v={v} />)}
      </div>
    ),
  },
  {
    key: 'session', label: 'Session & UX',
    children: (
      <div>
        <Title level={5}>Auto-Logout (9 hours)</Title>
        <Paragraph style={{ fontSize: 13 }}>
          On successful login, <C>AuthContext.login()</C> writes <C>loginAt = Date.now()</C> to localStorage.
          A <C>useEffect</C> in AuthContext computes the remaining time and calls <C>setTimeout(logout, remaining)</C>.
          On page refresh the timer re-arms from the stored <C>loginAt</C> value. After 9 hours the user is silently
          logged out and redirected to <C>/login</C>.
        </Paragraph>
        <Title level={5}>Session Countdown Timer</Title>
        <Paragraph style={{ fontSize: 13 }}>
          <C>useSessionTimer()</C> (defined in Layout.jsx, TaskListPage, VisitListPage) reads <C>loginAt</C>,
          computes remaining hours/minutes, and ticks every 60 seconds via <C>setInterval</C>.
          The timer is shown near the user's name: grey → orange (&lt; 30 min) → red (&lt; 10 min).
        </Paragraph>
        <Title level={5}>Login Greeting</Title>
        <Paragraph style={{ fontSize: 13 }}>
          <C>login()</C> sets <C>sessionStorage.greeting_pending = '1'</C>.
          <C>GreetingOverlay</C> checks this flag on mount, clears it, and shows the animated card.
          A pool of 20 icon+greeting pairs (paired by the same random index) is defined in <C>greetings.js</C>.
          The overlay dismisses on click or after the auto-fade timeout.
        </Paragraph>
        <Title level={5}>Performance Page</Title>
        <Paragraph style={{ fontSize: 13 }}>
          Route <C>/performance</C> — <C>PerformancePage.jsx</C> renders role-specific stat panels
          (InviterStatsPanel, OrgStatsPanel + SecurityStatsPanel, or GatekeeperStatsPanel).
          Accessible from the <strong>My Performance</strong> nav item for INVITER, SECURITY, and GATEKEEPER roles.
        </Paragraph>
        <Title level={5}>Why Us Modal</Title>
        <Paragraph style={{ fontSize: 13 }}>
          <C>WhyUsModal.jsx</C> — cinematic brochure-style marketing modal with a dark hero banner,
          Problem / Solution / Differentiators (6 feature cards) / Stats (dark bar) / CTA sections.
          Fully i18n in all 6 languages (<C>whyUs.*</C> keys). Opened via the <strong>Why Us — Our Vision</strong>{' '}
          link on the Login page above the "Sign in" label (<C>nav.whyUs</C> key).
        </Paragraph>
        <Title level={5}>Role Adoption Modal</Title>
        <Paragraph style={{ fontSize: 13 }}>
          <C>RoleAdoptionModal.jsx</C> — single component receiving a <C>role</C> prop
          (<C>INVITER</C> / <C>SECURITY</C> / <C>GATEKEEPER</C>). Shows a role-coloured header, 5 checkmark
          bullet points of capabilities that became newly possible, and a mobile-app callout with{' '}
          <C>MobileOutlined</C> icon. All content fully i18n via <C>roleAdoption.{'{role}'}.{'{key}'}</C> keys in all 6
          languages. Linked in the sidebar above Dev. Logs — only visible to the matching role, hidden from ADMIN.
          Link text pattern: <em>VisMan for [Role]</em> (translated per locale).
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

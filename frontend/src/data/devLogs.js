// ─── Development Session Log ─────────────────────────────────────────────────
// All timestamps are UTC. Costs estimated from transcript size.
// Claude Sonnet pricing: $3/MTok input, $15/MTok output.

const devLogs = [
  {
    session: 1,
    title: 'Project Bootstrap & Full-Stack Foundation',
    description: 'Spring Boot 3 backend with Operaton BPMN engine, React 18 frontend, SQL Server integration. Four-step visitor process, role-based dashboards (Inviter, Security, Gatekeeper). Extensive dependency and version compatibility troubleshooting.',
    start: '2026-03-02T15:56:19Z',
    end:   '2026-03-03T09:21:33Z',
    hours: 17.4,
    costUSD: 1.26,
  },
  {
    session: 2,
    title: 'Admin Dashboard, Auto-Refresh & Flow Visualization',
    description: 'Admin dashboard implementation, SSE-based auto-refresh for real-time task updates, custom ProcessFlowViz component for BPMN step visualization.',
    start: '2026-03-03T09:21:05Z',
    end:   '2026-03-03T11:55:56Z',
    hours: 2.6,
    costUSD: 0.84,
  },
  {
    session: 3,
    title: 'UI Enhancements & Admin User Management',
    description: 'ProcessFlowViz size increase, admin user management with webAdmins group, per-user task history with daily charts.',
    start: '2026-03-03T11:55:48Z',
    end:   '2026-03-03T12:26:11Z',
    hours: 0.5,
    costUSD: 0.55,
  },
  {
    session: 4,
    title: 'SSE Real-time Updates, Navigation & Reskin',
    description: 'Server-Sent Events for real-time task updates, collapsible left navigation drawer with role-based menus, Ant Design CSS theme extraction and MUI theme mapping.',
    start: '2026-03-03T12:26:06Z',
    end:   '2026-03-03T12:46:07Z',
    hours: 0.3,
    costUSD: 0.84,
  },
  {
    session: 5,
    title: 'User & Group Management, Dual-Role Navigation',
    description: 'Full user and group management in admin dashboard (create/edit/delete users, groups, memberships). Dual-role navigation for users belonging to multiple groups.',
    start: '2026-03-03T12:39:03Z',
    end:   '2026-03-03T13:24:35Z',
    hours: 0.8,
    costUSD: 1.25,
  },
  {
    session: 6,
    title: 'i18n — 6 Languages',
    description: 'Full internationalisation with react-i18next: English, German, Italian, French, Chinese, Russian. Per-user language persistence in localStorage, language switcher in topbar.',
    start: '2026-03-03T13:23:46Z',
    end:   '2026-03-03T15:58:26Z',
    hours: 2.6,
    costUSD: 2.71,
  },
  {
    session: 7,
    title: 'Live Label Editor',
    description: 'In-app label editing: click the logo square in the drawer to toggle edit mode, click any label to edit it via prompt. Changes persist in localStorage per locale and apply live via i18next bundle injection.',
    start: '2026-03-03T15:57:36Z',
    end:   '2026-03-03T16:35:08Z',
    hours: 0.6,
    costUSD: 1.21,
  },
  {
    session: 8,
    title: 'Label Editor Debugging & Dev Logs Panel',
    description: 'Resolved label editor button visibility (wrong project path discovered). Converted all pages from t() to Tx component. Added Dev Logs panel accessible from the sidebar.',
    start: '2026-03-03T16:35:00Z',
    end:   '2026-03-04T20:00:00Z',
    hours: 27.4,
    costUSD: 3.80,
  },
]

export default devLogs

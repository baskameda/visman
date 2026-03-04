import React, { useState } from "react"
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Tabs, Tab, Divider, Chip, Paper,
} from "@mui/material"

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 2.5 }}>{children}</Box> : null
}

function Section({ title, children }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, color: "primary.main" }}>{title}</Typography>
      {children}
    </Box>
  )
}

function Tag({ label, color = "default" }) {
  return <Chip label={label} size="small" color={color} sx={{ mr: 0.5, mb: 0.5, fontSize: "0.72rem" }} />
}

function KV({ k, v }) {
  return (
    <Box sx={{ display: "flex", gap: 1, mb: 0.5 }}>
      <Typography variant="body2" sx={{ minWidth: 180, fontWeight: 600, color: "text.secondary" }}>{k}</Typography>
      <Typography variant="body2">{v}</Typography>
    </Box>
  )
}

function CodeBlock({ children }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "#f6f8fa", fontFamily: "monospace", fontSize: "0.8rem", overflowX: "auto", mb: 1 }}>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{children}</pre>
    </Paper>
  )
}

export default function TechDocsModal({ open, onClose }) {
  const [tab, setTab] = useState(0)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>
        <Typography variant="h6" fontWeight={700}>Technical Documentation</Typography>
        <Typography variant="body2" color="text.secondary">Visitor Management POC — Architecture & Developer Reference</Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
          <Tab label="Stack Overview" />
          <Tab label="Backend" />
          <Tab label="Frontend" />
          <Tab label="BPMN Process" />
          <Tab label="API Reference" />
          <Tab label="i18n & Labels" />
        </Tabs>

        <Box sx={{ px: 3, pb: 2 }}>

          {/* ── Tab 0: Stack Overview ── */}
          <TabPanel value={tab} index={0}>
            <Section title="Technology Stack">
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}>
                <Tag label="Java 21" color="primary" />
                <Tag label="Spring Boot 3.5.9" color="primary" />
                <Tag label="Operaton BPM 1.0.0-beta-5" color="primary" />
                <Tag label="SQL Server" color="primary" />
                <Tag label="Liquibase" />
                <Tag label="React 18.3" color="success" />
                <Tag label="Vite 5.4" color="success" />
                <Tag label="MUI v6" color="success" />
                <Tag label="react-i18next 15" color="success" />
                <Tag label="SSE" />
                <Tag label="React Router v6" color="success" />
              </Box>
              <KV k="Backend port" v="8080" />
              <KV k="Frontend port (dev)" v="5173" />
              <KV k="Database" v="SQL Server (localhost:1433, DB: visitor_db)" />
              <KV k="BPMN Engine" v="Operaton 1.0.0-beta-5 (Camunda 7 fork)" />
              <KV k="Build tool (backend)" v="Gradle 8 with Spring Boot plugin" />
              <KV k="Build tool (frontend)" v="Vite 5 + @vitejs/plugin-react" />
            </Section>

            <Section title="Architecture Overview">
              <Typography variant="body2" sx={{ mb: 1 }}>
                The application follows a decoupled SPA + REST architecture. The React frontend communicates
                exclusively with the Operaton REST API proxied through the Spring Boot backend, and with
                custom endpoints for SSE and user management.
              </Typography>
              <CodeBlock>{`Browser (React SPA)
  │
  ├── /engine-rest/**  →  Operaton REST API  →  BPMN Engine  →  SQL Server
  ├── /api/**          →  Custom Spring endpoints (SSE, user mgmt)
  └── Static assets served by Vite (dev) or Spring Boot (prod)`}</CodeBlock>
            </Section>

            <Section title="Roles & Access">
              <KV k="Invitor" v="Creates visitor invitations, submits invite form, views own task history" />
              <KV k="Security" v="Reviews pending invitations, assigns a reliability score (0–100)" />
              <KV k="Gatekeeper" v="Performs check-in / check-out of arriving visitors" />
              <KV k="Admin" v="Full user and group management; accessible via webAdmins group membership" />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                A user can hold multiple roles simultaneously. The sidebar shows an Admin link above role-specific tasks when the user belongs to webAdmins.
              </Typography>
            </Section>
          </TabPanel>

          {/* ── Tab 1: Backend ── */}
          <TabPanel value={tab} index={1}>
            <Section title="Project Structure">
              <CodeBlock>{`backend/
├── src/main/java/eu/poc/claude/
│   ├── VisitorApplication.java          # Spring Boot entry point
│   ├── config/
│   │   ├── AppConfig.java               # General beans
│   │   ├── OperatonInitializerConfig.java  # Groups/users auto-setup
│   │   └── WebSecurityConfig.java       # CORS + security filter chains
│   ├── delegate/
│   │   ├── SillyBlacklistChecker.java   # Service task delegate
│   │   └── SillyCheckinService.java     # Service task delegate
│   └── sse/
│       ├── SseController.java           # GET /api/sse/tasks
│       └── TaskEventService.java        # SSE broadcast logic
├── src/main/resources/
│   ├── application.yaml                 # All configuration
│   ├── processes/                       # BPMN files (auto-deployed)
│   └── db/changelog/                   # Liquibase changelogs
└── build.gradle`}</CodeBlock>
            </Section>

            <Section title="Key Configuration (application.yaml)">
              <KV k="server.port" v="8080" />
              <KV k="datasource.url" v="jdbc:sqlserver://localhost:1433;databaseName=visitor_db" />
              <KV k="operaton.bpm.database.type" v="mssql" />
              <KV k="operaton.bpm.history-level" v="full" />
              <KV k="operaton.bpm.auto-deployment-enabled" v="true" />
              <KV k="operaton.bpm.rest.path" v="/engine-rest" />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Default admin credentials: id=<b>admin</b> / password=<b>admin</b>. Change before production.
              </Typography>
            </Section>

            <Section title="Security">
              <Typography variant="body2">
                Two security filter chains are defined. The <code>/engine-rest/**</code> and <code>/api/**</code> paths
                have CSRF disabled and CORS configured for localhost:5173 (dev) and localhost:3000. Authentication
                is delegated to Operaton's built-in identity service — all API calls pass HTTP Basic credentials
                directly to the engine.
              </Typography>
            </Section>

            <Section title="SSE (Server-Sent Events)">
              <Typography variant="body2" sx={{ mb: 1 }}>
                <code>GET /api/sse/tasks</code> opens a persistent SSE stream per authenticated user.
                <code>TaskEventService</code> broadcasts a <code>task-update</code> event whenever the BPMN
                engine fires a task lifecycle event. The React frontend reconnects automatically on disconnect.
              </Typography>
            </Section>

            <Section title="Liquibase">
              <Typography variant="body2">
                Application-level schema migrations live in <code>db/changelog/</code>.
                Operaton manages its own tables (<code>ACT_*</code>, <code>HI_*</code>) internally via
                <code>schema-update: true</code>. Do not use Liquibase to manage Operaton tables.
              </Typography>
            </Section>
          </TabPanel>

          {/* ── Tab 2: Frontend ── */}
          <TabPanel value={tab} index={2}>
            <Section title="Project Structure">
              <CodeBlock>{`frontend/src/
├── App.jsx                  # Route definitions
├── main.jsx                 # React root, providers
├── theme.js                 # MUI theme (Nunito Sans, role colors)
├── api/
│   └── operatonApi.js       # All Axios calls to /engine-rest & /api
├── components/
│   ├── Layout.jsx           # Sidebar + AppBar shell
│   ├── LanguageSwitcher.jsx # Flag + locale picker
│   ├── TaskCard.jsx         # Reusable task card
│   ├── ProcessFlowViz.jsx   # BPMN step progress indicator
│   ├── Tx.jsx               # Editable i18n label component
│   ├── DevLogsModal.jsx     # Dev session log modal
│   └── TechDocsModal.jsx    # This modal
├── context/
│   └── AuthContext.jsx      # Auth state + login/logout
├── data/
│   └── devLogs.js           # Dev session log data
├── hooks/
│   ├── useTaskSSE.js        # SSE subscription hook
│   └── useAutoRefresh.js    # Polling fallback hook
├── i18n/
│   ├── index.js             # i18next initialisation + override loader
│   ├── overrides.js         # localStorage override CRUD helpers
│   └── locales/             # en / de / it / fr / zh / ru JSON files
└── pages/
    ├── LoginPage.jsx
    ├── InviterDashboard.jsx
    ├── SecurityDashboard.jsx
    ├── GatekeeperDashboard.jsx
    ├── InvitationHistoryPage.jsx
    └── AdminDashboard.jsx`}</CodeBlock>
            </Section>

            <Section title="State Management">
              <Typography variant="body2">
                No Redux or Zustand. State is managed with React's built-in <code>useState</code> /
                <code>useCallback</code> at page level, with two React Contexts:
              </Typography>
              <KV k="AuthContext" v="Stores authenticated user (role, username, firstName, isAlsoAdmin). Persisted in sessionStorage." />
              <KV k="window.__labelEditMode" v="Global edit-mode flag (not a Context — uses CustomEvent broadcast to avoid import chain issues)." />
            </Section>

            <Section title="MUI Theme">
              <Typography variant="body2" sx={{ mb: 1 }}>
                Custom MUI theme in <code>theme.js</code>. Font: Nunito Sans (Google Fonts). Role-based accent
                colours are defined in Layout.jsx:
              </Typography>
              <KV k="Invitor" v="#1677ff (blue)" />
              <KV k="Security" v="#d46b08 (orange)" />
              <KV k="Gatekeeper" v="#531dab (purple)" />
              <KV k="Admin" v="#389e0d (green)" />
            </Section>

            <Section title="Live Label Editor">
              <Typography variant="body2">
                Click the coloured logo square in the sidebar to enter edit mode. All <code>&lt;Tx&gt;</code> components
                render a clickable dashed outline. Clicking any label opens a <code>window.prompt()</code> to edit it.
                Changes are saved to <code>localStorage</code> under <code>i18n_overrides:&lt;lang&gt;</code> and
                applied live via <code>i18n.addResourceBundle()</code>.
              </Typography>
            </Section>
          </TabPanel>

          {/* ── Tab 3: BPMN ── */}
          <TabPanel value={tab} index={3}>
            <Section title="Process: VisitProcess_1.0">
              <Typography variant="body2" sx={{ mb: 2 }}>
                A BPMN 2.0 collaboration process with three swim lanes. Deployed automatically from
                <code>src/main/resources/processes/</code> on application start.
              </Typography>
              <CodeBlock>{`[Start]
  │
  ▼
[Invite]  ← Invitor lane
  User Task: candidateGroups=Invitors
  Form fields: VName (string), VDate (date)
  │
  ▼
[Security Check]  ← Security lane
  User Task: candidateGroups=Security
  Output: reliability (integer 0–100)
  │
  ▼
[Reliability Gateway]
  ├─ reliability >= 50  →  [Check-In]  ← Gatekeeper lane
  │                           User Task: candidateGroups=Gatekeeper
  │                           │
  │                           ▼
  │                        [Check-Out]
  │                           User Task
  │                           │
  │                           ▼
  └─ reliability < 50   →  [Reject]  ← Invitor lane
                              User Task: notify invitor of rejection
                              │
                              ▼
                           [End]`}</CodeBlock>
            </Section>

            <Section title="Process Variables">
              <KV k="VName" v="Visitor name (string) — set during Invite task" />
              <KV k="VDate" v="Planned visit date (date ISO string) — set during Invite task" />
              <KV k="reliability" v="Security score 0–100 (integer) — set during Security Check" />
              <KV k="starter" v="Username of the invitor (set by Operaton from camunda:initiator)" />
            </Section>

            <Section title="Service Delegates">
              <KV k="SillyBlacklistChecker" v="Java delegate wired to a service task — stub for future blacklist integration" />
              <KV k="SillyCheckinService" v="Java delegate wired to a service task — stub for future physical access system integration" />
            </Section>
          </TabPanel>

          {/* ── Tab 4: API Reference ── */}
          <TabPanel value={tab} index={4}>
            <Section title="Operaton REST API (proxied via Vite → :8080/engine-rest)">
              <KV k="POST /engine-rest/process-definition/key/{key}/start" v="Start a new visit process instance" />
              <KV k="GET  /engine-rest/task?candidateGroup=X" v="List tasks for a role group" />
              <KV k="GET  /engine-rest/task?assignee=X" v="List tasks assigned to a user" />
              <KV k="POST /engine-rest/task/{id}/claim" v="Claim a task before completing it" />
              <KV k="POST /engine-rest/task/{id}/complete" v="Complete a task with variables payload" />
              <KV k="GET  /engine-rest/process-instance/{id}/variables" v="Read all process variables" />
              <KV k="GET  /engine-rest/identity/verify" v="Verify credentials (used for login)" />
              <KV k="GET  /engine-rest/user" v="List all users (admin)" />
              <KV k="POST /engine-rest/user/create" v="Create a user (admin)" />
              <KV k="DELETE /engine-rest/user/{id}" v="Delete a user (admin)" />
              <KV k="GET  /engine-rest/group" v="List all groups (admin)" />
              <KV k="GET  /engine-rest/group/{id}/members" v="List group members (admin)" />
              <KV k="POST /engine-rest/group/{id}/members/{userId}" v="Add user to group (admin)" />
              <KV k="DELETE /engine-rest/group/{id}/members/{userId}" v="Remove user from group (admin)" />
            </Section>

            <Section title="Custom API Endpoints">
              <KV k="GET /api/sse/tasks" v="SSE stream — emits task-update events on any task lifecycle change" />
            </Section>

            <Section title="Authentication">
              <Typography variant="body2">
                All requests use HTTP Basic Auth with Operaton credentials. The frontend stores credentials
                in <code>AuthContext</code> (sessionStorage) and injects them as an Authorization header
                via Axios on every request. Operaton validates them against its identity service backed by SQL Server.
              </Typography>
            </Section>
          </TabPanel>

          {/* ── Tab 5: i18n ── */}
          <TabPanel value={tab} index={5}>
            <Section title="Supported Languages">
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
                <Tag label="English (en)" color="primary" />
                <Tag label="German (de)" color="primary" />
                <Tag label="Italian (it)" color="primary" />
                <Tag label="French (fr)" color="primary" />
                <Tag label="Chinese (zh)" color="primary" />
                <Tag label="Russian (ru)" color="primary" />
              </Box>
              <Typography variant="body2">
                Translation files: <code>src/i18n/locales/&lt;lang&gt;.json</code>. Selected language is
                persisted per-user in <code>localStorage</code> under <code>i18n_lang:&lt;username&gt;</code>.
              </Typography>
            </Section>

            <Section title="Override System">
              <Typography variant="body2" sx={{ mb: 1 }}>
                End-users can edit any label in-app without touching source files. Overrides are stored in
                <code>localStorage</code> under <code>i18n_overrides:&lt;lang&gt;</code> as flat JSON:
              </Typography>
              <CodeBlock>{`{ "security.title": "Security Review", "common.cancel": "Abort" }`}</CodeBlock>
              <Typography variant="body2">
                On startup and on every language change, <code>overrides.js</code> merges stored overrides
                into the i18next resource bundle via <code>addResourceBundle(lang, "translation", nested, true, true)</code>.
              </Typography>
            </Section>

            <Section title="Tx Component">
              <Typography variant="body2">
                Wrap any translatable string with <code>&lt;Tx k="some.key" /&gt;</code> (or
                  <code>{'<Tx k="key" vars={{ count: n }} />'}</code> for interpolation).
                In normal mode it returns plain translated text. In edit mode it renders a clickable
                outlined span that opens a prompt for inline editing.
              </Typography>
            </Section>
          </TabPanel>

        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} variant="contained" disableElevation>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Visitor Management System — a BPMN-driven visitor check-in workflow built with:
- **Backend**: Spring Boot 3 + Operaton BPM (Camunda 7 successor) + SQL Server + Liquibase
- **Frontend**: React 18 + Ant Design 5 — runs on `http://localhost:5174` (`frontend-ant/`)

The `frontend/` directory (MUI) is legacy and no longer under active development. All frontend work goes into `frontend-ant/`.

Backend runs on port 8080.

## Commands

### Backend (from `backend/`)
```bash
./gradlew bootRun          # Start the Spring Boot app
./gradlew test             # Run all tests (JUnit 5 + JaCoCo coverage)
./gradlew test --tests "SillyBlacklistCheckerTest"  # Run a single test class
./gradlew jacocoTestReport # Generate coverage report (auto-runs after test)
./gradlew build            # Full build
```

JaCoCo enforces 85% minimum coverage (`jacocoTestCoverageVerification`).

### Frontend (from `frontend-ant/`)
```bash
npm install   # First time only
npm run dev   # Dev server on http://localhost:5174
npm run build
```

## Architecture

### BPMN Process (`PocVisits.bpmn`)
Core workflow `VisitProcess_2.0` — one process instance per invitation, multi-instance sub-process per visitor:
1. **Inviter** — creates invitation (N visitors, date range, entrance), answers clarification requests from Security
2. **Security** — reviews each visitor independently; can APPROVE, REFUSE, BLACKLIST, or ASK_INVITER (up to 5 clarification loops, then auto-refuse via ScriptTask)
3. **Gatekeeper** — checks in visitors on arrival using visit records created at approval time
4. **Supervisor** — an inviter with an oversight role; can answer clarification questions for supervisees without claiming, or permanently claim an invitation (reassigns `inviter_username`)

Key process variables: `invitationId`, `visitorIds` (List), `entranceId`, `starter`, `securityDecision`, `securityReviewer`, `clarificationQuestion`, `clarificationAnswer`, `clarificationCount`.

### Backend Package Structure (`eu.poc.claude.*`)
- `visitor` — `Visitor` entity, `VisitorRepository`, `VisitorController` (`/api/visitors`) — scoped search per inviter, blacklist management
- `entrance` — `Entrance`, `EntranceRepository`, `EntranceController` (`/api/entrances`) — admin-only CRUD, gatekeeper assignment
- `invitation` — core domain package:
  - `Invitation` / `InvitationRepository` / `InvitationController` (`/api/invitations`) — multi-visitor invitation creation, starts BPMN process
  - `SecurityCheck` / `SecurityCheckRepository` / `SecurityCheckController` (`/api/security-checks`) — decide + clarify endpoints, complete BPMN tasks
  - `Visit` / `VisitRepository` / `VisitController` (`/api/visits`) — check-in, date-index endpoint for lazy loading, per-week range fetch
  - `SupervisorRepository` / `SupervisorController` (`/api/supervisor`) — flat two-level hierarchy; max 10 inviters per supervisor
- `delegate` — Operaton `JavaDelegate` / `TaskListener` beans:
  - `SillyBlacklistChecker` — checks `poc_visitor.blacklisted`, sets process variable
  - `SecurityTaskAssignmentListener` — reassigns Security task to `securityReviewer` on clarification loop-back
- `sse` — `TaskEventService` polls Operaton every 3 s for task changes, pushes SSE; `SseController` → `/api/sse/tasks`
- `config` — `WebSecurityConfig` (CORS + all `/api/**` `permitAll`), `AppConfig`, `OperatonInitializerConfig`

### Auth Pattern
Basic Auth decoded manually in each controller via a private `requireUsername()` helper. No Spring Security session. Admin-only endpoints check `identityService.createGroupQuery().groupMember(username).groupId("webAdmins")`. All `/api/**` routes are `permitAll()`.

### Database
Liquibase changesets `001–009` in `backend/src/main/resources/db/changelog/changes/`. Custom tables:

| Table | Purpose |
|---|---|
| `poc_visitor` | Visitor registry (blacklisted flag, created_by scoping) |
| `poc_entrance` | Physical entrances |
| `poc_entrance_gatekeeper` | M-N: gatekeeper ↔ entrance |
| `poc_invitation` | One per inviter (date range, entrance, inviter_username) |
| `poc_invitation_visitor` | M-N: visitors ↔ invitation |
| `poc_security_check` | One per (invitation, visitor) — decision, note, reliability, clarification fields |
| `poc_visit` | One per (visitor, date) — created on approval; PENDING → CHECKED_IN / NO_SHOW |
| `poc_supervisor_assignment` | `inviter_username` PK → `supervisor_username`; max 10 inviters per supervisor |

### Operaton Identity → Role Mapping
| Group | Role | Notes |
|---|---|---|
| `Invitors` | INVITER | Can also be a supervisor (checked at login via `/api/supervisor/am-i-supervisor`) |
| `Security` | SECURITY | |
| `Porters` | GATEKEEPER | |
| `webAdmins` | ADMIN | `isAlsoAdmin` flag set in auth context |

### Frontend Architecture (`frontend-ant/src/`)
- `api/operatonApi.js` — all Axios calls; Operaton REST + custom `/api/*` endpoints including supervisor functions
- `context/AuthContext.jsx` — auth state `{ username, password, role, isAlsoAdmin, isSupervisor }`; `isSupervisor` set at login
- `hooks/useTaskSSE.js` — SSE subscription; falls back to `useAutoRefresh.js` polling
- `hooks/use*Stats.js` — gamification stat hooks per role (Inviter, Security, Gatekeeper, Org)
- `i18n/` — i18next setup; 6 languages (en, de, fr, it, ru, zh); `overrides.js` for localStorage label overrides
- `pages/` — role-based pages:
  - `InviterDashboard` — invitations, clarification tasks, + "Supervised" tab (visible when `auth.isSupervisor`)
  - `SecurityDashboard` — security check review with decide/clarify/blacklist
  - `GatekeeperDashboard` — lazy-loading month → week collapse table; auto-expands closest week; 60 s auto-refresh; check-in date discrepancy warning
  - `AdminDashboard` — user/group/entrance management + nav to supervisor admin
  - `SupervisorAssignmentPage` — admin-only page at `/supervisor-admin`; enforces max-10 cap client-side
  - `InvitationHistoryPage` — historic process replay
- `components/` — `Layout`, `GatekeeperStatsPanel` (foldable, 25% compact), `ProcessFlowViz`, documentation modals (`TechDocsModal`, `SupportDocsModal`, `SalesDocsModal`), `DevLogsModal`
- `data/devLogs.js` — session-by-session dev log shown in the Dev Logs modal

### Supervisor Hierarchy Rules
- Flat two-level hierarchy: one supervisor per inviter, max 10 inviters per supervisor
- Enforced in `SupervisorController.assign()` — returns 400 if target supervisor already has 10 supervisees (unless it's a re-assignment of the same inviter)
- `isSupervisor` is checked once at login; supervisor must log out and back in after assignment
- Claiming an invitation is permanent (`UPDATE poc_invitation SET inviter_username = ?`) — no unclaim
- Answering a clarification without claiming: supervisor calls `POST /api/security-checks/{id}/clarify` directly with the Operaton task ID fetched via `GET /task?processInstanceId={id}`

### GatekeeperDashboard Lazy Loading Pattern
Two-tier data loading:
1. **Mount**: `GET /api/visits/my/date-index` → lightweight count-per-date index; builds month/week structure
2. **On week expand**: `GET /api/visits/my?from=&to=` → full visit rows for that week only
`loadingLock` ref (a `Set`) prevents double-fetches. `weekCacheRef` mirrors `weekCache` state for non-render reads inside intervals.

### Tests
Test files are in `backend/src/main/test/` (non-standard location — not `src/test/java`). Tests use JUnit 5, Mockito, and AssertJ. Spring context tests use `@SpringBootTest`.

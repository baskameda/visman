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

## Accessibility (WCAG 2.1 AA / European Accessibility Act)

`frontend-ant/src/a11y.css` — global a11y stylesheet imported in `main.jsx`:
- `.sr-only` utility class (visually hidden but screen-reader accessible)
- `.skip-link:focus-visible` — makes the skip-to-content link visible on keyboard focus
- `@media (prefers-reduced-motion: reduce)` — zeroes all animation/transition durations

**Implemented categories:**
- **Cat 1** — Page titles: `document.title` updated per route via `PAGE_TITLE_KEYS` map in `Layout.jsx`
- **Cat 2** — Colour contrast: theme-aware `textSub = dark ? '#a0a0a0' : '#6b6b6b'` (AA pass both modes); `colorTextSecondary`/`colorTextDescription` tokens in ConfigProvider; role badge `textColor` is a darker accessible variant separate from the brand hue used for backgrounds/gradients
- **Cat 3** — Focus management / keyboard:
  - `GreetingOverlay` — `role="dialog"`, `aria-modal`, `tabIndex={0}`, auto-focus on open, Escape/Enter/Space to dismiss
  - `AdminDashboard` checkbox rows — Ant Design Checkbox has `onChange` so keyboard Space toggles correctly
  - `EntrancesPage` gatekeeper assign Checkbox — same `onChange` fix
  - `SupervisorAssignmentPage` IcicleChart `<g>` nodes — `role="button"`, `tabIndex`, `onKeyDown` (Enter/Space) for drilldown
  - `SupervisorAssignmentPage` TangledTree supervisor `<g>` nodes — `role="button"`, `tabIndex`, `aria-pressed`, `onKeyDown`
  - EntrancesPage chart SVG — `role="img"` + `aria-label` as text alternative
- **Cat 4** — Live updates: `paused` state gates 60s interval in `GatekeeperDashboard`; pause button has `aria-pressed`
- **Cat 5** — Reduced motion: CSS media query in `a11y.css`
- **Cat 6** — Form labels: `aria-label` on bare inputs/textareas outside Form.Item (SecurityDashboard note + clarification TextAreas; InviterDashboard clarification + supervisor answer TextAreas + Radio.Group; AdminDashboard Checkboxes; LocationsPage delete confirm Input; EntrancesPage location Select + gatekeeper Checkbox; LicencePage feature Switch); Slider has `aria-label` + `aria-valuetext`
- **Cat 7** — Session timeout warning: fires Modal at ≤5 min remaining; "Extend session" resets `localStorage.loginAt` + triggers `extendSession()` callback from AuthContext
- **Cat 8** — Data tables: `aria-label` on all `<Table>` components
- **Cat 9** — Decorative icons: `aria-hidden="true"` on all `<Text type="secondary">` icon spans; `role="img"` on meaningful SVGs

**Key patterns:**
- `<html lang>` synced with i18next via `LangSync` component in `main.jsx`
- Skip link: `<a href="#main-content" className="sr-only skip-link">` at top of `Layout.jsx`; target is `<Content id="main-content" role="main">`
- `<nav aria-label="Main navigation">` wrapping the sidebar Menu
- All icon-only buttons have explicit `aria-label`

## Architecture

### BPMN Process (`PocVisits.bpmn`)
Core workflow `VisitProcess_2.0` — one process instance per invitation, multi-instance sub-process per visitor:
1. **Inviter** — creates invitation (N visitors, date range, entrance), answers clarification requests from Security
2. **Security** — reviews each visitor independently; can APPROVE, REFUSE, BLACKLIST, or ASK_INVITER (up to 5 clarification loops, then auto-refuse via ScriptTask)
3. **Gatekeeper** — checks in visitors on arrival using visit records created at approval time
4. **Supervisor** — an inviter with an oversight role; can answer clarification questions for supervisees without claiming, or permanently claim an invitation (reassigns `inviter_username`)

Key process variables: `invitationId`, `visitorIds` (List), `entranceId`, `starter`, `securityDecision`, `securityReviewer`, `clarificationQuestion`, `clarificationAnswer`, `clarificationCount`.

### Backend Package Structure (`eu.poc.claude.*`)
- `location` — `Location` entity, `LocationRepository` (findAll with entrance count via LEFT JOIN, countEntrances, nullable lat/lon via `wasNull()`), `LocationController` (`/api/locations`) — admin CRUD; DELETE returns 409 if any entrance references the location
- `visitor` — `Visitor` entity, `VisitorRepository`, `VisitorController` (`/api/visitors`) — scoped search per inviter, blacklist management
- `entrance` — `Entrance` (includes `locationId` FK), `EntranceRepository` (findByLocation, findGatekeepersInOtherLocations), `EntranceController` (`/api/entrances`) — admin-only CRUD; GET accepts `?locationId` filter; PUT /gatekeepers validates no cross-location conflicts → 409; GET `/gatekeepers-in-other-locations?locationId=X` for modal filtering
- `invitation` — core domain package:
  - `Invitation` / `InvitationRepository` / `InvitationController` (`/api/invitations`) — multi-visitor invitation creation, starts BPMN process; calls `assignLeastLoaded()` to distribute new security checks across Security group members
  - `SecurityCheck` / `SecurityCheckRepository` / `SecurityCheckController` (`/api/security-checks`) — decide + clarify + claim endpoints; three filtered-list endpoints (`/pending/mine`, `/pending/others`, `/pending/supervisees`)
  - `Visit` / `VisitRepository` / `VisitController` (`/api/visits`) — check-in, date-index, per-week range fetch; `GET /api/visits/supervisees` for gatekeeper supervisors; `GET /api/visits/stats/checkins-per-entrance-day?days=30&locationId=X` admin stats (uses `ResultSetExtractor` for variable param count)
  - `SupervisorRepository` / `SupervisorController` (`/api/supervisor`) — all three supervisor hierarchies (inviter, security, gatekeeper) under one controller; max 10 supervisees per supervisor per hierarchy
  - `SecuritySupervisorRepository` — same flat structure for Security role (`poc_security_supervisor_assignment`)
  - `GatekeeperSupervisorRepository` — same flat structure for Gatekeeper role (`poc_gatekeeper_supervisor_assignment`)
- `delegate` — Operaton `JavaDelegate` / `TaskListener` beans:
  - `SillyBlacklistChecker` — checks `poc_visitor.blacklisted`, sets process variable
  - `SecurityTaskAssignmentListener` — reassigns Security task to `securityReviewer` on clarification loop-back
- `sse` — `TaskEventService` polls Operaton every 3 s for task changes, pushes SSE; `SseController` → `/api/sse/tasks`
- `config` — `WebSecurityConfig` (CORS + all `/api/**` `permitAll`), `AppConfig`, `OperatonInitializerConfig`

### Auth Pattern
Basic Auth decoded manually in each controller via a private `requireUsername()` helper. No Spring Security session. Admin-only endpoints check `identityService.createGroupQuery().groupMember(username).groupId("webAdmins")`. All `/api/**` routes are `permitAll()`.

### Database
Liquibase changesets `001–014` in `backend/src/main/resources/db/changelog/changes/`. Changesets 013–014 are seed-only and safe to skip on production. Custom tables:

| Table | Purpose |
|---|---|
| `poc_location` | Facility locations (name, description, latitude/longitude DECIMAL(15,10), created_at) |
| `poc_visitor` | Visitor registry (blacklisted flag, created_by scoping) |
| `poc_entrance` | Physical entrances — `location_id` FK to `poc_location` |
| `poc_entrance_gatekeeper` | M-N: gatekeeper ↔ entrance |
| `poc_invitation` | One per inviter (date range, entrance, inviter_username) |
| `poc_invitation_visitor` | M-N: visitors ↔ invitation |
| `poc_security_check` | One per (invitation, visitor) — decision, note, reliability, clarification fields, `assigned_to` (officer username), `security_reviewer` (claimed by) |
| `poc_visit` | One per (visitor, date) — created on approval; PENDING → CHECKED_IN / NO_SHOW |
| `poc_supervisor_assignment` | `inviter_username` PK → `supervisor_username`; max 10 inviters per supervisor |
| `poc_security_supervisor_assignment` | `officer_username` PK → `supervisor_username`; max 10 officers per supervisor |
| `poc_gatekeeper_supervisor_assignment` | `porter_username` PK → `supervisor_username`; max 10 porters per supervisor |

### Operaton Identity → Role Mapping
| Group | Role | Notes |
|---|---|---|
| `Invitors` | INVITER | Can also be a supervisor (checked at login via `/api/supervisor/am-i-supervisor`) |
| `Security` | SECURITY | Can also be a security supervisor (checked at login via `/api/supervisor/security/am-i-supervisor`) |
| `Porters` | GATEKEEPER | Can also be a gatekeeper supervisor (checked at login via `/api/supervisor/gatekeeper/am-i-supervisor`) |
| `webAdmins` | ADMIN | `isAlsoAdmin` flag set in auth context |

### Frontend Architecture (`frontend-ant/src/`)
- `api/operatonApi.js` — all Axios calls; Operaton REST + custom `/api/*` endpoints including supervisor and security-supervisor functions
- `context/AuthContext.jsx` — auth state `{ username, password, role, isAlsoAdmin, isSupervisor, isSecuritySupervisor, isGatekeeperSupervisor }`; all supervisor flags set at login
- `hooks/useTaskSSE.js` — SSE subscription; falls back to `useAutoRefresh.js` polling
- `hooks/use*Stats.js` — gamification stat hooks per role (Inviter, Security, Gatekeeper, Org)
- `i18n/` — i18next setup; 6 languages (en, de, fr, it, ru, zh); `overrides.js` for localStorage label overrides
- `pages/` — role-based pages:
  - `InviterDashboard` — invitations, clarification tasks, + "Supervised" tab (visible when `auth.isSupervisor`)
  - `SecurityDashboard` — three tabs: "My Checks" (`assigned_to = me OR null`), "Others" (read-only), "Supervised" (`auth.isSecuritySupervisor` only, with Decide + Claim buttons)
  - `GatekeeperDashboard` — two tabs: "My Visits" (lazy-loading month → week collapse; auto-expands closest week; 60 s auto-refresh; check-in date discrepancy warning) + "Supervised" (`auth.isGatekeeperSupervisor` only, flat table of supervisees' entrances' visits with Check In button)
  - `AdminDashboard` — user/group management; Users tab has "Manage Groups" button per user; Groups tab has "Manage Members" button per group; both open checkbox modals with diff-save logic
  - `LocationsPage` — admin-only at `/locations`; collapsible Leaflet overview map (all locations as markers, defaultActiveKey open); CRUD table below; create/edit modal embeds interactive `MapContainer` (click-to-place + draggable pin synced to lat/lon fields); delete requires typing location name to confirm; blocks if entrance count > 0
  - `EntrancesPage` — admin-only at `/entrances`; location selector persists to `?location=X` URL param; empty state when no location selected; D3 stacked bar chart of check-ins per entrance per day (days 7/14/30/90, `ResizeObserver` for responsive width, floating tooltip); gatekeeper assign modal greys out + tags porters already at another location
  - `SupervisorAssignmentPage` — admin-only page at `/supervisor-admin`; three tabs with Tree / Icicle / Tangled tree visualizations; enforces max-10 cap client-side
  - `InvitationHistoryPage` — historic process replay
- `context/AuthContext.jsx` — `login()` also writes `sessionStorage.greeting_pending='1'` and `localStorage.loginAt=Date.now()` for greeting + auto-logout; `logout` wrapped in `useCallback`; 9-hour `setTimeout(logout, remaining)` in a `useEffect([auth, logout])`
- `pages/PerformancePage.jsx` — route `/performance`; renders role-specific stat panels (`InviterStatsPanel`, `OrgStatsPanel`+`SecurityStatsPanel`, `GatekeeperStatsPanel`); accessible from "My Performance" nav item (INVITER/SECURITY/GATEKEEPER)
- `components/GreetingOverlay.jsx` — animated greeting card shown after every login; `greeting_pending` sessionStorage flag guards display; 20-item `icons[]` pool in `greetings.js` (same index as greeting text); click-to-dismiss with 380 ms fade-out
- `components/WhyUsModal.jsx` — cinematic brochure-style marketing modal; dark hero banner; Problem / Solution / Differentiators (6 feature cards) / Stats (dark bar) / CTA sections; all content i18n via `whyUs.*` keys in all 6 locales; opened from LoginPage above "Sign in" label
- `components/RoleAdoptionModal.jsx` — single component, `role` prop selects INVITER / SECURITY / GATEKEEPER content; role-coloured header, 5 checkmark bullet points of newly-possible capabilities, mobile-app callout; all content i18n via `roleAdoption.{role}.*` keys; sidebar link per role above Dev. Logs (hidden from ADMIN); link text: "VisMan for [Role]" pattern
- `components/` — `Layout` (includes `useSessionTimer` hook — reads `loginAt`, ticks every 60 s, colour thresholds &lt;10 min red / &lt;30 min orange), `GatekeeperStatsPanel`, `ProcessFlowViz`, documentation modals (`TechDocsModal`, `SupportDocsModal`, `SalesDocsModal`, `WhyUsModal`, `RoleAdoptionModal`), `DevLogsModal`
- `data/devLogs.js` — session-by-session dev log shown in the Dev Logs modal

### Supervisor Hierarchy Rules

**Inviter supervisors** (`poc_supervisor_assignment`, `/api/supervisor/*`):
- One supervisor per inviter, max 10 inviters per supervisor
- Claiming an invitation is permanent (`UPDATE poc_invitation SET inviter_username = ?`) — no unclaim
- Supervisor can answer clarification questions for supervisees without claiming first

**Gatekeeper supervisors** (`poc_gatekeeper_supervisor_assignment`, `/api/supervisor/gatekeeper/*`):
- Gatekeeper supervisor is also a Porters group member
- Supervised tab loads `GET /api/visits/supervisees` — aggregates entrances of all supervisees, returns all their visits
- Check-in endpoint (`PUT /api/visits/{id}/checkin`) has no ownership guard — supervisor checks in directly; `checked_in_by` records who performed the check-in
- No claiming state — performing the check-in is the act of taking over
- `isGatekeeperSupervisor` checked at login; re-login required after assignment changes

**Security supervisors** (`poc_security_supervisor_assignment`, `/api/supervisor/security/*`):
- Security supervisor is also a Security group member — same operational role with added oversight
- Assignment is per security check (`poc_security_check.assigned_to`); set at invitation creation via least-loaded distribution (query Security group members, sort by `COUNT(*) WHERE assigned_to = ? AND status = 'PENDING'`)
- `assigned_to = NULL` means unassigned (legacy or no Security members) — visible to all in "My Checks" tab
- Supervisor can decide without claiming; claiming preemptively sets `security_reviewer` via atomic `UPDATE WHERE security_reviewer IS NULL OR security_reviewer = ?`
- 409 Conflict returned if `security_reviewer` is already set to a different user at decide time

**All three hierarchies:**
- Enforced server-side with 400 if cap reached (unless re-assigning the same supervisee)
- Supervisor flags (`isSupervisor`, `isSecuritySupervisor`, `isGatekeeperSupervisor`) checked once at login; re-login required after assignment changes
- Admin manages all three hierarchies from `SupervisorAssignmentPage` (`/supervisor-admin`) — three tabs

### GatekeeperDashboard Lazy Loading Pattern
Two-tier data loading:
1. **Mount**: `GET /api/visits/my/date-index` → lightweight count-per-date index; builds month/week structure
2. **On week expand**: `GET /api/visits/my?from=&to=` → full visit rows for that week only
`loadingLock` ref (a `Set`) prevents double-fetches. `weekCacheRef` mirrors `weekCache` state for non-render reads inside intervals.

### Seed Data (changesets 013–014)

**013** (`013-seed-commanders-desk.xml`) — static inserts, runs in seconds:
- 10 entrances at "Commanders Desk" (Main Entrance, North Gate, South Gate, East/West Wing Lobby, Loading Dock Alpha/Bravo, Executive Floor, Server Room Corridor, Staff Canteen)
- Users: inviter2–11 → `Invitors`, gatekeeper2–21 → `Porters`, security2–6 → `Security`; passwords = SHA-1 hex of `[role][N]123` via `HASHBYTES('SHA1', ...)`
- 2 gatekeepers assigned per entrance via `SELECT … JOIN poc_location` subqueries

**014** (`014-seed-invitation-history.xml`) — single T-SQL batch, runs 1–3 min:
- Creates 500 visitors (25 first × 20 last names, 10 companies, 8 functions) owned across inviter1–11
- Loops all working days in the past year; 8–12 invitations/day; 1–5 visitors/invitation picked from pool
- Security decisions per visitor: 2% `BLACKLISTED` (sets `poc_visitor.blacklisted=1`), 5% `REFUSED`, 93% `APPROVED`
- Approved → `poc_visit` inserted as `CHECKED_IN` with random gatekeeper (of the 2 assigned) and 08:00–16:59 check-in time
- `process_instance_id = NEWID()` — synthetic GUIDs; invitation list and stats work, BPMN replay does not

**Login page credential pattern** (`LoginPage.jsx`):
- Quick-fill auto-loads all Operaton users and resets their passwords to their username via `resetPasswordToUserId`
- "This is for testing only!" text has a hover Tooltip documenting: username = `[role][N]` (e.g. `inviter4`), initial password = `[role][N]123`; seeded ranges inviter2–11, security2–6, gatekeeper2–21
- Login card top row has two side-by-side buttons: **"Why Us"** (opens `WhyUsModal`) and **"PoC Journey"** (opens `PocSummaryModal`) — both rendered as styled `div`s with hover opacity transition
- **`LicenceStatusBox`** component rendered below those buttons and above the Sign In heading: green PoC-mode banner when no licence is loaded; blue box with `SafetyCertificateOutlined`, issuer, date, and four feature `Tag`s (green `CheckCircleFilled` = active, grey `LockOutlined` = disabled) when a licence is loaded
- `availableRoles` in quick-fill filtered by `featureActive[ROLE_FEATURE[r]]` — unlicensed role pills never appear in the location role selector

### Licence Management System

**File format** — `.lic` files are binary blobs base64-encoded: `[4-byte magic "VML1" = 0x56 0x4D 0x4C 0x31][12-byte random IV][AES-GCM ciphertext]`. Payload JSON: `{ issuer, issueDate, version, features: { security, inviter, gatekeeper, gamification } }`.

**Crypto** — AES-256-GCM via `SubtleCrypto`; key derived with PBKDF2 (100 000 iterations, SHA-256, fixed salt `"visman-licence-v1"`). PoC seed hardcoded as `"myLicense"`.

**`LicenceContext.jsx`** — global state provider with:
- `licenceMeta` (null = no file loaded), `featureLicenced` (from decrypted payload), `featureActive` (effective toggles, defaults all-true with no file)
- `loadLicence(file)` / `clearLicence()` / `setFeatureActive(key, value)` (silently ignored for unlicensed features when a file is loaded)
- **`activeFeaturesRef`** — module-level mutable export kept in sync by a `useEffect`; allows non-React code (axios interceptors) to read current flags without context access

**`api/licenceInterceptor.js`** — installed as a side-effect import in `main.jsx`; intercepts the global `axios` instance only (NOT `axios.create()` instances used for `engine-rest/**`); rejects blocked requests with `{ response: { status: 403 }, isLicenceBlock: true }`. Feature→prefix map:
- `security` → `/api/security-checks`, `/api/supervisor/security`
- `inviter` → `/api/invitations`, `/api/visitors`, `/api/supervisor/supervisee-invitations`, `/api/supervisor/claim/`
- `gatekeeper` → `/api/visits/my`, `/api/visits/supervisees`, `/api/entrances/my`, `/api/supervisor/gatekeeper`
- `gamification` → `/api/visits/my-checkins`, `/api/security-checks/my-decisions`, `/api/visits/stats`

**`pages/LicencePage.jsx`** — Admin-only at `/licence`. `GenerateCard` generates and downloads `.lic` files. `VerifyCard` handles upload → decrypt → state; three visual states (no file / error / loaded). `FeatureRow` shared between both cards.

**`components/FeatureNotLicensed.jsx`** — full-page result shown by `LicenceGuard` for blocked routes. Wrapped in `Layout` for consistent chrome.

**Feature gating in `App.jsx`**:
- `LicenceGuard` — route wrapper: `featureActive[feature] ? children : <FeatureNotLicensed />`
- `LicenceWatcher` — null-rendering component; auto-logouts the logged-in user when their own role feature is deactivated mid-session (`ROLE_FEATURE` map: `{ SECURITY: 'security', INVITER: 'inviter', GATEKEEPER: 'gatekeeper' }`)

**`ITEM_FEATURE` map in `Layout.jsx`** — maps nav route paths to feature keys; nav items for inactive features are hidden from the sidebar.

**`components/ReleaseTestSummaryModal.jsx`** — support-facing role-aware modal showing what was tested in each release; items classified as tested (green), tested with caveat (orange), or not tested (grey). Linked from the documentation accordion below "QA Notes".

**`components/PocSummaryModal.jsx`** — executive-facing modal opened from "PoC Journey" button on the login page (next to "Why Us"). Three tabs:
- **Overview**: 6 KPI cards (AI calendar days, total AI hours, Claude cost, human-equivalent dev hours, team cost, realistic calendar time) + `MultiplierBreakdown` click-to-expand factor table + category breakdown table (Feature Development / Bug Fixing / Documentation / QA & Testing) with AI hours, Claude cost, team hours, team cost columns.
- **Timeline Estimate**: assumptions panel (start Jan 2026, 10 devs, 75% availability, 3,600h effective capacity/quarter, 10-40% project allocation) + quarterly row-by-row table with allocation %, progress bar, cumulative hours, and finish marker (~Feb 2032 ≈ 6 years). `TIMELINE_RAW` is a hardcoded 25-quarter sequence with pseudo-random peaks/troughs.
- **Feature Chronicle**: filter pills per category + scrollable session list with exec-friendly title, category tag, AI hours, Claude cost, human-equivalent hours and team cost per session.
`HUMAN_MULTIPLIER = 187.5` (5.0 × 2.5 × 2.0 × 2.5 × 3.0, computed from `FACTOR_VALUES` array). `HOURLY_RATE_EUR = 24`. The four non-base factors were initially proposed by the AI at lower values (×1.5/×1.1/×1.15/×1.1) and corrected by the PoC issuer to real-world values (×2.5/×2.0/×2.5/×3.0); both values shown with strikethrough for AI estimate and bold orange for corrected. `MultiplierBreakdown` renders a 3-column grid (factor label / AI estimate / real value) with click-to-expand rationale including bold orange disclaimer text embedded as `**...**` markers.

### Tests
Test files are in `backend/src/main/test/` (non-standard location — not `src/test/java`). Tests use JUnit 5, Mockito, and AssertJ. Spring context tests use `@SpringBootTest`.

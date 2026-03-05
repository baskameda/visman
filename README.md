# Visitor Management — Ant Design Frontend

Ant Design 5 port of the original MUI frontend, running side-by-side.

## Start

```bash
# Install deps (first time only)
npm install

# Start dev server — runs on http://localhost:5174
npm run dev
```

Backend must be running on port 8080. Both frontends share the same backend.

---

## Porting status

| Page / Component         | Status       |
|--------------------------|--------------|
| `LoginPage`              | ⏳ Pending   |
| `InviterDashboard`       | ⏳ Pending   |
| `SecurityDashboard`      | ⏳ Pending   |
| `GatekeeperDashboard`    | ⏳ Pending   |
| `InvitationHistoryPage`  | ⏳ Pending   |
| `Layout` (shell)         | ⏳ Pending   |
| `TaskCard`               | ⏳ Pending   |
| `ProcessFlowViz`         | ⏳ Pending   |
| `LanguageSwitcher`       | ⏳ Pending   |
| `Tx` (label editor)      | ✅ Done      |

---

## Files shared verbatim from MUI frontend (no changes needed)

These files are **copied as-is** — they contain no MUI references:

| File | Purpose |
|------|---------|
| `src/api/operatonApi.js` | All Axios calls to Operaton REST API |
| `src/context/AuthContext.jsx` | Auth state + login/logout |
| `src/i18n/index.js` | i18next setup + language helpers |
| `src/i18n/overrides.js` | localStorage override CRUD |
| `src/i18n/locales/*.json` | Translation files (6 languages) |
| `src/hooks/useTaskSSE.js` | SSE subscription hook |
| `src/hooks/useAutoRefresh.js` | Polling fallback hook |
| `src/hooks/useInviterStats.js` | Gamification — Inviter |
| `src/hooks/useSecurityStats.js` | Gamification — Security |
| `src/hooks/useGatekeeperStats.js` | Gamification — Gatekeeper |
| `src/hooks/useOrgStats.js` | Gamification — Org-wide |
| `src/data/devLogs.js` | Dev session log data |

---

## Component mapping reference (MUI → Ant Design)

| MUI | Ant Design |
|-----|-----------|
| `Box` | `div` + inline style, or `Flex` / `Space` |
| `Typography variant="h5"` | `Typography.Title level={4}` |
| `Typography variant="body2"` | `Typography.Text` |
| `Button` | `Button` |
| `TextField` | `Input` / `Input.Password` |
| `Dialog` | `Modal` |
| `Drawer` | `Layout.Sider` + `Drawer` |
| `AppBar` | `Layout.Header` |
| `Alert` | `Alert` |
| `Chip` | `Tag` |
| `Skeleton` | `Skeleton` |
| `LinearProgress` | `Progress type="line"` |
| `CircularProgress` | `Spin` |
| `Tooltip` | `Tooltip` |
| `Grid container/item` | `Row` / `Col` |
| `DatePicker (MUI X)` | `DatePicker (antd)` — uses dayjs natively |
| `Tabs / Tab` | `Tabs` with `items` prop |
| `Collapse` | `Collapse` |
| `Paper` | `Card` (no shadow: `variant="borderless"`) |
| `IconButton` | `Button type="text" icon={...}` |
| `sx={{ ... }}` | `style={{ ... }}` or CSS |

---

## Porting convention

1. Copy the MUI page into `src/pages/`.
2. Replace all MUI imports with Ant Design equivalents using the table above.
3. Replace every `sx={{ ... }}` prop with `style={{ ... }}`.
4. Replace `<Box>` layout wrappers with `<div style={{ display:'flex', ... }}>` or `<Flex>`.
5. Replace `<Typography variant="...">` with the appropriate Ant variant.
6. Update the status table in this README.

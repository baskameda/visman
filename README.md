# Visitor Management POC

A full-stack proof-of-concept for a visitor invitation and facility check-in process, built on top of **Operaton** (BPMN 2.0 engine, community fork of Camunda 7).

---

## Architecture

```
visitor-poc/
├── backend/       Spring Boot 3 + Operaton + SQL Server + Liquibase
└── frontend/      React 18 + Vite + Material UI (MUI)
```

---

## BPMN Process – Invitation Process

```
[Start] → [Invite (Invitors)] → [BlackList Check] → <gateway>
                                                         ├─ reliability ≤ 30 → [Invitation Refused]
                                                         └─ reliability > 30 → [Security Check (Security)] → <gateway>
                                                                                                                ├─ reliability ≤ 30 → [Invitation Refused]
                                                                                                                └─ reliability > 30 → [Allow Visit (Porters)] → [Check In] → [Visitor Checked In]
```

### Personas & Groups

| Persona    | Group      | User (demo) | Password      |
|------------|------------|-------------|---------------|
| Inviter    | Invitors   | inviter1    | inviter123    |
| Security   | Security   | security1   | security123   |
| Gatekeeper | Porters    | gatekeeper1 | porter123     |
| Admin      | —          | admin       | admin         |

---

## Prerequisites

- Java 21
- Node.js 20+
- SQL Server (local or Docker) with a database named `visitor_db`
- Gradle (wrapper included — no local install needed)

### SQL Server with Docker (quickstart)

```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourPassword123!" \
  -p 1433:1433 --name visitor-sqlserver \
  -d mcr.microsoft.com/mssql/server:2022-latest

# Create the database
docker exec -it visitor-sqlserver /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "YourPassword123!" \
  -Q "CREATE DATABASE visitor_db"
```

---

## Backend

### Configuration

Edit `backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=visitor_db;encrypt=false;trustServerCertificate=true
spring.datasource.username=sa
spring.datasource.password=YourPassword123!
```

### ⚠️ Operaton Version

The `build.gradle` references `operaton-bom:7.22.0`.
Please verify the latest stable version at **https://operaton.org** or **https://github.com/operaton/operaton/releases** and update `ext.operatonVersion` in `build.gradle` if needed.

The Operaton Maven repository is:
```
https://artifacts.operaton.org/repository/operaton-public/
```

### Run

```bash
cd backend
./gradlew bootRun
```

The backend starts on **http://localhost:8080**.

### Operaton Web Apps

Once running, access the standard Operaton UI at:

| App      | URL                                                  |
|----------|------------------------------------------------------|
| Cockpit  | http://localhost:8080/operaton/app/cockpit/default/  |
| Tasklist | http://localhost:8080/operaton/app/tasklist/default/ |
| Admin    | http://localhost:8080/operaton/app/admin/default/    |

Login: `admin` / `admin`

### REST API

The Operaton REST API is exposed at **http://localhost:8080/engine-rest**.

Key endpoints used by the frontend:

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/identity/verify` | Validate user credentials |
| `GET`  | `/group?member={id}` | Get groups for a user |
| `POST` | `/process-definition/key/VisitProcess_1.0/start` | Start the invitation process |
| `GET`  | `/task?candidateGroup={group}` | List tasks for a group |
| `POST` | `/task/{id}/claim` | Claim a task |
| `POST` | `/task/{id}/complete` | Complete a task with variables |
| `GET`  | `/process-instance/{id}/variables` | Read process variables |
| `GET`  | `/history/process-instance` | Historic process list |

---

## Frontend

### Run

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on **http://localhost:5173**.

### Login

Use the demo accounts listed in the table above, or click any quick-fill button on the login page.

### Dashboard per Role

| Role       | Capabilities |
|------------|-------------|
| Inviter    | Start new invitation, fill visitor name & date |
| Security   | Review pending checks, set reliability score (0–100) |
| Gatekeeper | Allow entry, record actual visit date |

---

## Liquibase

Application-level DB changelogs live in:
```
backend/src/main/resources/db/changelog/
├── db.changelog-master.xml
└── changes/
    └── 001-initial-setup.xml
```

Add future application-specific table definitions as new `changeSet` entries in the `changes/` directory.

> Note: Operaton manages its own schema (`ACT_*`, `HI_*`, etc.) internally via `operaton.bpm.database.schema-update=true`. You do not need to manage those tables in Liquibase.

---

## Java Delegates

| Class | Task | Behaviour |
|-------|------|-----------|
| `eu.poc.claude.delegate.SillyBlacklistChecker` | BlackList Check | Sets `reliability = 70` (not blacklisted). Replace with real logic. |
| `eu.poc.claude.delegate.SillyCheckinService`   | Check In        | Logs visitor details and sets `checkedIn = true`. Replace with real integration. |

---

## Development Notes

- The Vite dev server proxies `/engine-rest/*` to `http://localhost:8080` — no CORS issues during development.
- For production, build the frontend (`npm run build`) and serve from `backend/src/main/resources/static/` or a separate web server.
- Change default passwords before any non-local deployment.

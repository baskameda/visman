import React, { useState } from "react"
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Tabs, Tab, Paper, Alert, Chip,
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
function Step({ n, children }) {
  return (
    <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
      <Box sx={{ width: 24, height: 24, borderRadius: "50%", bgcolor: "primary.main", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0, mt: 0.2 }}>
        {n}
      </Box>
      <Typography variant="body2">{children}</Typography>
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

export default function SupportDocsModal({ open, onClose }) {
  const [tab, setTab] = useState(0)
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>
        <Typography variant="h6" fontWeight={700}>Support Documentation</Typography>
        <Typography variant="body2" color="text.secondary">Installation, configuration and troubleshooting guide</Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
          <Tab label="Prerequisites" />
          <Tab label="Installation" />
          <Tab label="First Run" />
          <Tab label="User Setup" />
          <Tab label="Troubleshooting" />
        </Tabs>
        <Box sx={{ px: 3, pb: 2 }}>

          <TabPanel value={tab} index={0}>
            <Alert severity="info" sx={{ mb: 2 }}>All components run locally. No cloud account required.</Alert>
            <Section title="Required Software">
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                {[
                  ["Java 21+", "JDK (not JRE). Temurin / Eclipse / Oracle all work."],
                  ["Gradle 8+", "Or use the included Gradle wrapper (recommended)."],
                  ["Node.js 18+", "With npm. Used to run the React frontend."],
                  ["SQL Server", "Express edition is sufficient. Must allow TCP/IP on port 1433."],
                  ["Git", "To clone the repository."],
                  ["IDE (optional)", "IntelliJ IDEA or VS Code recommended."],
                ].map(([k, v]) => (
                  <Paper key={k} variant="outlined" sx={{ p: 1.5 }}>
                    <Typography variant="body2" fontWeight={700}>{k}</Typography>
                    <Typography variant="caption" color="text.secondary">{v}</Typography>
                  </Paper>
                ))}
              </Box>
            </Section>
            <Section title="Verify Prerequisites">
              <CodeBlock>{`java -version      # Should show 21 or higher
node -v            # Should show v18 or higher
npm -v             # Should show 8 or higher
sqlcmd -?          # Should show SQL Server command line help`}</CodeBlock>
            </Section>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <Section title="1. Clone the Repository">
              <CodeBlock>{`git clone <repository-url>
cd visitor-poc`}</CodeBlock>
            </Section>

            <Section title="2. Create the Database">
              <Step n={1}>Open SQL Server Management Studio (SSMS) or run sqlcmd.</Step>
              <Step n={2}>Create the database and a login:</Step>
              <CodeBlock>{`CREATE DATABASE visitor_db;
GO
-- If using SA account, ensure it is enabled and has a password set.
-- For production, create a dedicated application user instead of SA.`}</CodeBlock>
              <Step n={3}>Ensure TCP/IP is enabled in SQL Server Configuration Manager and the service is running on port 1433.</Step>
            </Section>

            <Section title="3. Configure the Backend">
              <Step n={1}>Open <code>backend/src/main/resources/application.yaml</code></Step>
              <Step n={2}>Update the datasource section with your SQL Server credentials:</Step>
              <CodeBlock>{`spring:
  datasource:
    url: jdbc:sqlserver://localhost:1433;databaseName=visitor_db;encrypt=false;trustServerCertificate=true
    username: sa
    password: YOUR_ACTUAL_PASSWORD   # ← change this`}</CodeBlock>
              <Alert severity="warning" sx={{ mt: 1 }}>Never commit real passwords to source control. Use environment variables for production.</Alert>
            </Section>

            <Section title="4. Build & Start the Backend">
              <CodeBlock>{`cd backend
./gradlew bootRun          # Linux / Mac
gradlew.bat bootRun        # Windows`}</CodeBlock>
              <Typography variant="body2">
                The first run takes 2–3 minutes. Liquibase runs migrations automatically.
                Operaton creates its own tables. Look for <code>Started VisitorApplication</code> in the logs.
              </Typography>
            </Section>

            <Section title="5. Install & Start the Frontend">
              <CodeBlock>{`cd frontend
npm install
npm run dev`}</CodeBlock>
              <Typography variant="body2">
                Vite starts on <strong>http://localhost:5173</strong>. The proxy forwards
                <code>/engine-rest</code> and <code>/api</code> calls to port 8080 automatically.
              </Typography>
            </Section>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <Section title="Default Admin Login">
              <CodeBlock>{`URL:      http://localhost:5173
Username: admin
Password: admin`}</CodeBlock>
              <Alert severity="warning" sx={{ mb: 2 }}>Change the admin password in application.yaml before any shared or production use.</Alert>
            </Section>

            <Section title="Operaton Cockpit (optional)">
              <Typography variant="body2" sx={{ mb: 1 }}>
                The full Operaton web interface is available at <code>http://localhost:8080/operaton</code>.
                Use it to monitor process instances, inspect variables, and manage the BPMN engine directly.
                Login with the same admin credentials.
              </Typography>
            </Section>

            <Section title="Creating Your First Visit">
              <Step n={1}>Log in as a user in the <strong>Invitors</strong> group (or as admin).</Step>
              <Step n={2}>Click <strong>New Invitation</strong>, enter visitor name and date, submit.</Step>
              <Step n={3}>Log in as a user in the <strong>Security</strong> group. The new task appears in the dashboard.</Step>
              <Step n={4}>Open the task, set a reliability score (50+ = approved, below 50 = rejected), submit.</Step>
              <Step n={5}>If approved, log in as <strong>Gatekeeper</strong> to process check-in and check-out.</Step>
            </Section>
          </TabPanel>

          <TabPanel value={tab} index={3}>
            <Section title="Built-in Groups">
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {[
                  ["Invitors", "Can create visitor invitations"],
                  ["Security", "Performs security reliability checks"],
                  ["Gatekeeper", "Manages physical check-in / check-out"],
                  ["webAdmins", "Grants access to the admin dashboard (user & group management)"],
                ].map(([g, d]) => (
                  <Box key={g} sx={{ display: "flex", gap: 1 }}>
                    <Chip label={g} size="small" sx={{ minWidth: 120, fontWeight: 700 }} />
                    <Typography variant="body2" sx={{ pt: 0.2 }}>{d}</Typography>
                  </Box>
                ))}
              </Box>
            </Section>

            <Section title="Creating Users via Admin Dashboard">
              <Step n={1}>Log in with a webAdmins user.</Step>
              <Step n={2}>Click <strong>Administration</strong> in the sidebar.</Step>
              <Step n={3}>Use the <strong>Users</strong> tab to create users (username, password, first name).</Step>
              <Step n={4}>Use the <strong>Groups</strong> tab to assign users to one or more groups.</Step>
              <Typography variant="body2" color="text.secondary">
                A user can belong to multiple groups and will see all relevant dashboards simultaneously.
              </Typography>
            </Section>

            <Section title="Language Settings">
              <Typography variant="body2">
                Each user can independently switch the UI language using the flag selector in the top-right.
                The choice is saved in localStorage and restored automatically on next login.
                Supported: English, German, Italian, French, Chinese, Russian.
              </Typography>
            </Section>
          </TabPanel>

          <TabPanel value={tab} index={4}>
            <Section title="Common Issues">
              {[
                {
                  problem: "Backend fails to start — datasource connection error",
                  cause: "SQL Server not running, wrong port, or incorrect credentials.",
                  fix: "Check SQL Server service is started. Verify credentials in application.yaml. Ensure TCP/IP is enabled in SQL Server Configuration Manager.",
                },
                {
                  problem: "Frontend shows blank page or CORS errors",
                  cause: "Backend not running, or running on a different port.",
                  fix: "Ensure backend is running on port 8080. Check browser console for specific error. CORS is configured for localhost:5173 only.",
                },
                {
                  problem: "Login fails with correct credentials",
                  cause: "Operaton identity service not initialised yet, or wrong admin password.",
                  fix: "Wait for full startup (look for Started VisitorApplication). Check admin.password in application.yaml.",
                },
                {
                  problem: "Tasks not appearing in real time",
                  cause: "SSE connection dropped.",
                  fix: "The frontend reconnects automatically. Refresh the page if tasks are missing after 30 seconds.",
                },
                {
                  problem: "Liquibase errors on startup",
                  cause: "Schema mismatch from a previous run with different code.",
                  fix: "Drop and recreate the database, or manually resolve the Liquibase changelog lock in the DATABASECHANGELOGLOCK table.",
                },
              ].map(({ problem, cause, fix }) => (
                <Paper key={problem} variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
                  <Typography variant="body2" fontWeight={700} color="error.main" sx={{ mb: 0.5 }}>{problem}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block"><b>Cause:</b> {cause}</Typography>
                  <Typography variant="caption" display="block"><b>Fix:</b> {fix}</Typography>
                </Paper>
              ))}
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

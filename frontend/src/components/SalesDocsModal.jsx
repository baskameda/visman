import React, { useState } from "react"
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Tabs, Tab, Paper, Chip,
} from "@mui/material"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"

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
function Benefit({ title, children }) {
  return (
    <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
      <CheckCircleIcon sx={{ color: "success.main", mt: 0.2, flexShrink: 0 }} />
      <Box>
        <Typography variant="body2" fontWeight={700}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">{children}</Typography>
      </Box>
    </Box>
  )
}
function StatBox({ value, label }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, textAlign: "center", flex: 1 }}>
      <Typography variant="h4" fontWeight={900} color="primary.main">{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Paper>
  )
}

export default function SalesDocsModal({ open, onClose }) {
  const [tab, setTab] = useState(0)
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>
        <Typography variant="h6" fontWeight={700}>Sales & Marketing Documentation</Typography>
        <Typography variant="body2" color="text.secondary">Visitor Management POC — Value proposition & adoption guide</Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
          <Tab label="Executive Summary" />
          <Tab label="Key Benefits" />
          <Tab label="Use Cases" />
          <Tab label="Competitive Edge" />
          <Tab label="Adoption Path" />
        </Tabs>
        <Box sx={{ px: 3, pb: 2 }}>

          <TabPanel value={tab} index={0}>
            <Box sx={{ p: 2.5, bgcolor: "#e6f4ff", borderRadius: 2, mb: 3, borderLeft: "4px solid #1677ff" }}>
              <Typography variant="body1" fontWeight={600} sx={{ mb: 1 }}>
                What is the Visitor Management System?
              </Typography>
              <Typography variant="body2">
                A process-driven web application that replaces paper-based or spreadsheet visitor logs with
                a structured, auditable digital workflow. Every visit follows a defined BPMN process —
                from invitation, through security vetting, to physical check-in and check-out — with
                real-time visibility for all stakeholders.
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
              <StatBox value="4" label="Process steps automated" />
              <StatBox value="3" label="Roles supported" />
              <StatBox value="6" label="Languages included" />
              <StatBox value="100%" label="Audit trail coverage" />
            </Box>

            <Section title="The Problem It Solves">
              <Typography variant="body2" sx={{ mb: 1 }}>
                Most organisations manage visitor access through informal channels: phone calls, emails,
                paper sign-in sheets, or basic spreadsheets. This creates:
              </Typography>
              {["Security gaps — no structured vetting before visitors enter the premises",
                "Compliance risk — no auditable record of who authorised each visit",
                "Operational inefficiency — manual coordination between reception, security and hosts",
                "Poor visitor experience — long waits, lost paperwork, unclear process",
              ].map(t => (
                <Box key={t} sx={{ display: "flex", gap: 1, mb: 0.5 }}>
                  <Typography variant="body2" color="error.main" sx={{ flexShrink: 0 }}>✗</Typography>
                  <Typography variant="body2">{t}</Typography>
                </Box>
              ))}
            </Section>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <Section title="Operational Benefits">
              <Benefit title="End-to-End Process Visibility">
                Every visit is a traceable process instance. Managers can see at any moment which visitors
                are expected, who has been vetted, and who is currently on-site.
              </Benefit>
              <Benefit title="Real-Time Task Notifications">
                Staff dashboards update instantly via Server-Sent Events — no manual refresh needed.
                Security officers and gatekeeper staff see new tasks the moment they are created.
              </Benefit>
              <Benefit title="Role-Based Workflow">
                Each staff member sees only the tasks relevant to their role. Inviters manage invitations,
                security handles vetting, gatekeepers manage physical access. No information overload.
              </Benefit>
              <Benefit title="Reliability Scoring">
                Security staff assign a structured 0–100 reliability score to each visitor before approval.
                Visitors scoring below 50 are automatically rejected and the inviter is notified.
              </Benefit>
            </Section>

            <Section title="IT & Compliance Benefits">
              <Benefit title="Full Audit Trail">
                Operaton records the complete history of every process instance — who did what, when,
                with what values. This satisfies ISO 27001, GDPR, and most facility security audits.
              </Benefit>
              <Benefit title="No Vendor Lock-In">
                Built on 100% open-source components (Operaton, Spring Boot, React). No per-seat
                licensing, no SaaS dependency, no data leaving your infrastructure.
              </Benefit>
              <Benefit title="Runs On-Premise">
                All data stays within your SQL Server instance. Suitable for organisations with
                strict data residency requirements.
              </Benefit>
              <Benefit title="Internationalised Out of the Box">
                Ships with six languages. Labels can be customised in-browser by any administrator
                without touching code — ideal for rebranding or terminology alignment.
              </Benefit>
            </Section>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <Section title="Who Uses It">
              {[
                {
                  role: "Corporate Offices",
                  desc: "Manage visitor access across single or multiple reception desks. Security teams get advance notice of expected visitors.",
                  tags: ["Reception", "Security", "HR"],
                },
                {
                  role: "Manufacturing & Industrial Sites",
                  desc: "Enforce safety inductions and contractor vetting before site access. Track who is on-site at any moment for emergency evacuation lists.",
                  tags: ["Safety Compliance", "Contractors", "Evacuation"],
                },
                {
                  role: "Healthcare Facilities",
                  desc: "Control patient area access, enforce visiting hours, and maintain a complete record of all non-staff entries.",
                  tags: ["Compliance", "Patient Safety", "GDPR"],
                },
                {
                  role: "Government & Public Sector",
                  desc: "Structured, auditable visitor management for sensitive buildings. Integrates with existing identity and access management.",
                  tags: ["Audit", "Security Clearance", "Compliance"],
                },
              ].map(({ role, desc, tags }) => (
                <Paper key={role} variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>{role}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{desc}</Typography>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {tags.map(t => <Chip key={t} label={t} size="small" variant="outlined" />)}
                  </Box>
                </Paper>
              ))}
            </Section>
          </TabPanel>

          <TabPanel value={tab} index={3}>
            <Section title="Why Choose This Over Alternatives">
              <Box sx={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ background: "#f0f5ff" }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: "2px solid #d0e0ff" }}>Feature</th>
                      <th style={{ padding: "8px 12px", textAlign: "center", borderBottom: "2px solid #d0e0ff" }}>This System</th>
                      <th style={{ padding: "8px 12px", textAlign: "center", borderBottom: "2px solid #d0e0ff" }}>Paper / Email</th>
                      <th style={{ padding: "8px 12px", textAlign: "center", borderBottom: "2px solid #d0e0ff" }}>Generic SaaS VMS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Structured approval workflow", "✓", "✗", "Partial"],
                      ["Real-time staff notifications", "✓", "✗", "✓"],
                      ["On-premise / data sovereignty", "✓", "✓", "✗"],
                      ["No per-seat licensing", "✓", "✓", "✗"],
                      ["Custom workflow via BPMN", "✓", "✗", "✗"],
                      ["Full process audit trail", "✓", "Partial", "✓"],
                      ["Multi-language UI", "✓", "✗", "Partial"],
                      ["In-browser label customisation", "✓", "N/A", "✗"],
                      ["Open source", "✓", "N/A", "✗"],
                    ].map(([feat, ours, paper, saas]) => (
                      <tr key={feat} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "7px 12px" }}>{feat}</td>
                        <td style={{ padding: "7px 12px", textAlign: "center", color: "#389e0d", fontWeight: 700 }}>{ours}</td>
                        <td style={{ padding: "7px 12px", textAlign: "center", color: ours === "✓" && paper === "✗" ? "#cc0000" : "#666" }}>{paper}</td>
                        <td style={{ padding: "7px 12px", textAlign: "center", color: saas === "✗" ? "#cc0000" : "#666" }}>{saas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Section>
          </TabPanel>

          <TabPanel value={tab} index={4}>
            <Section title="Proof of Concept → Production Path">
              {[
                { phase: "Phase 1 — POC (current)", color: "#1677ff", items: [
                  "Full workflow running on local infrastructure",
                  "All three roles operational",
                  "Multi-language UI in place",
                  "Admin dashboard for user/group management",
                ]},
                { phase: "Phase 2 — Pilot", color: "#531dab", items: [
                  "Deploy to shared server (Docker / Kubernetes)",
                  "Connect to production SQL Server instance",
                  "Integrate with Active Directory / LDAP for single sign-on",
                  "Configure email notifications at process step transitions",
                ]},
                { phase: "Phase 3 — Production", color: "#389e0d", items: [
                  "HTTPS / TLS termination",
                  "Backup and disaster recovery for SQL Server",
                  "Custom BPMN process adjustments for organisation-specific rules",
                  "Integration with physical access control systems (badge readers)",
                  "Reporting dashboard for visitor statistics and compliance reports",
                ]},
              ].map(({ phase, color, items }) => (
                <Paper key={phase} variant="outlined" sx={{ p: 2, mb: 2, borderLeft: `4px solid ${color}` }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color }}>{phase}</Typography>
                  {items.map(i => (
                    <Box key={i} sx={{ display: "flex", gap: 1, mb: 0.4 }}>
                      <Typography variant="body2" sx={{ color, flexShrink: 0 }}>→</Typography>
                      <Typography variant="body2">{i}</Typography>
                    </Box>
                  ))}
                </Paper>
              ))}
            </Section>

            <Section title="Estimated Implementation Effort">
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <StatBox value="~8h" label="POC running (already done)" />
                <StatBox value="2–3d" label="Pilot deployment" />
                <StatBox value="1–2w" label="Production-ready with integrations" />
              </Box>
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

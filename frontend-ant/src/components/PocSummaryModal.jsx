import React, { useMemo, useState } from 'react'
import { Modal, Tabs, Card, Table, Tag, Typography, Tooltip, Space, Row, Col, Progress, Alert, Button } from 'antd'
import {
  ClockCircleOutlined, DollarOutlined, TeamOutlined,
  CalendarOutlined, ThunderboltOutlined, RocketOutlined,
  WarningOutlined, PrinterOutlined, DownloadOutlined,
} from '@ant-design/icons'
import devLogs from '../data/devLogs'

const { Text, Title, Paragraph } = Typography

// ── Constants ─────────────────────────────────────────────────────────────────

// Worst-case-scenario factors (AI's own analysis after reflection)
const FACTOR_VALUES_AI      = [5.0, 2.5, 2.0, 2.5, 3.0]
// Optimistic-scenario factors (calibrated by PoC issuer based on project experience)
const FACTOR_VALUES_REALITY = [5.0, 2.0, 1.5, 1.5, 2.0]

const HUMAN_MULTIPLIER_AI      = FACTOR_VALUES_AI.reduce((a, b) => a * b, 1)      // 187.5
const HUMAN_MULTIPLIER         = FACTOR_VALUES_REALITY.reduce((a, b) => a * b, 1) //  45.0

const HOURLY_RATE_EUR  = 24
const TEAM_SIZE        = 10
const HOURS_PER_DAY    =  8
const AVAILABILITY     = 0.75
const TEAM_H_PER_QTR   = TEAM_SIZE * 60 * HOURS_PER_DAY * AVAILABILITY  // 3,600

const CATEGORIES = {
  dev: { color: '#1677ff', tagColor: 'blue'   },
  fix: { color: '#f5222d', tagColor: 'red'    },
  doc: { color: '#722ed1', tagColor: 'purple' },
  qa:  { color: '#fa8c16', tagColor: 'orange' },
}

// ── Quarterly timeline ────────────────────────────────────────────────────────

const TIMELINE_RAW = [
  { quarter: 'Q1 2026', period: { en: 'Jan – Mar 2026', de: 'Jan. – März 2026'  }, pct: 32 },
  { quarter: 'Q2 2026', period: { en: 'Apr – Jun 2026', de: 'Apr. – Juni 2026'  }, pct: 12 },
  { quarter: 'Q3 2026', period: { en: 'Jul – Sep 2026', de: 'Jul. – Sep. 2026'  }, pct: 28 },
  { quarter: 'Q4 2026', period: { en: 'Oct – Dec 2026', de: 'Okt. – Dez. 2026'  }, pct: 40 },
  { quarter: 'Q1 2027', period: { en: 'Jan – Mar 2027', de: 'Jan. – März 2027'  }, pct: 15 },
  { quarter: 'Q2 2027', period: { en: 'Apr – Jun 2027', de: 'Apr. – Juni 2027'  }, pct: 35 },
  { quarter: 'Q3 2027', period: { en: 'Jul – Sep 2027', de: 'Jul. – Sep. 2027'  }, pct: 10 },
  { quarter: 'Q4 2027', period: { en: 'Oct – Dec 2027', de: 'Okt. – Dez. 2027'  }, pct: 22 },
  { quarter: 'Q1 2028', period: { en: 'Jan – Mar 2028', de: 'Jan. – März 2028'  }, pct: 38 },
  { quarter: 'Q2 2028', period: { en: 'Apr – Jun 2028', de: 'Apr. – Juni 2028'  }, pct: 12 },
  { quarter: 'Q3 2028', period: { en: 'Jul – Sep 2028', de: 'Jul. – Sep. 2028'  }, pct: 25 },
  { quarter: 'Q4 2028', period: { en: 'Oct – Dec 2028', de: 'Okt. – Dez. 2028'  }, pct: 40 },
  { quarter: 'Q1 2029', period: { en: 'Jan – Mar 2029', de: 'Jan. – März 2029'  }, pct: 10 },
  { quarter: 'Q2 2029', period: { en: 'Apr – Jun 2029', de: 'Apr. – Juni 2029'  }, pct: 30 },
  { quarter: 'Q3 2029', period: { en: 'Jul – Sep 2029', de: 'Jul. – Sep. 2029'  }, pct: 38 },
  { quarter: 'Q4 2029', period: { en: 'Oct – Dec 2029', de: 'Okt. – Dez. 2029'  }, pct: 18 },
  { quarter: 'Q1 2030', period: { en: 'Jan – Mar 2030', de: 'Jan. – März 2030'  }, pct: 35 },
  { quarter: 'Q2 2030', period: { en: 'Apr – Jun 2030', de: 'Apr. – Juni 2030'  }, pct: 12 },
  { quarter: 'Q3 2030', period: { en: 'Jul – Sep 2030', de: 'Jul. – Sep. 2030'  }, pct: 28 },
  { quarter: 'Q4 2030', period: { en: 'Oct – Dec 2030', de: 'Okt. – Dez. 2030'  }, pct: 40 },
  { quarter: 'Q1 2031', period: { en: 'Jan – Mar 2031', de: 'Jan. – März 2031'  }, pct: 10 },
  { quarter: 'Q2 2031', period: { en: 'Apr – Jun 2031', de: 'Apr. – Juni 2031'  }, pct: 25 },
  { quarter: 'Q3 2031', period: { en: 'Jul – Sep 2031', de: 'Jul. – Sep. 2031'  }, pct: 35 },
  { quarter: 'Q4 2031', period: { en: 'Oct – Dec 2031', de: 'Okt. – Dez. 2031'  }, pct: 12 },
  { quarter: 'Q1 2032', period: { en: 'Jan – Mar 2032', de: 'Jan. – März 2032'  }, pct: 40 },
]

// ── Bilingual session titles & categories ─────────────────────────────────────

const SESSION_TITLES = {
  1:  { en: 'Full-Stack Foundation & Core Visit Workflow',           de: 'Grundstruktur & Kern-Besuchsworkflow' },
  2:  { en: 'Admin Dashboard & Real-Time Updates',                   de: 'Admin-Dashboard & Echtzeit-Aktualisierungen' },
  3:  { en: 'Admin User Management',                                 de: 'Admin-Benutzerverwaltung' },
  4:  { en: 'Server-Sent Events & Navigation',                       de: 'Server-Sent Events & Navigation' },
  5:  { en: 'User & Group Management',                               de: 'Benutzer- & Gruppenverwaltung' },
  6:  { en: '6-Language Support (i18n)',                             de: '6-Sprachunterstützung (i18n)' },
  7:  { en: 'Live Label Editor',                                     de: 'Live-Beschriftungseditor' },
  8:  { en: 'Documentation Hub, Gamification & Ant Design Port',     de: 'Dokumentations-Hub, Gamification & Ant-Design-Port' },
  9:  { en: 'Visitor Registry & Search',                             de: 'Besucherverzeichnis & Suche' },
  10: { en: 'Security Review — Identity Confirmation & Decisions',   de: 'Sicherheitsprüfung — Identitätsbestätigung & Entscheidungsfluss' },
  11: { en: 'Clarification Loop & Blacklist Management',             de: 'Klärungsschleife & Sperrlisten-Verwaltung' },
  12: { en: 'Multi-Visitor Invitations & Gatekeeper Check-In',       de: 'Mehrbesucher-Einladungen & Pförtner-Einlass' },
  13: { en: 'Inviter Supervisor Hierarchy',                          de: 'Vorgesetzten-Hierarchie für Einlader' },
  14: { en: 'Org Chart Visualizations & Admin Navigation',           de: 'Organigramm-Visualisierungen & Admin-Navigation' },
  15: { en: 'Multi-Location Support with Maps & Analytics',          de: 'Mehrstandort-Unterstützung mit Karten & Analysen' },
  16: { en: 'Route Registration & Bug Fixes',                        de: 'Routenregistrierung & Fehlerbehebungen' },
  17: { en: 'Seed Data — One Year of Synthetic History',             de: 'Testdaten — Ein Jahr synthetischer Verlauf' },
  18: { en: 'Security Officer Mobile PWA',                           de: 'Sicherheitsbeauftragter Mobile PWA' },
  19: { en: 'Login Role Filter & Inviter Month Grouping',            de: 'Login-Rollenfilter & Einlader-Monatsgruppierung' },
  20: { en: 'Dashboard UX Rework',                                   de: 'Dashboard-UX-Überarbeitung' },
  21: { en: 'Gatekeeper Mobile PWA — Offline-First with GPS',        de: 'Pförtner Mobile PWA — Offline-First mit GPS' },
  22: { en: 'Documentation — Gatekeeper PWA',                        de: 'Dokumentation — Pförtner-PWA' },
  23: { en: 'Multi-Location Expansion & Documentation Pass',         de: 'Mehrstandort-Erweiterung & Dokumentationsdurchlauf' },
  24: { en: 'UX Polish — Greetings, Session Timer & Marketing',      de: 'UX-Verfeinerung — Begrüßungen, Sitzungstimer & Marketing' },
  25: { en: 'QA Notes & Support Test Summary',                       de: 'QA-Hinweise & Support-Testzusammenfassung' },
  26: { en: 'Licence Management — Generate',                         de: 'Lizenzverwaltung — Generierung' },
  27: { en: 'Licence Verification & Global Feature Flags',           de: 'Lizenzüberprüfung & globale Feature-Flags' },
  28: { en: 'Feature Gating — Interceptors & Auto-Logout',           de: 'Feature-Sperrung — Interceptors & automatische Abmeldung' },
  29: { en: 'Login Licence Awareness & QA Documentation Pass',       de: 'Login-Lizenzerkennung & QA-Dokumentationsdurchlauf' },
  30: { en: 'PoC Executive Summary',                                  de: 'PoC-Zusammenfassung für die Geschäftsleitung' },
}

const SESSION_CATEGORIES = {
  1:'dev',2:'dev',3:'dev',4:'dev',5:'dev',6:'dev',7:'dev',8:'dev',9:'dev',10:'dev',
  11:'dev',12:'dev',13:'dev',14:'dev',15:'dev',16:'fix',17:'dev',18:'dev',19:'dev',20:'dev',
  21:'dev',22:'doc',23:'doc',24:'dev',25:'qa',26:'dev',27:'dev',28:'dev',29:'qa',30:'doc',
}

// ── Multiplier factors — three columns ────────────────────────────────────────
// factorAIInitial:   original optimistic AI guess
// factorAICorrected: worst case scenario (AI corrected after reflection)
// factorPerceived:   optimistic scenario (PoC issuer, based on experience)

const MULTIPLIER_FACTORS_DATA = [
  {
    factorAIInitial: '×5.0', factorAICorrected: '×5.0', factorPerceived: '×5.0',
    color: '#1677ff', bold: false, changed: false,
    en: {
      label: 'No AI — websearch only',
      explanation: 'Multiple industry studies (GitHub Copilot, McKinsey, Google DORA) show AI-assisted coding is 3–5× faster than conventional web-search-based development for complex projects. This project spans Java, BPMN, React, two mobile PWAs, SQL Server, Leaflet maps, D3 charts, and Web Crypto — a breadth where AI assistance gives maximum benefit. All three estimates agree on ×5 for a single senior developer working without AI.',
    },
    de: {
      label: 'Kein KI — nur Websuche',
      explanation: 'Mehrere Branchenstudien (GitHub Copilot, McKinsey, Google DORA) belegen, dass KI-gestützte Programmierung bei komplexen Projekten 3–5× schneller ist als herkömmliche webbasierte Entwicklung. Dieses Projekt umfasst Java, BPMN, React, zwei mobile PWAs, SQL Server, Leaflet-Karten, D3-Diagramme und Web Crypto — eine Breite, bei der KI maximalen Nutzen entfaltet. Alle drei Schätzungen stimmen beim Faktor ×5 für einen einzelnen erfahrenen Entwickler ohne KI-Hilfe überein.',
    },
  },
  {
    factorAIInitial: '×1.5', factorAICorrected: '×2.5', factorPerceived: '×2.0',
    color: '#531dab', bold: false, changed: true,
    en: {
      label: 'Team specialisation + backend split',
      explanation: 'The 2 frontend developers cannot implement backend features, and backend developers are only 50% available (working on another project in parallel). This halves effective backend bandwidth and introduces API contract meetings, integration handoffs, PR review cycles, and standup overhead. **The AI\'s initial estimate of ×1.5 was optimistic.** The worst case scenario raises this to ×2.5, assuming deeper knowledge silos and more severe idle-time cascades. **Optimistic scenario: ×2.0** — the friction is real but teams find practical workarounds that partially offset the theoretical overhead.',
    },
    de: {
      label: 'Teamspezialisierung + Backend-Aufteilung',
      explanation: 'Die 2 Frontend-Entwickler können keine Backend-Funktionen umsetzen, und Backend-Entwickler stehen nur zu 50 % zur Verfügung (parallel an einem anderen Projekt tätig). Dies halbiert die effektive Backend-Kapazität und erzeugt Mehraufwand durch API-Gespräche, Übergaben und Reviews. **Die KI-Erstschätzung von ×1,5 war optimistisch.** Das Worst-Case-Szenario erhöht dies auf ×2,5 unter Annahme tieferer Wissenssilos und stärkerer Leerlauf-Kaskaden. **Optimistisches Szenario: ×2,0** — die Reibung ist real, aber Teams finden praktische Lösungswege, die einen Teil des theoretischen Overheads abfedern.',
    },
  },
  {
    factorAIInitial: '×1.1', factorAICorrected: '×2.0', factorPerceived: '×1.5',
    color: '#d46b08', bold: false, changed: true,
    en: {
      label: 'Frontend/backend API mismatches (10–15% of features)',
      explanation: 'When the frontend team and backend team build against different interpretations of the API contract, both sides must rework their implementation. **The AI\'s initial estimate of ×1.1 was optimistic.** The worst case scenario corrects this to ×2.0, assuming cascading rework across multiple components. **Optimistic scenario: ×1.5** — mismatches are managed through more frequent (if informal) sync sessions and feature flags that decouple frontend and backend delivery, reducing the actual rework cost.',
    },
    de: {
      label: 'Frontend/Backend-API-Diskrepanzen (10–15 % der Features)',
      explanation: 'Wenn Frontend- und Backend-Team gegen unterschiedliche Interpretationen des API-Vertrags entwickeln, müssen beide Seiten ihre Implementierung überarbeiten. **Die KI-Erstschätzung von ×1,1 war optimistisch.** Das Worst-Case-Szenario korrigiert dies auf ×2,0 unter der Annahme kaskadierender Nachbesserungen. **Optimistisches Szenario: ×1,5** — Diskrepanzen werden durch häufigere (informelle) Sync-Gespräche und Feature-Flags abgefedert, die Frontend- und Backend-Lieferung entkoppeln und so die tatsächlichen Nachbesserungskosten senken.',
    },
  },
  {
    factorAIInitial: '×1.15', factorAICorrected: '×2.5', factorPerceived: '×1.5',
    color: '#f5222d', bold: false, changed: true,
    en: {
      label: 'QA friction — bug attribution + junior QA',
      explanation: '20–25% of development time is affected by the question "Is this a frontend or backend bug?" When QA cannot determine the root cause, both teams investigate simultaneously. **The AI\'s initial estimate of ×1.15 was heavily optimistic.** The worst case scenario corrects this to ×2.5, modelling lengthy parallel investigation chains and pervasive false positives. **Optimistic scenario: ×1.5** — in practice, teams develop triage instincts over time, most bugs are quickly scoped to one layer, and junior QA produces fewer false positives than the theoretical worst case assumes.',
    },
    de: {
      label: 'QA-Reibung — Fehlerattribution + Junior-QA',
      explanation: '20–25 % der Entwicklungszeit ist von der Frage betroffen: „Frontend- oder Backend-Fehler?" Wenn die QA die Ursache nicht bestimmen kann, untersuchen beide Teams gleichzeitig. **Die KI-Erstschätzung von ×1,15 war stark optimistisch.** Das Worst-Case-Szenario korrigiert dies auf ×2,5 und modelliert lange parallele Untersuchungsketten und häufige Fehlalarme. **Optimistisches Szenario: ×1,5** — in der Praxis entwickeln Teams im Laufe der Zeit Triage-Instinkte, die meisten Fehler lassen sich schnell einer Schicht zuordnen, und der Junior-QA produziert weniger Fehlalarme als im theoretischen Worst Case angenommen.',
    },
  },
  {
    factorAIInitial: '×1.1', factorAICorrected: '×3.0', factorPerceived: '×2.0',
    color: '#389e0d', bold: false, changed: true,
    en: {
      label: 'Blurry requirements + PO unavailability',
      explanation: 'When requirements are unclear and the product owner is not readily available, developers implement based on assumptions. **The AI\'s initial estimate of ×1.1 was significantly underestimated.** The worst case scenario corrects this to ×3.0, treating requirement-driven rework as the dominant cost driver. **Optimistic scenario: ×2.0** — requirements are rarely crystal clear, but experienced teams apply pragmatic scoping ("build the 80% case now, flag the ambiguous 20%"), partial implementation strategies, and rapid prototyping to reduce the cost of late-stage discovery.',
    },
    de: {
      label: 'Unklare Anforderungen + eingeschränkte PO-Verfügbarkeit',
      explanation: 'Wenn Anforderungen unklar sind und der Product Owner nicht verfügbar ist, entwickeln Entwickler auf Basis von Annahmen. **Die KI-Erstschätzung von ×1,1 war erheblich zu niedrig.** Das Worst-Case-Szenario korrigiert dies auf ×3,0 und behandelt anforderungsbedingte Nachbesserungen als dominanten Kostentreiber. **Optimistisches Szenario: ×2,0** — Anforderungen sind selten glasklar, aber erfahrene Teams wenden pragmatisches Scoping an („80 %-Fall jetzt umsetzen, die 20 % Unklarheiten markieren"), setzen auf Teilimplementierungen und schnelle Prototypen, um Spätentdeckungen zu reduzieren.',
    },
  },
  {
    factorAIInitial: '≈ 10×', factorAICorrected: '= 187.5×', factorPerceived: '= 45×',
    color: '#000000', bold: true, changed: true,
    en: {
      label: 'Compounded total',
      explanation: 'AI initial: 5.0 × 1.5 × 1.1 × 1.15 × 1.1 ≈ 10×.  Worst case scenario: 5.0 × 2.5 × 2.0 × 2.5 × 3.0 = 187.5×.  Optimistic scenario: 5.0 × 2.0 × 1.5 × 1.5 × 2.0 = 45×. The 4.2× gap between worst case (187.5) and optimistic scenario (45) is itself informative: the worst case models theoretical friction peaks while the optimistic scenario reflects teams that cope, adapt, and find pragmatic solutions under pressure. The 18× gap between AI initial and optimistic scenario confirms that naive optimism remains the greatest estimation risk.',
    },
    de: {
      label: 'Zusammengesetzter Gesamtfaktor',
      explanation: 'KI-Erstschätzung: 5,0 × 1,5 × 1,1 × 1,15 × 1,1 ≈ 10×.  Worst-Case-Szenario: 5,0 × 2,5 × 2,0 × 2,5 × 3,0 = 187,5×.  Optimistisches Szenario: 5,0 × 2,0 × 1,5 × 1,5 × 2,0 = 45×. Der 4,2-fache Unterschied zwischen Worst-Case (187,5) und optimistischem Szenario (45) ist selbst aussagekräftig: Der Worst Case modelliert theoretische Reibungsmaxima, während das optimistische Szenario Teams widerspiegelt, die anpassen, improvisieren und unter Druck pragmatische Lösungen finden. Der 18-fache Unterschied zwischen KI-Erstschätzung und optimistischem Szenario zeigt, dass naiver Optimismus das größte Schätzrisiko bleibt.',
    },
  },
]

// ── Bilingual UI strings ───────────────────────────────────────────────────────

const STRINGS = {
  en: {
    modalTitle:   'PoC Journey — What Was Built & What It Cost',
    tagExecutive: 'Executive Summary',
    tagCorrected: 'Optimistic scenario',
    tabs: {
      overview:  'Overview',
      timeline:  'Timeline Estimate',
      chronicle: n => `Feature Chronicle (${n} sessions)`,
    },
    sections: {
      worstCase:  `Worst Case Scenario  ×${HUMAN_MULTIPLIER_AI}`,
      optimistic: `Optimistic Scenario  ×${HUMAN_MULTIPLIER}`,
      aiDev:      'AI Development',
    },
    kpi: {
      // Worst case section
      wcHours:   { title: `Team Dev Hours (×${HUMAN_MULTIPLIER_AI})`,               sub: 'Worst case scenario · no AI' },
      wcCost:    { title: `Team Cost (${TEAM_SIZE} devs × ${HOURLY_RATE_EUR} €/h)`, sub: `Worst case · ${HUMAN_MULTIPLIER_AI}× multiplier` },
      wcTime:    { title: 'Worst Case Calendar Time',                                sub: 'Worst case · see Timeline tab', value: '~Feb 2032' },
      // Optimistic section
      humanHours:{ title: `Team Dev Hours (×${HUMAN_MULTIPLIER})`,                  sub: 'Optimistic scenario · no AI' },
      teamCost:  { title: `Team Cost (${TEAM_SIZE} devs × ${HOURLY_RATE_EUR} €/h)`, sub: `Optimistic · ${HUMAN_MULTIPLIER}× multiplier` },
      calTime:   { title: 'Optimistic Calendar Time',                                sub: 'Optimistic scenario · see Timeline tab', value: '~Jun 2027' },
      // AI Development section
      calDays:   { title: 'AI Development — Calendar Days',                          sub: '2 – 9 March 2026' },
      aiHours:   { title: 'Total AI-Assisted Hours',                                 sub: n => `${n} sessions` },
      claudeCost:{ title: 'Claude API Cost',                                         sub: 'Sonnet 4.x pricing' },
    },
    overviewIntro: (days) =>
      `This PoC was built end-to-end by one developer assisted by Claude AI in ${days} calendar days. The figures below show two scenarios for what the same system would cost a conventional team of ${TEAM_SIZE} developers at ${HOURLY_RATE_EUR} €/h, working without AI assistance. The optimistic scenario uses a ×${HUMAN_MULTIPLIER} multiplier (calibrated against real project experience); the worst case uses ×${HUMAN_MULTIPLIER_AI} (AI theoretical analysis). See the methodology below.`,
    multiplier: {
      title:       'How the scenario multipliers were derived',
      tag:         'Optimistic scenario',
      warning:     `The AI initially proposed optimistic factors. It then corrected itself upward based on theoretical analysis (→ Worst Case Scenario ×${HUMAN_MULTIPLIER_AI}). The PoC issuer then calibrated each factor against perceived project experience, arriving at the lower Optimistic Scenario ×${HUMAN_MULTIPLIER}. Click any row to read the full rationale.`,
      colFactor:   'Factor',
      colAIInit:   'AI initial',
      colAICorr:   'Worst case scenario',
      colPerceived:'Optimistic scenario',
      tagCorrected:'adjusted',
    },
    categories: { dev: 'Feature Development', fix: 'Bug Fixing', doc: 'Documentation', qa: 'QA & Testing' },
    table: {
      colCategory: 'Category',
      colSessions: 'Sessions',
      colAiHours:  'AI Hours',
      colClaude:   'Claude Cost',
      colHumanH:   `Team Hours (×${HUMAN_MULTIPLIER})`,
      colTeamCost: `Team Cost (${TEAM_SIZE} × ${HOURLY_RATE_EUR} €/h)`,
      total:       'Total',
    },
    overviewNote: `Note for executives: AI hours = actual time spent with Claude. The optimistic scenario multiplier (×${HUMAN_MULTIPLIER} = 5 × 2.0 × 1.5 × 1.5 × 2.0) reflects experienced teams that adapt under pressure. The worst case scenario (×${HUMAN_MULTIPLIER_AI}) models theoretical friction peaks. Hourly rate: ${HOURLY_RATE_EUR} €/h. Infrastructure, testing environments, and project management overhead are excluded.`,
    timeline: {
      assumptionsTitle: 'Model Assumptions',
      scenarioNote: (opt, wc) => `Timeline shown uses the optimistic scenario multiplier (×${opt}). Using the worst case scenario (×${wc}) the project would finish approximately February 2032 — roughly 4.5 years later. That gap reflects how differently teams can assess the same friction factors.`,
      assumptions: (avgPct, totalH) => [
        ['Project start',            '1 January 2026'],
        ['Team size',                `${TEAM_SIZE} developers`],
        ['Effective availability',   `${Math.round(AVAILABILITY * 100)}% (meetings, holidays, sickness, wasted time)`],
        ['Capacity per quarter',     `${TEAM_H_PER_QTR.toLocaleString('de-DE')} h  (${TEAM_SIZE} × 60 days × ${HOURS_PER_DAY} h × ${Math.round(AVAILABILITY*100)}%)`],
        ['Project allocation range', '10% (deep) – 40% (peak) of capacity'],
        ['Average allocation',       `${avgPct}% across all quarters`],
        ['Total hours needed',       `${totalH.toLocaleString('de-DE')} h  (${devLogs.reduce((a,s)=>a+s.hours,0).toFixed(1)} h AI × ${HUMAN_MULTIPLIER})`],
      ],
      legendPeak:   'Peak allocation (35–40%)',
      legendDeep:   'Deep allocation (10–14%)',
      legendMedium: 'Medium allocation (15–34%)',
      legendFinish: 'Estimated finish',
      finishTag:    pct => `~${pct}% in`,
      conclusion: (avgPct) =>
        `Estimated completion (optimistic scenario): approximately June 2027 — roughly 1 year and 6 months after project start on 1 January 2026. This assumes a team of ${TEAM_SIZE} people at ${Math.round(AVAILABILITY*100)}% effective availability investing on average ${avgPct}% of capacity, with natural peaks and troughs from competing priorities.`,
      disclaimer: 'The peak/deep distribution is illustrative. Actual allocation depends on competing releases, budget cycles, and staffing. Using the worst case scenario multiplier (×187.5) instead, the same model yields a finish of approximately February 2032 — a 4.5-year difference driven entirely by how friction factors are assessed.',
    },
    chronicle: {
      filters:   ['All', 'Feature Development', 'Bug Fixing', 'Documentation', 'QA & Testing'],
      aiHours:   h => `${h} h AI`,
      teamHours: h => `${h.toLocaleString('en-US')} h team`,
      teamCost:  c => `≈ €${c.toLocaleString('en-US')}`,
    },
    export: {
      savePdf:       'Save as PDF',
      downloadHtml:  'Download HTML',
      top15Title:    'Top 15 Features by Time Invested',
      top15Note:     (shown, total) => `Showing ${shown} of ${total} sessions, ranked by AI development hours.`,
      rankCol:       '#',
      featureCol:    'Feature',
      categoryCol:   'Category',
      aiHoursCol:    'AI Hours',
      teamHoursCol:  `Team Hours (×${HUMAN_MULTIPLIER} opt.)`,
      teamCostCol:   'Team Cost (optimistic)',
      generatedOn:   'Generated on',
      wcLabel:       `Worst Case Scenario (×${HUMAN_MULTIPLIER_AI})`,
      optLabel:      `Optimistic Scenario (×${HUMAN_MULTIPLIER})`,
      aiLabel:       'AI Development',
      methodology:   'Methodology — How the Multipliers Were Derived',
      catBreakdown:  'Cost by Category',
      timelineTitle: 'Estimated Timeline',
      footerNote:    'This document was generated from the PoC Executive Summary. All figures are estimates. Infrastructure, testing environments, and project management overhead are excluded.',
    },
  },

  de: {
    modalTitle:   'PoC-Reise — Was gebaut wurde und was es kostete',
    tagExecutive: 'Zusammenfassung für die Geschäftsleitung',
    tagCorrected: 'Optimistisches Szenario',
    tabs: {
      overview:  'Überblick',
      timeline:  'Zeitplanschätzung',
      chronicle: n => `Funktionschronik (${n} Sitzungen)`,
    },
    sections: {
      worstCase:  `Worst-Case-Szenario  ×${HUMAN_MULTIPLIER_AI}`,
      optimistic: `Optimistisches Szenario  ×${HUMAN_MULTIPLIER}`,
      aiDev:      'KI-Entwicklung',
    },
    kpi: {
      // Worst-Case-Sektion
      wcHours:   { title: `Teamstunden (×${HUMAN_MULTIPLIER_AI})`,                     sub: 'Worst-Case-Szenario · ohne KI' },
      wcCost:    { title: `Teamkosten (${TEAM_SIZE} Entw. × ${HOURLY_RATE_EUR} €/Std.)`, sub: `Worst-Case · Faktor ${HUMAN_MULTIPLIER_AI}×` },
      wcTime:    { title: 'Worst-Case-Kalenderplan',                                   sub: 'Worst-Case · siehe Zeitplan', value: '~Feb. 2032' },
      // Optimistische Sektion
      humanHours:{ title: `Teamstunden (×${HUMAN_MULTIPLIER})`,                        sub: 'Optimistisches Szenario · ohne KI' },
      teamCost:  { title: `Teamkosten (${TEAM_SIZE} Entw. × ${HOURLY_RATE_EUR} €/Std.)`, sub: `Optimistisch · Faktor ${HUMAN_MULTIPLIER}×` },
      calTime:   { title: 'Optimistischer Kalenderplan',                               sub: 'Optimistisches Szenario · siehe Zeitplan', value: '~Jun. 2027' },
      // KI-Entwicklungs-Sektion
      calDays:   { title: 'KI-Entwicklung — Kalendertage',                             sub: '2.–9. März 2026' },
      aiHours:   { title: 'Gesamt-KI-Stunden',                                         sub: n => `${n} Arbeitssitzungen` },
      claudeCost:{ title: 'Claude-API-Kosten',                                         sub: 'Sonnet 4.x Preismodell' },
    },
    overviewIntro: (days) =>
      `Dieser PoC wurde von einem einzigen KI-gestützten Entwickler in ${days} Kalendertagen vollständig erstellt. Die folgenden Zahlen zeigen zwei Szenarien für die Kosten eines konventionellen Teams von ${TEAM_SIZE} Entwicklern zu ${HOURLY_RATE_EUR} €/Std. ohne KI-Unterstützung. Das optimistische Szenario verwendet den Faktor ×${HUMAN_MULTIPLIER} (kalibriert an echter Projekterfahrung); das Worst-Case-Szenario verwendet ×${HUMAN_MULTIPLIER_AI} (KI-theoretische Analyse). Methodik unten.`,
    multiplier: {
      title:        'Herleitung der Szenario-Faktoren',
      tag:          'Optimistisches Szenario',
      warning:      `Die KI schlug zunächst optimistische Faktoren vor und korrigierte sich anschließend auf höhere Werte auf Basis theoretischer Analyse (→ Worst-Case-Szenario ×${HUMAN_MULTIPLIER_AI}). Der Auftraggeber kalibrierte jeden Faktor dann an der wahrgenommenen Projekterfahrung und gelangte zum niedrigeren optimistischen Szenario ×${HUMAN_MULTIPLIER}. Klicken Sie auf eine Zeile für die vollständige Begründung.`,
      colFactor:    'Faktor',
      colAIInit:    'KI-Erstschätzung',
      colAICorr:    'Worst-Case-Szenario',
      colPerceived: 'Optimistisches Szenario',
      tagCorrected: 'angepasst',
    },
    categories: { dev: 'Funktionsentwicklung', fix: 'Fehlerbehebung', doc: 'Dokumentation', qa: 'QA & Tests' },
    table: {
      colCategory: 'Kategorie',
      colSessions: 'Sitzungen',
      colAiHours:  'KI-Stunden',
      colClaude:   'Claude-Kosten',
      colHumanH:   `Teamstunden (×${HUMAN_MULTIPLIER})`,
      colTeamCost: `Teamkosten (${TEAM_SIZE} × ${HOURLY_RATE_EUR} €/Std.)`,
      total:       'Gesamt',
    },
    overviewNote: `Hinweis für die Geschäftsleitung: KI-Stunden = tatsächliche Arbeitszeit mit Claude. Der Faktor ×${HUMAN_MULTIPLIER} (optimistisches Szenario: 5 × 2,0 × 1,5 × 1,5 × 2,0) spiegelt erfahrene Teams wider, die sich unter Druck anpassen. Das Worst-Case-Szenario (×${HUMAN_MULTIPLIER_AI}) modelliert theoretische Reibungsmaxima. Stundensatz: ${HOURLY_RATE_EUR} €/Std. Infrastruktur, Testumgebungen und Projektmanagement sind nicht enthalten.`,
    timeline: {
      assumptionsTitle: 'Modellannahmen',
      scenarioNote: (opt, wc) => `Der Zeitplan basiert auf dem optimistischen Szenario (×${opt}). Im Worst-Case-Szenario (×${wc}) würde das Projekt erst ca. Februar 2032 fertig — rund 4,5 Jahre später. Dieser Unterschied zeigt, wie unterschiedlich dieselben Reibungsfaktoren bewertet werden können.`,
      assumptions: (avgPct, totalH) => [
        ['Projektstart',               '1. Januar 2026'],
        ['Teamgröße',                  `${TEAM_SIZE} Entwickler`],
        ['Effektive Verfügbarkeit',    `${Math.round(AVAILABILITY * 100)} % (Meetings, Urlaub, Krankheit, Leerlauf)`],
        ['Kapazität pro Quartal',      `${TEAM_H_PER_QTR.toLocaleString('de-DE')} Std. (${TEAM_SIZE} × 60 Tage × ${HOURS_PER_DAY} Std. × ${Math.round(AVAILABILITY*100)} %)`],
        ['Projektzuteilung',           '10 % (Tief) – 40 % (Hoch) der Kapazität'],
        ['Durchschnittliche Auslastung', `${avgPct} % über alle Quartale`],
        ['Benötigte Gesamtstunden',    `${totalH.toLocaleString('de-DE')} Std. (${devLogs.reduce((a,s)=>a+s.hours,0).toFixed(1)} Std. KI × ${HUMAN_MULTIPLIER})`],
      ],
      legendPeak:   'Hohe Auslastung (35–40 %)',
      legendDeep:   'Niedrige Auslastung (10–14 %)',
      legendMedium: 'Mittlere Auslastung (15–34 %)',
      legendFinish: 'Geschätztes Fertigstellungsdatum',
      finishTag:    pct => `~${pct} % abgeschl.`,
      conclusion: (avgPct) =>
        `Geschätztes Fertigstellungsdatum (optimistisches Szenario): ungefähr Juni 2027 — rund 1 Jahr und 6 Monate nach Projektbeginn am 1. Januar 2026. Das Modell geht von einem Team aus ${TEAM_SIZE} Personen mit ${Math.round(AVAILABILITY*100)} % effektiver Verfügbarkeit und durchschnittlich ${avgPct} % Projektzuteilung aus.`,
      disclaimer: 'Die Verteilung der Hoch- und Tiefphasen ist illustrativ. Die tatsächliche Auslastung hängt von konkurrierenden Releases, Budgetzyklen und Personalverfügbarkeit ab. Mit dem Worst-Case-Faktor (×187,5) würde dasselbe Modell eine Fertigstellung im Februar 2032 ergeben — ein Unterschied von 4,5 Jahren, der ausschließlich darauf zurückzuführen ist, wie die Reibungsfaktoren bewertet werden.',
    },
    chronicle: {
      filters:   ['Alle', 'Funktionsentwicklung', 'Fehlerbehebung', 'Dokumentation', 'QA & Tests'],
      aiHours:   h => `${h} Std. KI`,
      teamHours: h => `${h.toLocaleString('de-DE')} Std. Team`,
      teamCost:  c => `≈ €${c.toLocaleString('de-DE')}`,
    },
    export: {
      savePdf:       'Als PDF speichern',
      downloadHtml:  'HTML herunterladen',
      top15Title:    'Top 15 Features nach Zeitaufwand',
      top15Note:     (shown, total) => `${shown} von ${total} Sitzungen, sortiert nach KI-Entwicklungsstunden.`,
      rankCol:       '#',
      featureCol:    'Feature',
      categoryCol:   'Kategorie',
      aiHoursCol:    'KI-Stunden',
      teamHoursCol:  `Teamstunden (×${HUMAN_MULTIPLIER} opt.)`,
      teamCostCol:   'Teamkosten (optimistisch)',
      generatedOn:   'Erstellt am',
      wcLabel:       `Worst-Case-Szenario (×${HUMAN_MULTIPLIER_AI})`,
      optLabel:      `Optimistisches Szenario (×${HUMAN_MULTIPLIER})`,
      aiLabel:       'KI-Entwicklung',
      methodology:   'Methodik — Herleitung der Szenario-Faktoren',
      catBreakdown:  'Kosten nach Kategorie',
      timelineTitle: 'Geschätzte Zeitplanung',
      footerNote:    'Dieses Dokument wurde aus der PoC-Zusammenfassung für die Geschäftsleitung generiert. Alle Zahlen sind Schätzungen. Infrastruktur, Testumgebungen und Projektmanagement sind nicht enthalten.',
    },
  },
}

// ── Derived data ──────────────────────────────────────────────────────────────

function useMetrics(lang) {
  return useMemo(() => {
    const sessions = devLogs.map(s => {
      const meta = SESSION_TITLES[s.session] ?? { en: s.title, de: s.title }
      const cat  = SESSION_CATEGORIES[s.session] ?? 'dev'
      return {
        ...s,
        title:        meta[lang] ?? meta.en,
        category:     cat,
        humanHours:   Math.round(s.hours * HUMAN_MULTIPLIER),
        humanCostEur: Math.round(s.hours * HUMAN_MULTIPLIER * HOURLY_RATE_EUR),
      }
    })

    const totalAiHours       = +sessions.reduce((a, s) => a + s.hours,   0).toFixed(1)
    const totalCostUSD       = +sessions.reduce((a, s) => a + s.costUSD, 0).toFixed(2)
    const humanHours         = Math.round(totalAiHours * HUMAN_MULTIPLIER)
    const teamCostEur        = humanHours * HOURLY_RATE_EUR
    const humanHoursWorstCase = Math.round(totalAiHours * HUMAN_MULTIPLIER_AI)
    const teamCostWorstCase   = humanHoursWorstCase * HOURLY_RATE_EUR

    const starts  = sessions.map(s => new Date(s.start).getTime())
    const ends    = sessions.map(s => new Date(s.end).getTime())
    const calDays = Math.round((Math.max(...ends) - Math.min(...starts)) / 86_400_000) + 1

    const byCategory = {}
    for (const cat of Object.keys(CATEGORIES)) {
      const cs = sessions.filter(s => s.category === cat)
      byCategory[cat] = {
        hours:   +cs.reduce((a, s) => a + s.hours,   0).toFixed(1),
        costUSD: +cs.reduce((a, s) => a + s.costUSD, 0).toFixed(2),
        count:   cs.length,
      }
    }

    let cumul = 0, finishQuarter = null
    const timeline = TIMELINE_RAW.map(row => {
      if (finishQuarter) return { ...row, hoursOnProject: 0, cumulative: cumul, done: false, finish: false }
      const hoursOnProject = Math.round(TEAM_H_PER_QTR * row.pct / 100)
      const prevCumul = cumul
      cumul = Math.min(cumul + hoursOnProject, humanHours)
      const progressPct = +(cumul / humanHours * 100).toFixed(1)
      const finish = prevCumul < humanHours && cumul >= humanHours
      if (finish) finishQuarter = row.quarter
      return {
        ...row,
        hoursOnProject: finish ? humanHours - prevCumul : hoursOnProject,
        cumulative: cumul,
        progressPct,
        type: row.pct >= 35 ? 'peak' : row.pct <= 14 ? 'deep' : 'medium',
        finish,
        done: true,
      }
    })

    const avgPct = +(TIMELINE_RAW.reduce((a, r) => a + r.pct, 0) / TIMELINE_RAW.length).toFixed(1)

    return { sessions, totalAiHours, totalCostUSD, humanHours, teamCostEur, humanHoursWorstCase, teamCostWorstCase, calDays, byCategory, timeline, avgPct }
  }, [lang])
}

// ── Bold-marker renderer ──────────────────────────────────────────────────────

function BoldText({ text }) {
  return (
    <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.65 }}>
      {text.split('**').map((part, i) =>
        i % 2 === 1
          ? <strong key={i} style={{ color: '#d46b08' }}>{part}</strong>
          : part
      )}
    </Text>
  )
}

// ── MultiplierBreakdown ───────────────────────────────────────────────────────

function MultiplierBreakdown({ s }) {
  const [expanded, setExpanded] = useState(null)
  const ms  = s.multiplier
  const isDE = s === STRINGS.de

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <Title level={5} style={{ margin: 0 }}>{ms.title}</Title>
        <Tag color="geekblue" style={{ fontSize: 11 }}>{ms.tag}</Tag>
      </div>

      <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 12, background: '#fff7e6', border: '1px solid #ffd591' }}>
        <Text style={{ fontSize: 12 }}>
          <WarningOutlined style={{ color: '#fa8c16', marginRight: 6 }} />
          {ms.warning}
        </Text>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 90px 90px 120px',
        gap: '0 8px', padding: '6px 12px',
        background: '#fafafa', borderRadius: '8px 8px 0 0',
        borderBottom: '1px solid #f0f0f0', marginBottom: 2,
      }}>
        {[ms.colFactor, ms.colAIInit, ms.colAICorr, ms.colPerceived].map((h, i) => (
          <Text key={i} type="secondary" style={{ fontSize: 10, fontWeight: 600, textAlign: i > 0 ? 'center' : 'left' }}>
            {h}
          </Text>
        ))}
      </div>

      {MULTIPLIER_FACTORS_DATA.map((f, i) => {
        const fl = f[isDE ? 'de' : 'en']
        return (
          <div
            key={i}
            onClick={() => setExpanded(expanded === i ? null : i)}
            style={{
              display: 'grid', gridTemplateColumns: '1fr 90px 90px 120px',
              gap: '0 8px', padding: '8px 12px', marginBottom: 3,
              background: expanded === i ? '#f0f5ff' : (f.bold ? '#f5f5f5' : '#fafafa'),
              border: `1px solid ${expanded === i ? '#adc6ff' : '#f0f0f0'}`,
              borderLeft: `3px solid ${f.color}`,
              borderRadius: 6, cursor: 'pointer', transition: 'background 0.15s',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <Text style={{ fontSize: 13, fontWeight: f.bold ? 700 : 400 }}>{fl.label}</Text>
              {f.changed && !f.bold && (
                <Tag color="orange" style={{ fontSize: 10, marginLeft: 8, padding: '0 4px' }}>
                  {ms.tagCorrected}
                </Tag>
              )}
            </div>
            {/* AI initial — greyed, struck if changed */}
            <Text style={{
              fontSize: 12, fontFamily: 'monospace', textAlign: 'center',
              color: f.changed && !f.bold ? '#bfbfbf' : f.color,
              textDecoration: f.changed && !f.bold ? 'line-through' : 'none',
            }}>
              {f.factorAIInitial}
            </Text>
            {/* Worst case scenario — amber */}
            <Text style={{
              fontSize: 12, fontFamily: 'monospace', textAlign: 'center',
              color: f.changed && !f.bold ? '#d46b08' : f.color,
              fontWeight: f.bold ? 700 : 400,
            }}>
              {f.factorAICorrected}
            </Text>
            {/* Optimistic scenario — green/bold */}
            <Text style={{
              fontSize: 12, fontFamily: 'monospace', textAlign: 'center',
              color: f.changed ? '#389e0d' : f.color,
              fontWeight: 700,
            }}>
              {f.factorPerceived}
            </Text>

            {expanded === i && (
              <div style={{ gridColumn: '1 / -1', marginTop: 6 }}>
                <BoldText text={fl.explanation} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ label, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      marginBottom: 8, paddingBottom: 4,
      borderBottom: `2px solid ${color}22`,
    }}>
      <div style={{ width: 4, height: 16, borderRadius: 2, background: color, flexShrink: 0 }} />
      <Text style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color }}>
        {label}
      </Text>
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ icon, title, value, suffix, sub, color, warn }) {
  const c = warn ? '#fa8c16' : color
  return (
    <Card size="small" style={{ borderRadius: 12, borderTop: `3px solid ${c}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, background: c + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {React.cloneElement(icon, { style: { fontSize: 18, color: c } })}
        </div>
        <div style={{ minWidth: 0 }}>
          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{title}</Text>
          <div style={{ fontSize: 22, fontWeight: 700, color: warn ? '#d46b08' : color, lineHeight: 1.2 }}>
            {value}{suffix && <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 3 }}>{suffix}</span>}
          </div>
          {sub && <Text type="secondary" style={{ fontSize: 11 }}>{sub}</Text>}
        </div>
      </div>
    </Card>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ m, s }) {
  const catRows = Object.entries(CATEGORIES).map(([key, cfg]) => ({
    key, ...cfg,
    label: s.categories[key],
    ...(m.byCategory[key] ?? { hours: 0, costUSD: 0, count: 0 }),
  }))

  const t = s.table
  const columns = [
    { title: t.colCategory, dataIndex: 'label', render: (label, row) => <Tag color={row.tagColor}>{label}</Tag> },
    { title: t.colSessions, dataIndex: 'count', align: 'center' },
    { title: t.colAiHours,  dataIndex: 'hours',   align: 'right', render: v => `${v.toFixed(1)} h` },
    { title: t.colClaude,   dataIndex: 'costUSD', align: 'right', render: v => `$${v.toFixed(2)}` },
    { title: t.colHumanH,   key: 'humanH',  align: 'right',
      render: (_, row) => `${Math.round(row.hours * HUMAN_MULTIPLIER).toLocaleString('de-DE')} h` },
    { title: t.colTeamCost, key: 'teamCost', align: 'right',
      render: (_, row) => (
        <Text strong style={{ color: '#389e0d' }}>
          €{(Math.round(row.hours * HUMAN_MULTIPLIER) * HOURLY_RATE_EUR).toLocaleString('de-DE')}
        </Text>
      ),
    },
  ]

  return (
    <div>
      <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 20 }}>
        {s.overviewIntro(m.calDays)}
      </Paragraph>

      {/* ── Worst Case Scenario ─── */}
      <SectionLabel label={s.sections.worstCase} color="#cf1322" />
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={8}>
          <KpiCard icon={<TeamOutlined />}        color="#cf1322" title={s.kpi.wcHours.title}  value={m.humanHoursWorstCase.toLocaleString('de-DE')} suffix="h" sub={s.kpi.wcHours.sub} warn />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <KpiCard icon={<ThunderboltOutlined />} color="#cf1322" title={s.kpi.wcCost.title}   value={`€${m.teamCostWorstCase.toLocaleString('de-DE')}`}         sub={s.kpi.wcCost.sub} warn />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <KpiCard icon={<RocketOutlined />}      color="#cf1322" title={s.kpi.wcTime.title}   value={s.kpi.wcTime.value}                                         sub={s.kpi.wcTime.sub} warn />
        </Col>
      </Row>

      {/* ── Optimistic Scenario ─── */}
      <SectionLabel label={s.sections.optimistic} color="#389e0d" />
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={8}>
          <KpiCard icon={<TeamOutlined />}        color="#389e0d" title={s.kpi.humanHours.title} value={m.humanHours.toLocaleString('de-DE')} suffix="h" sub={s.kpi.humanHours.sub} />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <KpiCard icon={<ThunderboltOutlined />} color="#389e0d" title={s.kpi.teamCost.title}   value={`€${m.teamCostEur.toLocaleString('de-DE')}`}    sub={s.kpi.teamCost.sub} />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <KpiCard icon={<RocketOutlined />}      color="#389e0d" title={s.kpi.calTime.title}    value={s.kpi.calTime.value}                            sub={s.kpi.calTime.sub} />
        </Col>
      </Row>

      {/* ── AI Development ─── */}
      <SectionLabel label={s.sections.aiDev} color="#1677ff" />
      <Row gutter={[12, 12]} style={{ marginBottom: 28 }}>
        <Col xs={24} sm={12} md={8}>
          <KpiCard icon={<CalendarOutlined />}    color="#1677ff" title={s.kpi.calDays.title}    value={m.calDays}                       sub={s.kpi.calDays.sub} />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <KpiCard icon={<ClockCircleOutlined />} color="#531dab" title={s.kpi.aiHours.title}    value={m.totalAiHours} suffix="h"       sub={s.kpi.aiHours.sub(devLogs.length)} />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <KpiCard icon={<DollarOutlined />}      color="#d46b08" title={s.kpi.claudeCost.title} value={`$${m.totalCostUSD.toFixed(2)}`} sub={s.kpi.claudeCost.sub} />
        </Col>
      </Row>

      <MultiplierBreakdown s={s} />

      <Title level={5} style={{ marginBottom: 12 }}>{t.colCategory}</Title>
      <Table
        dataSource={catRows} columns={columns} pagination={false} size="small" rowKey="key"
        style={{ marginBottom: 16 }}
        summary={() => (
          <Table.Summary.Row style={{ background: '#fafafa' }}>
            <Table.Summary.Cell index={0}><Text strong>{t.total}</Text></Table.Summary.Cell>
            <Table.Summary.Cell index={1} align="center"><Text strong>{devLogs.length}</Text></Table.Summary.Cell>
            <Table.Summary.Cell index={2} align="right"><Text strong>{m.totalAiHours.toFixed(1)} h</Text></Table.Summary.Cell>
            <Table.Summary.Cell index={3} align="right"><Text strong>${m.totalCostUSD.toFixed(2)}</Text></Table.Summary.Cell>
            <Table.Summary.Cell index={4} align="right"><Text strong>{m.humanHours.toLocaleString('de-DE')} h</Text></Table.Summary.Cell>
            <Table.Summary.Cell index={5} align="right">
              <Text strong style={{ color: '#389e0d' }}>€{m.teamCostEur.toLocaleString('de-DE')}</Text>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />

      <div style={{ padding: '12px 16px', background: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f' }}>
        <Text style={{ fontSize: 12 }}>{s.overviewNote}</Text>
      </div>
    </div>
  )
}

// ── Timeline Tab ──────────────────────────────────────────────────────────────

const TYPE_STYLE = {
  peak:   { background: '#f0f5ff', border: '#adc6ff', dot: '#1677ff' },
  deep:   { background: '#fff1f0', border: '#ffa39e', dot: '#f5222d' },
  medium: { background: '#f6ffed', border: '#b7eb8f', dot: '#52c41a' },
}

function TimelineTab({ m, s, lang }) {
  const tl = s.timeline

  return (
    <div>
      <Alert
        type="info" showIcon style={{ marginBottom: 14 }}
        message={tl.scenarioNote(HUMAN_MULTIPLIER, HUMAN_MULTIPLIER_AI)}
      />

      <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 16, background: '#f0f5ff', border: '1px solid #adc6ff' }}>
        <Title level={5} style={{ margin: '0 0 8px' }}>{tl.assumptionsTitle}</Title>
        <Row gutter={[16, 4]}>
          {tl.assumptions(m.avgPct, m.humanHours).map(([k, v]) => (
            <Col xs={24} sm={12} key={k}>
              <Text type="secondary" style={{ fontSize: 12 }}>{k}: </Text>
              <Text style={{ fontSize: 12 }}><strong>{v}</strong></Text>
            </Col>
          ))}
        </Row>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { dot: '#1677ff', label: tl.legendPeak },
          { dot: '#f5222d', label: tl.legendDeep },
          { dot: '#52c41a', label: tl.legendMedium },
          { dot: '#c41d7f', label: tl.legendFinish, diamond: true },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 10, height: 10, borderRadius: item.diamond ? 2 : '50%',
              background: item.dot, transform: item.diamond ? 'rotate(45deg)' : 'none',
            }} />
            <Text style={{ fontSize: 12 }}>{item.label}</Text>
          </div>
        ))}
      </div>

      <div style={{ maxHeight: '44vh', overflowY: 'auto' }}>
        {m.timeline.filter(r => r.done).map((row, i) => {
          const ts = TYPE_STYLE[row.type] ?? TYPE_STYLE.medium
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '110px 130px 48px 1fr 90px 70px',
              gap: '0 10px', alignItems: 'center',
              padding: '6px 10px', marginBottom: 3, borderRadius: 8,
              background: row.finish ? '#fff0f6' : ts.background,
              border: `1px solid ${row.finish ? '#ffadd2' : ts.border}`,
              borderLeft: `3px solid ${row.finish ? '#c41d7f' : ts.dot}`,
            }}>
              <Text style={{ fontSize: 12, fontWeight: row.finish ? 700 : 400 }}>{row.quarter}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>{row.period[lang] ?? row.period.en}</Text>
              <Text style={{ fontSize: 12, color: ts.dot, fontWeight: 600, textAlign: 'right' }}>{row.pct}%</Text>
              <Progress percent={row.progressPct} size="small" showInfo={false}
                strokeColor={row.finish ? '#c41d7f' : ts.dot} style={{ margin: 0 }} />
              <Text style={{ fontSize: 11, textAlign: 'right' }}>{row.cumulative.toLocaleString('de-DE')} h</Text>
              {row.finish
                ? <Tag color="magenta" style={{ fontSize: 10, margin: 0, textAlign: 'center' }}>{tl.finishTag(row.progressPct)}</Tag>
                : <Text type="secondary" style={{ fontSize: 11, textAlign: 'right' }}>{row.progressPct}%</Text>
              }
            </div>
          )
        })}
      </div>

      <div style={{ padding: '12px 16px', borderRadius: 8, marginTop: 14, background: '#f6ffed', border: '1px solid #b7eb8f' }}>
        <Text style={{ fontSize: 13 }}>
          <strong style={{ color: '#389e0d' }}>{tl.conclusion(m.avgPct).split('—')[0].trim()}</strong>
          {' —'}
          {tl.conclusion(m.avgPct).split('—').slice(1).join('—')}
        </Text>
      </div>

      <div style={{ padding: '10px 14px', background: '#fffbe6', borderRadius: 8, marginTop: 8, border: '1px solid #ffe58f' }}>
        <Text type="secondary" style={{ fontSize: 11 }}>{tl.disclaimer}</Text>
      </div>
    </div>
  )
}

// ── Feature Chronicle Tab ─────────────────────────────────────────────────────

function ChronicleTab({ m, s }) {
  const [filterIdx, setFilterIdx] = useState(0)
  const catKeys  = ['all', 'dev', 'fix', 'doc', 'qa']
  const filters  = s.chronicle.filters
  const visible  = filterIdx === 0
    ? m.sessions
    : m.sessions.filter(sess => sess.category === catKeys[filterIdx])

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {filters.map((label, i) => {
          const active = filterIdx === i
          const cfg    = i === 0 ? null : CATEGORIES[catKeys[i]]
          return (
            <Tag
              key={i}
              color={active ? (cfg?.tagColor ?? 'default') : undefined}
              onClick={() => setFilterIdx(i)}
              style={{ cursor: 'pointer', fontWeight: active ? 600 : 400, opacity: active ? 1 : 0.65, userSelect: 'none' }}
            >
              {label}
              {i > 0 && (
                <span style={{ marginLeft: 4, opacity: 0.7 }}>
                  ({m.sessions.filter(sess => sess.category === catKeys[i]).length})
                </span>
              )}
            </Tag>
          )
        })}
      </div>
      <div style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: 4 }}>
        {visible.map(sess => {
          const cfg = CATEGORIES[sess.category] ?? CATEGORIES.dev
          return (
            <div key={sess.session} style={{
              padding: '10px 14px', borderRadius: 10, marginBottom: 7,
              background: '#fafafa', border: '1px solid #f0f0f0',
              borderLeft: `3px solid ${cfg.color}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                  background: cfg.color + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>S{sess.session}</Text>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 13 }}>{sess.title}</Text>
                    <Tag color={cfg.tagColor} style={{ fontSize: 11, margin: 0 }}>{s.categories[sess.category]}</Tag>
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <Tooltip title="AI-assisted hours">
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />{s.chronicle.aiHours(sess.hours)}
                      </Text>
                    </Tooltip>
                    <Tooltip title="Claude API cost">
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <DollarOutlined style={{ marginRight: 4 }} />${sess.costUSD.toFixed(2)}
                      </Text>
                    </Tooltip>
                    <Tooltip title={`×${HUMAN_MULTIPLIER}`}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <TeamOutlined style={{ marginRight: 4 }} />{s.chronicle.teamHours(sess.humanHours)}
                      </Text>
                    </Tooltip>
                    <Text style={{ fontSize: 12, color: '#389e0d' }}>
                      {s.chronicle.teamCost(sess.humanCostEur)}
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── HTML export generator ─────────────────────────────────────────────────────

function generateHtml(m, s, lang) {
  const ex     = s.export
  const isDE   = lang === 'de'
  const locale = isDE ? 'de-DE' : 'en-US'
  const top15  = [...m.sessions].sort((a, b) => b.hours - a.hours).slice(0, 15)

  const esc  = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const bold = text => text.split('**').map((p, i) =>
    i % 2 === 1 ? `<strong style="color:#d46b08">${esc(p)}</strong>` : esc(p)
  ).join('')

  const CAT_COLOR  = { dev: '#1677ff', fix: '#f5222d', doc: '#722ed1', qa: '#fa8c16' }
  const CAT_BG     = { dev: '#e6f4ff', fix: '#fff1f0', doc: '#f9f0ff', qa: '#fff7e6' }
  const TYPE_COLOR = { peak: '#1677ff', deep: '#f5222d', medium: '#52c41a' }
  const TYPE_BG    = { peak: '#f0f5ff', deep: '#fff1f0', medium: '#f6ffed' }
  const TYPE_BDR   = { peak: '#adc6ff', deep: '#ffa39e', medium: '#b7eb8f' }

  // ── helpers ─────────────────────────────────────────────────────────────────

  const sectionH = (label, color) =>
    `<div style="display:flex;align-items:center;gap:8px;margin:28px 0 8px;padding-bottom:4px;border-bottom:2px solid ${color}33">
      <div style="width:4px;height:16px;border-radius:2px;background:${color};flex-shrink:0"></div>
      <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:${color}">${esc(label)}</span>
    </div>`

  const kpiCard = (title, value, sub, color, warn = false) =>
    `<div style="flex:1;min-width:200px;border-radius:10px;border:1px solid #f0f0f0;border-top:3px solid ${warn ? '#fa8c16' : color};padding:14px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.06)">
      <div style="font-size:11px;color:#8c8c8c;margin-bottom:4px">${esc(title)}</div>
      <div style="font-size:22px;font-weight:700;color:${warn ? '#d46b08' : color};line-height:1.2">${esc(String(value))}</div>
      ${sub ? `<div style="font-size:11px;color:#8c8c8c;margin-top:2px">${esc(sub)}</div>` : ''}
    </div>`

  const kpiRow = cards =>
    `<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px">${cards}</div>`

  // ── KPI sections ─────────────────────────────────────────────────────────────

  const wcSection =
    sectionH(ex.wcLabel, '#cf1322') +
    kpiRow([
      kpiCard(s.kpi.wcHours.title, m.humanHoursWorstCase.toLocaleString(locale) + ' h', s.kpi.wcHours.sub, '#cf1322', true),
      kpiCard(s.kpi.wcCost.title,  '€' + m.teamCostWorstCase.toLocaleString(locale),    s.kpi.wcCost.sub,  '#cf1322', true),
      kpiCard(s.kpi.wcTime.title,  s.kpi.wcTime.value,                                  s.kpi.wcTime.sub,  '#cf1322', true),
    ].join(''))

  const optSection =
    sectionH(ex.optLabel, '#389e0d') +
    kpiRow([
      kpiCard(s.kpi.humanHours.title, m.humanHours.toLocaleString(locale) + ' h', s.kpi.humanHours.sub, '#389e0d'),
      kpiCard(s.kpi.teamCost.title,   '€' + m.teamCostEur.toLocaleString(locale), s.kpi.teamCost.sub,  '#389e0d'),
      kpiCard(s.kpi.calTime.title,    s.kpi.calTime.value,                         s.kpi.calTime.sub,   '#389e0d'),
    ].join(''))

  const aiSection =
    sectionH(ex.aiLabel, '#1677ff') +
    kpiRow([
      kpiCard(s.kpi.calDays.title,    String(m.calDays),                                 s.kpi.calDays.sub,                    '#1677ff'),
      kpiCard(s.kpi.aiHours.title,    m.totalAiHours + ' h',                             s.kpi.aiHours.sub(m.sessions.length), '#531dab'),
      kpiCard(s.kpi.claudeCost.title, '$' + m.totalCostUSD.toFixed(2),                   s.kpi.claudeCost.sub,                 '#d46b08'),
    ].join(''))

  // ── Multiplier breakdown (all rows pre-expanded) ──────────────────────────

  const ms = s.multiplier
  const mHeader =
    `<div style="display:grid;grid-template-columns:1fr 90px 120px 130px;gap:0 8px;padding:6px 12px;background:#fafafa;border-radius:8px 8px 0 0;border-bottom:1px solid #f0f0f0;margin-bottom:2px">
      ${[ms.colFactor, ms.colAIInit, ms.colAICorr, ms.colPerceived].map((h, i) =>
        `<span style="font-size:10px;font-weight:600;color:#8c8c8c;text-align:${i > 0 ? 'center' : 'left'}">${esc(h)}</span>`
      ).join('')}
    </div>`

  const mRows = MULTIPLIER_FACTORS_DATA.map(f => {
    const fl         = f[isDE ? 'de' : 'en']
    const initStyle  = f.changed && !f.bold ? 'color:#bfbfbf;text-decoration:line-through' : `color:${f.color}`
    const corrStyle  = f.changed && !f.bold ? 'color:#d46b08' : `color:${f.color}`
    const percStyle  = `color:${f.changed ? '#389e0d' : f.color};font-weight:700`
    return `<div style="margin-bottom:3px;border-radius:6px;border:1px solid #f0f0f0;border-left:3px solid ${f.color};background:${f.bold ? '#f5f5f5' : '#fafafa'}">
      <div style="display:grid;grid-template-columns:1fr 90px 120px 130px;gap:0 8px;padding:8px 12px">
        <span style="font-size:13px;font-weight:${f.bold ? 700 : 400}">${esc(fl.label)}</span>
        <span style="font-size:12px;font-family:monospace;text-align:center;${initStyle}">${esc(f.factorAIInitial)}</span>
        <span style="font-size:12px;font-family:monospace;text-align:center;${corrStyle};font-weight:${f.bold ? 700 : 400}">${esc(f.factorAICorrected)}</span>
        <span style="font-size:12px;font-family:monospace;text-align:center;${percStyle}">${esc(f.factorPerceived)}</span>
      </div>
      <div style="padding:0 12px 10px;font-size:12px;color:#595959;line-height:1.65">${bold(fl.explanation)}</div>
    </div>`
  }).join('')

  const methodologySection =
    `<h2 style="font-size:16px;font-weight:600;margin:32px 0 8px">${esc(ex.methodology)}</h2>
    <div style="padding:10px 14px;border-radius:8px;margin-bottom:12px;background:#fff7e6;border:1px solid #ffd591;font-size:12px">
      ⚠️ ${esc(ms.warning)}
    </div>
    ${mHeader}${mRows}`

  // ── Category breakdown ────────────────────────────────────────────────────

  const t = s.table
  const catData = Object.keys(CATEGORIES).map(cat => {
    const cs      = m.sessions.filter(sess => sess.category === cat)
    const hours   = +cs.reduce((a, sess) => a + sess.hours,   0).toFixed(1)
    const costUSD = +cs.reduce((a, sess) => a + sess.costUSD, 0).toFixed(2)
    const humanH  = Math.round(hours * HUMAN_MULTIPLIER)
    return { cat, label: s.categories[cat], hours, costUSD, count: cs.length, humanH, teamCost: humanH * HOURLY_RATE_EUR }
  })
  const catTotal = catData.reduce((acc, r) => ({
    count: acc.count + r.count, hours: +(acc.hours + r.hours).toFixed(1),
    costUSD: +(acc.costUSD + r.costUSD).toFixed(2),
    humanH: acc.humanH + r.humanH, teamCost: acc.teamCost + r.teamCost,
  }), { count: 0, hours: 0, costUSD: 0, humanH: 0, teamCost: 0 })

  const catRows = catData.map(r =>
    `<tr>
      <td style="padding:7px 10px"><span style="display:inline-block;padding:2px 8px;border-radius:4px;background:${CAT_BG[r.cat]};color:${CAT_COLOR[r.cat]};font-size:12px;font-weight:600">${esc(r.label)}</span></td>
      <td style="padding:7px 10px;text-align:center">${r.count}</td>
      <td style="padding:7px 10px;text-align:right">${r.hours.toFixed(1)} h</td>
      <td style="padding:7px 10px;text-align:right">$${r.costUSD.toFixed(2)}</td>
      <td style="padding:7px 10px;text-align:right">${r.humanH.toLocaleString(locale)} h</td>
      <td style="padding:7px 10px;text-align:right;color:#389e0d;font-weight:600">€${r.teamCost.toLocaleString(locale)}</td>
    </tr>`
  ).join('')

  const catSection =
    `<h2 style="font-size:16px;font-weight:600;margin:32px 0 8px">${esc(ex.catBreakdown)}</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="background:#fafafa;border-bottom:2px solid #f0f0f0">
        <th style="padding:8px 10px;text-align:left;font-weight:600;color:#595959">${esc(t.colCategory)}</th>
        <th style="padding:8px 10px;text-align:center;font-weight:600;color:#595959">${esc(t.colSessions)}</th>
        <th style="padding:8px 10px;text-align:right;font-weight:600;color:#595959">${esc(t.colAiHours)}</th>
        <th style="padding:8px 10px;text-align:right;font-weight:600;color:#595959">${esc(t.colClaude)}</th>
        <th style="padding:8px 10px;text-align:right;font-weight:600;color:#595959">${esc(t.colHumanH)}</th>
        <th style="padding:8px 10px;text-align:right;font-weight:600;color:#595959">${esc(t.colTeamCost)}</th>
      </tr></thead>
      <tbody>${catRows}</tbody>
      <tfoot><tr style="background:#fafafa;border-top:2px solid #f0f0f0;font-weight:700">
        <td style="padding:8px 10px">${esc(t.total)}</td>
        <td style="padding:8px 10px;text-align:center">${catTotal.count}</td>
        <td style="padding:8px 10px;text-align:right">${catTotal.hours.toFixed(1)} h</td>
        <td style="padding:8px 10px;text-align:right">$${catTotal.costUSD.toFixed(2)}</td>
        <td style="padding:8px 10px;text-align:right">${catTotal.humanH.toLocaleString(locale)} h</td>
        <td style="padding:8px 10px;text-align:right;color:#389e0d;font-weight:700">€${catTotal.teamCost.toLocaleString(locale)}</td>
      </tr></tfoot>
    </table>
    <div style="margin-top:10px;padding:12px 16px;background:#fffbe6;border-radius:8px;border:1px solid #ffe58f;font-size:12px">${esc(s.overviewNote)}</div>`

  // ── Timeline ──────────────────────────────────────────────────────────────

  const tl = s.timeline
  const tlRows = m.timeline.filter(r => r.done).map(row => {
    const tc  = row.finish ? '#c41d7f' : (TYPE_COLOR[row.type] ?? '#52c41a')
    const tb  = row.finish ? '#fff0f6' : (TYPE_BG[row.type] ?? '#f6ffed')
    const tbd = row.finish ? '#ffadd2' : (TYPE_BDR[row.type] ?? '#b7eb8f')
    return `<div style="display:grid;grid-template-columns:110px 130px 48px 1fr 90px 70px;gap:0 10px;align-items:center;padding:6px 10px;margin-bottom:3px;border-radius:8px;background:${tb};border:1px solid ${tbd};border-left:3px solid ${tc}">
      <span style="font-size:12px;font-weight:${row.finish ? 700 : 400}">${esc(row.quarter)}</span>
      <span style="font-size:11px;color:#8c8c8c">${esc(row.period[lang] ?? row.period.en)}</span>
      <span style="font-size:12px;color:${tc};font-weight:600;text-align:right">${row.pct}%</span>
      <div style="background:#f0f0f0;border-radius:4px;height:8px"><div style="background:${tc};border-radius:4px;height:8px;width:${row.progressPct}%"></div></div>
      <span style="font-size:11px;text-align:right">${row.cumulative.toLocaleString(locale)} h</span>
      <span style="font-size:11px;text-align:right;color:${row.finish ? '#c41d7f' : '#8c8c8c'};font-weight:${row.finish ? 700 : 400}">${row.progressPct}%${row.finish ? ' ✓' : ''}</span>
    </div>`
  }).join('')

  const tlAssumptions = tl.assumptions(m.avgPct, m.humanHours)
    .map(([k, v]) => `<div style="font-size:12px;margin-bottom:4px"><span style="color:#8c8c8c">${esc(k)}: </span><strong>${esc(v)}</strong></div>`)
    .join('')

  const timelineSection =
    `<h2 style="font-size:16px;font-weight:600;margin:32px 0 8px">${esc(ex.timelineTitle)}</h2>
    <div style="padding:10px 14px;border-radius:8px;margin-bottom:10px;background:#e6f4ff;border:1px solid #91caff;font-size:12px">ℹ️ ${esc(tl.scenarioNote(HUMAN_MULTIPLIER, HUMAN_MULTIPLIER_AI))}</div>
    <div style="padding:12px 16px;border-radius:8px;margin-bottom:14px;background:#f0f5ff;border:1px solid #adc6ff">
      <h3 style="font-size:14px;font-weight:600;margin:0 0 8px">${esc(tl.assumptionsTitle)}</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px">${tlAssumptions}</div>
    </div>
    ${tlRows}
    <div style="padding:12px 16px;border-radius:8px;margin-top:14px;background:#f6ffed;border:1px solid #b7eb8f;font-size:13px">${esc(tl.conclusion(m.avgPct))}</div>
    <div style="padding:10px 14px;background:#fffbe6;border-radius:8px;margin-top:8px;border:1px solid #ffe58f;font-size:11px;color:#595959">${esc(tl.disclaimer)}</div>`

  // ── Top 15 features ───────────────────────────────────────────────────────

  const featureRows = top15.map((sess, i) => {
    const cat = sess.category
    return `<tr style="background:${i % 2 === 1 ? '#fafafa' : '#fff'}">
      <td style="padding:7px 10px;text-align:center;font-weight:600;color:#8c8c8c">${i + 1}</td>
      <td style="padding:7px 10px;font-weight:500">${esc(sess.title)}</td>
      <td style="padding:7px 10px"><span style="display:inline-block;padding:2px 8px;border-radius:4px;background:${CAT_BG[cat]};color:${CAT_COLOR[cat]};font-size:12px">${esc(s.categories[cat])}</span></td>
      <td style="padding:7px 10px;text-align:right">${sess.hours.toFixed(1)} h</td>
      <td style="padding:7px 10px;text-align:right">${sess.humanHours.toLocaleString(locale)} h</td>
      <td style="padding:7px 10px;text-align:right;color:#389e0d;font-weight:600">€${sess.humanCostEur.toLocaleString(locale)}</td>
    </tr>`
  }).join('')

  const featuresSection =
    `<h2 style="font-size:16px;font-weight:600;margin:32px 0 4px">${esc(ex.top15Title)}</h2>
    <p style="font-size:12px;color:#8c8c8c;margin:0 0 10px">${esc(ex.top15Note(top15.length, m.sessions.length))}</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="background:#fafafa;border-bottom:2px solid #f0f0f0">
        <th style="padding:8px 10px;text-align:center;font-weight:600;color:#595959;width:36px">${esc(ex.rankCol)}</th>
        <th style="padding:8px 10px;text-align:left;font-weight:600;color:#595959">${esc(ex.featureCol)}</th>
        <th style="padding:8px 10px;text-align:left;font-weight:600;color:#595959">${esc(ex.categoryCol)}</th>
        <th style="padding:8px 10px;text-align:right;font-weight:600;color:#595959">${esc(ex.aiHoursCol)}</th>
        <th style="padding:8px 10px;text-align:right;font-weight:600;color:#595959">${esc(ex.teamHoursCol)}</th>
        <th style="padding:8px 10px;text-align:right;font-weight:600;color:#595959">${esc(ex.teamCostCol)}</th>
      </tr></thead>
      <tbody>${featureRows}</tbody>
    </table>`

  // ── Assemble full document ────────────────────────────────────────────────

  const now = new Date().toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(s.modalTitle)}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; color: #262626; background: #fff; margin: 0 auto; padding: 32px 40px; max-width: 960px; }
  table { border-collapse: collapse; width: 100%; }
  h1, h2, h3 { margin-top: 0; }
  @media print {
    body { padding: 16px 24px; }
    h2 { page-break-before: auto; break-inside: avoid; }
    div { break-inside: avoid; }
    @page { margin: 18mm 14mm; }
  }
</style>
</head>
<body>
<div style="border-bottom:3px solid #1677ff;padding-bottom:16px;margin-bottom:24px">
  <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px">
    <span style="font-size:11px;font-weight:700;padding:2px 10px;border-radius:4px;background:#e6f4ff;color:#1677ff">${esc(s.tagExecutive)}</span>
    <span style="font-size:11px;padding:2px 10px;border-radius:4px;background:#f0f0f0;color:#595959">2026-03-09</span>
  </div>
  <h1 style="font-size:22px;font-weight:700;margin:0 0 8px">${esc(s.modalTitle)}</h1>
  <p style="font-size:13px;color:#595959;margin:0">${esc(s.overviewIntro(m.calDays))}</p>
</div>

${wcSection}
${optSection}
${aiSection}
${methodologySection}
${catSection}
${timelineSection}
${featuresSection}

<div style="margin-top:40px;padding-top:16px;border-top:1px solid #f0f0f0;font-size:11px;color:#8c8c8c">
  ${esc(ex.generatedOn)}: ${now} &nbsp;|&nbsp; ${esc(ex.footerNote)}
</div>
</body>
</html>`
}

// ── Export action bar ─────────────────────────────────────────────────────────

function ExportBar({ m, s, lang }) {
  const ex = s.export

  const handlePdf = () => {
    const html = generateHtml(m, s, lang)
    const win  = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 800)
  }

  const handleHtml = () => {
    const html = generateHtml(m, s, lang)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `poc-summary-${lang}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8,
      padding: '6px 0 10px', borderBottom: '1px solid #f0f0f0', marginBottom: 4,
    }}>
      <Button size="small" icon={<PrinterOutlined />} onClick={handlePdf}>
        {ex.savePdf}
      </Button>
      <Button size="small" icon={<DownloadOutlined />} onClick={handleHtml} type="primary">
        {ex.downloadHtml}
      </Button>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function PocSummaryModal({ open, onClose, lang = 'en' }) {
  const s = STRINGS[lang] ?? STRINGS.en
  const m = useMetrics(lang)

  const tabItems = [
    { key: 'overview',  label: s.tabs.overview,                      children: <OverviewTab  m={m} s={s} /> },
    { key: 'timeline',  label: s.tabs.timeline,                      children: <TimelineTab  m={m} s={s} lang={lang} /> },
    { key: 'chronicle', label: s.tabs.chronicle(m.sessions.length),  children: <ChronicleTab m={m} s={s} /> },
  ]

  return (
    <Modal
      open={open} onCancel={onClose} onOk={onClose}
      title={
        <Space wrap>
          <RocketOutlined style={{ color: '#1677ff' }} />
          <span>{s.modalTitle}</span>
          <Tag color="blue"    style={{ fontSize: 11, fontWeight: 600 }}>{s.tagExecutive}</Tag>
          <Tag color="geekblue" style={{ fontSize: 11 }}>{s.tagCorrected}</Tag>
          <Tag style={{ fontSize: 11 }}>2026-03-09</Tag>
        </Space>
      }
      width={960}
      styles={{ body: { padding: '0 24px 16px', maxHeight: '80vh', overflowY: 'auto' } }}
    >
      <ExportBar m={m} s={s} lang={lang} />
      <Tabs defaultActiveKey="overview" items={tabItems} style={{ marginTop: 4 }} />
    </Modal>
  )
}

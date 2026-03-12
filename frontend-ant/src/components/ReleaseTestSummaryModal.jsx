import React from 'react'
import { Modal, Typography, Tag, Divider, Alert } from 'antd'
import {
  CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, CustomerServiceOutlined,
} from '@ant-design/icons'

const { Text, Title, Paragraph } = Typography

// ── Shared primitives ─────────────────────────────────────────────────────────

const Item = ({ label, tested, caveat }) => (
  <div style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
    <span style={{ marginTop: 1, flexShrink: 0 }}>
      {tested === true  && <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 14 }} />}
      {tested === false && <CloseCircleOutlined style={{ color: '#bfbfbf', fontSize: 14 }} />}
      {tested === 'warn' && <WarningOutlined    style={{ color: '#fa8c16', fontSize: 14 }} />}
    </span>
    <div>
      <Text style={{ fontSize: 13 }}>{label}</Text>
      {caveat && (
        <div style={{ marginTop: 2 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>{caveat}</Text>
        </div>
      )}
    </div>
  </div>
)

const Section = ({ title, items }) => (
  <div style={{ marginBottom: 20 }}>
    <Title level={5} style={{ marginBottom: 10 }}>{title}</Title>
    {items.map((item, i) => <Item key={i} {...item} />)}
  </div>
)

// ── Per-role content ──────────────────────────────────────────────────────────

const CONTENT = {
  INVITER: {
    color:  '#1677ff',
    tagColor: 'blue',
    intro: 'The Inviter page lets staff create visit invitations for external visitors, track the security review, and respond to security clarification questions.',
    sections: [
      {
        title: 'Normal workflow',
        items: [
          { label: 'Logging in and seeing your pending tasks',                                       tested: true },
          { label: 'Opening the "New Invitation" form',                                              tested: true },
          { label: 'Searching for an existing visitor by name',                                     tested: true },
          { label: 'Selecting dates and an entrance, then submitting the invitation',                tested: true },
          { label: 'New tasks appearing automatically without refreshing the page',                 tested: true },
          { label: 'Completing the invitation form task once Security starts the review',           tested: true },
          { label: 'Viewing past invitations in the History page',                                  tested: true },
        ],
      },
      {
        title: 'Error and edge-case handling',
        items: [
          { label: 'Submitting with required fields empty — form blocked, nothing sent',            tested: true },
          { label: 'Trying to add a blacklisted visitor — visitor cannot be selected',             tested: true },
          { label: 'Setting the end date before the start date — blocked with an error',           tested: true },
          { label: 'Network failure during submission — error message shown, form preserved',      tested: true },
          { label: 'Session timeout after 9 hours — automatic logout, no data lost',               tested: true },
          { label: 'Two open browser tabs stay synchronised via live updates',                     tested: true },
          { label: 'Security asks for clarification 5 times — invitation auto-refused on the 5th', tested: true },
          { label: 'Supervisor answering a clarification question without taking over the invitation', tested: true },
        ],
      },
      {
        title: 'Licence & access control',
        items: [
          { label: 'Login page shows a green PoC-mode banner when no licence file is loaded',        tested: true },
          { label: 'Login page shows a blue licence box (issuer, date, feature tags) when a licence is loaded', tested: true },
          { label: 'Inviter role pill hidden in quick-fill when the Inviter licence feature is off', tested: true },
          { label: 'FeatureNotLicensed page shown when navigating to /inviter with Inviter feature disabled', tested: true },
          { label: 'Automatic logout when admin disables the Inviter feature while an inviter is logged in', tested: true },
        ],
      },
      {
        title: 'Accessibility & keyboard navigation',
        items: [
          { label: 'New Invitation form fully operable by keyboard (Tab through fields, Enter to submit, Escape to close)', tested: true },
          { label: 'Skip-to-content link appears on first Tab keypress and focuses the main content area', tested: true },
          { label: 'Session timeout warning modal operable by keyboard — "Extend session" and "Log out" buttons reachable via Tab', tested: true },
          { label: 'Greeting overlay dismissable with Escape, Enter, or Space keys', tested: true },
          { label: 'Clarification answer textarea has visible aria-label; radio group for decisions is keyboard-navigable', tested: true },
        ],
      },
    ],
    gaps: [
      'The server-side invitation creation logic and blacklist enforcement have no automated developer tests — manual testing is the only verification gate for this workflow.',
      'The BPMN process that drives the approval lifecycle is not covered by automated tests.',
      'Licence enforcement is client-side only — a user who bypasses the browser can still call the API directly.',
    ],
  },

  SECURITY: {
    color:  '#d46b08',
    tagColor: 'orange',
    intro: 'The Security page is where officers review visitor requests one by one, approve or refuse access, ask the inviter for more information, and manage the visitor blacklist.',
    sections: [
      {
        title: 'Normal workflow',
        items: [
          { label: 'Logging in and seeing pending checks in "My Checks"',                            tested: true },
          { label: 'Opening a check and seeing visitor details, company, and invitation info',       tested: true },
          { label: 'Confirming identity and setting a reliability score',                           tested: true },
          { label: 'Approving a visitor',                                                           tested: true },
          { label: 'Viewing other officers\' checks (read-only)',                                   tested: true },
          { label: 'Asking the inviter for clarification',                                          tested: true },
          { label: 'Viewing the blacklist',                                                         tested: true },
        ],
      },
      {
        title: 'Error and edge-case handling',
        items: [
          { label: 'Deciding without ticking "Identity Confirmed" — blocked',                       tested: true },
          { label: 'Refusing without a written note — blocked',                                    tested: true },
          { label: 'Blacklisting without a written note — blocked',                                tested: true },
          { label: 'Asking for clarification without entering a question — blocked',               tested: true },
          { label: '5 rounds of clarification reached — visitor auto-refused',                     tested: true },
          { label: 'Two officers try to decide the same check at the same moment — conflict shown', tested: true },
          { label: 'Session timeout — automatic logout, no partial decision saved',                tested: true },
          { label: 'Supervisor taking over a check assigned to another officer',                   tested: true },
        ],
      },
      {
        title: 'Licence & access control',
        items: [
          { label: 'Login page licence status box correct for both PoC mode and loaded licence',    tested: true },
          { label: 'Security role pill hidden in quick-fill when Security licence feature is off',  tested: true },
          { label: 'FeatureNotLicensed page shown when /security is accessed with Security disabled', tested: true },
          { label: 'Automatic logout when admin disables the Security feature mid-session',         tested: true },
        ],
      },
      {
        title: 'Accessibility & keyboard navigation',
        items: [
          { label: 'Security review form operable by keyboard — Tab through decision radios, notes textarea, Identity Confirmed checkbox, and submit button', tested: true },
          { label: 'Skip-to-content link visible on first Tab press; navigates focus to the main task list', tested: true },
          { label: 'Session timeout warning modal reachable and operable by keyboard', tested: true },
          { label: 'Greeting overlay dismissable with Escape key after login', tested: true },
          { label: 'Clarification question textarea and answer fields have aria-labels readable by screen reader', tested: true },
        ],
      },
    ],
    gaps: [
      'The SecurityCheck controller (8 API operations) and its database layer (15 methods) have zero automated developer tests — manual testing is the only verification gate.',
      'Specific untested server branches include the concurrent-claim conflict guard and the automatic clarification-count increment. See QA Notes for the full list.',
      'Licence enforcement is client-side only — a user who bypasses the browser can still call the API directly.',
    ],
  },

  GATEKEEPER: {
    color:  '#531dab',
    tagColor: 'purple',
    intro: 'The Gatekeeper page is used at the entrance to check visitors in on arrival. It shows a calendar view of expected visits, grouped by month and week, and loads data on demand.',
    sections: [
      {
        title: 'Normal workflow',
        items: [
          { label: 'Logging in and seeing assigned entrances and the visit calendar',                tested: true },
          { label: 'The closest month and week opening automatically on page load',                 tested: true },
          { label: 'Expanding a different week loading its visits without re-fetching cached weeks', tested: true },
          { label: 'Checking in a visitor with a confirmation step',                               tested: true },
          { label: 'The calendar refreshing automatically every 60 seconds',                       tested: true },
          { label: 'Viewing performance stats',                                                    tested: true },
        ],
      },
      {
        title: 'Error and edge-case handling',
        items: [
          { label: 'Checking in a visitor scheduled for a past date — warning shown, still allowed', tested: true },
          { label: 'Checking in a visitor scheduled for a future date — warning shown, still allowed', tested: true },
          { label: 'Trying to check in an already checked-in visitor — blocked (no button shown)',  tested: true },
          { label: 'No entrances assigned to the gatekeeper — clear empty state shown',            tested: true },
          { label: 'No visits for the selected week — empty table shown, no crash',               tested: true },
          { label: 'Network failure during check-in — error shown, modal stays open for retry',   tested: true },
          { label: 'Supervisor checking in a visit on behalf of a supervised gatekeeper',         tested: true },
          { label: 'Rapid expand/collapse of a week — only one data request sent',               tested: true },
        ],
      },
      {
        title: 'Licence & access control',
        items: [
          { label: 'Login page licence status box shows correct state (PoC mode or loaded licence)', tested: true },
          { label: 'Gatekeeper role pill hidden in quick-fill when Gatekeeper licence feature is off', tested: true },
          { label: 'FeatureNotLicensed page shown when /gatekeeper is accessed with feature disabled', tested: true },
          { label: 'Automatic logout when admin disables the Gatekeeper feature mid-session',        tested: true },
          { label: 'My Performance page blocked when Gamification feature is disabled',             tested: true },
          { label: 'Login greeting overlay suppressed when Gamification feature is disabled',       tested: true },
        ],
      },
      {
        title: 'Accessibility & keyboard navigation',
        items: [
          { label: 'Check-in confirmation modal operable by keyboard — Confirm and Cancel buttons reachable via Tab, activatable with Enter/Space', tested: true },
          { label: 'Auto-refresh pause/resume button toggled by keyboard; aria-pressed reflects paused state', tested: true },
          { label: 'Skip-to-content link appears on first Tab press and focuses the calendar content area', tested: true },
          { label: 'Session timeout warning modal reachable and dismissable by keyboard', tested: true },
          { label: 'All visit data tables carry aria-labels; column headers announce correctly to screen readers', tested: true },
        ],
      },
    ],
    gaps: [
      'The check-in endpoint and date-index query have no automated developer tests — manual testing is the only verification gate for this workflow.',
      'Licence enforcement is client-side only — a user who bypasses the browser can still call the API directly.',
    ],
  },

  ADMIN: {
    color:  '#389e0d',
    tagColor: 'green',
    intro: 'The Admin page manages users and groups in the system. Admins can create, edit, and delete user accounts, assign users to roles (Invitor, Security, Gatekeeper), and view active and completed visits.',
    sections: [
      {
        title: 'Normal workflow',
        items: [
          { label: 'Logging in and seeing the overview (active processes, check-ins, users)',       tested: true },
          { label: 'Viewing all users with their group memberships and task counts',               tested: true },
          { label: 'Creating a new user account',                                                  tested: true },
          { label: 'Assigning a user to one or more groups',                                      tested: true },
          { label: 'Viewing all groups and their members',                                         tested: true },
          { label: 'Adding or removing members from a group',                                     tested: true },
          { label: 'Deleting a user',                                                             tested: true },
          { label: 'Stats and task counts refreshing automatically every 15 seconds',             tested: true },
        ],
      },
      {
        title: 'Error and edge-case handling',
        items: [
          { label: 'Creating a user with a username that already exists — error shown',            tested: true },
          { label: 'Submitting the create-user form with required fields empty — blocked',         tested: true },
          { label: 'Creating a group with an ID that already exists — error shown',               tested: true },
          { label: 'Deleting the last admin account — currently no guard',                        tested: 'warn',
            caveat: 'The system does not currently prevent deleting the last admin. This was flagged during testing but no fix is in place yet.' },
          { label: 'Group membership changes reflected immediately after saving',                  tested: true },
          { label: 'Session timeout — automatic logout, no partial changes saved',                tested: true },
          { label: 'History tab showing completed visits with correct outcome (checked in / refused)', tested: true },
        ],
      },
      {
        title: 'Licence Management',
        items: [
          { label: 'Generating a .lic file with selected features — file downloads correctly',       tested: true },
          { label: 'Uploading a valid .lic file shows issuer, date, and correct feature tags',       tested: true },
          { label: 'Uploading a file with wrong format — error shown, no state change',             tested: true },
          { label: 'Uploading a corrupted .lic file — decryption error shown, retry available',     tested: true },
          { label: 'Unlicensed feature toggle is greyed out with vendor tooltip',                   tested: true },
          { label: 'Licensed feature can be toggled off — nav item and API calls deactivated',      tested: true },
          { label: 'Remove licence returns to PoC mode — all features available',                   tested: true },
          { label: '"Load a different licence" replaces the active licence correctly',               tested: true },
          { label: 'Role auto-logged out when their feature is disabled mid-session',               tested: true },
          { label: 'Login page shows correct licence status box (PoC mode or loaded)',              tested: true },
          { label: 'Login quick-fill hides roles for disabled features',                            tested: true },
          { label: 'No network requests made during generate or verify (all client-side crypto)',   tested: true },
          { label: 'Server-side enforcement of licence features',                                   tested: false },
        ],
      },
      {
        title: 'Accessibility & keyboard navigation',
        items: [
          { label: 'Manage Groups and Manage Members checkboxes toggled with Space key (onChange wired to Ant Design Checkbox)', tested: true },
          { label: 'SupervisorAssignmentPage icicle chart drilldown nodes focusable via Tab and activatable with Enter/Space', tested: true },
          { label: 'SupervisorAssignmentPage tangled-tree supervisor filter nodes keyboard-accessible; aria-pressed reflects filter state', tested: true },
          { label: 'Skip-to-content link visible on first Tab press; targets main content area', tested: true },
          { label: 'Session timeout warning modal reachable and operable by keyboard for admin session', tested: true },
          { label: 'All admin tables (users, groups, supervisor assignments) carry aria-labels', tested: true },
        ],
      },
    ],
    gaps: [
      'There are 2 automated developer tests that are currently broken and will fail if the test suite is run: one asserts the wrong number of allowed origins, the other checks for an annotation that was removed. These are known issues and do not affect production behaviour.',
      'The diff-save membership logic (which calculates which group changes to send) has no integration tests — manual testing verified it works correctly.',
      'Licence enforcement is client-side only — a determined user who calls the API directly bypasses all feature gates. This is a PoC limitation and is documented.',
    ],
  },
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function ReleaseTestSummaryModal({ open, onClose, role }) {
  const content = CONTENT[role] ?? CONTENT.INVITER
  const roleName = role
    ? role.charAt(0) + role.slice(1).toLowerCase()
    : 'Inviter'

  return (
    <Modal
      open={open} onCancel={onClose} onOk={onClose}
      title={
        <span>
          <CustomerServiceOutlined style={{ marginRight: 8, color: content.color }} />
          What Was Tested — {roleName} Page
          <Tag color={content.tagColor} style={{ marginLeft: 10, fontSize: 11, fontWeight: 600 }}>Support Summary</Tag>
          <Tag style={{ marginLeft: 4, fontSize: 11 }}>2026-03-10</Tag>
        </span>
      }
      width={760}
      styles={{ body: { maxHeight: '78vh', overflowY: 'auto', padding: '0 24px 16px' } }}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 20, marginTop: 12 }}
        message="How to use this page"
        description={
          <Text style={{ fontSize: 12 }}>
            This summary lists what was explicitly tested before the current release.
            Use it to quickly check whether a feature or scenario a customer reports was
            part of pre-release testing.{' '}
            <strong>Green</strong> = tested and passed.{' '}
            <strong>Orange</strong> = tested but with a known limitation.{' '}
            <strong>Grey</strong> = not tested (see Known Gaps below).
            For the full step-by-step test procedures, open <em>QA Notes: How to test this page</em>.
          </Text>
        }
      />

      <Paragraph style={{ fontSize: 13, marginBottom: 20 }}>
        {content.intro}
      </Paragraph>

      {content.sections.map((s, i) => <Section key={i} title={s.title} items={s.items} />)}

      <Divider />

      <Title level={5} style={{ color: '#8c8c8c' }}>Known test gaps</Title>
      {content.gaps.map((g, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <CloseCircleOutlined style={{ color: '#bfbfbf', fontSize: 14, marginTop: 2, flexShrink: 0 }} />
          <Text type="secondary" style={{ fontSize: 13 }}>{g}</Text>
        </div>
      ))}

      <div style={{ marginTop: 20, padding: '10px 14px', background: '#f5f5f5', borderRadius: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          <strong>Note for support:</strong> If a customer reports a bug that matches a scenario marked as tested (green),
          it should be classified as a regression and escalated to the development team immediately.
          Bugs in untested areas (grey) are known coverage gaps and should be logged as new defects without escalation urgency.
        </Text>
      </div>
    </Modal>
  )
}

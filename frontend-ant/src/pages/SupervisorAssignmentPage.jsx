import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Typography, Table, Button, Space, Modal, Select, Alert, Popconfirm, Tag, Tabs,
  Checkbox, Divider, Collapse, Segmented,
} from 'antd'
import {
  TeamOutlined, PlusCircleOutlined, DeleteOutlined, ReloadOutlined,
  SafetyCertificateOutlined, BankOutlined, UserOutlined, ApartmentOutlined,
  TableOutlined, ShareAltOutlined,
} from '@ant-design/icons'
import { hierarchy, tree, partition } from 'd3-hierarchy'
import { linkHorizontal } from 'd3-shape'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import {
  getSupervisorAssignments, setSupervisorAssignment,
  removeSupervisorAssignment, getSupervisableInviters,
  getSecuritySupervisorAssignments, setSecuritySupervisorAssignment,
  removeSecuritySupervisorAssignment, getSecurityOfficers,
  getGatekeeperSupervisorAssignments, setGatekeeperSupervisorAssignment,
  removeGatekeeperSupervisorAssignment, getGatekeeperOfficers,
} from '../api/operatonApi'

const { Title, Text } = Typography

// ── Tidy tree visualization ───────────────────────────────────────────────────

const NODE_SIZE_Y = 44   // vertical gap between siblings
const LEVEL_WIDTH = 210  // horizontal distance between levels
const PAD = { top: 16, bottom: 16, left: 130, right: 140 }

function buildHierarchy(assignments, subjectKey, supervisorKey) {
  if (!assignments.length) return null
  const supMap = {}
  assignments.forEach(a => {
    const sup = a[supervisorKey]
    if (!supMap[sup]) supMap[sup] = []
    supMap[sup].push(a[subjectKey])
  })
  return {
    id: '__root__',
    children: Object.entries(supMap).map(([sup, subs]) => ({
      id: sup,
      role: 'supervisor',
      children: subs.map(s => ({ id: s, role: 'supervisee' })),
    })),
  }
}

function TidyTree({ assignments, subjectKey, supervisorKey, supervisorColor, subjectColor }) {
  const data = useMemo(
    () => buildHierarchy(assignments, subjectKey, supervisorKey),
    [assignments, subjectKey, supervisorKey],
  )

  const { nodes, links, svgW, svgH, tx, ty } = useMemo(() => {
    if (!data) return {}
    const root = hierarchy(data)
    tree().nodeSize([NODE_SIZE_Y, LEVEL_WIDTH])(root)

    const visible = root.descendants().filter(d => d.data.id !== '__root__')
    const visLinks = root.links().filter(l => l.source.data.id !== '__root__')

    const xs = visible.map(n => n.x)
    const ys = visible.map(n => n.y)
    const minX = Math.min(...xs), maxX = Math.max(...xs)
    const minY = Math.min(...ys), maxY = Math.max(...ys)

    return {
      nodes:  visible,
      links:  visLinks,
      svgW:   (maxY - minY) + PAD.left + PAD.right,
      svgH:   (maxX - minX) + PAD.top  + PAD.bottom,
      tx:     -minY + PAD.left,
      ty:     -minX + PAD.top,
    }
  }, [data])

  if (!data) return (
    <div style={{ padding: 32, textAlign: 'center', color: '#8c8c8c' }}>
      No assignments to display.
    </div>
  )

  const linkPath = linkHorizontal().x(d => d.y).y(d => d.x)

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={svgW} height={svgH} style={{ display: 'block' }}>
        <g transform={`translate(${tx},${ty})`}>
          {/* Curved links */}
          {links.map((link, i) => (
            <path
              key={i}
              d={linkPath(link)}
              fill="none"
              stroke="#d0d0d0"
              strokeWidth={1.5}
            />
          ))}

          {/* Nodes */}
          {nodes.map((node, i) => {
            const isSup  = node.data.role === 'supervisor'
            const color  = isSup ? supervisorColor : subjectColor
            const anchor = isSup ? 'end' : 'start'
            const dx     = isSup ? -10 : 10
            return (
              <g key={i} transform={`translate(${node.y},${node.x})`}>
                <circle
                  r={5}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={1.5}
                />
                <text
                  x={dx}
                  dy="0.35em"
                  textAnchor={anchor}
                  style={{ fontSize: 12, fill: '#333', fontFamily: 'ui-monospace, monospace' }}
                >
                  {node.data.id}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}

// ── Icicle chart visualization ────────────────────────────────────────────────

const ICICLE_H = 280

function IcicleChart({ assignments, subjectKey, supervisorKey, supervisorColor, subjectColor }) {
  const containerRef             = useRef(null)
  const [svgW, setSvgW]         = useState(680)
  const [focusedId, setFocusedId] = useState(null) // null = root

  // Measure container width responsively
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width
      if (w > 0) setSvgW(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const data = useMemo(
    () => buildHierarchy(assignments, subjectKey, supervisorKey),
    [assignments, subjectKey, supervisorKey],
  )

  // Reset zoom when data changes
  useEffect(() => { setFocusedId(null) }, [data])

  const rootNode = useMemo(() => {
    if (!data) return null
    const root = hierarchy(data).sum(() => 1)
    partition().size([ICICLE_H, svgW])(root)
    return root
  }, [data, svgW])

  const focused = useMemo(() => {
    if (!rootNode) return null
    if (!focusedId) return rootNode
    return rootNode.find(d => d.data.id === focusedId) ?? rootNode
  }, [rootNode, focusedId])

  // Breadth scale: maps node.x (vertical) based on focused node
  const bScale = useCallback(v => {
    if (!focused) return v
    return ((v - focused.x0) / (focused.x1 - focused.x0)) * ICICLE_H
  }, [focused])

  const handleClick = (node) => {
    if (node.data.id === '__root__') { setFocusedId(null); return }
    if (focused && node.data.id === focused.data.id) {
      // Click on focused → zoom to parent
      const parentId = focused.parent?.data.id
      setFocusedId(!parentId || parentId === '__root__' ? null : parentId)
    } else {
      setFocusedId(node.data.id)
    }
  }

  const visibleNodes = focused ? focused.descendants() : (rootNode?.descendants() ?? [])

  return (
    <div>
      {/* Zoom breadcrumb */}
      {focusedId && (
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Zoomed into: <strong>{focusedId}</strong>
          </Text>
          <Button size="small" type="link" style={{ padding: 0, height: 'auto' }}
            onClick={() => setFocusedId(null)}>
            Reset
          </Button>
        </div>
      )}

      <div ref={containerRef} style={{ width: '100%' }}>
        {!data ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#8c8c8c' }}>
            No assignments to display.
          </div>
        ) : (
          <svg width={svgW} height={ICICLE_H} style={{ display: 'block' }}>
            {visibleNodes.map(node => {
              if (node.data.id === '__root__') return null

              const x = node.y0
              const y = bScale(node.x0)
              const w = node.y1 - node.y0
              const h = bScale(node.x1) - y

              if (h < 0.5 || w < 0.5) return null

              const isSup    = node.data.role === 'supervisor'
              const fill     = isSup ? supervisorColor : subjectColor
              const isCurrent = focused?.data.id === node.data.id

              // Truncate label to fit
              const maxChars = Math.max(0, Math.floor((w - 12) / 7))
              const label    = node.data.id.length <= maxChars
                ? node.data.id
                : node.data.id.slice(0, Math.max(0, maxChars - 1)) + '…'
              const showLabel = w > 28 && h > 14

              return (
                <g key={node.data.id}
                  onClick={() => handleClick(node)}
                  tabIndex={node.children ? 0 : -1}
                  role={node.children ? 'button' : undefined}
                  aria-label={node.children ? `Drill into ${node.data.id}` : node.data.id}
                  onKeyDown={node.children ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(node) } } : undefined}
                  style={{ cursor: node.children ? 'pointer' : 'default', outline: 'none' }}>
                  <rect
                    x={x + 0.5} y={y + 0.5}
                    width={Math.max(0, w - 1)}
                    height={Math.max(0, h - 1)}
                    fill={fill}
                    opacity={isCurrent ? 1 : 0.82}
                    rx={2}
                    stroke="#fff"
                    strokeWidth={1}
                  />
                  {showLabel && (
                    <text
                      x={x + 6} y={y + h / 2}
                      dy="0.35em"
                      style={{
                        fontSize: Math.min(12, h * 0.52),
                        fill: '#fff',
                        fontFamily: 'ui-monospace, monospace',
                        pointerEvents: 'none',
                        userSelect: 'none',
                      }}
                    >
                      {label}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        )}
      </div>
    </div>
  )
}

// ── Tangled tree visualization ────────────────────────────────────────────────
// Nitaku-style two-column layout: supervisor rects left, supervisee rects right,
// bundled cubic Bézier edges. Click a supervisor to zoom (filter) to its subtree.

const TG_NODE_H  = 28
const TG_NODE_W  = 150
const TG_COL_GAP = 160
const TG_ROW_GAP = 10
const TG_PAD     = 20   // side + bottom padding
const TG_PAD_TOP = 40   // extra top padding for column headers

function TangledTree({ assignments, subjectKey, supervisorKey, supervisorColor, subjectColor }) {
  const [focusedSup, setFocusedSup] = useState(null)

  const supMap = useMemo(() => {
    const map = {}
    assignments.forEach(a => {
      const sup = a[supervisorKey], sub = a[subjectKey]
      if (!map[sup]) map[sup] = []
      map[sup].push(sub)
    })
    return map
  }, [assignments, subjectKey, supervisorKey])

  const allSups = useMemo(() => Object.keys(supMap), [supMap])

  const { visSups, visSubs, svgW, svgH } = useMemo(() => {
    const vSups = focusedSup ? allSups.filter(s => s === focusedSup) : allSups
    const subSet = new Set(vSups.flatMap(s => supMap[s] ?? []))
    // stable order: follow assignment list
    const seen = new Set()
    const vSubs = assignments
      .map(a => a[subjectKey])
      .filter(s => subSet.has(s) && !seen.has(s) && seen.add(s))
    const rows = Math.max(vSups.length, vSubs.length, 1)
    const h = TG_PAD_TOP + rows * (TG_NODE_H + TG_ROW_GAP) + TG_PAD
    const w = TG_PAD * 2 + TG_NODE_W * 2 + TG_COL_GAP
    return { visSups: vSups, visSubs: vSubs, svgW: w, svgH: h }
  }, [assignments, subjectKey, supMap, allSups, focusedSup])

  if (!assignments.length) return (
    <div style={{ padding: 32, textAlign: 'center', color: '#8c8c8c' }}>
      No assignments to display.
    </div>
  )

  const nodeY   = i => TG_PAD_TOP + i * (TG_NODE_H + TG_ROW_GAP) + TG_NODE_H / 2
  const supX    = TG_PAD
  const subX    = TG_PAD + TG_NODE_W + TG_COL_GAP
  // Bundle control-point x: 35 % across the gap — creates the fan-out illusion
  const bundleX = TG_PAD + TG_NODE_W + TG_COL_GAP * 0.35

  const subIdx  = {}
  visSubs.forEach((id, i) => { subIdx[id] = i })

  return (
    <div>
      {focusedSup && (
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Filtered: <strong>{focusedSup}</strong>
          </Text>
          <Button size="small" type="link" style={{ padding: 0, height: 'auto' }}
            onClick={() => setFocusedSup(null)}>
            Reset
          </Button>
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <svg width={svgW} height={svgH} style={{ display: 'block' }}>

          {/* Column headers */}
          <text x={supX} y={TG_PAD_TOP - 10}
            style={{ fontSize: 11, fontWeight: 700, fill: supervisorColor,
              fontFamily: 'ui-sans-serif, sans-serif' }}>
            Supervisors
          </text>
          <text x={subX} y={TG_PAD_TOP - 10}
            style={{ fontSize: 11, fontWeight: 700, fill: subjectColor,
              fontFamily: 'ui-sans-serif, sans-serif' }}>
            Supervisees
          </text>

          {/* Bundled Bézier edges (drawn behind nodes) */}
          {visSups.map((supId, si) => {
            const sy = nodeY(si)
            const isFocused = focusedSup === supId
            return (supMap[supId] ?? [])
              .filter(subId => subIdx[subId] !== undefined)
              .map(subId => {
                const ty = nodeY(subIdx[subId])
                const d  = `M ${supX + TG_NODE_W} ${sy} C ${bundleX} ${sy}, ${bundleX} ${ty}, ${subX} ${ty}`
                return (
                  <path
                    key={`${supId}-${subId}`}
                    d={d}
                    fill="none"
                    stroke={supervisorColor}
                    strokeWidth={isFocused ? 2.5 : 1.5}
                    opacity={focusedSup && !isFocused ? 0.12 : isFocused ? 0.9 : 0.5}
                  />
                )
              })
          })}

          {/* Supervisor nodes */}
          {visSups.map((id, i) => {
            const y        = nodeY(i)
            const isFocused = focusedSup === id
            const dimmed   = focusedSup && !isFocused
            return (
              <g key={id}
                onClick={() => setFocusedSup(f => f === id ? null : id)}
                tabIndex={0}
                role="button"
                aria-pressed={focusedSup === id}
                aria-label={focusedSup === id ? `Clear filter: ${id}` : `Filter to supervisor: ${id}`}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFocusedSup(f => f === id ? null : id) } }}
                style={{ cursor: 'pointer', outline: 'none' }}>
                <rect
                  x={supX} y={y - TG_NODE_H / 2}
                  width={TG_NODE_W} height={TG_NODE_H}
                  rx={5}
                  fill={supervisorColor}
                  opacity={dimmed ? 0.2 : 0.88}
                  stroke={isFocused ? '#fff' : 'none'}
                  strokeWidth={2}
                />
                <text x={supX + 10} y={y} dy="0.35em"
                  style={{ fontSize: 12, fill: '#fff', fontFamily: 'ui-monospace, monospace',
                    pointerEvents: 'none', userSelect: 'none' }}>
                  {id.length > 16 ? id.slice(0, 15) + '…' : id}
                </text>
              </g>
            )
          })}

          {/* Supervisee nodes */}
          {visSubs.map((id, i) => {
            const y = nodeY(i)
            return (
              <g key={id}>
                <rect
                  x={subX} y={y - TG_NODE_H / 2}
                  width={TG_NODE_W} height={TG_NODE_H}
                  rx={5}
                  fill={subjectColor}
                  opacity={0.82}
                />
                <text x={subX + 10} y={y} dy="0.35em"
                  style={{ fontSize: 12, fill: '#fff', fontFamily: 'ui-monospace, monospace',
                    pointerEvents: 'none', userSelect: 'none' }}>
                  {id.length > 16 ? id.slice(0, 15) + '…' : id}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// ── Reusable assignment panel ─────────────────────────────────────────────────

function AssignmentPanel({
  assignments, members, loading, error, onError,
  subjectLabel,
  supervisorLabel,
  subjectKey,
  supervisorKey,
  onAssign, onRemove, onReload,
  subjectColor = 'blue', supervisorColor = 'purple',
}) {
  const [open,          setOpen]          = useState(false)
  const [supervisorSel, setSupervisorSel] = useState(null)
  const [subjectsSel,   setSubjectsSel]   = useState(new Set())
  const [submitting,    setSubmitting]    = useState(false)
  const [submitError,   setSubmitError]   = useState('')

  // Users already assigned as a subject (have a supervisor)
  const assignedSubjects = new Set(assignments.map(a => a[subjectKey]))

  // Count current supervisees per supervisor
  const superviseeCount = assignments.reduce((acc, a) => {
    acc[a[supervisorKey]] = (acc[a[supervisorKey]] ?? 0) + 1
    return acc
  }, {})

  // Eligible subjects: not already supervised by anyone
  const eligibleSubjects = members.filter(m => !assignedSubjects.has(m.username))

  // Eligible supervisors: not themselves being supervised
  const eligibleSupervisors = members.filter(m => !assignedSubjects.has(m.username))

  const currentSuperviseeCount = supervisorSel ? (superviseeCount[supervisorSel] ?? 0) : 0
  const availableSlots = 10 - currentSuperviseeCount
  const selectedCount  = subjectsSel.size

  const handleOpen = () => {
    setSupervisorSel(null)
    setSubjectsSel(new Set())
    setSubmitError('')
    setOpen(true)
  }

  const handleToggleSubject = (username) => {
    setSubjectsSel(prev => {
      const next = new Set(prev)
      if (next.has(username)) {
        next.delete(username)
      } else {
        next.add(username)
      }
      return next
    })
  }

  const handleSubmit = async () => {
    if (!supervisorSel) { setSubmitError('Please select a supervisor'); return }
    if (subjectsSel.size === 0) { setSubmitError(`Please select at least one ${subjectLabel.toLowerCase()}`); return }
    if (subjectsSel.has(supervisorSel)) { setSubmitError('The supervisor cannot also be a subject'); return }
    if (selectedCount > availableSlots) {
      setSubmitError(`Supervisor can only take ${availableSlots} more supervisee${availableSlots !== 1 ? 's' : ''}`); return
    }
    setSubmitting(true); setSubmitError('')
    try {
      await Promise.all([...subjectsSel].map(subject => onAssign(subject, supervisorSel)))
      setOpen(false)
      onReload()
    } catch (e) {
      setSubmitError('Failed: ' + (e.response?.data?.message ?? e.message))
    } finally { setSubmitting(false) }
  }

  const columns = [
    {
      title: subjectLabel,
      dataIndex: subjectKey,
      render: v => <Tag color={subjectColor}>{v}</Tag>,
    },
    {
      title: 'Supervisor',
      dataIndex: supervisorKey,
      render: (v) => {
        const count = superviseeCount[v] ?? 0
        return (
          <Space size={4}>
            <Tag color={supervisorColor}>{v}</Tag>
            <Text type="secondary" style={{ fontSize: 11 }}>{count}/10</Text>
            {count >= 10 && <Tag color="error" style={{ fontSize: 10 }}>Full</Tag>}
          </Space>
        )
      },
    },
    {
      title: 'Actions',
      width: 100,
      render: (_, row) => (
        <Popconfirm
          title="Remove this supervisor assignment?"
          okText="Remove" okButtonProps={{ danger: true }}
          onConfirm={() => onRemove(row[subjectKey])}
        >
          <Button danger size="small" icon={<DeleteOutlined />}>Remove</Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={onReload} loading={loading}
            aria-label="Reload assignments" />
          <Button type="primary" icon={<PlusCircleOutlined />} onClick={handleOpen}>
            Add Assignment
          </Button>
        </Space>
      </div>

      {error && (
        <Alert type="error" message={error} showIcon closable onClose={() => onError('')} style={{ marginBottom: 16 }} />
      )}

      <Table
        dataSource={assignments}
        columns={columns}
        rowKey={subjectKey}
        loading={loading}
        size="small"
        pagination={{ pageSize: 20 }}
        locale={{ emptyText: 'No supervisor assignments yet.' }}
        style={{ borderRadius: 8, overflow: 'hidden' }}
      />

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        title={<Space><TeamOutlined /> Add Supervisor Assignments</Space>}
        footer={null}
        width={500}
        destroyOnHidden
      >
        {submitError && (
          <Alert type="error" message={submitError} showIcon closable
            onClose={() => setSubmitError('')} style={{ marginBottom: 16 }} />
        )}

        {/* Supervisor selector */}
        <Text strong style={{ display: 'block', marginBottom: 6 }}>{supervisorLabel}</Text>
        <Select
          style={{ width: '100%', marginBottom: 4 }}
          placeholder="Select supervisor"
          options={eligibleSupervisors
            .filter(m => m.username !== supervisorSel || true) // keep selected even if not in list
            .map(m => {
              const count = superviseeCount[m.username] ?? 0
              const full  = count >= 10
              return {
                value: m.username,
                label: `${m.username}${m.firstName || m.lastName ? ` — ${m.firstName} ${m.lastName}`.trim() : ''} (${count}/10${full ? ' — full' : ''})`,
                disabled: full,
              }
            })}
          value={supervisorSel}
          onChange={(v) => { setSupervisorSel(v); setSubjectsSel(new Set()) }}
          showSearch
          filterOption={(input, opt) => opt.label.toLowerCase().includes(input.toLowerCase())}
        />
        {supervisorSel && (
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>
            {availableSlots > 0
              ? `${availableSlots} slot${availableSlots !== 1 ? 's' : ''} available`
              : 'No slots available — supervisor is full'}
          </Text>
        )}
        {!supervisorSel && <div style={{ marginBottom: 16 }} />}

        <Divider style={{ margin: '0 0 12px' }} />

        {/* Subject checkbox list */}
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          {subjectLabel}s to assign
          {selectedCount > 0 && (
            <Tag color="blue" style={{ marginLeft: 8 }}>{selectedCount} selected</Tag>
          )}
          {supervisorSel && selectedCount > availableSlots && (
            <Tag color="error" style={{ marginLeft: 4 }}>exceeds cap</Tag>
          )}
        </Text>

        {eligibleSubjects.length === 0 ? (
          <Text type="secondary" style={{ fontSize: 13 }}>
            All {subjectLabel.toLowerCase()}s already have a supervisor assigned.
          </Text>
        ) : (
          <div style={{
            maxHeight: 260, overflowY: 'auto',
            border: '1px solid #e8e8e8', borderRadius: 8, padding: '4px 0',
          }}>
            {eligibleSubjects.map((m, idx) => {
              const isSelected = subjectsSel.has(m.username)
              const isSupervisor = m.username === supervisorSel
              const wouldExceedCap = supervisorSel && !isSelected && selectedCount >= availableSlots
              const disabled = isSupervisor || wouldExceedCap || availableSlots === 0
              return (
                <div
                  key={m.username}
                  onClick={() => !disabled && handleToggleSubject(m.username)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 14px',
                    background: isSelected ? '#e6f4ff' : 'transparent',
                    borderBottom: idx < eligibleSubjects.length - 1 ? '1px solid #f0f0f0' : 'none',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.45 : 1,
                    transition: 'background 0.15s',
                  }}
                >
                  <Checkbox checked={isSelected} disabled={disabled} onChange={() => {}} />
                  <UserOutlined style={{ color: '#8c8c8c', fontSize: 13 }} />
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: 13 }}>{m.username}</Text>
                    {(m.firstName || m.lastName) && (
                      <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                        {[m.firstName, m.lastName].filter(Boolean).join(' ')}
                      </Text>
                    )}
                  </div>
                  {isSupervisor && <Tag style={{ fontSize: 10 }}>selected as supervisor</Tag>}
                </div>
              )
            })}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <Button onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button
            type="primary"
            loading={submitting}
            disabled={!supervisorSel || subjectsSel.size === 0 || selectedCount > availableSlots}
            onClick={handleSubmit}
          >
            Assign {selectedCount > 0 ? `(${selectedCount})` : ''}
          </Button>
        </div>
      </Modal>
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SupervisorAssignmentPage() {
  const { auth } = useAuth()

  // Visualization type
  const [vizType, setVizType] = useState('tree')

  // Inviter supervisor state
  const [inviterAssignments, setInviterAssignments] = useState([])
  const [inviters,           setInviters]           = useState([])
  const [inviterLoading,     setInviterLoading]     = useState(true)
  const [inviterError,       setInviterError]       = useState('')

  // Security supervisor state
  const [secAssignments, setSecAssignments] = useState([])
  const [officers,       setOfficers]       = useState([])
  const [secLoading,     setSecLoading]     = useState(true)
  const [secError,       setSecError]       = useState('')

  // Gatekeeper supervisor state
  const [gkAssignments, setGkAssignments] = useState([])
  const [porters,        setPorters]       = useState([])
  const [gkLoading,      setGkLoading]     = useState(true)
  const [gkError,        setGkError]       = useState('')

  const loadInviter = useCallback(async () => {
    setInviterLoading(true); setInviterError('')
    try {
      const [asgn, inv] = await Promise.all([
        getSupervisorAssignments(auth),
        getSupervisableInviters(auth),
      ])
      setInviterAssignments(asgn)
      setInviters(inv)
    } catch (e) {
      setInviterError('Failed to load: ' + (e.response?.data?.message ?? e.message))
    } finally { setInviterLoading(false) }
  }, [auth])

  const loadSecurity = useCallback(async () => {
    setSecLoading(true); setSecError('')
    try {
      const [asgn, off] = await Promise.all([
        getSecuritySupervisorAssignments(auth),
        getSecurityOfficers(auth),
      ])
      setSecAssignments(asgn)
      setOfficers(off)
    } catch (e) {
      setSecError('Failed to load: ' + (e.response?.data?.message ?? e.message))
    } finally { setSecLoading(false) }
  }, [auth])

  const loadGatekeeper = useCallback(async () => {
    setGkLoading(true); setGkError('')
    try {
      const [asgn, off] = await Promise.all([
        getGatekeeperSupervisorAssignments(auth),
        getGatekeeperOfficers(auth),
      ])
      setGkAssignments(asgn)
      setPorters(off)
    } catch (e) {
      setGkError('Failed to load: ' + (e.response?.data?.message ?? e.message))
    } finally { setGkLoading(false) }
  }, [auth])

  useEffect(() => { loadInviter(); loadSecurity(); loadGatekeeper() }, [loadInviter, loadSecurity, loadGatekeeper])

  const tabItems = [
    {
      key: 'inviter',
      label: <Space><TeamOutlined />Inviter Supervisors</Space>,
      children: (
        <AssignmentPanel
          assignments={inviterAssignments}
          members={inviters}
          loading={inviterLoading}
          error={inviterError}
          onError={setInviterError}
          subjectLabel="Inviter"
          supervisorLabel="Supervisor (must be an inviter)"
          subjectKey="inviterUsername"
          supervisorKey="supervisorUsername"
          onAssign={(subject, supervisor) => setSupervisorAssignment(auth, subject, supervisor)}
          onRemove={(subject) => removeSupervisorAssignment(auth, subject).then(loadInviter)}
          onReload={loadInviter}
          subjectColor="blue"
          supervisorColor="purple"
        />
      ),
    },
    {
      key: 'security',
      label: <Space><SafetyCertificateOutlined />Security Supervisors</Space>,
      children: (
        <AssignmentPanel
          assignments={secAssignments}
          members={officers}
          loading={secLoading}
          error={secError}
          onError={setSecError}
          subjectLabel="Officer"
          supervisorLabel="Supervisor (must be a Security member)"
          subjectKey="officerUsername"
          supervisorKey="supervisorUsername"
          onAssign={(subject, supervisor) => setSecuritySupervisorAssignment(auth, subject, supervisor)}
          onRemove={(subject) => removeSecuritySupervisorAssignment(auth, subject).then(loadSecurity)}
          onReload={loadSecurity}
          subjectColor="orange"
          supervisorColor="red"
        />
      ),
    },
    {
      key: 'gatekeeper',
      label: <Space><BankOutlined />Gatekeeper Supervisors</Space>,
      children: (
        <AssignmentPanel
          assignments={gkAssignments}
          members={porters}
          loading={gkLoading}
          error={gkError}
          onError={setGkError}
          subjectLabel="Gatekeeper"
          supervisorLabel="Supervisor (must be a Porter member)"
          subjectKey="porterUsername"
          supervisorKey="supervisorUsername"
          onAssign={(subject, supervisor) => setGatekeeperSupervisorAssignment(auth, subject, supervisor)}
          onRemove={(subject) => removeGatekeeperSupervisorAssignment(auth, subject).then(loadGatekeeper)}
          onReload={loadGatekeeper}
          subjectColor="purple"
          supervisorColor="cyan"
        />
      ),
    },
  ]

  return (
    <Layout>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <TeamOutlined style={{ marginRight: 8 }} />
          Supervisor Assignments
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Manage supervisor hierarchies. One supervisor per member, max 10 supervisees per supervisor.
        </Text>
      </div>

      {/* ── Hierarchy visualization (collapsed by default) ── */}
      <Collapse style={{ marginBottom: 24 }} defaultActiveKey={[]}>
        <Collapse.Panel
          key="hierarchy"
          header={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <Space>
                <ApartmentOutlined style={{ color: '#531dab' }} />
                <span style={{ fontWeight: 600 }}>Supervisor Hierarchy</span>
              </Space>
              {/* Stop propagation so clicking the control doesn't toggle the panel */}
              <div onClick={e => e.stopPropagation()}>
                <Segmented
                  size="small"
                  value={vizType}
                  onChange={setVizType}
                  options={[
                    { label: <Space size={4}><ApartmentOutlined />Tree</Space>,     value: 'tree'    },
                    { label: <Space size={4}><TableOutlined />Icicle</Space>,        value: 'icicle'  },
                    { label: <Space size={4}><ShareAltOutlined />Tangled</Space>,   value: 'tangled' },
                  ]}
                />
              </div>
            </div>
          }
        >
          <Tabs
            size="small"
            items={[
              {
                key: 'inviter',
                label: <Space><TeamOutlined />Inviters</Space>,
                children: vizType === 'tree' ? (
                  <TidyTree
                    assignments={inviterAssignments}
                    subjectKey="inviterUsername"
                    supervisorKey="supervisorUsername"
                    supervisorColor="#531dab"
                    subjectColor="#1677ff"
                  />
                ) : vizType === 'icicle' ? (
                  <IcicleChart
                    assignments={inviterAssignments}
                    subjectKey="inviterUsername"
                    supervisorKey="supervisorUsername"
                    supervisorColor="#531dab"
                    subjectColor="#1677ff"
                  />
                ) : (
                  <TangledTree
                    assignments={inviterAssignments}
                    subjectKey="inviterUsername"
                    supervisorKey="supervisorUsername"
                    supervisorColor="#531dab"
                    subjectColor="#1677ff"
                  />
                ),
              },
              {
                key: 'security',
                label: <Space><SafetyCertificateOutlined />Security</Space>,
                children: vizType === 'tree' ? (
                  <TidyTree
                    assignments={secAssignments}
                    subjectKey="officerUsername"
                    supervisorKey="supervisorUsername"
                    supervisorColor="#cf1322"
                    subjectColor="#d46b08"
                  />
                ) : vizType === 'icicle' ? (
                  <IcicleChart
                    assignments={secAssignments}
                    subjectKey="officerUsername"
                    supervisorKey="supervisorUsername"
                    supervisorColor="#cf1322"
                    subjectColor="#d46b08"
                  />
                ) : (
                  <TangledTree
                    assignments={secAssignments}
                    subjectKey="officerUsername"
                    supervisorKey="supervisorUsername"
                    supervisorColor="#cf1322"
                    subjectColor="#d46b08"
                  />
                ),
              },
              {
                key: 'gatekeeper',
                label: <Space><BankOutlined />Gatekeepers</Space>,
                children: vizType === 'tree' ? (
                  <TidyTree
                    assignments={gkAssignments}
                    subjectKey="porterUsername"
                    supervisorKey="supervisorUsername"
                    supervisorColor="#0958d9"
                    subjectColor="#531dab"
                  />
                ) : vizType === 'icicle' ? (
                  <IcicleChart
                    assignments={gkAssignments}
                    subjectKey="porterUsername"
                    supervisorKey="supervisorUsername"
                    supervisorColor="#0958d9"
                    subjectColor="#531dab"
                  />
                ) : (
                  <TangledTree
                    assignments={gkAssignments}
                    subjectKey="porterUsername"
                    supervisorKey="supervisorUsername"
                    supervisorColor="#0958d9"
                    subjectColor="#531dab"
                  />
                ),
              },
            ]}
          />
        </Collapse.Panel>
      </Collapse>

      <Tabs items={tabItems} />
    </Layout>
  )
}

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Select, Spin, Alert, Table, Tag, Typography } from 'antd'
import * as d3 from 'd3'
import { sankey as d3Sankey, sankeyLinkHorizontal } from 'd3-sankey'
import { useAuth } from '../context/AuthContext'
import { getVisitSankeyStats } from '../api/operatonApi'

const { Text } = Typography

const GROUP_COLOR = {
  inviter:    '#1677ff',
  security:   '#fa8c16',
  gatekeeper: '#52c41a',
  entrance:   '#722ed1',
}

const GROUP_LABEL = {
  inviter:    'INVITER',
  security:   'SECURITY',
  gatekeeper: 'GATEKEEPER',
  entrance:   'ENTRANCE',
}

// ─── D3 diagram (inner) ───────────────────────────────────────────────────────

function SankeyDiagram({ data, width, setTooltip }) {
  const svgRef = useRef(null)

  useEffect(() => {
    if (!data || !width || width < 200) return
    const { nodes: rawNodes, links: rawLinks } = data
    if (!rawNodes?.length || !rawLinks?.length) return

    // Compute height from the tallest column
    const col = g => rawNodes.filter(n => n.group === g).length
    const maxNodes = Math.max(col('inviter'), col('security'), col('gatekeeper'), col('entrance'))
    const H  = Math.max(440, maxNodes * 34 + 70)
    const ML = 130, MR = 150, MT = 36, MB = 16
    const innerW = width - ML - MR
    const innerH = H - MT - MB

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', width).attr('height', H)

    const g = svg.append('g').attr('transform', `translate(${ML},${MT})`)

    // Sankey layout
    const layout = d3Sankey()
      .nodeId(d => d.id)
      .nodeWidth(18)
      .nodePadding(10)
      .extent([[0, 0], [innerW, innerH]])

    const graph = layout({
      nodes: rawNodes.map(d => ({ ...d })),
      links: rawLinks.map(d => ({ source: d.source, target: d.target, value: d.value })),
    })

    // ── Column headers ────────────────────────────────────────────────────────
    ;['inviter', 'security', 'gatekeeper', 'entrance'].forEach(grp => {
      const gNodes = graph.nodes.filter(n => n.group === grp)
      if (!gNodes.length) return
      const x = (gNodes[0].x0 + gNodes[0].x1) / 2
      g.append('text')
        .attr('x', x)
        .attr('y', -14)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('font-weight', '700')
        .style('letter-spacing', '0.04em')
        .style('fill', GROUP_COLOR[grp])
        .text(GROUP_LABEL[grp])
    })

    // ── Links ─────────────────────────────────────────────────────────────────
    g.append('g').attr('fill', 'none')
      .selectAll('path')
      .data(graph.links)
      .join('path')
        .attr('d', sankeyLinkHorizontal())
        .attr('stroke', d => GROUP_COLOR[d.source.group] ?? '#aaa')
        .attr('stroke-width', d => Math.max(1, d.width))
        .attr('stroke-opacity', 0.2)
        .on('mouseenter', function(event, d) {
          d3.select(this).attr('stroke-opacity', 0.55)
          setTooltip({
            x: event.clientX + 14,
            y: event.clientY - 10,
            html: `<b>${d.source.name}</b> → <b>${d.target.name}</b><br/>${d.value.toLocaleString()} visits`,
          })
        })
        .on('mousemove', function(event) {
          setTooltip(p => p ? { ...p, x: event.clientX + 14, y: event.clientY - 10 } : null)
        })
        .on('mouseleave', function() {
          d3.select(this).attr('stroke-opacity', 0.2)
          setTooltip(null)
        })

    // ── Nodes ─────────────────────────────────────────────────────────────────
    const node = g.append('g').selectAll('g').data(graph.nodes).join('g')

    node.append('rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('width',  d => d.x1 - d.x0)
      .attr('height', d => Math.max(1, d.y1 - d.y0))
      .attr('fill', d => GROUP_COLOR[d.group] ?? '#999')
      .attr('rx', 3)
      .on('mouseenter', function(event, d) {
        setTooltip({
          x: event.clientX + 14,
          y: event.clientY - 10,
          html: `<b>${d.name}</b><br/>${(d.value ?? 0).toLocaleString()} visits`,
        })
      })
      .on('mousemove', function(event) {
        setTooltip(p => p ? { ...p, x: event.clientX + 14, y: event.clientY - 10 } : null)
      })
      .on('mouseleave', () => setTooltip(null))

    // ── Labels ────────────────────────────────────────────────────────────────
    node.append('text')
      .attr('x', d => d.x0 < innerW / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr('y', d => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => d.x0 < innerW / 2 ? 'start' : 'end')
      .style('font-size', '11px')
      .style('fill', '#333')
      .text(d => d.name.length > 18 ? d.name.slice(0, 16) + '…' : d.name)

  }, [data, width, setTooltip])

  return <svg ref={svgRef} style={{ display: 'block', overflow: 'visible' }} />
}

// ─── Panel (outer — handles data fetching, layout, refused table) ─────────────

export default function SankeyPanel() {
  const { auth } = useAuth()
  const [days,    setDays]    = useState(90)
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [width,   setWidth]   = useState(0)
  const [tooltip, setTooltip] = useState(null)
  const containerRef = useRef(null)

  // Responsive width
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width
      if (w > 0) setWidth(w)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Data fetch
  const fetchData = useCallback(() => {
    setLoading(true)
    setError('')
    getVisitSankeyStats(auth, days)
      .then(setData)
      .catch(e => setError(e.message ?? 'Failed to load sankey data'))
      .finally(() => setLoading(false))
  }, [auth, days])

  useEffect(() => { fetchData() }, [fetchData])

  // Pivot refused → one row per officer
  const refusedMap = {}
  ;(data?.refused ?? []).forEach(r => {
    if (!refusedMap[r.securityOfficer])
      refusedMap[r.securityOfficer] = { officer: r.securityOfficer, refused: 0, blacklisted: 0 }
    if (r.status === 'REFUSED')     refusedMap[r.securityOfficer].refused     += r.count
    if (r.status === 'BLACKLISTED') refusedMap[r.securityOfficer].blacklisted += r.count
  })
  const refusedRows = Object.values(refusedMap)
    .map(r => ({ ...r, total: r.refused + r.blacklisted }))
    .sort((a, b) => b.total - a.total)

  const hasData = data?.nodes?.length > 0

  return (
    <div>
      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Approved check-ins — Inviter → Security Officer → Gatekeeper → Entrance
        </Text>
        <Select
          value={days}
          onChange={setDays}
          size="small"
          style={{ width: 140 }}
          options={[
            { value: 30,  label: 'Last 30 days' },
            { value: 90,  label: 'Last 90 days' },
            { value: 365, label: 'Last year'    },
          ]}
        />
      </div>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 12 }} />}

      {/* ── Sankey diagram ── */}
      <div ref={containerRef} style={{ position: 'relative', minHeight: 440 }}>
        {loading
          ? <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}><Spin /></div>
          : hasData
            ? <SankeyDiagram data={data} width={width} setTooltip={setTooltip} />
            : !loading && <Text type="secondary">No check-in data for this period.</Text>
        }
      </div>

      {/* ── Floating tooltip ── */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top:  tooltip.y,
            background: 'rgba(0,0,0,0.82)',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: 6,
            fontSize: 12,
            lineHeight: 1.6,
            pointerEvents: 'none',
            zIndex: 9999,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.html }}
        />
      )}

      {/* ── Refused summary ── */}
      {!loading && refusedRows.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
            Refused &amp; Blacklisted — by Security Officer
          </Text>
          <Table
            dataSource={refusedRows}
            rowKey="officer"
            size="small"
            pagination={false}
            columns={[
              {
                title: 'Security Officer',
                dataIndex: 'officer',
                key: 'officer',
                render: t => <strong style={{ color: GROUP_COLOR.security }}>{t}</strong>,
              },
              {
                title: 'Refused',
                dataIndex: 'refused',
                key: 'refused',
                align: 'center',
                render: v => v > 0
                  ? <Tag color="warning">{v.toLocaleString()}</Tag>
                  : <Text type="secondary">—</Text>,
              },
              {
                title: 'Blacklisted',
                dataIndex: 'blacklisted',
                key: 'blacklisted',
                align: 'center',
                render: v => v > 0
                  ? <Tag color="error">{v.toLocaleString()}</Tag>
                  : <Text type="secondary">—</Text>,
              },
              {
                title: 'Total',
                dataIndex: 'total',
                key: 'total',
                align: 'center',
                render: v => <Tag>{v.toLocaleString()}</Tag>,
              },
            ]}
          />
        </div>
      )}
    </div>
  )
}

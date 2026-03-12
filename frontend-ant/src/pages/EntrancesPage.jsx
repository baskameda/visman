import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Button, Typography, Alert, Space, Spin, Tag, Avatar,
  Modal, Form, Input, Checkbox, Tooltip, Popconfirm, message, Empty,
  Segmented, Card, Select,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  TeamOutlined, LoginOutlined, EnvironmentOutlined,
} from '@ant-design/icons'
import { Table } from 'antd'
import { stack } from 'd3-shape'
import { scaleBand, scaleLinear, scaleOrdinal } from 'd3-scale'
import { max } from 'd3-array'
import { schemeTableau10 } from 'd3-scale-chromatic'
import Layout       from '../components/Layout'
import SankeyPanel  from '../components/SankeyPanel'
import { useAuth } from '../context/AuthContext'
import {
  getEntrances, createEntrance, updateEntrance, deleteEntrance,
  getEntranceGatekeepers, setEntranceGatekeepers,
  getGroupMembers, getCheckinsByEntranceAndDay,
  getLocations, getGatekeepersInOtherLocations,
} from '../api/operatonApi'

const { Title, Text } = Typography

// ── Stacked bar: check-ins per entrance per day ───────────────────────────────

const CHART_H  = 300
const MARGIN   = { top: 16, right: 16, bottom: 48, left: 40 }

function CheckinsChart({ auth, locationId }) {
  const containerRef                = useRef(null)
  const [svgW,    setSvgW]          = useState(680)
  const [days,    setDays]          = useState(30)
  const [rawData, setRawData]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [tooltip, setTooltip]       = useState(null)

  // Responsive width via ResizeObserver
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

  // Fetch aggregated data
  useEffect(() => {
    setLoading(true)
    getCheckinsByEntranceAndDay(auth, days, locationId)
      .then(setRawData)
      .catch(() => setRawData([]))
      .finally(() => setLoading(false))
  }, [auth, days, locationId])

  const { dates, entrances, stackedSeries, xScale, yScale, colorScale, innerW, innerH } = useMemo(() => {
    const innerW = svgW - MARGIN.left - MARGIN.right
    const innerH = CHART_H - MARGIN.top - MARGIN.bottom

    if (!rawData.length) return { dates: [], entrances: [], stackedSeries: [], innerW, innerH }

    const dateSet     = [...new Set(rawData.map(d => d.date))].sort()
    const entranceSet = [...new Set(rawData.map(d => d.entranceName))].sort()

    // Pivot: date → { entranceName: count }
    const pivot = {}
    dateSet.forEach(d => { pivot[d] = {} })
    rawData.forEach(({ date, entranceName, count }) => { pivot[date][entranceName] = count })

    const rows = dateSet.map(date => ({ date, ...Object.fromEntries(entranceSet.map(e => [e, pivot[date][e] ?? 0])) }))

    const stackGen     = stack().keys(entranceSet)
    const stackedSeries = stackGen(rows)

    const xScale = scaleBand().domain(dateSet).range([0, innerW]).padding(0.25)
    const yMax   = max(rows, row => entranceSet.reduce((s, e) => s + (row[e] ?? 0), 0)) ?? 1
    const yScale = scaleLinear().domain([0, yMax]).range([innerH, 0]).nice()
    const colorScale = scaleOrdinal(schemeTableau10).domain(entranceSet)

    return { dates: dateSet, entrances: entranceSet, stackedSeries, xScale, yScale, colorScale, innerW, innerH }
  }, [rawData, svgW])

  const yTicks = yScale ? yScale.ticks(5).filter(t => Number.isInteger(t)) : []

  // X-axis: thin out labels to avoid overlap
  const labelStep = dates.length > 0 ? Math.ceil(dates.length / Math.max(1, Math.floor((svgW - MARGIN.left - MARGIN.right) / 52))) : 1

  const fmtDate = iso => { const [, m, d] = iso.split('-'); return `${m}/${d}` }

  return (
    <Card style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text strong style={{ fontSize: 14 }}>Check-in Activity by Entrance</Text>
        <Segmented
          size="small"
          value={days}
          onChange={setDays}
          options={[
            { label: '7d',  value: 7  },
            { label: '14d', value: 14 },
            { label: '30d', value: 30 },
            { label: '90d', value: 90 },
          ]}
        />
      </div>

      {/* Legend */}
      {entrances.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
          {entrances.map(e => (
            <Space key={e} size={6}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: colorScale(e) }} />
              <Text style={{ fontSize: 12 }}>{e}</Text>
            </Space>
          ))}
        </div>
      )}

      <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : rawData.length === 0 ? (
          <Empty description="No check-in data for this period." style={{ padding: 40 }} />
        ) : (
          <>
            <svg width={svgW} height={CHART_H} style={{ display: 'block', overflow: 'visible' }}
              role="img" aria-label={`Stacked bar chart: daily check-ins per entrance over the last ${days} days`}>
              <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>

                {/* Horizontal gridlines */}
                {yTicks.map(t => (
                  <line key={t} x1={0} x2={innerW} y1={yScale(t)} y2={yScale(t)} stroke="#f0f0f0" strokeWidth={1} />
                ))}

                {/* Y-axis labels */}
                {yTicks.map(t => (
                  <text key={t} x={-6} y={yScale(t)} dy="0.35em" textAnchor="end"
                    style={{ fontSize: 11, fill: '#8c8c8c' }}>{t}</text>
                ))}

                {/* Axis lines */}
                <line x1={0} x2={0}     y1={0}      y2={innerH} stroke="#d9d9d9" />
                <line x1={0} x2={innerW} y1={innerH} y2={innerH} stroke="#d9d9d9" />

                {/* Stacked bars */}
                {stackedSeries.map(series =>
                  series.map((seg, di) => {
                    const x = xScale(dates[di])
                    const y0 = yScale(seg[1])
                    const h  = yScale(seg[0]) - y0
                    if (h <= 0) return null
                    return (
                      <rect
                        key={`${series.key}-${di}`}
                        x={x} y={y0}
                        width={xScale.bandwidth()} height={h}
                        fill={colorScale(series.key)}
                        opacity={tooltip && tooltip.date !== dates[di] ? 0.45 : 0.85}
                        onMouseEnter={e => setTooltip({
                          date: dates[di],
                          values: entrances.map(en => ({ name: en, count: seg.data[en] ?? 0 })),
                          x: e.clientX, y: e.clientY,
                        })}
                        onMouseMove={e => setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : t)}
                        onMouseLeave={() => setTooltip(null)}
                        style={{ cursor: 'default' }}
                      />
                    )
                  })
                )}

                {/* X-axis labels */}
                {dates.map((d, i) => {
                  if (i % labelStep !== 0) return null
                  return (
                    <text
                      key={d}
                      x={xScale(d) + xScale.bandwidth() / 2}
                      y={innerH + 16}
                      textAnchor="middle"
                      style={{ fontSize: 11, fill: '#8c8c8c' }}
                    >
                      {fmtDate(d)}
                    </text>
                  )
                })}
              </g>
            </svg>

            {/* Floating tooltip */}
            {tooltip && (
              <div style={{
                position: 'fixed', left: tooltip.x + 14, top: tooltip.y - 10,
                background: 'rgba(0,0,0,0.82)', color: '#fff',
                padding: '8px 12px', borderRadius: 6, fontSize: 12,
                pointerEvents: 'none', zIndex: 1000, minWidth: 130,
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{tooltip.date}</div>
                {tooltip.values.filter(v => v.count > 0).map(v => (
                  <div key={v.name} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                    <Space size={4}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, display: 'inline-block', background: colorScale(v.name) }} />
                      <span>{v.name}</span>
                    </Space>
                    <span style={{ fontWeight: 600 }}>{v.count}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EntrancesPage() {
  const { auth } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const locationId = searchParams.get('location') ? parseInt(searchParams.get('location'), 10) : null

  const [locations,     setLocations]    = useState([])
  const [porters,       setPorters]       = useState([])
  const [entrances,     setEntrances]     = useState([])
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState('')
  const [modalOpen,     setModalOpen]     = useState(false)
  const [editTarget,    setEditTarget]    = useState(null)
  const [saving,        setSaving]        = useState(false)
  const [gatekeeperMap, setGatekeeperMap] = useState({})
  const [assignTarget,  setAssignTarget]  = useState(null)
  const [assignSelected,setAssignSelected]= useState([])
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignSaving,  setAssignSaving]  = useState(false)
  const [excludedGatekeepers, setExcludedGatekeepers] = useState([])
  const [chartView, setChartView] = useState('activity')
  const [form] = Form.useForm()

  // Load locations list once
  useEffect(() => {
    getLocations(auth).then(setLocations).catch(() => setLocations([]))
    getGroupMembers(auth, 'Porters').then(setPorters).catch(() => setPorters([]))
  }, [auth])

  const load = useCallback(async () => {
    if (locationId == null) { setEntrances([]); setGatekeeperMap({}); return }
    setLoading(true); setError('')
    try {
      const list = await getEntrances(auth, locationId)
      setEntrances(list)
      const map = {}
      await Promise.all(list.map(async e => {
        try { map[e.id] = await getEntranceGatekeepers(auth, e.id) }
        catch { map[e.id] = [] }
      }))
      setGatekeeperMap(map)
    } catch (e) {
      setError('Failed to load: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [auth, locationId])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditTarget(null); form.resetFields(); setModalOpen(true) }
  const openEdit   = (e) => {
    setEditTarget(e)
    form.setFieldsValue({ name: e.name, description: e.description ?? '' })
    setModalOpen(true)
  }

  const openAssign = async (e) => {
    setAssignTarget(e); setAssignLoading(true)
    try {
      const [selected, excluded] = await Promise.all([
        getEntranceGatekeepers(auth, e.id),
        locationId != null ? getGatekeepersInOtherLocations(auth, locationId) : Promise.resolve([]),
      ])
      setAssignSelected(selected)
      setExcludedGatekeepers(excluded)
    } catch {
      setAssignSelected([]); setExcludedGatekeepers([])
    } finally { setAssignLoading(false) }
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      if (editTarget) {
        await updateEntrance(auth, editTarget.id, { name: values.name.trim(), description: values.description?.trim() || null })
      } else {
        await createEntrance(auth, { name: values.name.trim(), description: values.description?.trim() || null, locationId })
      }
      message.success(editTarget ? 'Entrance updated.' : 'Entrance created.')
      setModalOpen(false); await load()
    } catch (e) {
      if (e?.errorFields) return
      message.error('Failed: ' + (e.response?.data?.message ?? e.message))
    } finally { setSaving(false) }
  }

  const handleSaveAssign = async () => {
    setAssignSaving(true)
    try {
      await setEntranceGatekeepers(auth, assignTarget.id, assignSelected)
      message.success('Gatekeepers updated.')
      setAssignTarget(null)
      await load()
    } catch (e) {
      message.error('Failed: ' + e.message)
    } finally { setAssignSaving(false) }
  }

  const handleDelete = async (e) => {
    try { await deleteEntrance(auth, e.id); message.success('Deleted.'); await load() }
    catch (err) { message.error('Failed: ' + err.message) }
  }

  const columns = [
    {
      title: 'Name', dataIndex: 'name', key: 'name',
      render: (text) => <Space><LoginOutlined style={{ color: '#1677ff' }} /><strong>{text}</strong></Space>,
    },
    {
      title: 'Description', dataIndex: 'description', key: 'description',
      render: (text) => text
        ? <Text type="secondary">{text}</Text>
        : <Text type="secondary" italic>—</Text>,
    },
    {
      title: 'Assigned Gatekeepers', key: 'gatekeepers',
      render: (_, record) => {
        const assigned = gatekeeperMap[record.id] ?? []
        if (assigned.length === 0)
          return <Text type="secondary" italic>None</Text>
        return (
          <Space wrap>
            {assigned.map(uid => {
              const p = porters.find(x => x.id === uid)
              return (
                <Tag key={uid} color="purple">
                  {p ? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || uid : uid}
                </Tag>
              )
            })}
          </Space>
        )
      },
    },
    {
      title: 'Actions', key: 'actions', align: 'center', width: 130,
      render: (_, record) => (
        <Space>
          <Tooltip title="Assign gatekeepers">
            <Button size="small" type="primary" ghost icon={<TeamOutlined />} onClick={() => openAssign(record)}
              aria-label={`Assign gatekeepers to ${record.name}`} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}
              aria-label={`Edit entrance ${record.name}`} />
          </Tooltip>
          <Popconfirm
            title={`Delete "${record.name}"?`}
            description="This cannot be undone."
            onConfirm={() => handleDelete(record)}
            okText="Delete" okButtonProps={{ danger: true }}>
            <Button size="small" danger icon={<DeleteOutlined />}
              aria-label={`Delete entrance ${record.name}`} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const selectedLocation = locations.find(l => l.id === locationId) ?? null

  return (
    <Layout>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <LoginOutlined style={{ marginRight: 8 }} />
          Facility Entrances
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Manage physical entrances and assign gatekeepers. Select a location to begin.
        </Text>
      </div>

      {/* Location selector */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <EnvironmentOutlined style={{ color: '#8c8c8c' }} />
        <Select
          style={{ width: 280 }}
          placeholder="Select a location…"
          value={locationId}
          onChange={id => setSearchParams({ location: id })}
          options={locations.map(l => ({ value: l.id, label: l.name }))}
          allowClear
          onClear={() => setSearchParams({})}
          showSearch
          filterOption={(input, opt) => opt.label.toLowerCase().includes(input.toLowerCase())}
          aria-label="Select a location"
        />
        {selectedLocation && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {selectedLocation.entranceCount} entrance{selectedLocation.entranceCount !== 1 ? 's' : ''}
          </Text>
        )}
      </div>

      {locationId == null ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span>Select a location above to view and manage its entrances.</span>
          }
          style={{ padding: '60px 0' }}
        />
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <Segmented
              value={chartView}
              onChange={setChartView}
              options={[
                { label: 'Check-in Activity', value: 'activity' },
                { label: 'Flow',              value: 'flow'     },
              ]}
            />
          </div>

          {chartView === 'activity'
            ? <CheckinsChart auth={auth} locationId={locationId} />
            : <Card style={{ marginBottom: 24 }}><SankeyPanel /></Card>
          }

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>New Entrance</Button>
          </div>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

      {loading
        ? <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        : entrances.length === 0
          ? <Empty description="No entrances defined yet." />
          : <Table dataSource={entrances} columns={columns} rowKey="id" size="small" pagination={false} />
      }

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        title={editTarget ? `Edit — ${editTarget.name}` : 'New Entrance'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        confirmLoading={saving}
        okText={editTarget ? 'Save Changes' : 'Create'}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Required.' }]}>
            <Input autoFocus />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Optional…" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Assign Gatekeepers Modal */}
      <Modal
        open={Boolean(assignTarget)}
        title={<Space><TeamOutlined />Assign Gatekeepers — {assignTarget?.name}</Space>}
        onCancel={() => setAssignTarget(null)}
        onOk={handleSaveAssign}
        confirmLoading={assignSaving}
        okText={`Save (${assignSelected.length} selected)`}
        destroyOnHidden
      >
        {assignLoading
          ? <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
          : porters.length === 0
          ? <Text type="secondary">No gatekeepers found in the Porters group.</Text>
          : porters.map(p => {
              const excluded = excludedGatekeepers.includes(p.id)
              return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: excluded ? 'not-allowed' : 'pointer',
                  opacity: excluded ? 0.4 : 1,
                }} onClick={() => !excluded && setAssignSelected(prev =>
                  prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id]
                )}>
                  <Checkbox checked={assignSelected.includes(p.id)} disabled={excluded}
                    aria-label={excluded ? `${p.firstName ?? ''} ${p.lastName ?? ''} (${p.id}) — assigned to another location` : `${p.firstName ?? ''} ${p.lastName ?? ''} (${p.id})`}
                    onChange={() => !excluded && setAssignSelected(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} />
                  <Avatar style={{ background: '#531dab', flexShrink: 0 }}>
                    {(p.firstName?.[0] ?? p.id[0]).toUpperCase()}
                  </Avatar>
                  <div style={{ flex: 1 }}>
                    <div><strong>{p.firstName} {p.lastName}</strong></div>
                    <small style={{ color: '#888' }}>{p.id}</small>
                  </div>
                  {excluded && <Tag style={{ fontSize: 10 }}>other location</Tag>}
                </div>
              )
            })
        }
      </Modal>
        </>
      )}
    </Layout>
  )
}

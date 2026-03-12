import React, { useState, useEffect, useCallback } from 'react'
import {
  Button, Typography, Alert, Space, Spin, Tag, Table,
  Modal, Form, Input, Tooltip, Popconfirm, message, Empty,
  Collapse, Row, Col,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  EnvironmentOutlined, GlobalOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIconPng    from 'leaflet/dist/images/marker-icon.png'
import markerIcon2xPng  from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadowPng  from 'leaflet/dist/images/marker-shadow.png'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { getLocations, createLocation, updateLocation, deleteLocation } from '../api/operatonApi'

// Fix Leaflet default icon paths broken by Vite bundling
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl:       markerIconPng,
  iconRetinaUrl: markerIcon2xPng,
  shadowUrl:     markerShadowPng,
})

const { Title, Text } = Typography
const DEFAULT_CENTER  = [52.565124, 13.414247]
const DEFAULT_ZOOM    = 4
const DETAIL_ZOOM     = 14
const TILE_URL        = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTR       = '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'

// ── Map click handler (must be a child of MapContainer) ──────────────────────

function MapClickHandler({ onPositionChange }) {
  useMapEvents({ click: e => onPositionChange([e.latlng.lat, e.latlng.lng]) })
  return null
}

// ── Draggable marker with dragend callback ────────────────────────────────────

function DraggableMarker({ position, onPositionChange }) {
  return (
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend: e => {
          const { lat, lng } = e.target.getLatLng()
          onPositionChange([lat, lng])
        },
      }}
    />
  )
}

// ── Create / Edit modal ───────────────────────────────────────────────────────

function LocationModal({ open, editTarget, onSave, onCancel }) {
  const [form]       = Form.useForm()
  const [saving,     setSaving]     = useState(false)
  const [markerPos,  setMarkerPos]  = useState(null)
  const [mapCenter,  setMapCenter]  = useState(DEFAULT_CENTER)
  const [mapZoom,    setMapZoom]    = useState(DEFAULT_ZOOM)

  // Initialise form and map when modal opens
  useEffect(() => {
    if (!open) return
    if (editTarget) {
      form.setFieldsValue({
        name:        editTarget.name,
        description: editTarget.description ?? '',
        latitude:    editTarget.latitude  != null ? String(editTarget.latitude)  : '',
        longitude:   editTarget.longitude != null ? String(editTarget.longitude) : '',
      })
      if (editTarget.latitude != null && editTarget.longitude != null) {
        const pos = [editTarget.latitude, editTarget.longitude]
        setMarkerPos(pos)
        setMapCenter(pos)
        setMapZoom(DETAIL_ZOOM)
      } else {
        setMarkerPos(null)
        setMapCenter(DEFAULT_CENTER)
        setMapZoom(DEFAULT_ZOOM)
      }
    } else {
      form.resetFields()
      setMarkerPos(null)
      setMapCenter(DEFAULT_CENTER)
      setMapZoom(DEFAULT_ZOOM)
    }
  }, [open, editTarget, form])

  const handlePinDrop = ([lat, lng]) => {
    setMarkerPos([lat, lng])
    form.setFieldsValue({
      latitude:  lat.toFixed(8),
      longitude: lng.toFixed(8),
    })
  }

  const syncMarkerFromFields = () => {
    const lat = parseFloat(form.getFieldValue('latitude'))
    const lng = parseFloat(form.getFieldValue('longitude'))
    if (!isNaN(lat) && !isNaN(lng)) setMarkerPos([lat, lng])
  }

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      await onSave({
        name:        values.name.trim(),
        description: values.description?.trim() || null,
        latitude:    parseFloat(values.latitude),
        longitude:   parseFloat(values.longitude),
      })
    } catch (e) {
      if (e?.errorFields) return
      message.error('Failed: ' + (e.response?.data?.message ?? e.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title={editTarget ? `Edit — ${editTarget.name}` : 'New Location'}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={saving}
      okText={editTarget ? 'Save Changes' : 'Create'}
      destroyOnHidden
      width={620}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Required.' }]}>
          <Input autoFocus />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} placeholder="Optional…" />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="latitude" label="Latitude"
              rules={[
                { required: true, message: 'Required.' },
                { pattern: /^-?\d+(\.\d+)?$/, message: 'Must be a number.' },
              ]}
            >
              <Input placeholder="e.g. 52.565123" onBlur={syncMarkerFromFields} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="longitude" label="Longitude"
              rules={[
                { required: true, message: 'Required.' },
                { pattern: /^-?\d+(\.\d+)?$/, message: 'Must be a number.' },
              ]}
            >
              <Input placeholder="e.g. 13.414247" onBlur={syncMarkerFromFields} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Pick on map" style={{ marginBottom: 0 }}>
          <div style={{ height: 280, borderRadius: 8, overflow: 'hidden', border: '1px solid #d9d9d9' }}>
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
              <MapClickHandler onPositionChange={handlePinDrop} />
              {markerPos && (
                <DraggableMarker position={markerPos} onPositionChange={handlePinDrop} />
              )}
            </MapContainer>
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Click on the map to drop a pin, or drag the pin to adjust. You can also type coordinates directly above.
          </Text>
        </Form.Item>
      </Form>
    </Modal>
  )
}

// ── Delete confirmation modal ─────────────────────────────────────────────────

function DeleteModal({ target, onConfirm, onCancel, deleting }) {
  const [typed, setTyped] = useState('')

  useEffect(() => { if (!target) setTyped('') }, [target])

  return (
    <Modal
      open={Boolean(target)}
      title={<Space><ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />Delete Location</Space>}
      onCancel={onCancel}
      onOk={onConfirm}
      okText="Delete"
      okButtonProps={{ danger: true, disabled: typed !== target?.name, loading: deleting }}
      confirmLoading={deleting}
      destroyOnHidden
    >
      <Alert
        type="warning"
        showIcon
        message="All entrances must be removed before a location can be deleted."
        style={{ marginBottom: 16 }}
      />
      <Text>Type <strong>{target?.name}</strong> to confirm:</Text>
      <Input
        style={{ marginTop: 8 }}
        value={typed}
        onChange={e => setTyped(e.target.value)}
        placeholder={target?.name}
        onPressEnter={() => typed === target?.name && onConfirm()}
        aria-label={`Type ${target?.name ?? 'the location name'} to confirm deletion`}
      />
    </Modal>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LocationsPage() {
  const { auth } = useAuth()

  const [locations,    setLocations]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setLocations(await getLocations(auth)) }
    catch (e) { setError('Failed to load: ' + (e.response?.data?.message ?? e.message)) }
    finally { setLoading(false) }
  }, [auth])

  useEffect(() => { load() }, [load])

  const handleSave = async (data) => {
    if (editTarget) {
      await updateLocation(auth, editTarget.id, data)
      message.success('Location updated.')
    } else {
      await createLocation(auth, data)
      message.success('Location created.')
    }
    setModalOpen(false)
    await load()
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteLocation(auth, deleteTarget.id)
      message.success('Location deleted.')
      setDeleteTarget(null)
      await load()
    } catch (e) {
      message.error('Failed: ' + (e.response?.data?.message ?? e.message))
    } finally { setDeleting(false) }
  }

  const mapCenter = locations.find(l => l.latitude != null)
    ? [locations.find(l => l.latitude != null).latitude, locations.find(l => l.latitude != null).longitude]
    : DEFAULT_CENTER

  const columns = [
    {
      title: 'Name', dataIndex: 'name', key: 'name',
      render: t => <Space><EnvironmentOutlined style={{ color: '#1677ff' }} /><strong>{t}</strong></Space>,
    },
    {
      title: 'Description', dataIndex: 'description', key: 'description',
      render: t => t ? <Text type="secondary">{t}</Text> : <Text type="secondary" italic>—</Text>,
    },
    {
      title: 'Coordinates', key: 'coords',
      render: (_, loc) => loc.latitude != null
        ? <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
          </Text>
        : <Text type="secondary" italic>—</Text>,
    },
    {
      title: 'Entrances', dataIndex: 'entranceCount', key: 'entranceCount',
      align: 'center',
      render: c => <Tag color={c > 0 ? 'blue' : 'default'}>{c}</Tag>,
    },
    {
      title: 'Actions', key: 'actions', align: 'center', width: 110,
      render: (_, loc) => (
        <Space>
          <Tooltip title="Edit">
            <Button size="small" icon={<EditOutlined />}
              onClick={() => { setEditTarget(loc); setModalOpen(true) }}
              aria-label={`Edit location ${loc.name}`} />
          </Tooltip>
          <Tooltip title={loc.entranceCount > 0 ? 'Remove all entrances first' : 'Delete'}>
            <Button size="small" danger icon={<DeleteOutlined />}
              disabled={loc.entranceCount > 0}
              onClick={() => setDeleteTarget(loc)}
              aria-label={loc.entranceCount > 0 ? `Cannot delete ${loc.name} — remove entrances first` : `Delete location ${loc.name}`} />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <Layout>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <EnvironmentOutlined style={{ marginRight: 8 }} />
          Locations
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Manage facility locations. Entrances and gatekeepers are scoped to a location.
        </Text>
      </div>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

      {/* Overview map */}
      <Collapse defaultActiveKey={['map']} style={{ marginBottom: 24 }}>
        <Collapse.Panel
          key="map"
          header={<Space><GlobalOutlined style={{ color: '#1677ff' }} />Location Overview Map</Space>}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={locations.length === 1 && locations[0].latitude != null ? DETAIL_ZOOM : DEFAULT_ZOOM}
              style={{ height: 380, borderRadius: 4 }}
            >
              <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
              {locations.filter(l => l.latitude != null).map(loc => (
                <Marker key={loc.id} position={[loc.latitude, loc.longitude]}>
                  <Popup>
                    <strong>{loc.name}</strong>
                    {loc.description && <div style={{ marginTop: 4 }}>{loc.description}</div>}
                    <div style={{ marginTop: 6 }}>
                      <Tag color="blue">{loc.entranceCount} entrance{loc.entranceCount !== 1 ? 's' : ''}</Tag>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </Collapse.Panel>
      </Collapse>

      {/* CRUD table */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />}
          onClick={() => { setEditTarget(null); setModalOpen(true) }}>
          New Location
        </Button>
      </div>

      {loading
        ? <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        : locations.length === 0
          ? <Empty description="No locations defined yet." />
          : <Table dataSource={locations} columns={columns} rowKey="id" size="small" pagination={false} />
      }

      <LocationModal
        open={modalOpen}
        editTarget={editTarget}
        onSave={handleSave}
        onCancel={() => setModalOpen(false)}
      />

      <DeleteModal
        target={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        deleting={deleting}
      />
    </Layout>
  )
}

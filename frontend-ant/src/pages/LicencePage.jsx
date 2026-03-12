import React, { useState } from 'react'
import {
  Card, Alert, Form, Input, Switch, Button, Typography,
  Divider, Tag, Space, Row, Col, Upload, Tooltip, Spin,
} from 'antd'
import {
  SafetyCertificateOutlined, DownloadOutlined, LockOutlined,
  SafetyOutlined, TeamOutlined, BankOutlined, TrophyOutlined,
  InboxOutlined, CheckCircleOutlined, DeleteOutlined,
} from '@ant-design/icons'
import { useAuth }    from '../context/AuthContext'
import { useLicence } from '../context/LicenceContext'
import Layout         from '../components/Layout'

const { Text, Paragraph, Title } = Typography

// ── PoC constants (must match LicenceContext.jsx) ─────────────────────────────
const POC_SEED        = 'myLicense'
const PBKDF2_SALT     = 'visman-licence-v1'
const PBKDF2_ITER     = 100_000
const FILE_MAGIC      = new Uint8Array([0x56, 0x4D, 0x4C, 0x31]) // "VML1"

// ── Feature definitions ────────────────────────────────────────────────────────
const FEATURES = [
  {
    key: 'security',
    label: 'Security',
    icon: <SafetyOutlined />,
    color: '#d46b08',
    tagColor: 'orange',
    description:
      'Enables the Security officer workflow: reviewing visitor requests, approving, refusing, ' +
      'or blacklisting visitors, requesting clarifications from inviters, and managing the blacklist.',
  },
  {
    key: 'inviter',
    label: 'Inviter',
    icon: <TeamOutlined />,
    color: '#1677ff',
    tagColor: 'blue',
    description:
      'Enables invitation creation and management: submitting visit requests, selecting visitors ' +
      'and entrances, managing date ranges, and responding to security clarification questions.',
  },
  {
    key: 'gatekeeper',
    label: 'Gatekeeper',
    icon: <BankOutlined />,
    color: '#531dab',
    tagColor: 'purple',
    description:
      'Enables visitor check-in at physical entrances: the calendar-based visit dashboard, ' +
      'the check-in confirmation flow, and supervisor oversight of entrance operations.',
  },
  {
    key: 'gamification',
    label: 'Gamification',
    icon: <TrophyOutlined />,
    color: '#389e0d',
    tagColor: 'green',
    description:
      'Enables performance and statistics panels for all roles: streaks, check-in counts, ' +
      'reliability scores, and organisational-level metrics on the Performance page.',
  },
]

// ── Crypto helpers (encrypt — for Generate card) ───────────────────────────────
async function deriveEncryptKey() {
  const km = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(POC_SEED),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    {
      name:       'PBKDF2',
      salt:       new TextEncoder().encode(PBKDF2_SALT),
      iterations: PBKDF2_ITER,
      hash:       'SHA-256',
    },
    km,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  )
}

async function encryptLicence(payload) {
  const key = await deriveEncryptKey()
  const iv  = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(payload, null, 2)),
  )
  const blob = new Uint8Array(FILE_MAGIC.length + iv.length + ciphertext.byteLength)
  blob.set(FILE_MAGIC, 0)
  blob.set(iv,         FILE_MAGIC.length)
  blob.set(new Uint8Array(ciphertext), FILE_MAGIC.length + iv.length)
  return btoa(String.fromCharCode(...blob))
}

function triggerDownload(base64Content, filename) {
  const bytes = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0))
  const url   = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }))
  const a     = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}

// ── Shared FeatureRow used in both cards ──────────────────────────────────────
const VENDOR_TIP = 'Contact your vendor for a demo today!'

function FeatureRow({ f, checked, disabled, onChange }) {
  const isOn = checked && !disabled

  const inner = (
    <div
      style={{
        display:    'flex',
        gap:        14,
        alignItems: 'flex-start',
        padding:    '12px 16px',
        borderRadius: 8,
        border:     `1px solid ${isOn ? '#d9e8ff' : '#f0f0f0'}`,
        background: disabled ? '#fafafa' : isOn ? '#f0f7ff' : '#fafafa',
        transition: 'background 0.2s, border-color 0.2s',
        opacity:    disabled ? 0.5 : 1,
        cursor:     disabled ? 'not-allowed' : 'default',
      }}
    >
      <Switch
        checked={checked}
        disabled={disabled}
        onChange={val => !disabled && onChange(val)}
        style={{ marginTop: 3, flexShrink: 0 }}
        aria-label={`Toggle ${f.label} feature`}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Space size={6} style={{ flexWrap: 'wrap' }}>
          <span style={{ color: disabled ? '#bfbfbf' : f.color, fontSize: 15 }}>{f.icon}</span>
          <Text strong style={{ fontSize: 14, color: disabled ? '#bfbfbf' : undefined }}>
            {f.label}
          </Text>
          {disabled
            ? <Tag style={{ fontSize: 11 }}>Not Licensed</Tag>
            : <Tag color={isOn ? f.tagColor : 'default'} style={{ fontSize: 11 }}>
                {isOn ? 'Active' : 'Inactive'}
              </Tag>
          }
        </Space>
        <Paragraph
          type="secondary"
          style={{
            fontSize: 12, marginBottom: 0, marginTop: 5, lineHeight: 1.6,
            color: disabled ? '#d9d9d9' : undefined,
          }}
        >
          {f.description}
        </Paragraph>
      </div>
    </div>
  )

  return disabled
    ? <Tooltip title={VENDOR_TIP} placement="right">{inner}</Tooltip>
    : inner
}

// ── Generate card ─────────────────────────────────────────────────────────────
function GenerateCard({ auth }) {
  const [features,   setFeatures]   = useState({ security: false, inviter: false, gatekeeper: false, gamification: false })
  const [generating, setGenerating] = useState(false)
  const [lastFile,   setLastFile]   = useState(null)

  const activeCount = Object.values(features).filter(Boolean).length

  const handleGenerate = async () => {
    setGenerating(true)
    setLastFile(null)
    try {
      const payload  = { issuer: auth?.username ?? 'unknown', issuedAt: new Date().toISOString(), features, version: '1.0' }
      const base64   = await encryptLicence(payload)
      const filename = `visman-${new Date().toISOString().slice(0, 10)}.lic`
      triggerDownload(base64, filename)
      setLastFile(filename)
    } catch (err) {
      console.error('Licence generation failed:', err)
    } finally {
      setGenerating(false)
    }
  }

  const issueDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <Card
      title={<Space><SafetyCertificateOutlined style={{ color: '#1677ff', fontSize: 16 }} /><span>Generate Licence</span></Space>}
      style={{ marginBottom: 24 }}
    >
      <Form layout="vertical" requiredMark={false}>
        <Row gutter={24}>
          <Col xs={24} sm={12}>
            <Form.Item label="Issuer">
              <Input value={auth?.username ?? ''} readOnly
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                style={{ background: '#fafafa', cursor: 'default' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Issue date">
              <Input value={issueDate} readOnly
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                style={{ background: '#fafafa', cursor: 'default' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Licence seed password"
          extra={
            <Text type="secondary" style={{ fontSize: 12 }}>
              For this PoC the seed is always{' '}
              <code style={{ background: '#f5f5f5', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace' }}>
                {POC_SEED}
              </code>.
              Any value entered here is ignored — the password is stored outside the application.
            </Text>
          }
        >
          <Input.Password placeholder={POC_SEED} visibilityToggle={false} style={{ maxWidth: 300 }} />
        </Form.Item>

        <Divider orientation="left" style={{ fontSize: 13, color: '#595959' }}>Licensed features</Divider>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FEATURES.map(f => (
            <FeatureRow
              key={f.key}
              f={f}
              checked={features[f.key]}
              disabled={false}
              onChange={val => setFeatures(prev => ({ ...prev, [f.key]: val }))}
            />
          ))}
        </div>

        <Divider />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            loading={generating}
            onClick={handleGenerate}
            size="large"
            disabled={activeCount === 0}
          >
            Create Licence
          </Button>
          {activeCount === 0 && (
            <Text type="secondary" style={{ fontSize: 13 }}>
              Enable at least one feature to generate a licence.
            </Text>
          )}
          {lastFile && !generating && (
            <Text style={{ fontSize: 13, color: '#52c41a' }}>
              <CheckCircleOutlined style={{ marginRight: 6 }} />
              Downloaded as <code style={{ fontFamily: 'monospace', fontSize: 12 }}>{lastFile}</code>
            </Text>
          )}
        </div>

        {activeCount > 0 && (
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 10 }}>
            Output: AES-256-GCM encrypted · PBKDF2 key derivation (100 000 iterations, SHA-256) ·
            binary format <code style={{ fontFamily: 'monospace', fontSize: 11 }}>VML1</code> header + random IV + ciphertext.
          </Text>
        )}
      </Form>
    </Card>
  )
}

// ── Verify card ───────────────────────────────────────────────────────────────
function VerifyCard() {
  const { licenceLoaded, licenceMeta, featureLicenced, featureActive, loading, error, loadLicence, clearLicence, setFeatureActive } = useLicence()

  const handleUpload = (file) => {
    loadLicence(file)
    return false   // prevent Ant Design auto-upload
  }

  const formatDate = iso => {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch { return iso }
  }

  return (
    <Card
      title={
        <Space>
          <LockOutlined style={{ color: licenceLoaded ? '#52c41a' : '#8c8c8c', fontSize: 15 }} />
          <span>Verify Licence</span>
          {licenceLoaded && <Tag color="success" style={{ fontSize: 11 }}>Loaded</Tag>}
        </Space>
      }
    >
      <Spin spinning={loading}>

        {/* ── No licence state ── */}
        {!licenceLoaded && !error && (
          <>
            <Alert
              type="info"
              showIcon={false}
              style={{ marginBottom: 20, textAlign: 'center', borderRadius: 8 }}
              message={
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 1, color: '#d46b08' }}>
                    NO LICENCE UPLOADED
                  </div>
                  <div style={{ fontSize: 13, color: '#595959', marginTop: 4 }}>
                    For PoC only: all features are available
                  </div>
                </div>
              }
            />

            <Upload.Dragger
              accept=".lic"
              showUploadList={false}
              beforeUpload={handleUpload}
              style={{ marginBottom: 20 }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: 40, color: '#1677ff' }} />
              </p>
              <p className="ant-upload-text">Drop a <code>.lic</code> file here, or click to select</p>
              <p className="ant-upload-hint">
                The file will be decrypted using the stored seed and the licensed features will be applied.
              </p>
            </Upload.Dragger>

            <Divider orientation="left" style={{ fontSize: 13, color: '#595959' }}>
              Active features (PoC defaults — all on)
            </Divider>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FEATURES.map(f => (
                <FeatureRow
                  key={f.key}
                  f={f}
                  checked={featureActive[f.key]}
                  disabled={false}
                  onChange={val => setFeatureActive(f.key, val)}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Error state ── */}
        {error && (
          <>
            <Alert
              type="error"
              showIcon
              message="Invalid licence file"
              description={error}
              style={{ marginBottom: 20 }}
            />
            <Upload.Dragger
              accept=".lic"
              showUploadList={false}
              beforeUpload={handleUpload}
              style={{ marginBottom: 20 }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: 40 }} />
              </p>
              <p className="ant-upload-text">Try a different <code>.lic</code> file</p>
            </Upload.Dragger>
          </>
        )}

        {/* ── Licence loaded state ── */}
        {licenceLoaded && !error && (
          <>
            <Alert
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              style={{ marginBottom: 20 }}
              message="Licence loaded successfully"
              description={
                <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                  <div><strong>Issuer:</strong> {licenceMeta.issuer}</div>
                  <div><strong>Issued:</strong> {formatDate(licenceMeta.issuedAt)}</div>
                  <div><strong>Format version:</strong> {licenceMeta.version}</div>
                </div>
              }
            />

            <Divider orientation="left" style={{ fontSize: 13, color: '#595959' }}>
              Licensed features
            </Divider>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {FEATURES.map(f => {
                const isLicenced = !!featureLicenced?.[f.key]
                return (
                  <FeatureRow
                    key={f.key}
                    f={f}
                    checked={isLicenced ? featureActive[f.key] : false}
                    disabled={!isLicenced}
                    onChange={val => setFeatureActive(f.key, val)}
                  />
                )
              })}
            </div>

            <Divider />

            <Space wrap>
              <Upload
                accept=".lic"
                showUploadList={false}
                beforeUpload={handleUpload}
              >
                <Button icon={<InboxOutlined />}>Load a different licence</Button>
              </Upload>

              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={clearLicence}
              >
                Remove licence (revert to PoC defaults)
              </Button>
            </Space>
          </>
        )}

      </Spin>
    </Card>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function LicencePage() {
  const { auth } = useAuth()

  return (
    <Layout>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>

        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
          message="This page is only for the PoC — in real life, Licence Management does not reside in the software"
          description={
            <Text style={{ fontSize: 13 }}>
              In a production deployment the licence authority is an external, independent system.
              The mechanism shown here (password seed, feature flags, encrypted file) is a functional
              demonstration only.
            </Text>
          }
        />

        <GenerateCard auth={auth} />
        <VerifyCard />

      </div>
    </Layout>
  )
}

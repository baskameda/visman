import React from 'react'
import { Modal, Typography } from 'antd'
import { CheckCircleFilled, MobileOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

const { Text, Title } = Typography

const ROLE_META = {
  INVITER:    { color: '#1677ff', bg: '#e6f4ff', icon: '📬' },
  SECURITY:   { color: '#d46b08', bg: '#fff7e6', icon: '🛡️' },
  GATEKEEPER: { color: '#531dab', bg: '#f9f0ff', icon: '🏰' },
}

const ITEMS = ['i1', 'i2', 'i3', 'i4', 'i5']

export default function RoleAdoptionModal({ open, onClose, role }) {
  const { t } = useTranslation()
  if (!role || !ROLE_META[role]) return null

  const meta    = ROLE_META[role]
  const roleKey = role.toLowerCase()

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={onClose}
      title={null}
      width={560}
      styles={{ body: { padding: 0 } }}
      footer={null}
    >
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${meta.color}12, ${meta.color}06)`,
        borderBottom: `3px solid ${meta.color}`,
        padding: '28px 32px 22px',
        borderRadius: '8px 8px 0 0',
      }}>
        <div style={{ fontSize: 34, marginBottom: 10 }}>{meta.icon}</div>
        <Title level={3} style={{ margin: '0 0 6px', color: meta.color }}>
          {t(`roleAdoption.${roleKey}.title`)}
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {t('roleAdoption.subtitle')}
        </Text>
      </div>

      {/* Items */}
      <div style={{ padding: '24px 32px 28px' }}>
        {ITEMS.map(key => (
          <div key={key} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
            <CheckCircleFilled style={{ color: meta.color, fontSize: 16, marginTop: 2, flexShrink: 0 }} />
            <Text style={{ fontSize: 13, lineHeight: 1.6 }}>
              {t(`roleAdoption.${roleKey}.${key}`)}
            </Text>
          </div>
        ))}

        {/* Mobile callout */}
        <div style={{
          marginTop: 20,
          background: `${meta.color}08`,
          border: `1px solid ${meta.color}28`,
          borderRadius: 10,
          padding: '12px 16px',
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <MobileOutlined style={{ color: meta.color, fontSize: 18, marginTop: 1, flexShrink: 0 }} />
          <Text style={{ fontSize: 12, color: '#595959', lineHeight: 1.6, fontStyle: 'italic' }}>
            {t(`roleAdoption.${roleKey}.mobile`)}
          </Text>
        </div>
      </div>
    </Modal>
  )
}

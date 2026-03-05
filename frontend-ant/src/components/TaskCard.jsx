import React from 'react'
import { Card, Button, Tag, Divider, Skeleton, Space, Typography } from 'antd'
import { UserOutlined, CalendarOutlined } from '@ant-design/icons'
import ProcessFlowViz from './ProcessFlowViz'
import { useTranslation } from 'react-i18next'

const { Text } = Typography

export default function TaskCard({ task, variables, onAction, actionLabel, loading }) {
  const { t } = useTranslation()
  const visitorName = variables?.VName ?? '—'
  const visitDate   = variables?.VDate
    ? new Date(variables.VDate).toLocaleDateString()
    : '—'

  const reliabilityColor = (r) =>
    Number(r) > 60 ? 'success' : Number(r) > 30 ? 'warning' : 'error'

  return (
    <Card
      variant="borderless"
      style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        border: '1px solid #e8e8e8', borderRadius: 12,
        transition: 'box-shadow 0.2s ease',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
      styles={{ body: { padding: 16, display: 'flex', flexDirection: 'column', height: '100%' } }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text strong style={{ fontSize: 14 }}>{task.name}</Text>
        <Tag color="warning" style={{ margin: 0 }}>{t('taskCard.pending')}</Tag>
      </div>

      {/* Visitor info */}
      <Space direction="vertical" size={4} style={{ marginBottom: 16, flex: 1 }}>
        <Space size={6}>
          <UserOutlined style={{ color: '#8c8c8c', fontSize: 13 }} />
          {loading
            ? <Skeleton.Input active size="small" style={{ width: 120, height: 16 }} />
            : <Text type="secondary" style={{ fontSize: 13 }}>
                <Text strong style={{ fontSize: 13 }}>{t('taskCard.visitor')} </Text>{visitorName}
              </Text>
          }
        </Space>
        <Space size={6}>
          <CalendarOutlined style={{ color: '#8c8c8c', fontSize: 13 }} />
          {loading
            ? <Skeleton.Input active size="small" style={{ width: 100, height: 16 }} />
            : <Text type="secondary" style={{ fontSize: 13 }}>
                <Text strong style={{ fontSize: 13 }}>{t('taskCard.date')} </Text>{visitDate}
              </Text>
          }
        </Space>
        {variables?.reliability !== undefined && (
          <Space size={6} style={{ marginLeft: 19 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              <Text strong style={{ fontSize: 13 }}>{t('taskCard.reliability')} </Text>
              <Tag color={reliabilityColor(variables.reliability)} style={{ margin: 0, fontSize: 11 }}>
                {variables.reliability}
              </Tag>
            </Text>
          </Space>
        )}
        {task.assignee && (
          <Space size={6}>
            <UserOutlined style={{ color: '#8c8c8c', fontSize: 13 }} />
            <Text type="secondary" style={{ fontSize: 13 }}>
              <Text strong style={{ fontSize: 13 }}>{t('taskCard.assignee')} </Text>{task.assignee}
            </Text>
          </Space>
        )}
      </Space>

      <Divider style={{ margin: '0 0 12px' }} />

      {/* Process flow */}
      {loading
        ? <Skeleton.Input active style={{ width: '100%', height: 40, borderRadius: 8, marginBottom: 12 }} />
        : <div style={{ marginBottom: 12 }}>
            <ProcessFlowViz currentTaskKey={task.taskDefinitionKey} outcome="active" compact />
          </div>
      }

      {/* Action */}
      <Button type="primary" block onClick={() => onAction(task, variables)}>
        {actionLabel ?? t('taskCard.complete')}
      </Button>
    </Card>
  )
}

export function TaskCardSkeleton() {
  return (
    <Card variant="borderless" style={{ border: '1px solid #e8e8e8', borderRadius: 12 }}
      styles={{ body: { padding: 16 } }}>
      <Skeleton active paragraph={{ rows: 2 }} style={{ marginBottom: 12 }} />
      <Skeleton.Input active style={{ width: '100%', height: 40, borderRadius: 8, marginBottom: 12 }} />
      <Skeleton.Button active block style={{ height: 36, borderRadius: 8 }} />
    </Card>
  )
}

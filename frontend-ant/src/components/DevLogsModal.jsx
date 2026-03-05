import React from 'react'
import { Modal, Tag, Typography, Divider, Space } from 'antd'
import devLogs from '../data/devLogs'

const { Text, Title } = Typography

function fmt(iso) {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function DevLogsModal({ open, onClose }) {
  const totalHours = devLogs.reduce((s, r) => s + (r.hours ?? 0), 0)
  const totalCost  = devLogs.reduce((s, r) => s + (r.costUSD ?? 0), 0)

  return (
    <Modal open={open} onCancel={onClose} onOk={onClose} title={
      <div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Development Log</div>
        <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>Visitor Management POC — session history</Text>
      </div>
    } width={760} styles={{ body: { maxHeight: '70vh', overflowY: 'auto', padding: '16px 24px' } }}>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 24, padding: '14px 16px', background: '#f6f8fa', borderRadius: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          ['Total Sessions', devLogs.length, null],
          ['Total Dev Hours', `${totalHours.toFixed(1)} h`, null],
          ['Anthropic Cost', `$${totalCost.toFixed(2)}`, '#d46b08'],
          ['First Session', fmt(devLogs[0].start), null],
          ['Latest Session', fmt(devLogs[devLogs.length - 1].end), null],
        ].map(([label, value, color]) => (
          <div key={label}>
            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{label}</Text>
            <Text strong style={{ fontSize: 18, color: color ?? undefined }}>{value}</Text>
          </div>
        ))}
      </div>

      {/* Session list */}
      {devLogs.slice().reverse().map((s, i) => (
        <div key={s.session}>
          {i > 0 && <Divider style={{ margin: '16px 0' }} />}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <Space size={8} style={{ marginBottom: 4 }}>
                <Tag color="blue" style={{ fontWeight: 700, fontSize: 11 }}>Session {s.session}</Tag>
                <Text strong style={{ fontSize: 14 }}>{s.title}</Text>
              </Space>
              <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>{s.description}</Text>
              <Space size={24}>
                <div>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Start</Text>
                  <Text style={{ fontSize: 13, fontWeight: 500 }}>{fmt(s.start)}</Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>End</Text>
                  <Text style={{ fontSize: 13, fontWeight: 500 }}>{fmt(s.end)}</Text>
                </div>
              </Space>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{(s.hours ?? 0).toFixed(1)} h</div>
              <Text style={{ color: '#d46b08', fontWeight: 600 }}>${(s.costUSD ?? 0).toFixed(2)}</Text>
            </div>
          </div>
        </div>
      ))}
    </Modal>
  )
}

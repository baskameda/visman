import React from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown, Space, Typography } from 'antd'
import { CheckOutlined, DownOutlined } from '@ant-design/icons'
import { LANGUAGES, setUserLang } from '../i18n'
import { useAuth } from '../context/AuthContext'

export default function LanguageSwitcher() {
  const { i18n }  = useTranslation()
  const { auth }  = useAuth()
  const current   = LANGUAGES.find(l => l.code === i18n.language) ?? LANGUAGES[0]

  const handleSelect = ({ key }) => {
    i18n.changeLanguage(key)
    setUserLang(auth?.username, key)
  }

  const items = LANGUAGES.map(lang => ({
    key:   lang.code,
    label: (
      <Space style={{ minWidth: 140, justifyContent: 'space-between' }}>
        <Space>
          <span style={{ fontSize: '1.1rem' }}>{lang.flag}</span>
          <Typography.Text style={{ fontSize: 13 }}>{lang.label}</Typography.Text>
        </Space>
        {lang.code === i18n.language && (
          <CheckOutlined style={{ color: '#1677ff', fontSize: 12 }} />
        )}
      </Space>
    ),
  }))

  return (
    <Dropdown
      menu={{ items, onClick: handleSelect, selectedKeys: [current.code] }}
      trigger={['click']}
      placement="bottomRight"
    >
      <Space
        style={{
          cursor: 'pointer',
          padding: '4px 10px',
          borderRadius: 8,
          border: '1px solid #d9d9d9',
          background: '#fff',
          userSelect: 'none',
          lineHeight: 1,
        }}
      >
        <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{current.flag}</span>
        <Typography.Text style={{ fontSize: 13, fontWeight: 500, color: '#595959' }}>
          {current.label}
        </Typography.Text>
        <DownOutlined style={{ fontSize: 11, color: '#bfbfbf' }} />
      </Space>
    </Dropdown>
  )
}

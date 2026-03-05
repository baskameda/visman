import { theme as antdTheme } from 'antd'

// ─── Role colours (unchanged) ─────────────────────────────────────────────────
export const ROLE_COLORS = {
  INVITER:    { color: '#1677ff', bg: '#e6f4ff', border: '#91caff' },
  SECURITY:   { color: '#d46b08', bg: '#fff7e6', border: '#ffd591' },
  GATEKEEPER: { color: '#531dab', bg: '#f9f0ff', border: '#d3adf7' },
  ADMIN:      { color: '#389e0d', bg: '#f6ffed', border: '#b7eb8f' },
}

const shared = {
  colorPrimary:   '#1677ff',
  colorSuccess:   '#52c41a',
  colorWarning:   '#faad14',
  colorError:     '#ff4d4f',
  colorInfo:      '#1677ff',
  fontFamily:     "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize:       14,
  borderRadius:   8,
  borderRadiusLG: 12,
  borderRadiusSM: 4,
}

export const lightTheme = {
  algorithm: antdTheme.defaultAlgorithm,
  token: { ...shared, colorBgContainer: '#ffffff', colorBgLayout: '#f5f5f5' },
  components: {
    Layout: { siderBg: '#ffffff', headerBg: '#ffffff', bodyBg: '#f5f5f5', triggerBg: '#f0f0f0' },
    Menu:   { itemBg: 'transparent', itemSelectedBg: '#e6f4ff', itemSelectedColor: '#1677ff', itemHoverBg: '#f5f5f5' },
  },
}

export const darkTheme = {
  algorithm: antdTheme.darkAlgorithm,
  token: { ...shared, colorBgContainer: '#1f1f1f', colorBgLayout: '#141414' },
  components: {
    Layout: { siderBg: '#1f1f1f', headerBg: '#1f1f1f', bodyBg: '#141414', triggerBg: '#2a2a2a' },
    Menu:   { itemBg: 'transparent', itemSelectedBg: '#1677ff22', itemSelectedColor: '#4096ff', itemHoverBg: '#ffffff0d' },
  },
}

// legacy
export const antTheme = lightTheme

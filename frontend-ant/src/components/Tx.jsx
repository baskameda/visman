import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { saveOverride } from '../i18n/overrides'

/**
 * Drop-in replacement for {t('key')} that supports in-browser label editing.
 *
 * Usage:
 *   <Tx k="some.key" />
 *   <Tx k="some.key" vars={{ count: n }} />
 *
 * In normal mode: renders translated text inline.
 * In edit mode:   renders a clickable dashed outline span.
 *                 Clicking opens a window.prompt() to edit the label live.
 *                 Changes are saved to localStorage and applied immediately.
 *
 * Edit mode is activated by dispatching:
 *   window.dispatchEvent(new CustomEvent('labelEditModeChange', { detail: { active: true } }))
 */
export default function Tx({ k, vars }) {
  const { t, i18n } = useTranslation()
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    const handler = e => setEditMode(e.detail?.active ?? false)
    window.addEventListener('labelEditModeChange', handler)
    return () => window.removeEventListener('labelEditModeChange', handler)
  }, [])

  const current = t(k, vars ?? {})

  if (!editMode) return <>{current}</>

  const hasOverride = !!localStorage.getItem(`i18n_overrides:${i18n.language}`)
    && JSON.parse(localStorage.getItem(`i18n_overrides:${i18n.language}`) || '{}')[k]

  const handleClick = (e) => {
    e.stopPropagation()
    const next = window.prompt(`Edit label [${k}]:`, current)
    if (next !== null && next !== current) {
      saveOverride(i18n.language, k, next)
      i18n.addResourceBundle(i18n.language, 'translation', { [k]: next }, true, true)
    }
  }

  return (
    <span
      onClick={handleClick}
      title={`Edit: ${k}`}
      style={{
        outline: `2px dashed ${hasOverride ? '#fa8c16' : '#1677ff'}`,
        outlineOffset: 2,
        borderRadius: 3,
        cursor: 'pointer',
        padding: '0 2px',
      }}
    >
      {current}
    </span>
  )
}

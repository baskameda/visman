import React from 'react'
import { useTranslation } from 'react-i18next'
import { useLabelEdit }   from '../context/LabelEditContext'
import { getOverrides }   from '../i18n/overrides'
import Tx from './Tx'

/**
 * <Tx k="some.key" vars={{ count: 3 }} />
 *
 * In normal mode   → renders translated text exactly like t('some.key', vars)
 * In edit mode     → wraps text in a dashed box; click opens the edit dialog
 */
export default function Tx({ k, vars }) {
  const { t, i18n }              = useTranslation()
  const ctx                      = useLabelEdit()
  const editMode                 = ctx?.editMode ?? false
  const openEditDialog           = ctx?.openEditDialog

  const text       = t(k, vars)
  const isCustom   = editMode && getOverrides(i18n.language)[k] !== undefined

  if (!editMode) return text

  return (
    <span
      onClick={e => { e.stopPropagation(); openEditDialog(k) }}
      title={k}
      style={{
        cursor:       'pointer',
        outline:      isCustom ? '2px solid #faad14' : '1.5px dashed #1677ff',
        outlineOffset: 2,
        borderRadius:  3,
        backgroundColor: isCustom ? 'rgba(250,173,20,0.08)' : 'rgba(22,119,255,0.05)',
        padding:       '0 2px',
        display:       'inline',
        whiteSpace:    'pre-wrap',
      }}
    >
      {text}
    </span>
  )
}

import React, { createContext, useContext, useState, useCallback } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box, Alert, Chip,
} from '@mui/material'
import EditIcon    from '@mui/icons-material/Edit'
import RestoreIcon from '@mui/icons-material/SettingsBackupRestore'
import { useTranslation } from 'react-i18next'
import { saveOverride, deleteOverride, getBaseValue, flatToNested, getOverrides } from '../i18n/overrides'
import i18next from '../i18n'

const LabelEditContext = createContext(null)

export function useLabelEdit() {
  return useContext(LabelEditContext)
}

// Get the raw template string (with {{vars}}) for a dotted key from the live bundle
function getLiveTemplate(lang, key) {
  const bundle = i18next.getResourceBundle(lang, 'translation')
  if (!bundle) return key
  const val = key.split('.').reduce((o, k) => (o != null ? o[k] : null), bundle)
  return typeof val === 'string' ? val : key
}

export function LabelEditProvider({ children }) {
  const [editMode, setEditMode] = useState(false)
  const { i18n } = useTranslation()

  const [open, setOpen]       = useState(false)
  const [editKey, setEditKey] = useState('')
  const [value, setValue]     = useState('')
  const [isOverridden, setIsOverridden] = useState(false)

  const toggleEditMode = useCallback(() => setEditMode(m => !m), [])

  const openEditDialog = useCallback((key) => {
    const live    = getLiveTemplate(i18n.language, key)
    const already = getOverrides(i18n.language)[key] !== undefined
    setEditKey(key)
    setValue(live)
    setIsOverridden(already)
    setOpen(true)
  }, [i18n.language])

  const handleSave = useCallback(() => {
    saveOverride(i18n.language, editKey, value)
    i18next.addResourceBundle(
      i18n.language, 'translation',
      flatToNested({ [editKey]: value }),
      true, true
    )
    setOpen(false)
  }, [i18n.language, editKey, value])

  const handleReset = useCallback(() => {
    deleteOverride(i18n.language, editKey)
    const original = getBaseValue(i18n.language, editKey)
    i18next.addResourceBundle(
      i18n.language, 'translation',
      flatToNested({ [editKey]: original }),
      true, true
    )
    setOpen(false)
  }, [i18n.language, editKey])

  return (
    <LabelEditContext.Provider value={{ editMode, toggleEditMode, openEditDialog }}>
      {children}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon fontSize="small" color="warning" />
          Edit Label
          {isOverridden && (
            <Chip label="custom" size="small" color="warning" sx={{ ml: 1, height: 18, fontSize: '0.7rem' }} />
          )}
        </DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Key
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2, color: 'text.secondary', fontSize: '0.8rem' }}>
            {editKey}
          </Typography>

          <Alert severity="info" sx={{ mb: 2, py: 0.5 }} icon={false}>
            <Typography variant="caption">
              {'Use '}
              <code style={{ background: '#e8f4fd', borderRadius: 2, padding: '1px 4px' }}>
                {'{{variable}}'}
              </code>
              {' placeholders as-is — they are filled in at runtime.'}
            </Typography>
          </Alert>

          <TextField
            label="Label text"
            value={value}
            onChange={e => setValue(e.target.value)}
            fullWidth multiline minRows={2}
            autoFocus
            helperText={`Language: ${i18n.language.toUpperCase()}`}
          />

          {isOverridden && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Default: <em>{getBaseValue(i18n.language, editKey)}</em>
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
          <Box>
            {isOverridden && (
              <Button startIcon={<RestoreIcon />} color="error" size="small" onClick={handleReset}>
                Reset to default
              </Button>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="contained" color="warning" onClick={handleSave}>Save</Button>
          </Box>
        </DialogActions>
      </Dialog>
    </LabelEditContext.Provider>
  )
}

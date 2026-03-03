import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box, Menu, MenuItem, Typography, ListItemText, Tooltip,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { LANGUAGES, setUserLang } from '../i18n/index.js'
import { useAuth } from '../context/AuthContext'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const { auth } = useAuth()
  const [anchor, setAnchor] = useState(null)
  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0]

  const handleSelect = (code) => {
    i18n.changeLanguage(code)
    setUserLang(auth?.username, code)
    setAnchor(null)
  }

  return (
    <>
      <Tooltip title={current.label}>
        <Box
          onClick={e => setAnchor(e.currentTarget)}
          sx={{
            display: 'flex', alignItems: 'center', gap: 0.5,
            px: 1, py: 0.5, borderRadius: 1.5,
            cursor: 'pointer',
            border: '1px solid', borderColor: 'divider',
            '&:hover': { bgcolor: 'action.hover' },
            transition: 'background 0.15s ease',
          }}
        >
          <Typography sx={{ fontSize: '1.1rem', lineHeight: 1 }}>
            {current.flag}
          </Typography>
          <Typography variant='body2' sx={{ fontWeight: 500, fontSize: '0.8rem', color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
            {current.label}
          </Typography>
          <ExpandMoreIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        </Box>
      </Tooltip>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 160, borderRadius: 2, mt: 0.5 } } }}
      >
        {LANGUAGES.map(lang => (
          <MenuItem
            key={lang.code}
            selected={lang.code === i18n.language}
            onClick={() => handleSelect(lang.code)}
            dense
            sx={{ gap: 1 }}
          >
            <Typography sx={{ fontSize: '1.1rem', lineHeight: 1, mr: 0.5 }}>{lang.flag}</Typography>
            <ListItemText primary={lang.label} primaryTypographyProps={{ variant: 'body2' }} />
            {lang.code === i18n.language && (
              <CheckIcon fontSize='small' sx={{ color: 'primary.main', ml: 'auto' }} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

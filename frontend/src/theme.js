import { createTheme, alpha } from '@mui/material/styles'

// ─── Ant Design 5 light-theme tokens mapped to MUI ───────────────────────────
const AD = {
  colorPrimary:         '#1677ff',
  colorPrimaryHover:    '#4096ff',
  colorPrimaryDark:     '#0958d9',
  colorPrimaryBg:       '#e6f4ff',
  colorPrimaryBorder:   '#91caff',

  colorSuccess:         '#52c41a',
  colorSuccessBg:       '#f6ffed',
  colorWarning:         '#faad14',
  colorWarningBg:       '#fffbe6',
  colorError:           '#ff4d4f',
  colorErrorBg:         '#fff2f0',
  colorInfo:            '#1677ff',
  colorInfoBg:          '#e6f4ff',

  colorBgLayout:        '#f5f5f5',   // page background
  colorBgContainer:     '#ffffff',   // card/paper background
  colorBgSpotlight:     '#f0f0f0',

  colorBorder:          '#d9d9d9',
  colorBorderSecondary: '#f0f0f0',

  colorText:            'rgba(0,0,0,0.88)',
  colorTextSecondary:   'rgba(0,0,0,0.65)',
  colorTextTertiary:    'rgba(0,0,0,0.45)',
  colorTextQuaternary:  'rgba(0,0,0,0.25)',

  boxShadow:            '0 3px 8px rgba(0,0,0,0.24)',
  boxShadowCard:        '0 1px 2px rgba(0,0,0,0.03), 0 1px 6px rgba(0,0,0,0.04)',
}

const theme = createTheme({
  // ── Palette ────────────────────────────────────────────────────────────────
  palette: {
    primary: {
      main:          AD.colorPrimary,
      light:         AD.colorPrimaryHover,
      dark:          AD.colorPrimaryDark,
      contrastText:  '#fff',
    },
    secondary: {
      main:          '#722ed1',
      light:         '#9254de',
      dark:          '#531dab',
      contrastText:  '#fff',
    },
    success: {
      main:          AD.colorSuccess,
      contrastText:  '#fff',
    },
    warning: {
      main:          AD.colorWarning,
      contrastText:  '#fff',
    },
    error: {
      main:          AD.colorError,
      contrastText:  '#fff',
    },
    info: {
      main:          AD.colorInfo,
      contrastText:  '#fff',
    },
    background: {
      default:       AD.colorBgLayout,
      paper:         AD.colorBgContainer,
    },
    text: {
      primary:       AD.colorText,
      secondary:     AD.colorTextSecondary,
      disabled:      AD.colorTextQuaternary,
    },
    divider:         AD.colorBorder,
    action: {
      hover:         alpha(AD.colorPrimary, 0.04),
      selected:      alpha(AD.colorPrimary, 0.08),
      disabledBackground: AD.colorBgSpotlight,
    },
  },

  // ── Typography ─────────────────────────────────────────────────────────────
  typography: {
    fontFamily: '"Nunito Sans", sans-serif',
    fontSize:   14,
    fontWeightRegular: 400,
    fontWeightMedium:  600,
    fontWeightBold:    700,

    h1: { fontWeight: 700, fontSize: '2rem',    lineHeight: 1.3 },
    h2: { fontWeight: 700, fontSize: '1.714rem', lineHeight: 1.35 },
    h3: { fontWeight: 700, fontSize: '1.428rem', lineHeight: 1.4 },
    h4: { fontWeight: 700, fontSize: '1.214rem', lineHeight: 1.4 },
    h5: { fontWeight: 700, fontSize: '1.071rem', lineHeight: 1.45 },
    h6: { fontWeight: 700, fontSize: '0.928rem', lineHeight: 1.5 },

    subtitle1: { fontWeight: 600, fontSize: '0.928rem', lineHeight: 1.5 },
    subtitle2: { fontWeight: 600, fontSize: '0.857rem', lineHeight: 1.57 },
    body1:     { fontWeight: 400, fontSize: '0.928rem', lineHeight: 1.57 },
    body2:     { fontWeight: 400, fontSize: '0.857rem', lineHeight: 1.57 },
    caption:   { fontWeight: 400, fontSize: '0.785rem', lineHeight: 1.66 },
    button:    { fontWeight: 600, fontSize: '0.857rem', textTransform: 'none', letterSpacing: 0 },
    overline:  { fontWeight: 600, fontSize: '0.714rem', textTransform: 'uppercase', letterSpacing: '0.08em' },
  },

  // ── Shape ──────────────────────────────────────────────────────────────────
  shape: { borderRadius: 8 },

  // ── Shadows (lighter, Ant Design-style) ────────────────────────────────────
  shadows: [
    'none',
    '0 1px 2px rgba(0,0,0,0.04)',
    '0 1px 4px rgba(0,0,0,0.06)',
    AD.boxShadowCard,
    '0 4px 12px rgba(0,0,0,0.08)',
    '0 6px 16px rgba(0,0,0,0.08)',
    '0 8px 24px rgba(0,0,0,0.08)',
    '0 10px 32px rgba(0,0,0,0.10)',
    '0 12px 40px rgba(0,0,0,0.12)',
    '0 14px 48px rgba(0,0,0,0.14)',
    '0 16px 56px rgba(0,0,0,0.16)',
    '0 18px 64px rgba(0,0,0,0.18)',
    '0 20px 72px rgba(0,0,0,0.20)',
    AD.boxShadow,
    AD.boxShadow,
    AD.boxShadow,
    AD.boxShadow,
    AD.boxShadow,
    AD.boxShadow,
    AD.boxShadow,
    AD.boxShadow,
    AD.boxShadow,
    AD.boxShadow,
    AD.boxShadow,
    AD.boxShadow,
  ],

  // ── Component overrides ────────────────────────────────────────────────────
  components: {

    // Global baseline
    MuiCssBaseline: {
      styleOverrides: {
        html: { fontSize: 14 },
        body: {
          fontFamily: '"Nunito Sans", sans-serif',
          fontSize: 14,
          color: AD.colorText,
          backgroundColor: AD.colorBgLayout,
          '*::-webkit-scrollbar':       { width: 6, height: 6 },
          '*::-webkit-scrollbar-track': { background: AD.colorBgContainer },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor: AD.colorBorderSecondary,
            borderRadius: 10,
            border: `2px solid ${AD.colorBorderSecondary}`,
          },
        },
      },
    },

    // ── AppBar ──────────────────────────────────────────────────────────────
    MuiAppBar: {
      defaultProps:  { elevation: 0, color: 'inherit' },
      styleOverrides: {
        root: {
          backgroundColor: AD.colorBgContainer,
          color:           AD.colorText,
          boxShadow:       AD.boxShadow,
          borderBottom:    'none',
          minHeight:       '4.5rem',    // slightly shorter than 7rem – reasonable for our simpler header
          zIndex:          100,
        },
      },
    },

    // ── Toolbar ─────────────────────────────────────────────────────────────
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight:  '4.5rem !important',
          padding:    '0.75rem 2rem !important',
        },
      },
    },

    // ── Card ────────────────────────────────────────────────────────────────
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius:   10,
          border:         `1px solid ${AD.colorBorderSecondary}`,
          boxShadow:      AD.boxShadowCard,
          backgroundColor: AD.colorBgContainer,
          '&.MuiPaper-outlined': {
            border: `1px solid ${AD.colorBorder}`,
          },
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '1rem 1.25rem',
          '&:last-child': { paddingBottom: '1rem' },
        },
      },
    },

    MuiCardActions: {
      styleOverrides: {
        root: { padding: '0.5rem 1.25rem 1rem' },
      },
    },

    // ── Paper ───────────────────────────────────────────────────────────────
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: {
          border: `1px solid ${AD.colorBorder}`,
        },
        rounded: {
          borderRadius: 10,
        },
      },
    },

    // ── Button ──────────────────────────────────────────────────────────────
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius:  8,
          fontWeight:    600,
          textTransform: 'none',
          letterSpacing: 0,
          fontSize:      '0.857rem',
          padding:       '0.375rem 1rem',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 2px 8px rgba(22,119,255,0.25)' },
        },
        outlined: {
          borderColor: AD.colorBorder,
          '&:hover': { borderColor: AD.colorPrimary, backgroundColor: AD.colorPrimaryBg },
        },
        sizeSmall: {
          fontSize: '0.785rem',
          padding:  '0.25rem 0.75rem',
        },
        sizeLarge: {
          fontSize: '1rem',
          padding:  '0.625rem 1.5rem',
          borderRadius: 8,
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover': { backgroundColor: alpha(AD.colorPrimary, 0.06) },
        },
      },
    },

    // ── Text fields ─────────────────────────────────────────────────────────
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: AD.colorBgContainer,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: AD.colorPrimary,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: AD.colorPrimary,
            borderWidth:  1,
            boxShadow:    `0 0 0 2px ${alpha(AD.colorPrimary, 0.20)}`,
          },
        },
        notchedOutline: {
          borderColor: AD.colorBorder,
        },
        input: {
          padding: '0.625rem 0.875rem',
          fontSize: '0.928rem',
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.928rem',
          '&.Mui-focused': { color: AD.colorPrimary },
        },
      },
    },

    // ── Select ──────────────────────────────────────────────────────────────
    MuiSelect: {
      styleOverrides: {
        select: { borderRadius: 8 },
      },
    },

    // ── Chip ────────────────────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight:   600,
          fontSize:     '0.785rem',
          height:       24,
        },
        sizeSmall: {
          height:   20,
          fontSize: '0.714rem',
        },
        filled: {
          '&.MuiChip-colorDefault': {
            backgroundColor: AD.colorBgSpotlight,
            color: AD.colorTextSecondary,
          },
        },
        outlined: {
          borderColor: AD.colorBorder,
        },
      },
    },

    // ── Avatar ──────────────────────────────────────────────────────────────
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontSize:       '0.857rem',
          fontWeight:     700,
          backgroundColor: AD.colorPrimary,
        },
      },
    },

    // ── Tabs ────────────────────────────────────────────────────────────────
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 44,
          borderBottom: `1px solid ${AD.colorBorderSecondary}`,
        },
        indicator: {
          height:          3,
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
          backgroundColor: AD.colorPrimary,
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          minHeight:     44,
          padding:       '0 1rem',
          fontSize:      '0.857rem',
          fontWeight:    600,
          textTransform: 'none',
          letterSpacing: 0,
          color:         AD.colorTextSecondary,
          '&.Mui-selected': { color: AD.colorPrimary },
          '&:hover': {
            color:           AD.colorPrimary,
            backgroundColor: AD.colorPrimaryBg,
          },
        },
      },
    },

    // ── Table ───────────────────────────────────────────────────────────────
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: AD.colorBgLayout,
          '& .MuiTableCell-head': {
            fontWeight:   700,
            fontSize:     '0.785rem',
            color:        AD.colorTextSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderBottom: `1px solid ${AD.colorBorder}`,
            padding:      '0.625rem 1rem',
          },
        },
      },
    },

    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root': {
            transition: 'background-color 0.15s ease',
            '&:hover': { backgroundColor: alpha(AD.colorPrimary, 0.03) },
            '&:last-child td': { borderBottom: 0 },
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize:    '0.857rem',
          padding:     '0.625rem 1rem',
          borderColor: AD.colorBorderSecondary,
          color:       AD.colorText,
        },
      },
    },

    // ── Alert ───────────────────────────────────────────────────────────────
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize:     '0.857rem',
          fontWeight:   500,
          border:       '1px solid',
        },
        standardError:   { borderColor: '#ffa39e', backgroundColor: AD.colorErrorBg   },
        standardWarning: { borderColor: '#ffe58f', backgroundColor: AD.colorWarningBg },
        standardSuccess: { borderColor: '#b7eb8f', backgroundColor: AD.colorSuccessBg },
        standardInfo:    { borderColor: AD.colorPrimaryBorder, backgroundColor: AD.colorPrimaryBg },
      },
    },

    // ── Divider ─────────────────────────────────────────────────────────────
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: AD.colorBorderSecondary },
      },
    },

    // ── Linear progress ─────────────────────────────────────────────────────
    MuiLinearProgress: {
      styleOverrides: {
        root:        { borderRadius: 4, height: 4, backgroundColor: AD.colorPrimaryBg },
        bar:         { borderRadius: 4 },
      },
    },

    // ── Circular progress ────────────────────────────────────────────────────
    MuiCircularProgress: {
      defaultProps: { size: 20, thickness: 4 },
    },

    // ── Dialog ──────────────────────────────────────────────────────────────
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 10,
          boxShadow:    '0 20px 48px rgba(0,0,0,0.16)',
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          padding:    '1.25rem 1.5rem 0.75rem',
          fontSize:   '1.071rem',
          fontWeight: 700,
        },
      },
    },

    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '1rem 1.5rem',
          '&.MuiDialogContent-dividers': {
            borderColor: AD.colorBorderSecondary,
          },
        },
      },
    },

    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '0.75rem 1.5rem 1.25rem',
          gap:     '0.5rem',
          // pill buttons in dialogs – matching .ant-modal-footer button
          '& .MuiButton-root': { borderRadius: 50 },
        },
      },
    },

    // ── Slider ──────────────────────────────────────────────────────────────
    MuiSlider: {
      styleOverrides: {
        root:  { height: 6 },
        track: { borderRadius: 3 },
        rail:  { borderRadius: 3, backgroundColor: AD.colorBorderSecondary },
        thumb: {
          width:  18, height: 18,
          boxShadow: '0 2px 4px rgba(0,0,0,0.16)',
          '&:hover': { boxShadow: `0 0 0 6px ${alpha(AD.colorPrimary, 0.16)}` },
        },
        mark:      { backgroundColor: AD.colorBorder },
        markLabel: { fontSize: '0.714rem', color: AD.colorTextTertiary },
      },
    },

    // ── Tooltip ─────────────────────────────────────────────────────────────
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          fontSize:     '0.785rem',
          fontWeight:   500,
          backgroundColor: 'rgba(0,0,0,0.75)',
          padding:      '0.375rem 0.75rem',
        },
      },
    },

    // ── Skeleton ────────────────────────────────────────────────────────────
    MuiSkeleton: {
      defaultProps: { animation: 'wave' },
      styleOverrides: {
        root: { borderRadius: 6 },
      },
    },

    // ── Badge ────────────────────────────────────────────────────────────────
    MuiBadge: {
      styleOverrides: {
        badge: { fontWeight: 700, fontSize: '0.714rem' },
      },
    },
  },
})

export default theme

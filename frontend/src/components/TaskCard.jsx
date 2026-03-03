import React from 'react'
import {
  Card, CardContent, CardActions, Typography, Box,
  Chip, Button, Skeleton, Divider,
} from '@mui/material'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ProcessFlowViz from './ProcessFlowViz'

export default function TaskCard({ task, variables, onAction, actionLabel, loading }) {
  const visitorName = variables?.VName ?? '—'
  const visitDate   = variables?.VDate
    ? new Date(variables.VDate).toLocaleDateString()
    : '—'

  return (
    <Card variant="outlined" sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      transition: 'box-shadow 0.2s ease',
      '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
    }}>
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>{task.name}</Typography>
          <Chip label="Pending" color="warning" size="small" variant="outlined" />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonOutlineIcon fontSize="small" color="action" />
            {loading
              ? <Skeleton width={120} height={18} />
              : <Typography variant="body2" color="text.secondary">
                  <strong>Visitor:</strong> {visitorName}
                </Typography>
            }
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarTodayIcon fontSize="small" color="action" />
            {loading
              ? <Skeleton width={100} height={18} />
              : <Typography variant="body2" color="text.secondary">
                  <strong>Date:</strong> {visitDate}
                </Typography>
            }
          </Box>
          {variables?.reliability !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
                <strong>Reliability:</strong>{' '}
                <Chip
                  label={variables.reliability}
                  size="small"
                  color={Number(variables.reliability) > 60 ? 'success' : Number(variables.reliability) > 30 ? 'warning' : 'error'}
                  sx={{ height: 18, fontSize: '0.7rem' }}
                />
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        {loading
          ? <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 2 }} />
          : <ProcessFlowViz
              currentTaskKey={task.taskDefinitionKey}
              outcome="active"
              compact
            />
        }
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
        <Button variant="contained" fullWidth onClick={() => onAction(task, variables)}>
          {actionLabel ?? 'Complete'}
        </Button>
      </CardActions>
    </Card>
  )
}

export function TaskCardSkeleton() {
  return (
    <Card variant="outlined">
      <CardContent>
        <Skeleton variant="text" width="60%" height={28} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="70%" sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 2, mb: 1.5 }} />
        <Skeleton variant="rectangular" height={36} sx={{ borderRadius: 2 }} />
      </CardContent>
    </Card>
  )
}

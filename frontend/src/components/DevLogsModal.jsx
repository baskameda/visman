import React from "react"
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Divider, Chip,
} from "@mui/material"
import devLogs from "../data/devLogs"

function fmt(isoStr) {
  return new Date(isoStr).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function DevLogsModal({ open, onClose }) {
  const totalHours = devLogs.reduce((s, r) => s + r.hours, 0)
  const totalCost  = devLogs.reduce((s, r) => s + r.costUSD, 0)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" fontWeight={700}>Development Log</Typography>
        <Typography variant="body2" color="text.secondary">
          Visitor Management POC — session history
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {/* Summary row */}
        <Box sx={{
          display: "flex", gap: 3, mb: 3, p: 2,
          bgcolor: "#f6f8fa", borderRadius: 2, flexWrap: "wrap",
        }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">Total Sessions</Typography>
            <Typography variant="h5" fontWeight={700}>{devLogs.length}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">Total Dev Hours</Typography>
            <Typography variant="h5" fontWeight={700}>{(totalHours ?? 0).toFixed(1)} h</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">Total Anthropic Cost</Typography>
            <Typography variant="h5" fontWeight={700} color="#d46b08">${(totalCost ?? 0).toFixed(2)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">First Session</Typography>
            <Typography variant="body1" fontWeight={600}>{fmt(devLogs[0].start)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">Latest Session</Typography>
            <Typography variant="body1" fontWeight={600}>{fmt(devLogs[devLogs.length - 1].end)}</Typography>
          </Box>
        </Box>

        {/* Session list */}
        {devLogs.slice().reverse().map((s, i) => (
          <Box key={s.session} sx={{ mb: 2 }}>
            {i > 0 && <Divider sx={{ mb: 2 }} />}
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Chip label={"Session " + s.session} size="small"
                    sx={{ bgcolor: "#e6f4ff", color: "#1677ff", fontWeight: 700, fontSize: "0.7rem" }} />
                  <Typography variant="subtitle2" fontWeight={700}>{s.title}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{s.description}</Typography>
                <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Start</Typography>
                    <Typography variant="body2" fontWeight={500}>{fmt(s.start)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">End</Typography>
                    <Typography variant="body2" fontWeight={500}>{fmt(s.end)}</Typography>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                <Typography variant="h6" fontWeight={700}>{(s.hours ?? 0).toFixed(1)} h</Typography>
                <Typography variant="body2" color="#d46b08" fontWeight={600}>${(s.costUSD ?? 0).toFixed(2)}</Typography>
              </Box>
            </Box>
          </Box>
        ))}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} variant="contained" disableElevation>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

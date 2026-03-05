import { useState, useEffect, useCallback } from 'react'
import { getHistoricProcessesByStarter, getHistoricVariables } from '../api/operatonApi'

/**
 * Computes gamification stats for an inviter:
 *   - totalInvitations : number of process instances ever started by this user
 *   - approvalRate     : % of COMPLETED processes that were approved (reliability >= 50)
 *   - streak           : consecutive calendar days on which the user submitted ≥1 invite
 *   - milestone        : { level, label, next, nextLabel } derived from totalInvitations
 */
export function useInviterStats(auth) {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  const compute = useCallback(async () => {
    if (!auth) return
    setLoading(true)
    try {
      const processes = await getHistoricProcessesByStarter(auth, auth.username)

      const total = processes.length

      // ── Approval rate ────────────────────────────────────────────────────
      const completed = processes.filter(p => p.state === 'COMPLETED')
      let approved = 0
      await Promise.all(
        completed.map(async p => {
          try {
            const vars = await getHistoricVariables(auth, p.id)
            const rel = Number(vars.reliability ?? -1)
            if (rel >= 50) approved++
          } catch { /* variable fetch failed – skip */ }
        })
      )
      const approvalRate = completed.length > 0
        ? Math.round((approved / completed.length) * 100)
        : null

      // ── Streak ───────────────────────────────────────────────────────────
      // Use startTime of each process; group by calendar date (UTC date string)
      const days = new Set(
        processes.map(p => p.startTime?.slice(0, 10)).filter(Boolean)
      )
      const sortedDays = [...days].sort().reverse() // newest first

      let streak = 0
      if (sortedDays.length > 0) {
        const today   = new Date().toISOString().slice(0, 10)
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
        // Streak is valid if latest activity was today or yesterday
        if (sortedDays[0] === today || sortedDays[0] === yesterday) {
          streak = 1
          for (let i = 1; i < sortedDays.length; i++) {
            const prev = new Date(sortedDays[i - 1])
            const curr = new Date(sortedDays[i])
            const diff = (prev - curr) / 86400000
            if (diff === 1) streak++
            else break
          }
        }
      }

      // ── Milestone ────────────────────────────────────────────────────────
      const MILESTONES = [
        { min: 0,   level: 0, label: 'New Host',      next: 10,  nextLabel: 'Apprentice Host' },
        { min: 10,  level: 1, label: 'Apprentice Host', next: 25, nextLabel: 'Experienced Host' },
        { min: 25,  level: 2, label: 'Experienced Host', next: 50, nextLabel: 'Trusted Host' },
        { min: 50,  level: 3, label: 'Trusted Host',   next: 100, nextLabel: 'Elite Host' },
        { min: 100, level: 4, label: 'Elite Host',     next: null, nextLabel: null },
      ]
      const milestone = [...MILESTONES].reverse().find(m => total >= m.min) ?? MILESTONES[0]

      // ── Approval badge ───────────────────────────────────────────────────
      let approvalBadge = null
      if (approvalRate !== null) {
        if (approvalRate >= 90)     approvalBadge = { label: 'Trusted Host',   color: '#389e0d' }
        else if (approvalRate >= 75) approvalBadge = { label: 'Reliable',       color: '#1677ff' }
        else if (approvalRate >= 50) approvalBadge = { label: 'Building Trust', color: '#d46b08' }
        else                         approvalBadge = { label: 'Needs Attention', color: '#cc0000' }
      }

      setStats({ total, approvalRate, approvalBadge, streak, milestone })
    } catch (e) {
      console.error('useInviterStats error', e)
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [auth])

  useEffect(() => { compute() }, [compute])

  return { stats, loading, refresh: compute }
}

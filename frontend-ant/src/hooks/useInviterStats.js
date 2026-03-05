import { useState, useEffect, useCallback } from 'react'
import { getMyInvitations } from '../api/operatonApi'

/**
 * Gamification stats for an Inviter, derived from DB invitation history.
 *
 *  total         – total invitations created
 *  approvalRate  – % of invitations in APPROVED status
 *  streak        – consecutive calendar days with ≥1 invitation created (by startDate)
 *  milestone     – level object
 *  approvalBadge – { label, color } derived from approvalRate
 */
export function useInviterStats(auth) {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  const compute = useCallback(async () => {
    if (!auth) return
    setLoading(true)
    try {
      const invitations = await getMyInvitations(auth)

      const total = invitations.length

      // ── Approval rate ────────────────────────────────────────────────────
      const approved = invitations.filter(i => i.status === 'APPROVED').length
      const approvalRate = total > 0
        ? Math.round((approved / total) * 100)
        : null

      // ── Streak ───────────────────────────────────────────────────────────
      // Use startDate of each invitation; group by calendar date
      const msDay = 86400000
      const days = new Set(
        invitations.map(i => i.startDate?.slice(0, 10)).filter(Boolean)
      )
      const sortedDays = [...days].sort().reverse()

      let streak = 0
      if (sortedDays.length > 0) {
        const today     = new Date().toISOString().slice(0, 10)
        const yesterday = new Date(Date.now() - msDay).toISOString().slice(0, 10)
        if (sortedDays[0] === today || sortedDays[0] === yesterday) {
          streak = 1
          for (let i = 1; i < sortedDays.length; i++) {
            const diff = (new Date(sortedDays[i - 1]) - new Date(sortedDays[i])) / msDay
            if (diff === 1) streak++
            else break
          }
        }
      }

      // ── Milestone ────────────────────────────────────────────────────────
      const MILESTONES = [
        { min: 0,   level: 0, label: 'New Host',          next: 10,  nextLabel: 'Apprentice Host' },
        { min: 10,  level: 1, label: 'Apprentice Host',   next: 25,  nextLabel: 'Experienced Host' },
        { min: 25,  level: 2, label: 'Experienced Host',  next: 50,  nextLabel: 'Trusted Host' },
        { min: 50,  level: 3, label: 'Trusted Host',      next: 100, nextLabel: 'Elite Host' },
        { min: 100, level: 4, label: 'Elite Host',        next: null, nextLabel: null },
      ]
      const milestone = [...MILESTONES].reverse().find(m => total >= m.min) ?? MILESTONES[0]

      // ── Approval badge ───────────────────────────────────────────────────
      let approvalBadge = null
      if (approvalRate !== null) {
        if (approvalRate >= 90)      approvalBadge = { label: 'Trusted Host',    color: '#389e0d' }
        else if (approvalRate >= 75) approvalBadge = { label: 'Reliable',        color: '#1677ff' }
        else if (approvalRate >= 50) approvalBadge = { label: 'Building Trust',  color: '#d46b08' }
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

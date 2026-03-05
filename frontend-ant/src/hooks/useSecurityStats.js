import { useState, useEffect, useCallback } from 'react'
import { getMySecurityDecisions } from '../api/operatonApi'

/**
 * Gamification stats for a Security officer, derived from DB security-check history.
 *
 *  totalReviews      – all security checks reviewed by this user
 *  todayReviews      – decided today
 *  approvalRate      – % approved (status === 'APPROVED')
 *  reliabilityAvg    – average reliability score assigned
 *  streak            – consecutive calendar days with ≥1 completed review
 *  milestone         – level object
 */
export function useSecurityStats(auth) {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  const compute = useCallback(async () => {
    if (!auth) return
    setLoading(true)
    try {
      const checks = await getMySecurityDecisions(auth)

      const todayStr = new Date().toISOString().slice(0, 10)
      const msDay    = 86400000

      const totalReviews = checks.length
      const todayReviews = checks.filter(c => c.decidedAt?.slice(0, 10) === todayStr).length

      // ── Approval rate ─────────────────────────────────────────────────────
      const approved = checks.filter(c => c.status === 'APPROVED').length
      const refused  = checks.filter(c => c.status === 'REFUSED' || c.status === 'BLACKLISTED').length
      const approvalRate = checks.length > 0
        ? Math.round((approved / checks.length) * 100)
        : null

      // ── Reliability avg ───────────────────────────────────────────────────
      const withRel = checks.filter(c => c.reliability != null)
      const reliabilityAvg = withRel.length > 0
        ? Math.round(withRel.reduce((sum, c) => sum + c.reliability, 0) / withRel.length)
        : null

      // ── Streak ────────────────────────────────────────────────────────────
      const days = new Set(
        checks.map(c => c.decidedAt?.slice(0, 10)).filter(Boolean)
      )
      const sortedDays = [...days].sort().reverse()
      let streak = 0
      const yesterday = new Date(Date.now() - msDay).toISOString().slice(0, 10)
      if (sortedDays.length > 0 && (sortedDays[0] === todayStr || sortedDays[0] === yesterday)) {
        streak = 1
        for (let i = 1; i < sortedDays.length; i++) {
          const diff = (new Date(sortedDays[i - 1]) - new Date(sortedDays[i])) / msDay
          if (diff === 1) streak++
          else break
        }
      }

      // ── Milestone ─────────────────────────────────────────────────────────
      const MILESTONES = [
        { min: 0,   level: 0, label: 'Rookie Officer',   next: 10,  nextLabel: 'Junior Officer' },
        { min: 10,  level: 1, label: 'Junior Officer',   next: 50,  nextLabel: 'Security Analyst' },
        { min: 50,  level: 2, label: 'Security Analyst', next: 100, nextLabel: 'Senior Analyst' },
        { min: 100, level: 3, label: 'Senior Analyst',   next: 250, nextLabel: 'Security Expert' },
        { min: 250, level: 4, label: 'Security Expert',  next: null, nextLabel: null },
      ]
      const milestone = [...MILESTONES].reverse().find(m => totalReviews >= m.min) ?? MILESTONES[0]

      setStats({
        totalReviews, todayReviews,
        approved, refused,
        approvalRate, reliabilityAvg,
        streak, milestone,
        scoreCount: withRel.length,
      })
    } catch (e) {
      console.error('useSecurityStats error', e)
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [auth])

  useEffect(() => { compute() }, [compute])
  return { stats, loading, refresh: compute }
}

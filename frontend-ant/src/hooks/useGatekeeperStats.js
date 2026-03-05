import { useState, useEffect, useCallback } from 'react'
import { getMyCheckins } from '../api/operatonApi'

/**
 * Gamification stats for a Gatekeeper, derived from DB visit history.
 *
 *  totalCheckins     – all visits this user has checked in
 *  todayCheckins     – checked in today (by visitDate)
 *  streak            – consecutive calendar days with ≥1 check-in
 *  busiestHour       – hour of day with most check-ins (from checkedInAt)
 *  milestone         – level object
 *  onTimeRate        – % of visits checked in on the correct visitDate
 */
export function useGatekeeperStats(auth) {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  const compute = useCallback(async () => {
    if (!auth) return
    setLoading(true)
    try {
      const visits = await getMyCheckins(auth)

      const todayStr = new Date().toISOString().slice(0, 10)
      const msDay    = 86400000

      const totalCheckins = visits.length
      const todayCheckins = visits.filter(v => v.visitDate === todayStr).length

      // ── Streak ────────────────────────────────────────────────────────────
      // Use checkedInAt date for streak computation
      const days = new Set(
        visits.map(v => v.checkedInAt?.slice(0, 10)).filter(Boolean)
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

      // ── On-time rate ──────────────────────────────────────────────────────
      // "On time" = checked in on the same calendar day as visitDate
      const withDates = visits.filter(v => v.visitDate && v.checkedInAt)
      const onTimeCount = withDates.filter(v =>
        v.checkedInAt.slice(0, 10) === v.visitDate
      ).length
      const onTimeRate = withDates.length > 0
        ? Math.round((onTimeCount / withDates.length) * 100)
        : null

      // ── Busiest hour ──────────────────────────────────────────────────────
      const hourCounts = {}
      visits.forEach(v => {
        if (!v.checkedInAt) return
        const h = new Date(v.checkedInAt).getHours()
        hourCounts[h] = (hourCounts[h] ?? 0) + 1
      })
      const busiestEntry = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]
      const busiestHourLabel = busiestEntry
        ? `${String(busiestEntry[0]).padStart(2, '0')}:00–${String(Number(busiestEntry[0]) + 1).padStart(2, '0')}:00`
        : '—'

      // ── Milestone ─────────────────────────────────────────────────────────
      const MILESTONES = [
        { min: 0,   level: 0, label: 'Trainee Guard',    next: 10,  nextLabel: 'Gate Officer' },
        { min: 10,  level: 1, label: 'Gate Officer',     next: 50,  nextLabel: 'Senior Guard' },
        { min: 50,  level: 2, label: 'Senior Guard',     next: 100, nextLabel: 'Gate Captain' },
        { min: 100, level: 3, label: 'Gate Captain',     next: 250, nextLabel: 'Chief Gatekeeper' },
        { min: 250, level: 4, label: 'Chief Gatekeeper', next: null, nextLabel: null },
      ]
      const milestone = [...MILESTONES].reverse().find(m => totalCheckins >= m.min) ?? MILESTONES[0]

      setStats({
        totalCheckins, todayCheckins,
        streak, onTimeRate,
        busiestHourLabel,
        milestone,
      })
    } catch (e) {
      console.error('useGatekeeperStats error', e)
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [auth])

  useEffect(() => { compute() }, [compute])
  return { stats, loading, refresh: compute }
}

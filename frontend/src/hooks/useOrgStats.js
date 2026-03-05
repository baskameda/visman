import { useState, useEffect, useCallback } from 'react'
import { getHistoricProcesses, getHistoricVariables } from '../api/operatonApi'

/**
 * Org-wide gamification stats available to all roles:
 *
 *  healthScore     – avg hours from process start to COMPLETED end (lower = better)
 *  healthGrade     – A/B/C/D derived from healthScore
 *  weeklyDigest    – { thisWeek, lastWeek, busiestDay, fastestHours }
 *  challenge       – { target, current, label, deadline } read from localStorage
 *  leaderboard     – [{ name, count }] top inviters this month
 */
export function useOrgStats(auth) {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  const compute = useCallback(async () => {
    if (!auth) return
    setLoading(true)
    try {
      const processes = await getHistoricProcesses(auth)

      const now   = new Date()
      const msDay = 86400000

      // ── Process health score ──────────────────────────────────────────────
      const completed = processes.filter(p => p.state === 'COMPLETED' && p.startTime && p.endTime)
      let totalHours = 0
      const durations = completed.map(p => {
        const h = (new Date(p.endTime) - new Date(p.startTime)) / 3600000
        totalHours += h
        return h
      })
      const avgHours = completed.length > 0 ? totalHours / completed.length : null
      let healthGrade = '—'
      let healthColor = '#8c8c8c'
      if (avgHours !== null) {
        if (avgHours <= 4)       { healthGrade = 'A'; healthColor = '#389e0d' }
        else if (avgHours <= 12) { healthGrade = 'B'; healthColor = '#1677ff' }
        else if (avgHours <= 24) { healthGrade = 'C'; healthColor = '#d46b08' }
        else                     { healthGrade = 'D'; healthColor = '#cc0000' }
      }

      // ── Weekly digest ─────────────────────────────────────────────────────
      const startOfThisWeek = new Date(now)
      startOfThisWeek.setHours(0,0,0,0)
      startOfThisWeek.setDate(now.getDate() - now.getDay())

      const startOfLastWeek = new Date(startOfThisWeek - 7 * msDay)

      const thisWeekProcs = processes.filter(p =>
        p.startTime && new Date(p.startTime) >= startOfThisWeek
      )
      const lastWeekProcs = processes.filter(p => {
        const t = p.startTime && new Date(p.startTime)
        return t && t >= startOfLastWeek && t < startOfThisWeek
      })

      // Busiest day last 30 days
      const dayCounts = {}
      const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
      processes.forEach(p => {
        if (!p.startTime) return
        const d = new Date(p.startTime)
        if (now - d > 30 * msDay) return
        const key = DAY_NAMES[d.getDay()]
        dayCounts[key] = (dayCounts[key] ?? 0) + 1
      })
      const busiestDay = Object.entries(dayCounts).sort((a,b) => b[1]-a[1])[0]?.[0] ?? '—'

      // Fastest completed process
      const fastestHours = durations.length > 0 ? Math.min(...durations) : null

      // ── Leaderboard: top inviters this month ─────────────────────────────
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthProcs   = processes.filter(p =>
        p.startTime && new Date(p.startTime) >= startOfMonth
      )
      const inviterCounts = {}
      monthProcs.forEach(p => {
        const u = p.startUserId ?? 'unknown'
        inviterCounts[u] = (inviterCounts[u] ?? 0) + 1
      })
      const leaderboard = Object.entries(inviterCounts)
        .sort((a,b) => b[1]-a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }))

      // ── Seasonal challenge (stored in localStorage by admin) ──────────────
      let challenge = null
      try {
        const raw = localStorage.getItem('org_challenge')
        if (raw) {
          const cfg = JSON.parse(raw)
          const monthTotal = monthProcs.filter(p => p.state === 'COMPLETED').length
          challenge = {
            label:    cfg.label ?? 'Monthly Challenge',
            target:   cfg.target,
            current:  monthTotal,
            deadline: cfg.deadline,
            progress: Math.min(100, Math.round((monthTotal / cfg.target) * 100)),
          }
        }
      } catch { /* ignore */ }

      setStats({
        healthScore: avgHours, healthGrade, healthColor,
        totalProcesses: processes.length,
        completedProcesses: completed.length,
        weeklyDigest: {
          thisWeek: thisWeekProcs.length,
          lastWeek: lastWeekProcs.length,
          busiestDay,
          fastestHours,
        },
        leaderboard,
        challenge,
      })
    } catch (e) {
      console.error('useOrgStats error', e)
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [auth])

  useEffect(() => { compute() }, [compute])

  return { stats, loading, refresh: compute }
}

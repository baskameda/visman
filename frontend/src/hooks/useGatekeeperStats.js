import { useState, useEffect, useCallback } from 'react'
import { getHistoricTasksByAssignee, getHistoricVariables } from '../api/operatonApi'

const GATEKEEPER_TASK_KEY = 'Activity_03g8gtv'

/**
 * Gamification stats for a Gatekeeper:
 *
 *  totalCheckins     – all completed allow-visit tasks ever done by this user
 *  todayCheckins     – completed today
 *  avgMinutes        – average processing time (claim → complete)
 *  speedGrade        – S/A/B/C/D
 *  streak            – consecutive days with ≥1 completed check-in
 *  onTimeRate        – % of visitors processed within 30 min of VDate (same day)
 *  milestone         – level object
 *  busiestHour       – hour of day with most check-ins (0–23)
 */
export function useGatekeeperStats(auth) {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  const compute = useCallback(async () => {
    if (!auth) return
    setLoading(true)
    try {
      const tasks = await getHistoricTasksByAssignee(auth, auth.username)
      const gkTasks = tasks.filter(t => t.taskDefinitionKey === GATEKEEPER_TASK_KEY)

      const now      = new Date()
      const msDay    = 86400000
      const todayStr = now.toISOString().slice(0, 10)

      const totalCheckins = gkTasks.length
      const todayCheckins = gkTasks.filter(t => t.endTime?.slice(0, 10) === todayStr).length

      // ── Speed grade ───────────────────────────────────────────────────────
      const durations = gkTasks
        .filter(t => t.startTime && t.endTime)
        .map(t => (new Date(t.endTime) - new Date(t.startTime)) / 60000)

      const avgMinutes = durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : null

      let speedGrade = '—'; let speedColor = '#8c8c8c'
      if (avgMinutes !== null) {
        if (avgMinutes <= 2)       { speedGrade = 'S'; speedColor = '#531dab' }
        else if (avgMinutes <= 5)  { speedGrade = 'A'; speedColor = '#389e0d' }
        else if (avgMinutes <= 15) { speedGrade = 'B'; speedColor = '#1677ff' }
        else if (avgMinutes <= 30) { speedGrade = 'C'; speedColor = '#d46b08' }
        else                       { speedGrade = 'D'; speedColor = '#cc0000' }
      }

      // ── Streak ────────────────────────────────────────────────────────────
      const days = new Set(gkTasks.map(t => t.endTime?.slice(0, 10)).filter(Boolean))
      const sortedDays = [...days].sort().reverse()
      let streak = 0
      const yesterday = new Date(Date.now() - msDay).toISOString().slice(0, 10)
      if (sortedDays.length > 0 && (sortedDays[0] === todayStr || sortedDays[0] === yesterday)) {
        streak = 1
        for (let i = 1; i < sortedDays.length; i++) {
          const diff = (new Date(sortedDays[i-1]) - new Date(sortedDays[i])) / msDay
          if (diff === 1) streak++
          else break
        }
      }

      // ── On-time rate ──────────────────────────────────────────────────────
      // A check-in is "on time" if it was completed on the same calendar day as VDate
      const recentTasks = gkTasks.slice(0, 50)
      let onTimeCount = 0; let datedCount = 0
      await Promise.all(recentTasks.map(async t => {
        if (!t.endTime) return
        try {
          const vars = await getHistoricVariables(auth, t.processInstanceId)
          if (vars.VDate) {
            datedCount++
            const visitDay   = String(vars.VDate).slice(0, 10)
            const checkinDay = t.endTime.slice(0, 10)
            if (visitDay === checkinDay) onTimeCount++
          }
        } catch { /* skip */ }
      }))
      const onTimeRate = datedCount > 0
        ? Math.round((onTimeCount / datedCount) * 100)
        : null

      // ── Busiest hour ──────────────────────────────────────────────────────
      const hourCounts = {}
      gkTasks.forEach(t => {
        if (!t.endTime) return
        const h = new Date(t.endTime).getHours()
        hourCounts[h] = (hourCounts[h] ?? 0) + 1
      })
      const busiestHour = Object.entries(hourCounts).sort((a,b) => b[1]-a[1])[0]
      const busiestHourLabel = busiestHour
        ? `${String(busiestHour[0]).padStart(2,'0')}:00–${String(Number(busiestHour[0])+1).padStart(2,'0')}:00`
        : '—'

      // ── Milestone ─────────────────────────────────────────────────────────
      const MILESTONES = [
        { min: 0,   level: 0, label: 'Trainee Guard',   next: 10,  nextLabel: 'Gate Officer' },
        { min: 10,  level: 1, label: 'Gate Officer',    next: 50,  nextLabel: 'Senior Guard' },
        { min: 50,  level: 2, label: 'Senior Guard',    next: 100, nextLabel: 'Gate Captain' },
        { min: 100, level: 3, label: 'Gate Captain',    next: 250, nextLabel: 'Chief Gatekeeper' },
        { min: 250, level: 4, label: 'Chief Gatekeeper', next: null, nextLabel: null },
      ]
      const milestone = [...MILESTONES].reverse().find(m => totalCheckins >= m.min) ?? MILESTONES[0]

      setStats({
        totalCheckins, todayCheckins,
        avgMinutes, speedGrade, speedColor,
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

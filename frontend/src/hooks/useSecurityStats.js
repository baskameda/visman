import { useState, useEffect, useCallback } from 'react'
import { getHistoricTasksByAssignee, getHistoricVariables } from '../api/operatonApi'

const SECURITY_TASK_KEY = 'Activity_1ntxaf8'

/**
 * Gamification stats for a Security officer:
 *
 *  totalReviews      – all completed security checks ever done by this user
 *  todayReviews      – completed today
 *  avgMinutes        – average minutes from task claim to completion
 *  speedGrade        – S/A/B/C derived from avgMinutes
 *  scoreDistribution – { approved, rejected, total } based on reliability >= 50
 *  approvalRate      – % approved
 *  streak            – consecutive days with ≥1 completed review
 *  milestone         – level object
 *  reliabilityAvg    – average reliability score assigned
 */
export function useSecurityStats(auth) {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  const compute = useCallback(async () => {
    if (!auth) return
    setLoading(true)
    try {
      const tasks = await getHistoricTasksByAssignee(auth, auth.username)
      const secTasks = tasks.filter(t => t.taskDefinitionKey === SECURITY_TASK_KEY)

      const now   = new Date()
      const msDay = 86400000
      const todayStr = now.toISOString().slice(0, 10)

      const totalReviews = secTasks.length
      const todayReviews = secTasks.filter(t => t.endTime?.slice(0, 10) === todayStr).length

      // ── Speed score ───────────────────────────────────────────────────────
      const durations = secTasks
        .filter(t => t.startTime && t.endTime)
        .map(t => (new Date(t.endTime) - new Date(t.startTime)) / 60000) // minutes

      const avgMinutes = durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : null

      let speedGrade = '—'; let speedColor = '#8c8c8c'
      if (avgMinutes !== null) {
        if (avgMinutes <= 5)       { speedGrade = 'S'; speedColor = '#531dab' }
        else if (avgMinutes <= 15) { speedGrade = 'A'; speedColor = '#389e0d' }
        else if (avgMinutes <= 30) { speedGrade = 'B'; speedColor = '#1677ff' }
        else if (avgMinutes <= 60) { speedGrade = 'C'; speedColor = '#d46b08' }
        else                       { speedGrade = 'D'; speedColor = '#cc0000' }
      }

      // ── Score distribution ────────────────────────────────────────────────
      // Fetch reliability from historic variables for completed tasks
      const recentTasks = secTasks.slice(0, 50) // cap API calls
      const reliabilityScores = []
      await Promise.all(recentTasks.map(async t => {
        try {
          const vars = await getHistoricVariables(auth, t.processInstanceId)
          const rel = Number(vars.reliability)
          if (!isNaN(rel)) reliabilityScores.push(rel)
        } catch { /* skip */ }
      }))

      const approved = reliabilityScores.filter(r => r >= 50).length
      const rejected = reliabilityScores.filter(r => r < 50).length
      const approvalRate = reliabilityScores.length > 0
        ? Math.round((approved / reliabilityScores.length) * 100)
        : null
      const reliabilityAvg = reliabilityScores.length > 0
        ? Math.round(reliabilityScores.reduce((a, b) => a + b, 0) / reliabilityScores.length)
        : null

      // ── Streak ────────────────────────────────────────────────────────────
      const days = new Set(secTasks.map(t => t.endTime?.slice(0, 10)).filter(Boolean))
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

      // ── Milestone ─────────────────────────────────────────────────────────
      const MILESTONES = [
        { min: 0,   level: 0, label: 'Rookie Officer',    next: 10,  nextLabel: 'Junior Officer' },
        { min: 10,  level: 1, label: 'Junior Officer',    next: 50,  nextLabel: 'Security Analyst' },
        { min: 50,  level: 2, label: 'Security Analyst',  next: 100, nextLabel: 'Senior Analyst' },
        { min: 100, level: 3, label: 'Senior Analyst',    next: 250, nextLabel: 'Security Expert' },
        { min: 250, level: 4, label: 'Security Expert',   next: null, nextLabel: null },
      ]
      const milestone = [...MILESTONES].reverse().find(m => totalReviews >= m.min) ?? MILESTONES[0]

      setStats({
        totalReviews, todayReviews,
        avgMinutes, speedGrade, speedColor,
        approved, rejected,
        approvalRate, reliabilityAvg,
        streak, milestone,
        scoreCount: reliabilityScores.length,
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

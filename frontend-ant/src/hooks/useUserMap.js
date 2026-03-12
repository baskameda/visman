import { useState, useEffect } from 'react'
import { getUsers } from '../api/operatonApi'

/**
 * Fetches all Operaton users once and returns a map of username → { firstName, lastName }.
 * Used by dashboards to resolve usernames to display names.
 */
export function useUserMap(auth) {
  const [userMap, setUserMap] = useState({})

  useEffect(() => {
    if (!auth?.username) return
    getUsers(auth)
      .then(users => {
        const map = {}
        users.forEach(u => {
          map[u.id] = { firstName: u.firstName ?? '', lastName: u.lastName ?? '' }
        })
        setUserMap(map)
      })
      .catch(() => {})
  }, [auth?.username])

  return userMap
}

/**
 * Formats a username for display: "First Last (username)" or just "username" if no name set.
 */
export function formatUser(username, userMap) {
  if (!username) return null
  const u = userMap[username]
  if (!u) return username
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ')
  return name ? `${name} (${username})` : username
}

/**
 * Derives a human-readable process status from a security check object.
 * Returns { label, color, bg }.
 */
export function getCheckProcessStatus(sc) {
  if (!sc) return { label: 'Unknown', color: '#8c8c8c', bg: '#fafafa' }
  if (sc.status === 'APPROVED')    return { label: 'Approved',           color: '#389e0d', bg: '#f6ffed' }
  if (sc.status === 'REFUSED')     return { label: 'Refused',            color: '#cf1322', bg: '#fff2f0' }
  if (sc.status === 'BLACKLISTED') return { label: 'Blacklisted',        color: '#cf1322', bg: '#fff2f0' }
  // PENDING sub-states
  const n = sc.clarificationCount ?? 0
  const q = sc.clarificationQuestion
  const a = sc.clarificationAnswer
  if (q && !a) return { label: `Clarification Requested · ${n}/5`, color: '#d46b08', bg: '#fffbe6' }
  if (q &&  a) return { label: `Answer Received · ${n}/5`,         color: '#531dab', bg: '#f9f0ff' }
  if (!sc.assignedTo) return { label: 'Awaiting Assignment',        color: '#8c8c8c', bg: '#fafafa' }
  return { label: 'Under Review', color: '#1677ff', bg: '#e6f4ff' }
}

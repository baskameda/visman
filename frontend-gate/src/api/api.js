import axios from 'axios'

const ENGINE  = '/engine-rest'
const API     = '/api'

function ah(creds) {
  return { Authorization: 'Basic ' + btoa(`${creds.username}:${creds.password}`) }
}

export async function verifyIdentity(username, password) {
  const res = await axios.post(`${ENGINE}/identity/verify`, { username, password })
  return res.data // { authenticated: bool }
}

export async function getUserGroups(creds) {
  const res = await axios.get(`${ENGINE}/group`, {
    headers: ah(creds),
    params: { member: creds.username },
  })
  return res.data.map(g => g.id) // string[]
}

export async function getUserProfile(creds) {
  const res = await axios.get(`${ENGINE}/user/${encodeURIComponent(creds.username)}/profile`, {
    headers: ah(creds),
  })
  return res.data // { id, firstName, lastName, email }
}

/** Current week visits for gatekeeper's entrances. */
export async function getWeekVisits(creds, from, to) {
  const res = await axios.get(`${API}/visits/my`, {
    headers: ah(creds),
    params: { from, to },
  })
  return res.data // Visit[]
}

/**
 * Check in a visit.
 * lat/lng and checkinTime are optional — supply them for mobile offline check-ins.
 * checkinTime is ISO-8601 string ("2026-03-06T10:30:00.000Z") — backend stores it
 * as the actual check-in timestamp instead of server time.
 */
export async function checkinVisit(creds, visitId, lat, lng, checkinTime) {
  await axios.put(
    `${API}/visits/${visitId}/checkin`,
    { latitude: lat ?? null, longitude: lng ?? null, checkinTime: checkinTime ?? null },
    { headers: { ...ah(creds), 'Content-Type': 'application/json' } },
  )
}

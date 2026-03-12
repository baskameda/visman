import axios from 'axios'

const BASE      = '/engine-rest'
const API_BASE  = '/api'

function authHeader(credentials) {
  return { Authorization: 'Basic ' + btoa(`${credentials.username}:${credentials.password}`) }
}

function client(credentials) {
  return axios.create({
    baseURL: BASE,
    headers: { ...authHeader(credentials), 'Content-Type': 'application/json' },
  })
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function verifyIdentity(username, password) {
  const res = await axios.post(`${BASE}/identity/verify`, { username, password })
  return res.data // { authenticated: bool }
}

export async function getUserGroups(credentials) {
  const res = await client(credentials).get('/group', { params: { member: credentials.username } })
  return res.data // [{ id, name, type }]
}

export async function getUserProfile(credentials) {
  const res = await client(credentials).get(`/user/${encodeURIComponent(credentials.username)}/profile`)
  return res.data // { id, firstName, lastName, email }
}

// ─── BPMN task map ────────────────────────────────────────────────────────────

export async function getTasksByAssignee(credentials) {
  const res = await client(credentials).get('/task', { params: { assignee: credentials.username } })
  return res.data
}

export async function getTasksByGroup(credentials, groupId) {
  const res = await client(credentials).get('/task', { params: { candidateGroup: groupId } })
  return res.data
}

export async function getTaskLocalVariable(credentials, taskId, varName) {
  const res = await client(credentials).get(`/task/${taskId}/localVariables/${varName}`)
  return res.data // { value, type }
}

export async function claimTask(credentials, taskId) {
  await client(credentials).post(`/task/${taskId}/claim`, { userId: credentials.username })
}

// ─── Security checks ──────────────────────────────────────────────────────────

export async function getPendingMineChecks(credentials) {
  const res = await axios.get(`${API_BASE}/security-checks/pending/mine`, { headers: authHeader(credentials) })
  return res.data
}

export async function getPendingOthersChecks(credentials) {
  const res = await axios.get(`${API_BASE}/security-checks/pending/others`, { headers: authHeader(credentials) })
  return res.data
}

export async function claimSecurityCheck(credentials, id) {
  await axios.post(`${API_BASE}/security-checks/${id}/claim`, null, { headers: authHeader(credentials) })
}

export async function decideSecurityCheck(credentials, scId, taskId, { decision, reliability, note, clarificationQuestion }) {
  await axios.post(
    `${API_BASE}/security-checks/${scId}/decide`,
    {
      taskId,
      decision,
      reliability:           reliability ?? null,
      note:                  note         ?? null,
      clarificationQuestion: clarificationQuestion ?? null,
    },
    { headers: { ...authHeader(credentials), 'Content-Type': 'application/json' } }
  )
}

// ─── Build scId → BPMN task map ──────────────────────────────────────────────

export async function buildTaskMap(credentials) {
  const [assigned, candidate] = await Promise.all([
    getTasksByAssignee(credentials),
    getTasksByGroup(credentials, 'Security'),
  ])
  const merged = [...assigned]
  for (const t of candidate) {
    if (!merged.find(x => x.id === t.id)) merged.push(t)
  }
  const secTasks = merged.filter(t => t.taskDefinitionKey === 'Activity_SecurityCheck_V2')

  const map = {}
  await Promise.all(secTasks.map(async task => {
    try {
      const v = await getTaskLocalVariable(credentials, task.id, 'securityCheckId')
      map[v.value] = task
    } catch { /* task may have already been completed */ }
  }))
  return map
}

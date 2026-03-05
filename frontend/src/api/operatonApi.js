import axios from 'axios'

const BASE = '/engine-rest'

// Build an axios instance with Basic-Auth headers
function client(credentials) {
  return axios.create({
    baseURL: BASE,
    headers: {
      Authorization: 'Basic ' + btoa(`${credentials.username}:${credentials.password}`),
      'Content-Type': 'application/json',
    },
  })
}

// ─── Identity ────────────────────────────────────────────────────────────────

export async function verifyIdentity(username, password) {
  const res = await axios.post(`${BASE}/identity/verify`, { username, password })
  return res.data // { authenticated: true/false }
}

export async function getUserGroups(credentials) {
  const res = await client(credentials).get('/group', {
    params: { member: credentials.username },
  })
  return res.data // array of { id, name, type }
}

// ─── Process ─────────────────────────────────────────────────────────────────

const PROCESS_KEY = 'VisitProcess_1.0'

export async function startProcess(credentials) {
  const res = await client(credentials).post(
    `/process-definition/key/${encodeURIComponent(PROCESS_KEY)}/start`,
    { variables: {} }
  )
  return res.data // { id, definitionId, ... }
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function getTasksByAssignee(credentials) {
  const res = await client(credentials).get('/task', {
    params: { assignee: credentials.username },
  })
  return res.data
}

export async function getTasksByGroup(credentials, groupId) {
  const res = await client(credentials).get('/task', {
    params: { candidateGroup: groupId },
  })
  return res.data
}

export async function getTasksForProcess(credentials, processInstanceId) {
  const res = await client(credentials).get('/task', {
    params: { processInstanceId },
  })
  return res.data
}

export async function claimTask(credentials, taskId) {
  await client(credentials).post(`/task/${taskId}/claim`, {
    userId: credentials.username,
  })
}

export async function completeTask(credentials, taskId, variables) {
  // Convert plain object { key: value } → Operaton variable format
  const operatonVars = {}
  for (const [key, value] of Object.entries(variables)) {
    if (value === null || value === undefined) continue
    operatonVars[key] = { value }
  }
  await client(credentials).post(`/task/${taskId}/complete`, {
    variables: operatonVars,
  })
}

// ─── Process Variables ────────────────────────────────────────────────────────

export async function getProcessVariables(credentials, processInstanceId) {
  const res = await client(credentials).get(
    `/process-instance/${processInstanceId}/variables`
  )
  // Returns { varName: { value, type }, ... }
  const flat = {}
  for (const [k, v] of Object.entries(res.data)) {
    flat[k] = v.value
  }
  return flat
}

// ─── History (completed + refused processes) ─────────────────────────────────

export async function getHistoricProcesses(credentials) {
  const res = await client(credentials).get('/history/process-instance', {
    params: {
      processDefinitionKey: PROCESS_KEY,
      sortBy: 'startTime',
      sortOrder: 'desc',
      maxResults: 50,
    },
  })
  return res.data
}

export async function getHistoricVariables(credentials, processInstanceId) {
  const res = await client(credentials).get('/history/variable-instance', {
    params: { processInstanceId },
  })
  const flat = {}
  for (const v of res.data) {
    flat[v.name] = v.value
  }
  return flat
}

// ─── Admin ───────────────────────────────────────────────────────────────────

/** All active tasks across all instances of the visitor process */
export async function getAllActiveTasksForProcess(credentials) {
  const res = await client(credentials).get('/task', {
    params: { processDefinitionKey: PROCESS_KEY, maxResults: 200 },
  })
  return res.data
}

/** All currently active process instances */
export async function getActiveProcessInstances(credentials) {
  const res = await client(credentials).get('/process-instance', {
    params: { processDefinitionKey: PROCESS_KEY, maxResults: 200 },
  })
  return res.data
}

/** All users registered in Operaton */
export async function getUsers(credentials) {
  const res = await client(credentials).get('/user', {
    params: { maxResults: 100 },
  })
  return res.data
}

/** All groups registered in Operaton */
export async function getAllGroups(credentials) {
  const res = await client(credentials).get('/group', {
    params: { maxResults: 100 },
  })
  return res.data
}

/** Members of a specific group */
export async function getGroupMembers(credentials, groupId) {
  const res = await client(credentials).get('/user', {
    params: { memberOfGroup: groupId, maxResults: 100 },
  })
  return res.data
}

/** Historic activity instances for a process – used to determine refused step */
export async function getHistoricActivities(credentials, processInstanceId) {
  const res = await client(credentials).get('/history/activity-instance', {
    params: { processInstanceId, sortBy: 'startTime', sortOrder: 'asc' },
  })
  return res.data
}

// ─── Historic tasks per user ──────────────────────────────────────────────────

/**
 * Returns completed historic task instances assigned to a specific user.
 * Sorted newest-first.
 */
export async function getHistoricTasksByAssignee(credentials, userId) {
  const res = await client(credentials).get('/history/task', {
    params: {
      taskAssignee: userId,
      finished: true,
      sortBy: 'endTime',
      sortOrder: 'desc',
      maxResults: 200,
    },
  })
  return res.data // array of historic task objects
}

// ─── Bootstrap / admin creation ───────────────────────────────────────────────

const SYSTEM_CREDS = { username: 'admin', password: 'admin' }

/**
 * Returns users who are members of the given group.
 * Uses the system admin account – called before the user logs in.
 */
export async function getWebAdminUsers() {
  try {
    const res = await client(SYSTEM_CREDS).get('/user', {
      params: { memberOfGroup: 'webAdmins', maxResults: 10 },
    })
    return res.data // [] if group is empty or doesn't exist
  } catch {
    return []
  }
}

/**
 * Ensures the webAdmins group exists (ignores 500/conflict if it already does).
 */
async function ensureWebAdminsGroup() {
  try {
    await client(SYSTEM_CREDS).post('/group/create', {
      id:   'webAdmins',
      name: 'Web Admins',
      type: 'WORKFLOW',
    })
  } catch { /* already exists – that's fine */ }
}

/**
 * Creates the "Superhero" admin user and wires them into webAdmins.
 * Sequence: ensure group → create user → add membership.
 */
export async function createSuperheroAdmin() {
  await ensureWebAdminsGroup()

  // Create user
  await client(SYSTEM_CREDS).post('/user/create', {
    profile: {
      id:        'superhero',
      firstName: 'Superhero',
      lastName:  'Admin',
      email:     'superhero@visitor-poc.local',
    },
    credentials: { password: 'test123' },
  })

  // Add to webAdmins
  await client(SYSTEM_CREDS).put('/group/webAdmins/members/superhero')
}

// ─── User management (admin write operations) ─────────────────────────────────

/** Create a new user. Throws on conflict (user already exists). */
export async function createUser(credentials, { id, firstName, lastName, email, password }) {
  await client(credentials).post('/user/create', {
    profile:     { id, firstName, lastName, email: email || `${id}@visitor-poc.local` },
    credentials: { password },
  })
}

/** Delete a user by ID. */
export async function deleteUser(credentials, userId) {
  await client(credentials).delete(`/user/${userId}`)
}

/** Update a user's profile (firstName, lastName, email). */
export async function updateUser(credentials, userId, { firstName, lastName, email }) {
  await client(credentials).put(`/user/${userId}/profile`, { id: userId, firstName, lastName, email })
}

/** Update a user's password. */
export async function updateUserPassword(credentials, userId, newPassword) {
  await client(credentials).put(`/user/${userId}/credentials`, { password: newPassword })
}

// ─── Group management ─────────────────────────────────────────────────────────

/** Create a new group. */
export async function createGroup(credentials, { id, name, type = 'WORKFLOW' }) {
  await client(credentials).post('/group/create', { id, name, type })
}

/** Delete a group by ID. */
export async function deleteGroup(credentials, groupId) {
  await client(credentials).delete(`/group/${groupId}`)
}

// ─── Membership management ────────────────────────────────────────────────────

/** Add a user to a group. Silently ignores "already member" errors. */
export async function addMembership(credentials, userId, groupId) {
  try {
    await client(credentials).put(`/group/${groupId}/members/${userId}`)
  } catch (e) {
    if (e.response?.status !== 500) throw e
  }
}

/** Remove a user from a group. */
export async function removeMembership(credentials, userId, groupId) {
  await client(credentials).delete(`/group/${groupId}/members/${userId}`)
}

/** Historic process instances started by a specific user */
export async function getHistoricProcessesByStarter(credentials, userId) {
  const res = await client(credentials).get('/history/process-instance', {
    params: {
      processDefinitionKey: PROCESS_KEY,
      startedBy: userId,
      sortBy: 'startTime',
      sortOrder: 'desc',
      maxResults: 500,
    },
  })
  return res.data
}

// ─── Visitor Registry ─────────────────────────────────────────────────────────

const API_BASE = "/api"

/**
 * Search visitors previously created by the logged-in inviter.
 * q="" returns up to 20 recent visitors; any other value filters by name/company/email.
 * Ownership is enforced server-side — other inviters' visitors are never returned.
 */
export async function searchVisitors(credentials, q = "") {
  const res = await axios.get(`${API_BASE}/visitors/search`, {
    params: { q },
    headers: {
      Authorization: "Basic " + btoa(`${credentials.username}:${credentials.password}`),
    },
  })
  return res.data // array of Visitor { id, firstName, lastName, company, function, email, phone, description }
}

/**
 * Persist a new visitor to the registry.
 * The server assigns ownership to the authenticated user.
 */
export async function createVisitor(credentials, visitor) {
  const res = await axios.post(`${API_BASE}/visitors`, visitor, {
    headers: {
      Authorization: "Basic " + btoa(`${credentials.username}:${credentials.password}`),
      "Content-Type": "application/json",
    },
  })
  return res.data // saved Visitor with id
}


// ─── Visitor Blacklist ────────────────────────────────────────────────────────

/** Add a visitor to the blacklist (Security only). */
export async function setBlacklisted(credentials, visitorId) {
  await axios.put(`${API_BASE}/visitors/${visitorId}/blacklist`, null, {
    headers: { Authorization: "Basic " + btoa(`${credentials.username}:${credentials.password}`) },
  })
}

/** Remove a visitor from the blacklist (Security only). */
export async function clearBlacklisted(credentials, visitorId) {
  await axios.delete(`${API_BASE}/visitors/${visitorId}/blacklist`, {
    headers: { Authorization: "Basic " + btoa(`${credentials.username}:${credentials.password}`) },
  })
}

/** List all blacklisted visitors across all owners (Security view). */
export async function getBlacklistedVisitors(credentials) {
  const res = await axios.get(`${API_BASE}/visitors/blacklisted`, {
    headers: { Authorization: "Basic " + btoa(`${credentials.username}:${credentials.password}`) },
  })
  return res.data
}


// ─── Entrances ────────────────────────────────────────────────────────────────

const _ah = (creds) =>
  ({ Authorization: 'Basic ' + btoa(`${creds.username}:${creds.password}`) })

export async function getEntrances(credentials) {
  const res = await axios.get(`${API_BASE}/entrances`, { headers: _ah(credentials) })
  return res.data
}

export async function createEntrance(credentials, entrance) {
  const res = await axios.post(`${API_BASE}/entrances`, entrance, { headers: _ah(credentials) })
  return res.data
}

export async function updateEntrance(credentials, id, entrance) {
  await axios.put(`${API_BASE}/entrances/${id}`, entrance, { headers: _ah(credentials) })
}

export async function deleteEntrance(credentials, id) {
  await axios.delete(`${API_BASE}/entrances/${id}`, { headers: _ah(credentials) })
}

export async function getEntranceGatekeepers(credentials, entranceId) {
  const res = await axios.get(`${API_BASE}/entrances/${entranceId}/gatekeepers`, { headers: _ah(credentials) })
  return res.data
}

export async function setEntranceGatekeepers(credentials, entranceId, usernames) {
  await axios.put(`${API_BASE}/entrances/${entranceId}/gatekeepers`, usernames, { headers: _ah(credentials) })
}

export async function getMyEntrances(credentials) {
  const res = await axios.get(`${API_BASE}/entrances/my`, { headers: _ah(credentials) })
  return res.data
}

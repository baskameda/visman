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

const PROCESS_KEY = 'VisitProcess_2.0'

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

/**
 * Returns Allow-Visit tasks filtered server-side to only those whose entrance
 * is assigned to the authenticated gatekeeper.
 * @deprecated Use getMyVisits() instead for VisitProcess_2.0
 */
export async function getGatekeeperTasks(credentials) {
  const res = await axios.get(`${API_BASE}/tasks/gatekeeper`, { headers: _ah(credentials) })
  return res.data
}

// ─── Invitations (VisitProcess_2.0) ──────────────────────────────────────────

/** Create a new multi-visitor invitation and start the BPMN process. */
export async function createInvitation(credentials, body) {
  // body: { startDate, endDate, entranceId, company?, description?, visitors: [{id}|{firstName,lastName,company,...}] }
  const res = await axios.post(`${API_BASE}/invitations`, body, { headers: _ah(credentials) })
  return res.data
}

/** All invitations created by the authenticated user (with computed status). */
export async function getMyInvitations(credentials) {
  const res = await axios.get(`${API_BASE}/invitations/my`, { headers: _ah(credentials) })
  return res.data
}

/** Full invitation detail: visitors, their security-check statuses, and visit summaries. */
export async function getInvitation(credentials, id) {
  const res = await axios.get(`${API_BASE}/invitations/${id}`, { headers: _ah(credentials) })
  return res.data
}

// ─── SecurityChecks (VisitProcess_2.0) ───────────────────────────────────────

/**
 * Read a task-LOCAL variable (set via task.setVariableLocal in a TaskListener).
 * The /localVariables endpoint returns only variables scoped to the task itself.
 */
export async function getTaskLocalVariable(credentials, taskId, varName) {
  const res = await client(credentials).get(`/task/${taskId}/localVariables/${varName}`)
  return res.data // { value, type, valueInfo }
}

/** Full security-check detail including visitor and invitation fields. */
export async function getSecurityCheck(credentials, id) {
  const res = await axios.get(`${API_BASE}/security-checks/${id}`, { headers: _ah(credentials) })
  return res.data
}

/**
 * Submit a security decision for a visitor.
 * Also completes the associated BPMN user task internally.
 */
export async function decideSecurityCheck(credentials, scId, taskId, { decision, reliability, note, clarificationQuestion }) {
  await axios.post(`${API_BASE}/security-checks/${scId}/decide`, {
    taskId,
    decision,
    reliability: reliability ?? null,
    note:       note        ?? null,
    clarificationQuestion: clarificationQuestion ?? null,
  }, { headers: _ah(credentials) })
}

/**
 * Submit the inviter's clarification answer.
 * Also completes the associated BPMN clarification user task internally.
 */
export async function clarifySecurityCheck(credentials, scId, taskId, answer) {
  await axios.post(`${API_BASE}/security-checks/${scId}/clarify`, {
    taskId,
    answer,
  }, { headers: _ah(credentials) })
}

// ─── Visits (VisitProcess_2.0) ────────────────────────────────────────────────

/** All visits assigned to the gatekeeper's entrances (PENDING + recent). */
export async function getMyVisits(credentials) {
  const res = await axios.get(`${API_BASE}/visits/my`, { headers: _ah(credentials) })
  return res.data
}

/** Mark a visit as CHECKED_IN. Returns 204; throws on conflict (already checked in). */
export async function checkInVisit(credentials, visitId) {
  await axios.put(`${API_BASE}/visits/${visitId}/checkin`, null, { headers: _ah(credentials) })
}

/** Lightweight date-index: visit counts per date for the gatekeeper's entrances. */
export async function getMyVisitDateIndex(credentials) {
  const res = await axios.get(`${API_BASE}/visits/my/date-index`, { headers: _ah(credentials) })
  return res.data
}

/** Visits for the gatekeeper's entrances within a specific date range (ISO strings). */
export async function getMyVisitsForWeek(credentials, from, to) {
  const res = await axios.get(`${API_BASE}/visits/my`, {
    headers: _ah(credentials),
    params: { from, to },
  })
  return res.data
}

/** All visits personally checked in by the authenticated gatekeeper — for historical stats. */
export async function getMyCheckins(credentials) {
  const res = await axios.get(`${API_BASE}/visits/my-checkins`, { headers: _ah(credentials) })
  return res.data
}

/** All security checks where the authenticated user is the reviewer — for historical stats. */
export async function getMySecurityDecisions(credentials) {
  const res = await axios.get(`${API_BASE}/security-checks/my-decisions`, { headers: _ah(credentials) })
  return res.data
}

// ─── Supervisor ───────────────────────────────────────────────────────────────

export async function amISupervisor(credentials) {
  const res = await axios.get(`${API_BASE}/supervisor/am-i-supervisor`, { headers: _ah(credentials) })
  return res.data // { supervisor: true/false }
}

export async function getSuperviseeInvitations(credentials) {
  const res = await axios.get(`${API_BASE}/supervisor/supervisee-invitations`, { headers: _ah(credentials) })
  return res.data
}

export async function claimInvitation(credentials, invitationId, visitorId) {
  await axios.post(`${API_BASE}/supervisor/claim/${invitationId}/visitor/${visitorId}`, null, {
    headers: _ah(credentials),
  })
}

export async function getSupervisorAssignments(credentials) {
  const res = await axios.get(`${API_BASE}/supervisor/assignments`, { headers: _ah(credentials) })
  return res.data
}

export async function setSupervisorAssignment(credentials, inviterUsername, supervisorUsername) {
  await axios.put(`${API_BASE}/supervisor/assignments`, { inviterUsername, supervisorUsername }, {
    headers: { ..._ah(credentials), 'Content-Type': 'application/json' },
  })
}

export async function removeSupervisorAssignment(credentials, inviterUsername) {
  await axios.delete(`${API_BASE}/supervisor/assignments/${encodeURIComponent(inviterUsername)}`, {
    headers: _ah(credentials),
  })
}

export async function getSupervisableInviters(credentials) {
  const res = await axios.get(`${API_BASE}/supervisor/inviters`, { headers: _ah(credentials) })
  return res.data
}

// ─── Security Supervisor ──────────────────────────────────────────────────────

export async function amISecuritySupervisor(credentials) {
  const res = await axios.get(`${API_BASE}/supervisor/security/am-i-supervisor`, { headers: _ah(credentials) })
  return res.data // { supervisor: true/false }
}

export async function getPendingMineChecks(credentials) {
  const res = await axios.get(`${API_BASE}/security-checks/pending/mine`, { headers: _ah(credentials) })
  return res.data
}

export async function getPendingOthersChecks(credentials) {
  const res = await axios.get(`${API_BASE}/security-checks/pending/others`, { headers: _ah(credentials) })
  return res.data
}

export async function getPendingSuperviseeChecks(credentials) {
  const res = await axios.get(`${API_BASE}/security-checks/pending/supervisees`, { headers: _ah(credentials) })
  return res.data
}

export async function claimSecurityCheck(credentials, id) {
  await axios.post(`${API_BASE}/security-checks/${id}/claim`, null, { headers: _ah(credentials) })
}

export async function getSecuritySupervisorAssignments(credentials) {
  const res = await axios.get(`${API_BASE}/supervisor/security/assignments`, { headers: _ah(credentials) })
  return res.data
}

export async function setSecuritySupervisorAssignment(credentials, officerUsername, supervisorUsername) {
  await axios.put(`${API_BASE}/supervisor/security/assignments`, { officerUsername, supervisorUsername }, {
    headers: { ..._ah(credentials), 'Content-Type': 'application/json' },
  })
}

export async function removeSecuritySupervisorAssignment(credentials, officerUsername) {
  await axios.delete(`${API_BASE}/supervisor/security/assignments/${encodeURIComponent(officerUsername)}`, {
    headers: _ah(credentials),
  })
}

export async function getSecurityOfficers(credentials) {
  const res = await axios.get(`${API_BASE}/supervisor/security/officers`, { headers: _ah(credentials) })
  return res.data
}

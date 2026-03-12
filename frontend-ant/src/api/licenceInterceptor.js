/**
 * Licence-enforcement axios interceptor.
 *
 * Installed once at module-import time (see main.jsx).
 * Reads activeFeaturesRef — a plain object kept in sync by LicenceProvider —
 * so it can access current feature flags without being inside the React tree.
 *
 * Scope: only the global axios instance is intercepted. Calls made through
 * axios.create() instances (engine-rest via client()) are NOT intercepted here;
 * those are covered by UI-level route guards and nav filtering.
 */

import axios from 'axios'
import { activeFeaturesRef } from '../context/LicenceContext'

// ── Endpoint → feature mapping ────────────────────────────────────────────────
// Each entry: [feature key, ...URL prefix strings that belong to that feature]
// A request is blocked when its URL starts with any of the listed prefixes
// AND the corresponding feature is currently inactive.

const RULES = [
  {
    feature: 'security',
    prefixes: [
      '/api/security-checks',
      '/api/supervisor/security',
    ],
  },
  {
    feature: 'inviter',
    prefixes: [
      '/api/invitations',
      '/api/visitors',
      '/api/supervisor/supervisee-invitations',
      '/api/supervisor/claim/',
    ],
  },
  {
    feature: 'gatekeeper',
    prefixes: [
      '/api/visits/my',
      '/api/visits/supervisees',
      '/api/entrances/my',
      '/api/supervisor/gatekeeper',
    ],
  },
  {
    feature: 'gamification',
    prefixes: [
      '/api/visits/my-checkins',
      '/api/security-checks/my-decisions',
      '/api/visits/stats',
    ],
  },
]

function blockedFeatureFor(url) {
  if (!url) return null
  const features = activeFeaturesRef.current
  for (const { feature, prefixes } of RULES) {
    if (features[feature]) continue          // feature is active — allow
    for (const prefix of prefixes) {
      if (url.startsWith(prefix)) return feature
    }
  }
  return null
}

// ── Install interceptor ───────────────────────────────────────────────────────
axios.interceptors.request.use(config => {
  const blocked = blockedFeatureFor(config.url ?? '')
  if (blocked) {
    const label = blocked.charAt(0).toUpperCase() + blocked.slice(1)
    const err   = new Error(`Feature not licensed: ${label}`)
    err.response = {
      status: 403,
      data:   { message: `The '${label}' feature is not enabled in the current licence. Contact your vendor.` },
    }
    err.isLicenceBlock = true    // flag so callers can distinguish from server 403s
    return Promise.reject(err)
  }
  return config
})

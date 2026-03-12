import React, { createContext, useContext, useState } from 'react'

// ── PoC constants (must match LicencePage.jsx) ────────────────────────────────
const POC_SEED    = 'myLicense'
const PBKDF2_SALT = 'visman-licence-v1'
const PBKDF2_ITER = 100_000
const FILE_MAGIC  = [0x56, 0x4D, 0x4C, 0x31] // "VML1"

const ALL_FEATURES = { security: true, inviter: true, gatekeeper: true, gamification: true }

// ── Crypto helpers ─────────────────────────────────────────────────────────────
async function deriveDecryptKey() {
  const km = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(POC_SEED),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    {
      name:       'PBKDF2',
      salt:       new TextEncoder().encode(PBKDF2_SALT),
      iterations: PBKDF2_ITER,
      hash:       'SHA-256',
    },
    km,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  )
}

function readFileAsBytes(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve(new Uint8Array(e.target.result))
    reader.onerror = () => reject(new Error('Could not read the file'))
    reader.readAsArrayBuffer(file)
  })
}

async function decryptLicenceFile(file) {
  const bytes = await readFileAsBytes(file)

  if (bytes.length < FILE_MAGIC.length + 12 + 1) {
    throw new Error('File is too small to be a valid licence')
  }
  for (let i = 0; i < FILE_MAGIC.length; i++) {
    if (bytes[i] !== FILE_MAGIC[i]) {
      throw new Error('Not a valid VisMan licence file — header mismatch')
    }
  }

  const iv         = bytes.slice(FILE_MAGIC.length, FILE_MAGIC.length + 12)
  const ciphertext = bytes.slice(FILE_MAGIC.length + 12)
  const key        = await deriveDecryptKey()

  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
    return JSON.parse(new TextDecoder().decode(plain))
  } catch {
    throw new Error('Decryption failed — wrong seed or corrupted file')
  }
}

// ── Module-level ref — readable by axios interceptors outside the React tree ──
// Kept in sync by LicenceProvider via useEffect.
export const activeFeaturesRef = {
  current: { security: true, inviter: true, gatekeeper: true, gamification: true },
}

// ── Context ───────────────────────────────────────────────────────────────────
const LicenceContext = createContext(null)

export function LicenceProvider({ children }) {
  // null = no licence loaded; object = { issuer, issuedAt, version }
  const [licenceMeta,     setLicenceMeta]     = useState(null)
  // what the file says is licensed (null = no file, use all-true)
  const [featureLicenced, setFeatureLicenced] = useState(null)
  // current user-controlled active state (can only turn OFF licensed features)
  const [featureActive,   setFeatureActiveMap] = useState({ ...ALL_FEATURES })
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState(null)

  const licenceLoaded = licenceMeta !== null

  // Keep the module-level ref in sync so axios interceptors can read it
  // without needing access to the React context tree.
  React.useEffect(() => {
    activeFeaturesRef.current = featureActive
  }, [featureActive])

  const loadLicence = async (file) => {
    setLoading(true)
    setError(null)
    try {
      const payload = await decryptLicenceFile(file)
      setLicenceMeta({
        issuer:   payload.issuer   ?? 'Unknown',
        issuedAt: payload.issuedAt ?? null,
        version:  payload.version  ?? '?',
      })
      const licensed = {
        security:    !!payload.features?.security,
        inviter:     !!payload.features?.inviter,
        gatekeeper:  !!payload.features?.gatekeeper,
        gamification:!!payload.features?.gamification,
      }
      setFeatureLicenced(licensed)
      // Start with active = whatever is licensed (user can turn licensed ones off)
      setFeatureActiveMap({ ...licensed })
    } catch (err) {
      setError(err.message ?? 'Failed to load licence')
      setLicenceMeta(null)
      setFeatureLicenced(null)
      setFeatureActiveMap({ ...ALL_FEATURES })
    } finally {
      setLoading(false)
    }
  }

  const clearLicence = () => {
    setLicenceMeta(null)
    setFeatureLicenced(null)
    setFeatureActiveMap({ ...ALL_FEATURES })
    setError(null)
  }

  // Only allow toggling a feature that is actually licensed (or when no file is loaded)
  const setFeatureActive = (key, value) => {
    const isLicenced = featureLicenced === null ? true : !!featureLicenced[key]
    if (!isLicenced) return            // silently ignore — unlicensed features cannot be enabled
    setFeatureActiveMap(prev => ({ ...prev, [key]: value }))
  }

  return (
    <LicenceContext.Provider value={{
      licenceLoaded,
      licenceMeta,
      featureLicenced,   // null when no file; object when file loaded
      featureActive,     // current effective active state (navigation gating hook-in next session)
      loading,
      error,
      loadLicence,
      clearLicence,
      setFeatureActive,
    }}>
      {children}
    </LicenceContext.Provider>
  )
}

export const useLicence = () => useContext(LicenceContext)

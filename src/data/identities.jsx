import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { loadAllIdentities, saveIdentities, saveIdentity } from '../storage/db.js'

// Persistence moved from localStorage to IndexedDB. This is the old key, read once
// to migrate existing identities.
const LEGACY_STORAGE_KEY = 'inner-identidade-visual:identities'

// One array of items per folder of an identity.
export const FOLDER_KEYS = [
  'logos',
  'icones',
  'paleta',
  'tipografia',
  'elementos',
  'bibliotecaDeIcones',
  'fotografia',
  'tomDeVoz',
  'personalidade',
]

function emptyFolders() {
  return Object.fromEntries(FOLDER_KEYS.map((key) => [key, []]))
}

// Adds what an older stored identity does not have yet. Everything already stored
// is kept as it is.
function migrate(identity) {
  const next = { ...identity }
  for (const key of FOLDER_KEYS) {
    if (!Array.isArray(next[key])) next[key] = []
  }
  // Custom usage rights created by the user, shared by every logo of the identity.
  if (!Array.isArray(next.customUsageRights)) next.customUsageRights = []
  return next
}

function readLegacy() {
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.map(migrate) : []
  } catch {
    return []
  }
}

function removeLegacy() {
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // Nothing to do.
  }
}

async function loadInitial() {
  try {
    const stored = (await loadAllIdentities()).map(migrate)
    if (stored.length > 0) return stored
    const legacy = readLegacy()
    if (legacy.length > 0) {
      await saveIdentities(legacy)
      // Removed only after IndexedDB has the data.
      removeLegacy()
    }
    return legacy
  } catch (error) {
    console.error('Could not read IndexedDB', error)
    // The old data stays untouched in localStorage; show it for this session.
    return readLegacy()
  }
}

function newId() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export { newId }

const IdentitiesContext = createContext(null)

export function IdentitiesProvider({ children }) {
  const [state, setState] = useState({ loading: true, identities: [] })
  const identitiesRef = useRef(state.identities)
  identitiesRef.current = state.identities

  useEffect(() => {
    let cancelled = false
    loadInitial().then((identities) => {
      if (!cancelled) setState({ loading: false, identities })
    })
    return () => {
      cancelled = true
    }
  }, [])

  const createIdentity = useCallback((name) => {
    const identity = {
      id: newId(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      logo: null,
      cover: null,
      customUsageRights: [],
      ...emptyFolders(),
    }
    setState((current) => ({ ...current, identities: [...current.identities, identity] }))
    saveIdentity(identity).catch((error) => console.error('Could not save identity', error))
    return identity
  }, [])

  // Saves a logo and the custom usage rights created while adding it. Rejects if
  // the data could not be persisted.
  const addLogo = useCallback(async (identityId, logo, customRights = []) => {
    const current = identitiesRef.current.find((item) => item.id === identityId)
    if (!current) throw new Error('Identity not found')
    const known = new Set(current.customUsageRights.map((right) => right.toLowerCase()))
    const added = customRights.filter((right) => !known.has(right.toLowerCase()))
    const next = {
      ...current,
      logos: [...current.logos, logo],
      customUsageRights: [...current.customUsageRights, ...added],
    }
    await saveIdentity(next)
    setState((s) => ({
      ...s,
      identities: s.identities.map((item) => (item.id === identityId ? next : item)),
    }))
    return next
  }, [])

  const value = useMemo(
    () => ({ identities: state.identities, loading: state.loading, createIdentity, addLogo }),
    [state, createIdentity, addLogo],
  )

  return <IdentitiesContext.Provider value={value}>{children}</IdentitiesContext.Provider>
}

export function useIdentities() {
  return useContext(IdentitiesContext)
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'inner-identidade-visual:identities'

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

// Adds the folder arrays that an older stored identity does not have yet.
// Everything already stored is kept as it is.
function migrate(identity) {
  const next = { ...identity }
  for (const key of FOLDER_KEYS) {
    if (!Array.isArray(next[key])) next[key] = []
  }
  return next
}

function load() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.map(migrate) : []
  } catch {
    return []
  }
}

function newId() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

const IdentitiesContext = createContext(null)

export function IdentitiesProvider({ children }) {
  const [identities, setIdentities] = useState(load)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(identities))
    } catch {
      // Storage can be unavailable (private mode). The app keeps working in memory.
    }
  }, [identities])

  const createIdentity = useCallback((name) => {
    const identity = {
      id: newId(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      logo: null,
      cover: null,
      ...emptyFolders(),
    }
    setIdentities((current) => [...current, identity])
    return identity
  }, [])

  const value = useMemo(() => ({ identities, createIdentity }), [identities, createIdentity])

  return <IdentitiesContext.Provider value={value}>{children}</IdentitiesContext.Provider>
}

export function useIdentities() {
  return useContext(IdentitiesContext)
}

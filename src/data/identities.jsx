import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { deleteIdentityRecord, loadAllIdentities, saveIdentities, saveIdentity } from '../storage/db.js'
import { withDefaultLogoTexts, withDefaultTextsInIdentity } from './defaultTexts.js'
import { emptyPaletteTexts, storedCategoryText } from './paletteTexts.js'

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
  // One text per palette category (null = default), shared by the colors of the category.
  next.paletteTexts = { ...emptyPaletteTexts(), ...(identity.paletteTexts || {}) }
  // The per color "useCases" field is gone: those values are discarded.
  if (next.paleta.some((color) => 'useCases' in color)) {
    next.paleta = next.paleta.map(({ useCases: discarded, ...color }) => color) // eslint-disable-line no-unused-vars
  }
  return next
}

// True for a stored identity that the migration above changes, so it is saved again.
function needsMigration(raw) {
  return !raw.paletteTexts || (Array.isArray(raw.paleta) && raw.paleta.some((color) => 'useCases' in color))
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
    const raw = await loadAllIdentities()
    const migrated = raw.map(migrate)
    // One time migrations: logos with empty texts get the default ones, palette texts are
    // added and the per color use cases are dropped.
    const stored = migrated.map(withDefaultTextsInIdentity)
    const changed = stored.filter((identity, index) => identity !== migrated[index] || needsMigration(raw[index]))
    if (changed.length > 0) await saveIdentities(changed)
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
      paletteTexts: emptyPaletteTexts(),
      ...emptyFolders(),
    }
    setState((current) => ({ ...current, identities: [...current.identities, identity] }))
    saveIdentity(identity).catch((error) => console.error('Could not save identity', error))
    return identity
  }, [])

  // Saves a logo and the custom usage rights created while adding it. Rejects if
  // the data could not be persisted.
  const addLogo = useCallback(async (identityId, logo, customRights = [], key = 'logos') => {
    const current = identitiesRef.current.find((item) => item.id === identityId)
    if (!current) throw new Error('Identity not found')
    if (key === 'logos') logo = withDefaultLogoTexts(logo, current.name)
    const known = new Set(current.customUsageRights.map((right) => right.toLowerCase()))
    const added = customRights.filter((right) => !known.has(right.toLowerCase()))
    const next = {
      ...current,
      [key]: [...current[key], logo],
      customUsageRights: [...current.customUsageRights, ...added],
    }
    await saveIdentity(next)
    setState((s) => ({
      ...s,
      identities: s.identities.map((item) => (item.id === identityId ? next : item)),
    }))
    return next
  }, [])

  // Saves several items at once in one folder (for example the colors of a palette).
  // Rejects if the data could not be persisted.
  const addItems = useCallback(async (identityId, items, key) => {
    const current = identitiesRef.current.find((item) => item.id === identityId)
    if (!current) throw new Error('Identity not found')
    const next = { ...current, [key]: [...current[key], ...items] }
    await saveIdentity(next)
    setState((s) => ({
      ...s,
      identities: s.identities.map((item) => (item.id === identityId ? next : item)),
    }))
    return next
  }, [])

  // Updates the editable fields of a logo, plus the custom usage rights created while
  // editing it. Rejects if the change could not be persisted.
  const updateLogo = useCallback(async (identityId, logoId, changes, customRights = [], key = 'logos') => {
    const current = identitiesRef.current.find((item) => item.id === identityId)
    if (!current) throw new Error('Identity not found')
    const known = new Set(current.customUsageRights.map((right) => right.toLowerCase()))
    const added = customRights.filter((right) => !known.has(right.toLowerCase()))
    const next = {
      ...current,
      [key]: current[key].map((logo) => {
        if (logo.id !== logoId) return logo
        const updated = { ...logo, ...changes }
        return key === 'logos' ? withDefaultLogoTexts(updated, current.name) : updated
      }),
      customUsageRights: [...current.customUsageRights, ...added],
    }
    await saveIdentity(next)
    setState((s) => ({
      ...s,
      identities: s.identities.map((item) => (item.id === identityId ? next : item)),
    }))
    return next
  }, [])

  // Saves the tones of a palette color and, in the same write, the text of its category
  // (`text` = { category, value } or null). An empty value, or one equal to the default,
  // is stored as null so the default comes back. Rejects if it could not be persisted.
  const updatePaletteColor = useCallback(async (identityId, colorId, changes, text = null) => {
    const current = identitiesRef.current.find((item) => item.id === identityId)
    if (!current) throw new Error('Identity not found')
    const next = {
      ...current,
      paleta: current.paleta.map((color) => (color.id === colorId ? { ...color, ...changes } : color)),
      paletteTexts: text
        ? { ...current.paletteTexts, [text.category]: storedCategoryText(current, text.category, text.value) }
        : current.paletteTexts,
    }
    await saveIdentity(next)
    setState((s) => ({
      ...s,
      identities: s.identities.map((item) => (item.id === identityId ? next : item)),
    }))
    return next
  }, [])

  // Deletes logos. Rejects if the change could not be persisted.
  const deleteLogos = useCallback(async (identityId, logoIds, key = 'logos') => {
    const current = identitiesRef.current.find((item) => item.id === identityId)
    if (!current) throw new Error('Identity not found')
    const remove = new Set(logoIds)
    const next = { ...current, [key]: current[key].filter((logo) => !remove.has(logo.id)) }
    await saveIdentity(next)
    setState((s) => ({
      ...s,
      identities: s.identities.map((item) => (item.id === identityId ? next : item)),
    }))
    return next
  }, [])

  // Full copy of an identity (every folder and item, files included) with new ids. The copy
  // is named "[name] (cópia)", "[name] (cópia 2)" and so on, and shows up right away.
  const duplicateIdentity = useCallback((identityId) => {
    const source = identitiesRef.current.find((item) => item.id === identityId)
    if (!source) return null
    const names = new Set(identitiesRef.current.map((item) => item.name.trim().toLowerCase()))
    let name = `${source.name} (cópia)`
    for (let n = 2; names.has(name.toLowerCase()); n += 1) name = `${source.name} (cópia ${n})`
    const copy = structuredClone(source)
    copy.id = newId()
    copy.name = name
    copy.createdAt = new Date().toISOString()
    for (const key of FOLDER_KEYS) {
      for (const item of copy[key]) {
        item.id = newId()
        if (Array.isArray(item.monoVersions)) item.monoVersions.forEach((version) => (version.id = newId()))
      }
    }
    setState((s) => ({ ...s, identities: [...s.identities, copy] }))
    saveIdentity(copy).catch((error) => {
      console.error('Could not save the copy', error)
      setState((s) => ({ ...s, identities: s.identities.filter((item) => item.id !== copy.id) }))
    })
    return copy
  }, [])

  // Deletes an identity and all its files. Rejects if the change could not be persisted.
  const deleteIdentity = useCallback(async (identityId) => {
    await deleteIdentityRecord(identityId)
    setState((s) => ({ ...s, identities: s.identities.filter((item) => item.id !== identityId) }))
  }, [])

  const value = useMemo(
    () => ({
      identities: state.identities,
      loading: state.loading,
      duplicateIdentity,
      deleteIdentity,
      createIdentity,
      addLogo,
      addItems,
      updateLogo,
      updatePaletteColor,
      deleteLogos,
    }),
    [state, createIdentity, duplicateIdentity, deleteIdentity, addLogo, addItems, updateLogo, updatePaletteColor, deleteLogos],
  )

  return <IdentitiesContext.Provider value={value}>{children}</IdentitiesContext.Provider>
}

export function useIdentities() {
  return useContext(IdentitiesContext)
}

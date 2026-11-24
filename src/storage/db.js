// IndexedDB storage. Identities are stored whole, including the logo files (Blob),
// because image files do not fit in localStorage.
const DB_NAME = 'inner-identidade-visual'
const DB_VERSION = 1
const STORE = 'identities'

let dbPromise = null

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not available'))
        return
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    dbPromise.catch(() => {
      dbPromise = null
    })
  }
  return dbPromise
}

function run(mode, work) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const store = tx.objectStore(STORE)
        const result = work(store)
        tx.oncomplete = () => resolve(result && 'result' in result ? result.result : undefined)
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error)
      }),
  )
}

export function loadAllIdentities() {
  return run('readonly', (store) => store.getAll())
}

export function saveIdentity(identity) {
  return run('readwrite', (store) => {
    store.put(identity)
  })
}

// Removes an identity and, with it, every file stored inside the record.
export function deleteIdentityRecord(id) {
  return run('readwrite', (store) => {
    store.delete(id)
  })
}

export function saveIdentities(identities) {
  return run('readwrite', (store) => {
    identities.forEach((identity) => store.put(identity))
  })
}

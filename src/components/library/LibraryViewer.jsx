import { useEffect, useMemo, useRef, useState } from 'react'
import { CircleNotch, DownloadSimple, Trash, ArrowSquareOut, X } from '@phosphor-icons/react'
import ConfirmDialog from '../ConfirmDialog.jsx'
import LibraryDetailsPanel from './LibraryDetailsPanel.jsx'
import ZipGlyphs from './ZipGlyphs.jsx'
import LibraryGlyphs from '../../icon-libraries/LibraryGlyphs.jsx'
import { findLibrary, iconCount, iconPool, libraryUrl } from '../../icon-libraries/libraries.js'
import { saveBlob } from '../../utils/download.js'
import { buildLibraryZip } from '../../utils/libraryZip.js'

const GRID_COUNT = 49 // 7 x 7, 48px icons

function shuffled(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function initialDraft(item, identity) {
  return {
    style: item.style || '',
    name: item.name || '',
    description: item.description || '',
    useCases: item.useCases || '',
    tags: item.tags,
    usageRights: item.usageRights,
    customRights: identity.customUsageRights,
  }
}

const sameList = (a, b) => a.length === b.length && a.every((value, index) => value === b[index])

function isDirty(draft, item) {
  return (
    draft.style !== (item.style || '') ||
    draft.name !== (item.name || '') ||
    draft.description !== (item.description || '') ||
    draft.useCases !== (item.useCases || '') ||
    !sameList(draft.tags, item.tags) ||
    !sameList(draft.usageRights, item.usageRights)
  )
}

// Full screen viewer of the icon library of the identity (there is only one, so no previous /
// next): a white card full of random icons of the library, in the style being chosen, and a
// details panel on the right.
export default function LibraryViewer({ identity, item, deleteOpen, onClose, onDelete, onUpdate }) {
  const isUpload = item.source === 'upload'
  const library = isUpload ? null : findLibrary(item.libraryId)
  // The same icons (picked once) are redrawn when the style changes.
  const names = useMemo(() => (isUpload ? [] : shuffled(iconPool(library)).slice(0, GRID_COUNT)), [isUpload, library])

  const [draftState, setDraftState] = useState(null)
  const [pendingClose, setPendingClose] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [building, setBuilding] = useState(false)
  const draft = draftState || initialDraft(item, identity)
  const dirty = isDirty(draft, item)

  function setDraft(update) {
    setDraftState((current) => update(current || initialDraft(item, identity)))
    setSaveError(null)
  }

  function requestClose() {
    if (dirty) setPendingClose(true)
    else onClose()
  }

  async function save() {
    setSaving(true)
    setSaveError(null)
    try {
      const known = new Set(identity.customUsageRights.map((right) => right.toLowerCase()))
      const created = draft.customRights.filter((right) => !known.has(right.toLowerCase()))
      await onUpdate(
        item.id,
        {
          ...(isUpload ? {} : { style: draft.style }),
          name: draft.name.trim() || item.name,
          description: draft.description,
          useCases: draft.useCases,
          tags: draft.tags,
          usageRights: draft.usageRights,
        },
        created,
      )
      setDraftState(null)
    } catch (error) {
      console.error('Could not save', error)
      setSaveError('Não foi possível salvar')
    } finally {
      setSaving(false)
    }
  }

  // Free library: the zip with every icon of the style being shown. Uploaded: the original zip.
  async function download() {
    if (isUpload) {
      saveBlob(item.file, item.fileName)
      return
    }
    if (building) return
    setBuilding(true)
    try {
      saveBlob(await buildLibraryZip(library, draft.style), `${library.name}-${draft.style}.zip`)
    } catch (error) {
      console.error('Could not build the library zip', error)
    } finally {
      setBuilding(false)
    }
  }

  // Keep the latest values for the key handler without re-binding it on every render.
  const latest = useRef({})
  latest.current = { requestClose, pendingClose, deleteOpen }

  useEffect(() => {
    function onKeyDown(event) {
      if (event.defaultPrevented || event.key !== 'Escape') return
      const { requestClose: close, pendingClose: pending, deleteOpen: del } = latest.current
      if (del) return
      if (pending) setPendingClose(false)
      else close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const count = isUpload ? item.iconCount : iconCount(library, item.style)

  return (
    <div
      className="viewer"
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose()
      }}
    >
      <button type="button" className="viewer__round viewer__close" aria-label="Fechar" onClick={requestClose}>
        <X size={24} color="#5d5d5d" weight="regular" />
      </button>

      <div className="viewer__card viewer__card--library">
        <div className="fv-lib-grid" data-testid="viewer-grid">
          {isUpload ? (
            <ZipGlyphs file={item.file} count={GRID_COUNT} random />
          ) : (
            <LibraryGlyphs library={library} style={draft.style} names={names} />
          )}
        </div>
      </div>

      <div className="viewer__actions">
        <button type="button" className="viewer__round" aria-label="Excluir" onClick={() => onDelete(item)}>
          <Trash size={20} color="#5d5d5d" weight="regular" />
        </button>
        <button
          type="button"
          className="viewer__round"
          aria-label="Baixar"
          aria-busy={building}
          disabled={building}
          onClick={download}
        >
          {building ? (
            <CircleNotch className="lib-spin" size={20} color="#5d5d5d" weight="bold" />
          ) : (
            <DownloadSimple size={20} color="#5d5d5d" weight="regular" />
          )}
        </button>
        {isUpload ? null : (
          <button
            type="button"
            className="viewer__round"
            aria-label={`Abrir o site da ${library.name}`}
            onClick={() => window.open(libraryUrl(library), '_blank', 'noopener')}
          >
            <ArrowSquareOut size={20} color="#5d5d5d" weight="regular" />
          </button>
        )}
      </div>

      <LibraryDetailsPanel
        item={item}
        library={library}
        count={count}
        draft={draft}
        setDraft={setDraft}
        dirty={dirty}
        saving={saving}
        saveError={saveError}
        onSave={save}
        onCancel={() => {
          setDraftState(null)
          setSaveError(null)
        }}
      />

      {pendingClose ? (
        <ConfirmDialog
          title="Descartar alterações?"
          text="As alterações feitas serão perdidas."
          cancelLabel="Cancelar"
          confirmLabel="Descartar"
          onCancel={() => setPendingClose(false)}
          onConfirm={() => {
            setPendingClose(false)
            setDraftState(null)
            onClose()
          }}
        />
      ) : null}
    </div>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { CaretRight, CheckSquare, Square, X } from '@phosphor-icons/react'
import AdvancedPanel from '../logo/AdvancedPanel.jsx'
import ConfirmDiscard from '../logo/ConfirmDiscard.jsx'
import LibraryStylePanel from './LibraryStylePanel.jsx'
import ZipGlyphs from './ZipGlyphs.jsx'
import LibraryGlyphs from '../../icon-libraries/LibraryGlyphs.jsx'
import { findLibrary, iconPool } from '../../icon-libraries/libraries.js'
import { newId } from '../../data/identities.jsx'
import { defaultUsageRights } from '../../data/usageRights.js'

const GRID_COUNT = 60 // Figma: 15 icons per row, 4 rows
const FOLDER_TAG = 'Biblioteca de ícones'

function randomNames(names, count) {
  const copy = [...names]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, count)
}

function initialDraft(identity, source, library) {
  const upload = source.mode === 'upload'
  return {
    style: upload ? '' : library.defaultStyle,
    name: upload ? source.name : library.name,
    description: '',
    useCases: '',
    tags: upload ? [FOLDER_TAG, 'SVG'] : [FOLDER_TAG, library.name, library.defaultStyle],
    usageRights: defaultUsageRights(identity.customUsageRights),
    customRights: identity.customUsageRights,
    rightsConfirmed: true,
  }
}

function snapshot(draft) {
  return JSON.stringify([
    draft.style,
    draft.name,
    draft.description,
    draft.useCases,
    draft.tags,
    [...draft.usageRights].sort(),
    draft.customRights,
    draft.rightsConfirmed,
  ])
}

// "Nova biblioteca" (Figma node 6512:14018): a free library (title = its name, "Estilo" row)
// or an uploaded .zip (title = the file name, rights checkbox). `source` is
// { mode: 'library', libraryId } or { mode: 'upload', file, name, count }.
export default function NewLibraryModal({ identity, source, onClose, onSave }) {
  const isUpload = source.mode === 'upload'
  const library = isUpload ? null : findLibrary(source.libraryId)
  const [draft, setDraft] = useState(() => initialDraft(identity, source, library))
  const [panel, setPanel] = useState(null) // 'style' | 'advanced' | null
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const initialSnapshot = useRef(null)
  if (initialSnapshot.current === null) initialSnapshot.current = snapshot(draft)
  // The same icons (picked once) are redrawn when the style changes.
  const names = useMemo(() => (isUpload ? [] : randomNames(iconPool(library), GRID_COUNT)), [isUpload, library])
  const singleStyle = !isUpload && library.styles.length === 1
  const title = isUpload ? source.name : library.name
  const dirty = snapshot(draft) !== initialSnapshot.current

  function requestClose() {
    if (saving) return
    if (dirty) setConfirmOpen(true)
    else onClose()
  }

  // Esc closes the topmost layer: confirmation, then side panel, then the modal.
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      if (confirmOpen) setConfirmOpen(false)
      else if (panel) setPanel(null)
      else requestClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  })

  // The style tag follows the chosen style, unless the user removed it.
  function saveStyle(style) {
    setDraft((current) => {
      let tags = current.tags
      if (current.style !== style && tags.includes(current.style)) {
        tags = tags.includes(style)
          ? tags.filter((tag) => tag !== current.style)
          : tags.map((tag) => (tag === current.style ? style : tag))
      }
      return { ...current, style, tags }
    })
    setPanel(null)
  }

  const canAdd = (!isUpload || draft.rightsConfirmed) && !saving

  async function handleAdd() {
    if (!canAdd) return
    setSaving(true)
    setSaveError(null)
    const known = new Set(identity.customUsageRights.map((right) => right.toLowerCase()))
    const createdRights = draft.customRights.filter((right) => !known.has(right.toLowerCase()))
    const item = {
      id: newId(),
      source: source.mode,
      ...(isUpload
        ? { file: source.file, fileName: source.file.name, iconCount: source.count }
        : { libraryId: library.id, style: draft.style }),
      name: draft.name.trim() || title,
      description: draft.description.trim(),
      useCases: draft.useCases.trim(),
      tags: draft.tags,
      usageRights: draft.usageRights,
      createdAt: new Date().toISOString(),
    }
    try {
      await onSave(item, createdRights)
      onClose()
    } catch (error) {
      console.error('Could not save the library', error)
      setSaveError('Não foi possível salvar a biblioteca')
      setSaving(false)
    }
  }

  return (
    <>
      <div
        className="modal-overlay"
        onMouseDown={(event) => {
          if (event.target !== event.currentTarget) return
          if (confirmOpen) setConfirmOpen(false)
          else if (panel) setPanel(null)
          else requestClose()
        }}
      >
        <div className="modal modal--logo" role="dialog" aria-modal="true" aria-labelledby="new-library-title">
          <div className="modal__header">
            <h2 id="new-library-title" className="modal__title">
              {title}
            </h2>
            <button type="button" className="modal__close" aria-label="Fechar" onClick={requestClose}>
              <X size={24} color="#5d5d5d" weight="regular" />
            </button>
          </div>

          <div className="lib-body">
            <div className="lib-grid" data-testid="library-preview">
              {isUpload ? (
                <ZipGlyphs file={source.file} count={GRID_COUNT} random />
              ) : (
                <LibraryGlyphs library={library} style={draft.style} names={names} />
              )}
            </div>

            <div className="logo-rows">
              {isUpload ? null : singleStyle ? (
                <div className="logo-row logo-row--divider logo-row--static">
                  <span className="logo-row__label">Estilo</span>
                  <span className="logo-row__value logo-row__value--wide">{draft.style}</span>
                </div>
              ) : (
                <button type="button" className="logo-row logo-row--divider" onClick={() => setPanel('style')}>
                  <span className="logo-row__label">Estilo</span>
                  <span className="logo-row__value">{draft.style}</span>
                  <CaretRight size={20} color="#5d5d5d" weight="regular" />
                </button>
              )}
              <button type="button" className="logo-row logo-row--end" onClick={() => setPanel('advanced')}>
                <span className="logo-row__value logo-row__value--auto">Avançada</span>
                <CaretRight size={20} color="#5d5d5d" weight="regular" />
              </button>
            </div>
          </div>

          <div className={`logo-footer${isUpload ? '' : ' logo-footer--end'}`}>
            {isUpload ? (
              <button
                type="button"
                className="logo-check"
                role="checkbox"
                aria-checked={draft.rightsConfirmed}
                onClick={() => setDraft({ ...draft, rightsConfirmed: !draft.rightsConfirmed })}
              >
                {draft.rightsConfirmed ? (
                  <CheckSquare size={24} color="#000000" weight="fill" />
                ) : (
                  <Square size={24} color="#5d5d5d" weight="regular" />
                )}
                <span className="logo-check__label">Confirmo que tenho os direitos de uso desse arquivo</span>
              </button>
            ) : null}
            <button type="button" className="btn btn--primary btn--wide" disabled={!canAdd} onClick={handleAdd}>
              <span className="btn__label">Adicionar</span>
            </button>
          </div>
          {saveError ? <p className="logo-save-error">{saveError}</p> : null}
        </div>
      </div>

      {panel === 'style' && !isUpload ? (
        <LibraryStylePanel
          library={library}
          selected={draft.style}
          onSave={saveStyle}
          onCancel={() => setPanel(null)}
        />
      ) : null}
      {panel === 'advanced' ? (
        <AdvancedPanel
          initial={draft}
          customRights={draft.customRights}
          withName
          namePlaceholder="Nome da biblioteca"
          onSave={(values) => {
            setDraft((current) => ({ ...current, ...values }))
            setPanel(null)
          }}
          onCancel={() => setPanel(null)}
        />
      ) : null}

      {confirmOpen ? (
        <ConfirmDiscard title="Descartar biblioteca?" onCancel={() => setConfirmOpen(false)} onDiscard={onClose} />
      ) : null}
    </>
  )
}

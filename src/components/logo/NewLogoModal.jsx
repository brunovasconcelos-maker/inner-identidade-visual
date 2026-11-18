import { useEffect, useMemo, useRef, useState } from 'react'
import { CaretRight, CheckSquare, Square, X } from '@phosphor-icons/react'
import AdvancedPanel from './AdvancedPanel.jsx'
import ConfirmDiscard from './ConfirmDiscard.jsx'
import MonoPanel from './MonoPanel.jsx'
import MonoSummary from './MonoSummary.jsx'
import TypePanel from './TypePanel.jsx'
import { newId } from '../../data/identities.jsx'
import { findLogoType, firstFreeLogoType, usedLogoTypes } from '../../data/logoTypes.js'
import { ASSET_KINDS } from '../../data/assetKinds.js'
import { defaultUsageRights } from '../../data/usageRights.js'
import { useObjectUrl } from '../../hooks/useObjectUrl.js'

function initialDraft(identity, format, kind) {
  const type = kind.hasType ? firstFreeLogoType(identity.logos) : null
  return {
    type: type ? type.id : null,
    description: '',
    useCases: '',
    tags: kind.autoTags(format, type),
    usageRights: defaultUsageRights(identity.customUsageRights),
    customRights: identity.customUsageRights,
    monoVersions: [],
    rightsConfirmed: true,
  }
}

// What counts as "changed anything besides the file".
function snapshot(draft) {
  return JSON.stringify([
    draft.type,
    draft.description,
    draft.useCases,
    draft.tags,
    [...draft.usageRights].sort(),
    draft.customRights,
    draft.monoVersions.map((v) => [v.id, v.name, v.fileName, v.file.size, v.previewBg]),
    draft.rightsConfirmed,
  ])
}

export default function NewLogoModal({ identity, upload, kind = ASSET_KINDS.logo, onClose, onSave }) {
  const { file, format, width, height } = upload
  const [draft, setDraft] = useState(() => initialDraft(identity, format, kind))
  const [panel, setPanel] = useState(null) // 'type' | 'advanced' | 'mono' | null
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const initialSnapshot = useRef(null)
  if (initialSnapshot.current === null) initialSnapshot.current = snapshot(draft)

  const previewUrl = useObjectUrl(file)
  const usedTypes = useMemo(() => usedLogoTypes(identity.logos), [identity.logos])
  const type = kind.hasType ? findLogoType(draft.type) : null
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

  function saveType(typeId) {
    setDraft((current) => {
      const before = findLogoType(current.type)
      const after = findLogoType(typeId)
      let tags = current.tags
      // Keep the automatic type tag in sync, unless the user removed it.
      if (before.short !== after.short && tags.includes(before.short)) {
        tags = tags.includes(after.short)
          ? tags.filter((tag) => tag !== before.short)
          : tags.map((tag) => (tag === before.short ? after.short : tag))
      }
      return { ...current, type: typeId, tags }
    })
    setPanel(null)
  }

  function saveAdvanced(values) {
    setDraft((current) => ({ ...current, ...values }))
    setPanel(null)
  }

  function saveMono(versions) {
    setDraft((current) => ({ ...current, monoVersions: versions }))
    setPanel(null)
  }

  async function handleAdd() {
    if (!draft.rightsConfirmed || saving) return
    setSaving(true)
    setSaveError(null)
    const logo = {
      id: newId(),
      ...(kind.hasType ? { type: draft.type } : {}),
      file,
      fileName: file.name,
      format,
      width,
      height,
      createdAt: new Date().toISOString(),
      description: draft.description.trim(),
      useCases: draft.useCases.trim(),
      tags: draft.tags,
      usageRights: draft.usageRights,
      monoVersions: draft.monoVersions,
    }
    const known = new Set(identity.customUsageRights.map((right) => right.toLowerCase()))
    const createdRights = draft.customRights.filter((right) => !known.has(right.toLowerCase()))
    try {
      await onSave(logo, createdRights)
      onClose()
    } catch (error) {
      console.error('Could not save the logo', error)
      setSaveError('Não foi possível salvar a logo')
      setSaving(false)
    }
  }

  return (
    <>
      <div
        className="modal-overlay"
        onMouseDown={(event) => {
          if (event.target !== event.currentTarget) return
          if (panel) setPanel(null)
          else requestClose()
        }}
      >
        <div
          className="modal modal--logo"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-logo-title"
        >
          <div className="modal__header">
            <h2 id="new-logo-title" className="modal__title">
              {kind.modalTitle}
            </h2>
            <button type="button" className="modal__close" aria-label="Fechar" onClick={requestClose}>
              <X size={24} color="#5d5d5d" weight="regular" />
            </button>
          </div>

          <div className="logo-form">
            <div className="logo-preview">
              <div className="logo-preview__box">
                {previewUrl ? <img className="logo-preview__img" src={previewUrl} alt="" /> : null}
              </div>
            </div>

            <div className="logo-rows">
              {kind.hasType ? (
                <button
                  type="button"
                  className="logo-row logo-row--divider"
                  onClick={() => setPanel('type')}
                >
                  <span className="logo-row__label">Tipo de logo</span>
                  <span className="logo-row__value">{type.label}</span>
                  <CaretRight size={20} color="#5d5d5d" weight="regular" />
                </button>
              ) : null}
              <button
                type="button"
                className="logo-row logo-row--end"
                onClick={() => setPanel('advanced')}
              >
                <span className="logo-row__value logo-row__value--auto">Avançada</span>
                <CaretRight size={20} color="#5d5d5d" weight="regular" />
              </button>
            </div>

            {draft.monoVersions.length > 0 ? (
              <MonoSummary versions={draft.monoVersions} onEdit={() => setPanel('mono')} />
            ) : null}

            <button
              type="button"
              className="btn btn--outline btn--outline-strong"
              onClick={() => setPanel('mono')}
            >
              <span className="btn__label">Adicionar versões monocromáticas</span>
            </button>
          </div>

          <div className="logo-footer">
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
              <span className="logo-check__label">
                Confirmo que tenho os direitos de uso desse arquivo
              </span>
            </button>
            <button
              type="button"
              className="btn btn--primary btn--wide"
              disabled={!draft.rightsConfirmed || saving}
              onClick={handleAdd}
            >
              <span className="btn__label">Adicionar</span>
            </button>
          </div>
          {saveError ? <p className="logo-save-error">{saveError}</p> : null}
        </div>
      </div>

      {kind.hasType && panel === 'type' ? (
        <TypePanel
          currentType={draft.type}
          usedTypes={usedTypes}
          onSave={saveType}
          onCancel={() => setPanel(null)}
        />
      ) : null}
      {panel === 'advanced' ? (
        <AdvancedPanel
          initial={draft}
          customRights={draft.customRights}
          onSave={saveAdvanced}
          onCancel={() => setPanel(null)}
        />
      ) : null}
      {panel === 'mono' ? (
        <MonoPanel initial={draft.monoVersions} onSave={saveMono} onCancel={() => setPanel(null)} />
      ) : null}

      {confirmOpen ? (
        <ConfirmDiscard title={kind.discardTitle} onCancel={() => setConfirmOpen(false)} onDiscard={onClose} />
      ) : null}
    </>
  )
}

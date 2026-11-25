import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowsCounterClockwise,
  CaretRight,
  CheckSquare,
  FilePlus,
  MagnifyingGlass,
  Square,
  Trash,
  X,
} from '@phosphor-icons/react'
import AdvancedPanel from '../logo/AdvancedPanel.jsx'
import ConfirmDiscard from '../logo/ConfirmDiscard.jsx'
import TypePanel from '../logo/TypePanel.jsx'
import FontPicker from './FontPicker.jsx'
import WeightsPanel from './WeightsPanel.jsx'
import { newId } from '../../data/identities.jsx'
import { googleWeights } from '../../data/googleFonts.js'
import {
  FONT_TYPES,
  defaultFontTags,
  findFontType,
  pesosLabel,
  sortWeights,
  usedFontTypes,
  weightKey,
} from '../../data/typography.js'
import { defaultUsageRights } from '../../data/usageRights.js'
import { FONT_ACCEPT, readFontUpload, validateFontFile } from '../../utils/fontFiles.js'
import { openFilePicker } from '../../utils/files.js'
import { unregisterUploadedFont, uploadAlias, useFontPreview } from '../../utils/fonts.js'

const allKeys = (weights) => weights.map(weightKey)

// Family tag follows the chosen font, the type tag follows the chosen type, unless the
// user removed them.
function syncFamilyTag(tags, from, to) {
  if (from === to) return tags
  if (from && tags.includes(from)) {
    return tags.includes(to) ? tags.filter((tag) => tag !== from) : tags.map((tag) => (tag === from ? to : tag))
  }
  return tags
}

// The type always comes from the chooser (`initialType`).
function initialDraft(identity, font, typeId) {
  const type = findFontType(typeId)
  return {
    type: type.id,
    selectedWeights: font ? allKeys(font.weights) : [],
    description: '',
    useCases: '',
    tags: font ? defaultFontTags(font.family, type.id) : [],
    usageRights: defaultUsageRights(identity.customUsageRights),
    customRights: identity.customUsageRights,
    rightsConfirmed: true,
  }
}

function snapshot(font, draft) {
  return JSON.stringify([
    font ? [font.source, font.family] : null,
    draft.type,
    draft.selectedWeights,
    draft.description,
    draft.useCases,
    draft.tags,
    [...draft.usageRights].sort(),
    draft.customRights,
    draft.rightsConfirmed,
  ])
}

// "Nova tipografia". `mode` is where the font comes from: an uploaded file (already read,
// `initialFont`) or the Google Fonts picker. A Google font has no rights checkbox.
export default function NewFontModal({ identity, mode, initialFont, initialType, onClose, onSave }) {
  const isUpload = mode === 'upload'
  const [font, setFont] = useState(() =>
    initialFont ? { ...initialFont, id: newId(), source: 'upload' } : null,
  )
  const [draft, setDraft] = useState(() => initialDraft(identity, initialFont, initialType))
  const [panel, setPanel] = useState(null) // 'type' | 'weights' | 'advanced' | null
  const [pickerOpen, setPickerOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [fontError, setFontError] = useState(null)
  const initialSnapshot = useRef(null)
  if (initialSnapshot.current === null) initialSnapshot.current = snapshot(font, draft)

  const usedTypes = useMemo(() => usedFontTypes(identity.tipografia), [identity.tipografia])
  const preview = useFontPreview(font)
  const type = findFontType(draft.type)
  const dirty = snapshot(font, draft) !== initialSnapshot.current

  // The draft alias is released when the font changes or the modal closes.
  useEffect(() => {
    if (!font || font.source !== 'upload') return undefined
    const alias = uploadAlias(font.id)
    return () => unregisterUploadedFont(alias)
  }, [font])

  function requestClose() {
    if (saving) return
    if (dirty) setConfirmOpen(true)
    else onClose()
  }

  // Esc closes the topmost layer: confirmation, then side panel, then the modal. The font
  // picker handles its own Esc first.
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

  // A new font (picked or replaced): all its weights are selected and the family tag
  // follows it.
  function applyFont(next) {
    const previous = font
    setDraft((d) => ({
      ...d,
      selectedWeights: allKeys(next.weights),
      tags:
        d.tags.length === 0
          ? defaultFontTags(next.family, d.type)
          : syncFamilyTag(d.tags, previous && previous.family, next.family),
    }))
    setFont(next)
    setFontError(null)
  }

  function clearFont() {
    setFont(null)
    setDraft((d) => ({ ...d, selectedWeights: [] }))
    setFontError(null)
    setPickerOpen(false)
  }

  // Opens the native file picker with the same rules as the add card.
  async function pickUpload() {
    setFontError(null)
    const file = await openFilePicker(FONT_ACCEPT)
    if (!file) return
    const result = validateFontFile(file)
    if (!result.ok) {
      setFontError(result.error)
      return
    }
    const read = await readFontUpload(file, result.zip)
    if (!read.ok) {
      setFontError(read.error)
      return
    }
    applyFont({ id: newId(), source: 'upload', family: read.family, weights: read.weights })
  }

  function pickGoogle(entry) {
    applyFont({ id: newId(), source: 'google', family: entry.family, weights: googleWeights(entry) })
    setPickerOpen(false)
  }

  function saveType(typeId) {
    setDraft((current) => {
      const before = findFontType(current.type)
      const after = findFontType(typeId)
      let tags = current.tags
      if (before.short !== after.short && tags.includes(before.short)) {
        tags = tags.includes(after.short)
          ? tags.filter((tag) => tag !== before.short)
          : tags.map((tag) => (tag === before.short ? after.short : tag))
      }
      return { ...current, type: typeId, tags }
    })
    setPanel(null)
  }

  const canAdd = font !== null && (!isUpload || draft.rightsConfirmed) && !saving

  async function handleAdd() {
    if (!canAdd) return
    setSaving(true)
    setSaveError(null)
    const known = new Set(identity.customUsageRights.map((right) => right.toLowerCase()))
    const createdRights = draft.customRights.filter((right) => !known.has(right.toLowerCase()))
    const selected = sortWeights(font.weights.filter((weight) => draft.selectedWeights.includes(weightKey(weight))))
    const item = {
      id: newId(),
      source: font.source,
      family: font.family,
      type: draft.type,
      weights: font.weights,
      selectedWeights: selected.map(weightKey),
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
      console.error('Could not save the font', error)
      setSaveError('Não foi possível salvar a tipografia')
      setSaving(false)
    }
  }

  // Empty card: opens the file picker (upload) or the font picker (Google).
  const emptyAction = isUpload ? pickUpload : () => setPickerOpen(true)

  return (
    <>
      <div
        className="modal-overlay"
        onMouseDown={(event) => {
          if (event.target !== event.currentTarget) return
          if (pickerOpen) setPickerOpen(false)
          else if (panel) setPanel(null)
          else requestClose()
        }}
      >
        <div className="modal modal--logo" role="dialog" aria-modal="true" aria-labelledby="new-font-title">
          <div className="modal__header">
            <h2 id="new-font-title" className="modal__title">
              Nova tipografia
            </h2>
            <button type="button" className="modal__close" aria-label="Fechar" onClick={requestClose}>
              <X size={24} color="#5d5d5d" weight="regular" />
            </button>
          </div>

          <div className="font-field">
            {font ? (
              <div className="font-box">
                <span className="font-box__tile">
                  <span
                    className="font-box__aa"
                    style={{
                      fontFamily: preview.fontFamily,
                      fontWeight: preview.weight,
                      fontStyle: preview.italic ? 'italic' : 'normal',
                    }}
                  >
                    Aa
                  </span>
                </span>
                <span className="font-box__name">{font.family}</span>
                <span className="font-box__actions">
                  <button type="button" className="icon-action" aria-label="Remover fonte" onClick={clearFont}>
                    <Trash size={20} color="#5d5d5d" weight="regular" />
                  </button>
                  <button
                    type="button"
                    className="icon-action"
                    aria-label="Trocar fonte"
                    onClick={isUpload ? pickUpload : () => setPickerOpen(true)}
                  >
                    <ArrowsCounterClockwise size={20} color="#5d5d5d" weight="regular" />
                  </button>
                </span>
              </div>
            ) : (
              <button type="button" className="font-box font-box--empty" onClick={emptyAction}>
                <span className="font-box__tile">
                  <span className="font-box__aa">Aa</span>
                </span>
                <span className="font-box__name font-box__name--placeholder">
                  {isUpload ? 'Faça upload de uma tipografia' : 'Selecione a fonte da sua marca'}
                </span>
                {isUpload ? (
                  <FilePlus size={24} color="#5d5d5d" weight="regular" />
                ) : (
                  <MagnifyingGlass size={24} color="#000000" weight="regular" />
                )}
              </button>
            )}
            {pickerOpen ? (
              <FontPicker
                selectedFamily={font && font.source === 'google' ? font.family : null}
                onSelect={pickGoogle}
                onClose={() => setPickerOpen(false)}
              />
            ) : null}
            {fontError ? (
              <p className="font-error" role="alert">
                {fontError}
              </p>
            ) : null}
          </div>

          <div className="logo-rows">
            <button type="button" className="logo-row logo-row--divider" onClick={() => setPanel('type')}>
              <span className="logo-row__label">Tipo de tipografia</span>
              <span className="logo-row__value">{type.label}</span>
              <CaretRight size={20} color="#5d5d5d" weight="regular" />
            </button>
            <button
              type="button"
              className="logo-row logo-row--divider"
              disabled={!font}
              onClick={() => setPanel('weights')}
            >
              <span className="logo-row__label">Pesos</span>
              <span className="logo-row__value">{pesosLabel(draft.selectedWeights.length)}</span>
              <CaretRight size={20} color="#5d5d5d" weight="regular" />
            </button>
            <button type="button" className="logo-row logo-row--end" onClick={() => setPanel('advanced')}>
              <span className="logo-row__value logo-row__value--auto">Avançada</span>
              <CaretRight size={20} color="#5d5d5d" weight="regular" />
            </button>
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

      {panel === 'type' ? (
        <TypePanel
          title="Tipo de tipografia"
          options={FONT_TYPES}
          currentType={draft.type}
          usedTypes={usedTypes}
          onSave={saveType}
          onCancel={() => setPanel(null)}
        />
      ) : null}
      {panel === 'weights' && font ? (
        <WeightsPanel
          weights={font.weights}
          selected={draft.selectedWeights}
          onSave={(selectedWeights) => {
            setDraft((current) => ({ ...current, selectedWeights }))
            setPanel(null)
          }}
          onCancel={() => setPanel(null)}
        />
      ) : null}
      {panel === 'advanced' ? (
        <AdvancedPanel
          initial={draft}
          customRights={draft.customRights}
          onSave={(values) => {
            setDraft((current) => ({ ...current, ...values }))
            setPanel(null)
          }}
          onCancel={() => setPanel(null)}
        />
      ) : null}

      {confirmOpen ? (
        <ConfirmDiscard title="Descartar tipografia?" onCancel={() => setConfirmOpen(false)} onDiscard={onClose} />
      ) : null}
    </>
  )
}

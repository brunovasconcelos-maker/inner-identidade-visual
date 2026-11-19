import { useEffect, useRef, useState } from 'react'
import { CaretRight, Plus, Trash, X } from '@phosphor-icons/react'
import ConfirmDialog from '../ConfirmDialog.jsx'
import ColorDot from './ColorDot.jsx'
import ColorPanel from './ColorPanel.jsx'
import { newId } from '../../data/identities.jsx'
import { CATEGORIES, CATEGORY_ORDER } from '../../data/palette.js'

let rowCounter = 0
const emptyRow = () => ({ key: `row-${(rowCounter += 1)}`, name: '', hex: '', tones: [] })
const isFilled = (row) => row.hex !== ''

function Row({ category, row, removable, onOpen, onRemove }) {
  const filled = isFilled(row)
  return (
    <div
      className="pal-row"
      role="button"
      tabIndex={0}
      aria-label={`${category.rowLabel}: ${filled ? row.name : 'cor vazia'}`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          onOpen()
        }
      }}
    >
      {removable && filled ? (
        <button
          type="button"
          className="pal-row__trash icon-action"
          aria-label={`Remover ${row.name}`}
          onClick={(event) => {
            event.stopPropagation()
            onRemove()
          }}
        >
          <Trash size={20} color="#5d5d5d" weight="regular" />
        </button>
      ) : null}
      <ColorDot hex={filled ? row.hex : null} />
      <span className="pal-row__name">{filled ? row.name : 'Nome da cor'}</span>
      <span className="pal-row__hex">{filled ? row.hex : '#000000'}</span>
      <CaretRight size={20} color="#5d5d5d" weight="regular" />
    </div>
  )
}

// "Nova paleta": first the chooser with the three categories, then the modal of the
// chosen one. Rows keep their colors when going back to the chooser.
export default function NewPaletteModal({ identity, onClose, onSave }) {
  const [stage, setStage] = useState('chooser') // 'chooser' | category id
  const [rows, setRows] = useState(() =>
    Object.fromEntries(CATEGORY_ORDER.map((id) => [id, [emptyRow()]])),
  )
  const [panelRow, setPanelRow] = useState(null) // key of the row being edited
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const brandTaken = identity.paleta.some((color) => color.category === 'marca')
  const category = stage === 'chooser' ? null : CATEGORIES[stage]
  const anyFilled = CATEGORY_ORDER.some((id) => rows[id].some(isFilled))
  const canSave = category !== null && rows[stage].some(isFilled) && !saving

  function requestClose() {
    if (saving) return
    if (anyFilled) setConfirmOpen(true)
    else onClose()
  }

  // Esc closes the topmost layer: confirmation, then side panel, then the modal.
  const latest = useRef({})
  latest.current = { confirmOpen, panelRow, requestClose }
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      const { confirmOpen: confirming, panelRow: editing, requestClose: close } = latest.current
      if (confirming) setConfirmOpen(false)
      else if (editing) setPanelRow(null)
      else close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  function updateRow(key, values) {
    setRows((current) => ({
      ...current,
      [stage]: current[stage].map((row) => (row.key === key ? { ...row, ...values } : row)),
    }))
  }

  function removeRow(key) {
    setRows((current) => {
      const left = current[stage].filter((row) => row.key !== key)
      return { ...current, [stage]: left.length ? left : [emptyRow()] }
    })
  }

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setSaveError(null)
    const items = rows[stage].filter(isFilled).map((row) => ({
      id: newId(),
      category: stage,
      name: row.name,
      hex: row.hex,
      tones: row.tones,
      useCases: '',
      createdAt: new Date().toISOString(),
    }))
    try {
      await onSave(items)
      onClose()
    } catch (error) {
      console.error('Could not save the colors', error)
      setSaveError('Não foi possível salvar')
      setSaving(false)
    }
  }

  const editing = panelRow ? rows[stage]?.find((row) => row.key === panelRow) : null

  return (
    <>
      <div
        className="modal-overlay"
        onMouseDown={(event) => {
          if (event.target !== event.currentTarget) return
          if (panelRow) setPanelRow(null)
          else requestClose()
        }}
      >
        <div
          className="modal modal--logo"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-palette-title"
        >
          <div className="modal__header">
            <h2 id="new-palette-title" className="modal__title">
              {category ? category.modalTitle : 'Nova paleta'}
            </h2>
            <button type="button" className="modal__close" aria-label="Fechar" onClick={requestClose}>
              <X size={24} color="#5d5d5d" weight="regular" />
            </button>
          </div>

          {category === null ? (
            <div className="pal-options">
              {CATEGORY_ORDER.map((id) => {
                const option = CATEGORIES[id]
                const disabled = id === 'marca' && brandTaken
                return (
                  <button
                    key={id}
                    type="button"
                    className={`pal-option${disabled ? ' pal-option--disabled' : ''}`}
                    disabled={disabled}
                    onClick={() => setStage(id)}
                  >
                    <span className="pal-option__title">{option.chooserTitle}</span>
                    <span className="pal-option__text">{option.description}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <>
              <div className={`pal-list${category.single ? ' pal-list--single' : ''}`}>
                <span className="pal-list__label">{category.rowLabel}</span>
                <div className="pal-rows">
                  {rows[stage].map((row) => (
                    <Row
                      key={row.key}
                      category={category}
                      row={row}
                      removable={!category.single}
                      onOpen={() => setPanelRow(row.key)}
                      onRemove={() => removeRow(row.key)}
                    />
                  ))}
                  {category.single ? null : (
                    <button
                      type="button"
                      className="pal-add pal-add--modal"
                      onClick={() => setRows((current) => ({ ...current, [stage]: [...current[stage], emptyRow()] }))}
                    >
                      <span className="pal-add__label">Adicionar</span>
                      <Plus size={20} color="#5d5d5d" weight="regular" />
                    </button>
                  )}
                </div>
              </div>
              <div className="pal-footer">
                <button type="button" className="btn btn--ghost pal-footer__back" onClick={() => setStage('chooser')}>
                  <span className="btn__label">Voltar</span>
                </button>
                <button type="button" className="btn btn--primary" disabled={!canSave} onClick={handleSave}>
                  <span className="btn__label">Salvar</span>
                </button>
              </div>
              {saveError ? <p className="logo-save-error">{saveError}</p> : null}
            </>
          )}
        </div>
      </div>

      {editing ? (
        <ColorPanel
          key={editing.key}
          title={category.rowLabel}
          initial={{ name: editing.name, hex: editing.hex, tones: editing.tones }}
          onCancel={() => setPanelRow(null)}
          onSave={(values) => {
            updateRow(editing.key, values)
            setPanelRow(null)
          }}
        />
      ) : null}

      {confirmOpen ? (
        <ConfirmDialog
          title="Descartar paleta?"
          text="As cores adicionadas serão perdidas."
          cancelLabel="Cancelar"
          confirmLabel="Descartar"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={onClose}
        />
      ) : null}
    </>
  )
}

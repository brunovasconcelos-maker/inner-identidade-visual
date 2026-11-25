import { useEffect, useRef, useState } from 'react'
import { CaretLeft, CaretRight, Plus, Trash, X } from '@phosphor-icons/react'
import ConfirmDialog from '../ConfirmDialog.jsx'
import { useCopyHex } from './useCopyHex.jsx'
import { ToneRow } from './ColorPanel.jsx'
import { CATEGORIES, nextExtraStep, sortTones, toneHex } from '../../data/palette.js'

const toneKey = (tones) => JSON.stringify(sortTones(tones).map((tone) => [tone.step, tone.hex]))

// The text is the one of the color's category, shared by all its colors.
function initialDraft(color, text) {
  return { text, tones: sortTones(color.tones) }
}

function isDirty(draft, color, text) {
  return draft.text !== text || toneKey(draft.tones) !== toneKey(color.tones)
}

// Mini version of the featured card, shown on the sides: main color and tone strip.
function Neighbor({ color, side, onOpen }) {
  return (
    <button
      type="button"
      className={`viewer__neighbor viewer__neighbor--color viewer__neighbor--${side}`}
      aria-label={color.name}
      onClick={onOpen}
    >
      <span className="cv-neighbor__main" style={{ background: color.hex }} />
      <span className="cv-neighbor__strip">
        {sortTones(color.tones)
          .filter((tone) => !tone.isMain)
          .map((tone) => (
            <span key={tone.step} className="cv-strip__tone" style={{ background: tone.hex }} />
          ))}
      </span>
    </button>
  )
}

// Full screen viewer of one color: the featured card (main color over the strip of the
// other tones), neighbors on the sides and a panel on the right. `colors` is the grid
// order (search filter applied). Hovering a color area shows its hex next to the cursor;
// clicking copies it.
export default function ColorViewer({
  colors,
  colorId,
  categoryTextOf,
  deleteOpen,
  onChangeColor,
  onClose,
  onDelete,
  onUpdate,
}) {
  const index = colors.findIndex((item) => item.id === colorId)
  const color = colors[index]
  const prev = index > 0 ? colors[index - 1] : null
  const next = index >= 0 && index < colors.length - 1 ? colors[index + 1] : null

  const [draftState, setDraftState] = useState(null) // { colorId, values }
  const [pending, setPending] = useState(null) // action waiting for the discard dialog
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const { area, tooltip, clear: clearTooltip } = useCopyHex()

  const savedText = color ? categoryTextOf(color.category) : ''
  const draft = color
    ? draftState && draftState.colorId === color.id
      ? draftState.values
      : initialDraft(color, savedText)
    : null
  const dirty = color ? isDirty(draft, color, savedText) : false

  function setDraft(update) {
    setDraftState((current) => {
      const base = current && current.colorId === color.id ? current.values : initialDraft(color, savedText)
      return { colorId: color.id, values: update(base) }
    })
    setSaveError(null)
  }

  function go(action) {
    setDraftState(null)
    setSaveError(null)
    setPending(null)
    clearTooltip()
    if (action.type === 'close') onClose()
    else onChangeColor(action.id)
  }

  function request(action) {
    if (dirty) setPending(action)
    else go(action)
  }

  async function save() {
    setSaving(true)
    setSaveError(null)
    try {
      // The text belongs to the category: saving it changes it for every color of it.
      await onUpdate(
        color.id,
        { tones: sortTones(draft.tones) },
        draft.text !== savedText ? { category: color.category, value: draft.text } : null,
      )
      setDraftState(null)
    } catch (error) {
      console.error('Could not save', error)
      setSaveError('Não foi possível salvar')
    } finally {
      setSaving(false)
    }
  }

  // Keep the latest values for the key handler without re-binding it on every render.
  const latest = useRef({})
  latest.current = { prev, next, request, pending, deleteOpen }

  useEffect(() => {
    function onKeyDown(event) {
      if (event.defaultPrevented) return
      const { prev: p, next: n, request: req, pending: pend, deleteOpen: del } = latest.current
      if (event.key === 'Escape') {
        if (del) return
        if (pend) setPending(null)
        else req({ type: 'close' })
        return
      }
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      if (del || pend) return
      const el = document.activeElement
      if (el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable)) return
      const target = event.key === 'ArrowLeft' ? p : n
      if (target) {
        event.preventDefault()
        req({ type: 'nav', id: target.id })
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  if (!color) return null
  const category = CATEGORIES[color.category]
  const others = sortTones(color.tones).filter((tone) => !tone.isMain)
  const canAdd = nextExtraStep(draft.tones) !== null
  return (
    <div
      className="viewer"
      role="dialog"
      aria-modal="true"
      aria-label={`Cor ${color.name}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) request({ type: 'close' })
      }}
    >
      <button
        type="button"
        className="viewer__round viewer__close"
        aria-label="Fechar"
        onClick={() => request({ type: 'close' })}
      >
        <X size={24} color="#5d5d5d" weight="regular" />
      </button>

      <div className="viewer__card viewer__card--color">
        <div className="cv-principal" style={{ background: color.hex }} {...area('main', color.hex)} />
        {others.length > 0 ? (
          <div className="cv-strip">
            {others.map((tone) => (
              <div
                key={tone.step}
                className="cv-strip__tone"
                style={{ background: tone.hex }}
                {...area(`tone-${tone.step}`, tone.hex)}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="viewer__actions">
        <button type="button" className="viewer__round" aria-label="Excluir" onClick={() => onDelete(color)}>
          <Trash size={20} color="#5d5d5d" weight="regular" />
        </button>
      </div>

      {prev ? (
        <>
          <button
            type="button"
            className="viewer__round viewer__arrow viewer__arrow--prev"
            aria-label="Cor anterior"
            onClick={() => request({ type: 'nav', id: prev.id })}
          >
            <CaretLeft size={24} color="#5d5d5d" weight="regular" />
          </button>
          <Neighbor color={prev} side="prev" onOpen={() => request({ type: 'nav', id: prev.id })} />
        </>
      ) : null}
      {next ? (
        <>
          <button
            type="button"
            className="viewer__round viewer__arrow viewer__arrow--next"
            aria-label="Próxima cor"
            onClick={() => request({ type: 'nav', id: next.id })}
          >
            <CaretRight size={24} color="#5d5d5d" weight="regular" />
          </button>
          <Neighbor color={next} side="next" onOpen={() => request({ type: 'nav', id: next.id })} />
        </>
      ) : null}

      <aside className="viewer-panel" aria-label="Detalhes da cor">
        <div className="viewer-panel__content">
          <section className="cv-section">
            <p className="panel-field__label">Tipo de cor</p>
            <span className="info-chip cv-chip">{category.cardLabel}</span>
          </section>

          <section className="cv-section">
            <label className="panel-field__label" htmlFor="viewer-color-use-cases">
              Casos de uso
            </label>
            <textarea
              id="viewer-color-use-cases"
              className="textarea textarea--viewer"
              value={draft.text}
              placeholder="Onde você pode usar essa cor"
              onChange={(event) => setDraft((current) => ({ ...current, text: event.target.value }))}
            />
          </section>

          <div className="vp-divider" />

          <section className="cv-section">
            <p className="panel-field__label">Variação de cor</p>
            <div className="pal-tones">
              {sortTones(draft.tones).map((tone) => (
                <ToneRow
                  key={tone.step}
                  tone={tone}
                  onChange={(step, hex) =>
                    setDraft((current) => ({
                      ...current,
                      tones: current.tones.map((item) => (item.step === step ? { ...item, hex } : item)),
                    }))
                  }
                  onRemove={(step) =>
                    setDraft((current) => ({
                      ...current,
                      tones: current.tones.filter((item) => item.step !== step),
                    }))
                  }
                />
              ))}
              {canAdd ? (
                <button
                  type="button"
                  className="pal-add"
                  onClick={() =>
                    setDraft((current) => {
                      const step = nextExtraStep(current.tones)
                      if (step === null) return current
                      return {
                        ...current,
                        tones: sortTones([...current.tones, { step, hex: toneHex(color.hex, step), isMain: false }]),
                      }
                    })
                  }
                >
                  <span className="pal-add__label">Adicionar</span>
                  <Plus size={20} color="#5d5d5d" weight="regular" />
                </button>
              ) : null}
            </div>
          </section>

          <div className="vp-divider" />
        </div>

        {saveError ? <p className="viewer-panel__error">{saveError}</p> : null}
        <div className="side-panel__footer">
          <button
            type="button"
            className="btn btn--ghost"
            disabled={saving}
            onClick={() => go({ type: 'close' })}
          >
            <span className="btn__label">Cancelar</span>
          </button>
          <button type="button" className="btn btn--primary" disabled={!dirty || saving} onClick={save}>
            <span className="btn__label">Salvar</span>
          </button>
        </div>
      </aside>

      {tooltip}

      {pending ? (
        <ConfirmDialog
          title="Descartar alterações?"
          text="As alterações feitas serão perdidas."
          cancelLabel="Cancelar"
          confirmLabel="Descartar"
          onCancel={() => setPending(null)}
          onConfirm={() => go(pending)}
        />
      ) : null}
    </div>
  )
}

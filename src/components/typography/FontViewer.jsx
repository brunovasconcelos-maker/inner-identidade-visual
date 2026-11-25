import { useEffect, useRef, useState } from 'react'
import { CaretDown, CaretLeft, CaretRight, DownloadSimple, Trash, X } from '@phosphor-icons/react'
import ConfirmDialog from '../ConfirmDialog.jsx'
import FontDetailsPanel from './FontDetailsPanel.jsx'
import { heroWeight, selectedWeights } from '../../data/manualTypography.js'
import { sortWeights, styleName, weightKey } from '../../data/typography.js'
import { downloadFamily } from '../../utils/fontDownload.js'
import { useFontPreview } from '../../utils/fonts.js'

// Lines of the specimen under the family and style names (Figma node 6519:17642).
export const SPECIMEN_LINES = [
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  'abcdefghijklmnopqrstuvwxyz',
  '0123456789',
  'ÁÉÍÓÚ ÂÊÔ ÃÕ Ç ! ? @ & % ( ) . , ; :',
]

function initialDraft(font, identity) {
  return {
    description: font.description || '',
    useCases: font.useCases || '',
    tags: font.tags,
    usageRights: font.usageRights,
    selectedWeights: font.selectedWeights,
    customRights: identity.customUsageRights,
  }
}

function sameSet(a, b) {
  return a.length === b.length && [...a].sort().join() === [...b].sort().join()
}

function sameList(a, b) {
  return a.length === b.length && a.every((item, index) => item === b[index])
}

function isDirty(draft, font) {
  return (
    draft.description !== (font.description || '') ||
    draft.useCases !== (font.useCases || '') ||
    !sameList(draft.tags, font.tags) ||
    !sameList(draft.usageRights, font.usageRights) ||
    !sameSet(draft.selectedWeights, font.selectedWeights)
  )
}

// Weight dropdown at the top right of the card: the current style name and a list of the
// selected weights and styles (the kebab menu styles, row hover included). Closes with Esc
// (without closing the viewer), a click outside or a pick.
function WeightDropdown({ weights, current, onPick }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function onMouseDown(event) {
      if (root.current && !root.current.contains(event.target)) setOpen(false)
    }
    function onKeyDown(event) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [open])

  return (
    <div className="fv-dropdown" ref={root}>
      <button
        type="button"
        className="fv-dropdown__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Peso e estilo"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="fv-dropdown__label">{styleName(current.weight, current.italic)}</span>
        <CaretDown size={20} color="#000000" weight="regular" />
      </button>
      {open ? (
        <div className="logo-menu fv-dropdown__menu" role="listbox" aria-label="Pesos e estilos">
          {weights.map((weight) => {
            const selected = weightKey(weight) === weightKey(current)
            return (
              <button
                key={weightKey(weight)}
                type="button"
                role="option"
                aria-selected={selected}
                className={`menu-row${selected ? ' menu-row--current' : ''}`}
                onClick={() => {
                  onPick(weight)
                  setOpen(false)
                }}
              >
                <span className="menu-row__label">{styleName(weight.weight, weight.italic)}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

// Mini card of the previous / next font: a big "Aa" in that font.
function Neighbor({ font, side, onOpen }) {
  const preview = useFontPreview(font, font.selectedWeights)
  return (
    <button
      type="button"
      className={`viewer__neighbor viewer__neighbor--${side} viewer__neighbor--font`}
      aria-label={font.family}
      onClick={onOpen}
    >
      <span
        className="viewer__neighbor-aa"
        style={{ fontFamily: preview.fontFamily, fontWeight: preview.weight, fontStyle: preview.italic ? 'italic' : 'normal' }}
      >
        Aa
      </span>
    </button>
  )
}

// Full screen viewer of one font: a white card with the font itself, a row of chips with its
// weights, neighbors on the sides and a details panel on the right. `fonts` is the grid order
// (search filter applied).
export default function FontViewer({ identity, fonts, fontId, deleteOpen, onChangeFont, onClose, onDelete, onUpdate }) {
  const index = fonts.findIndex((item) => item.id === fontId)
  const font = fonts[index]
  const prev = index > 0 ? fonts[index - 1] : null
  const next = index >= 0 && index < fonts.length - 1 ? fonts[index + 1] : null

  const weights = font ? selectedWeights(font) : []
  // Featured weight and style: belongs to one font and falls back to Regular (or the closest)
  // when it is gone, for example after unchecking it in the panel.
  const [featuredState, setFeaturedState] = useState({ fontId: null, key: null })
  const featured =
    (font && featuredState.fontId === font.id && weights.find((weight) => weightKey(weight) === featuredState.key)) ||
    (weights.length > 0 ? heroWeight(weights) : null)
  const preview = useFontPreview(font || null, font ? font.selectedWeights : null)

  const [draftState, setDraftState] = useState(null) // { fontId, values }
  const [pending, setPending] = useState(null) // action waiting for the discard dialog
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [downloadError, setDownloadError] = useState(false)
  const downloadTimer = useRef(null)
  useEffect(() => () => clearTimeout(downloadTimer.current), [])

  const draft = font
    ? draftState && draftState.fontId === font.id
      ? draftState.values
      : initialDraft(font, identity)
    : null
  const dirty = font ? isDirty(draft, font) : false

  function setDraft(update) {
    setDraftState((current) => {
      const base = current && current.fontId === font.id ? current.values : initialDraft(font, identity)
      return { fontId: font.id, values: update(base) }
    })
    setSaveError(null)
  }

  function go(action) {
    setFeaturedState({ fontId: null, key: null })
    setDraftState(null)
    setSaveError(null)
    setPending(null)
    if (action.type === 'close') onClose()
    else onChangeFont(action.id)
  }

  function request(action) {
    if (dirty) setPending(action)
    else go(action)
  }

  async function save() {
    setSaving(true)
    setSaveError(null)
    try {
      const known = new Set(identity.customUsageRights.map((right) => right.toLowerCase()))
      const created = draft.customRights.filter((right) => !known.has(right.toLowerCase()))
      const chosen = sortWeights(font.weights.filter((weight) => draft.selectedWeights.includes(weightKey(weight))))
      await onUpdate(
        font.id,
        {
          description: draft.description,
          useCases: draft.useCases,
          tags: draft.tags,
          usageRights: draft.usageRights,
          selectedWeights: chosen.map(weightKey),
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

  async function download() {
    try {
      await downloadFamily(font, weights)
    } catch (error) {
      console.error('Could not download', error)
      setDownloadError(true)
      clearTimeout(downloadTimer.current)
      downloadTimer.current = setTimeout(() => setDownloadError(false), 3000)
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

  if (!font) return null
  const style = {
    fontFamily: preview.fontFamily,
    fontWeight: featured.weight,
    fontStyle: featured.italic ? 'italic' : 'normal',
  }

  return (
    <div
      className="viewer"
      role="dialog"
      aria-modal="true"
      aria-label={font.family}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) request({ type: 'close' })
      }}
    >
      <button type="button" className="viewer__round viewer__close" aria-label="Fechar" onClick={() => request({ type: 'close' })}>
        <X size={24} color="#5d5d5d" weight="regular" />
      </button>

      <div className="viewer__card viewer__card--font" data-weight={weightKey(featured)}>
        <div className="fv-specimen" style={style}>
          <span className="fv-line">{font.family}</span>
          <span className="fv-line">{styleName(featured.weight, featured.italic)}</span>
          <span className="fv-line fv-line--blank" aria-hidden="true" />
          {SPECIMEN_LINES.map((line) => (
            <span key={line} className="fv-line">
              {line}
            </span>
          ))}
        </div>
      </div>

      <div className="viewer__actions viewer__actions--font">
        <button type="button" className="viewer__round" aria-label="Excluir" onClick={() => onDelete(font)}>
          <Trash size={20} color="#000000" weight="regular" />
        </button>
        <span className="viewer__share">
          <button type="button" className="viewer__round" aria-label="Baixar" onClick={download}>
            <DownloadSimple size={20} color="#000000" weight="regular" />
          </button>
          {downloadError ? <span className="tooltip">Não foi possível baixar</span> : null}
        </span>
      </div>

      <div className="fv-dropdown-slot">
        <WeightDropdown
          weights={weights}
          current={featured}
          onPick={(weight) => setFeaturedState({ fontId: font.id, key: weightKey(weight) })}
        />
      </div>

      {prev ? (
        <>
          <button
            type="button"
            className="viewer__round viewer__arrow viewer__arrow--prev"
            aria-label="Tipografia anterior"
            onClick={() => request({ type: 'nav', id: prev.id })}
          >
            <CaretLeft size={24} color="#5d5d5d" weight="regular" />
          </button>
          <Neighbor font={prev} side="prev" onOpen={() => request({ type: 'nav', id: prev.id })} />
        </>
      ) : null}
      {next ? (
        <>
          <button
            type="button"
            className="viewer__round viewer__arrow viewer__arrow--next"
            aria-label="Próxima tipografia"
            onClick={() => request({ type: 'nav', id: next.id })}
          >
            <CaretRight size={24} color="#5d5d5d" weight="regular" />
          </button>
          <Neighbor font={next} side="next" onOpen={() => request({ type: 'nav', id: next.id })} />
        </>
      ) : null}

      <FontDetailsPanel
        key={font.id}
        font={font}
        draft={draft}
        setDraft={setDraft}
        dirty={dirty}
        saving={saving}
        saveError={saveError}
        onSave={save}
        onCancel={() => go({ type: 'close' })}
      />

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

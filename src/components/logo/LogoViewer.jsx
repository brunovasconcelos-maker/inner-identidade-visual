import { useEffect, useRef, useState } from 'react'
import { CaretLeft, CaretRight, X } from '@phosphor-icons/react'
import ViewerActions from '../viewer/ViewerActions.jsx'
import ConfirmDialog from '../ConfirmDialog.jsx'
import LogoDetailsPanel from './LogoDetailsPanel.jsx'
import { ASSET_KINDS } from '../../data/assetKinds.js'
import AssetPreview from './AssetPreview.jsx'
import { useObjectUrl } from '../../hooks/useObjectUrl.js'
import { saveBlob } from '../../utils/download.js'

function initialDraft(logo, identity) {
  return {
    name: logo.name || '',
    description: logo.description || '',
    useCases: logo.useCases || '',
    tags: logo.tags,
    usageRights: logo.usageRights,
    monoVersions: logo.monoVersions || [],
    customRights: identity.customUsageRights,
  }
}

function sameList(a, b) {
  return a.length === b.length && a.every((item, index) => item === b[index])
}

function isDirty(draft, logo) {
  return (
    draft.name !== (logo.name || '') ||
    draft.description !== (logo.description || '') ||
    draft.useCases !== (logo.useCases || '') ||
    !sameList(draft.tags, logo.tags) ||
    !sameList(draft.usageRights, logo.usageRights) ||
    !sameList(
      draft.monoVersions.map((version) => version.id),
      (logo.monoVersions || []).map((version) => version.id),
    )
  )
}

// Thumbnail of the featured-image row: the original logo or one monochrome version.
function VersionTab({ file, bg, label, active, icon, onSelect }) {
  const url = useObjectUrl(file)
  return (
    <button
      type="button"
      className={`logo-thumb viewer__thumb${active ? ' viewer__thumb--active' : ''}`}
      style={{ background: bg }}
      aria-label={label}
      aria-pressed={active}
      onClick={onSelect}
    >
      {url ? <img className={`logo-thumb__img${icon ? ' logo-thumb__img--icon' : ''}`} src={url} alt="" /> : null}
    </button>
  )
}

function Neighbor({ logo, label, side, element, onOpen }) {
  const url = useObjectUrl(element ? null : logo.file)
  return (
    <button
      type="button"
      className={`viewer__neighbor viewer__neighbor--${side}`}
      aria-label={label}
      onClick={onOpen}
    >
      {element ? (
        <AssetPreview file={logo.file} format={logo.format} size={48} className="viewer__neighbor-img" />
      ) : url ? (
        <img className="viewer__neighbor-img" src={url} alt="" />
      ) : null}
    </button>
  )
}

// Full screen viewer of one logo: large preview with neighbors on the sides and a
// details panel on the right. `logos` is the grid order (search filter applied).
export default function LogoViewer({
  identity,
  logos,
  logoId,
  kind = ASSET_KINDS.logo,
  deleteOpen,
  onChangeLogo,
  onClose,
  onDelete,
  onUpdate,
}) {
  const index = logos.findIndex((item) => item.id === logoId)
  const logo = logos[index]
  const prev = index > 0 ? logos[index - 1] : null
  const next = index >= 0 && index < logos.length - 1 ? logos[index + 1] : null
  // Featured version: the original (null) or the id of one saved monochrome version.
  // It belongs to one logo, so moving to another logo shows its original again.
  const [featuredState, setFeaturedState] = useState({ logoId: null, versionId: null })
  const featuredId = logo && featuredState.logoId === logo.id ? featuredState.versionId : null
  const monoVersions = logo ? logo.monoVersions || [] : []
  const featuredVersion = logo ? monoVersions.find((version) => version.id === featuredId) || null : null
  const featuredFile = logo ? (featuredVersion ? featuredVersion.file : logo.file) : null
  const featuredName = logo ? (featuredVersion ? featuredVersion.fileName : logo.fileName) : ''
  const url = useObjectUrl(kind.anyFile ? null : featuredFile)

  const [draftState, setDraftState] = useState(null) // { logoId, values }
  const [pending, setPending] = useState(null) // action waiting for the discard dialog
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const draft = logo
    ? draftState && draftState.logoId === logo.id
      ? draftState.values
      : initialDraft(logo, identity)
    : null
  const dirty = logo ? isDirty(draft, logo) : false

  function setDraft(update) {
    setDraftState((current) => {
      const base = current && current.logoId === logo.id ? current.values : initialDraft(logo, identity)
      return { logoId: logo.id, values: update(base) }
    })
    setSaveError(null)
  }

  function go(action) {
    setFeaturedState({ logoId: null, versionId: null })
    setDraftState(null)
    setSaveError(null)
    setPending(null)
    if (action.type === 'close') onClose()
    else onChangeLogo(action.id)
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
      await onUpdate(
        logo.id,
        {
          ...(kind.hasName ? { name: draft.name.trim() || logo.fileName } : {}),
          description: draft.description,
          useCases: draft.useCases,
          tags: draft.tags,
          usageRights: draft.usageRights,
          ...(kind.hasMono ? { monoVersions: draft.monoVersions } : {}),
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

  if (!logo) return null
  const label = kind.label(logo)

  return (
    <div
      className="viewer"
      role="dialog"
      aria-modal="true"
      aria-label={kind.hasType ? `Logo ${label}` : label}
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

      <div className="viewer__card">
        {kind.anyFile ? (
          <AssetPreview
            file={logo.file}
            format={logo.format}
            size={200}
            className="viewer__img"
            iconClassName="viewer__file-icon"
            alt={label}
          />
        ) : url ? (
          <img className="viewer__img" src={url} alt={label} />
        ) : null}
      </div>

      <ViewerActions
        onDelete={() => onDelete(logo)}
        onDownload={() => saveBlob(featuredFile, featuredName)}
      />

      {monoVersions.length > 0 ? (
        <div className="viewer__thumbs">
          <VersionTab
            file={logo.file}
            bg="#f4f5f5"
            label="Original"
            icon={!kind.hasType}
            active={!featuredVersion}
            onSelect={() => setFeaturedState({ logoId: logo.id, versionId: null })}
          />
          {monoVersions.map((version) => (
            <VersionTab
              key={version.id}
              file={version.file}
              bg={version.previewBg}
              label={version.name}
              icon={!kind.hasType}
              active={featuredVersion === version}
              onSelect={() => setFeaturedState({ logoId: logo.id, versionId: version.id })}
            />
          ))}
        </div>
      ) : null}

      {prev ? (
        <>
          <button
            type="button"
            className="viewer__round viewer__arrow viewer__arrow--prev"
            aria-label={kind.hasName ? 'Elemento anterior' : 'Logo anterior'}
            onClick={() => request({ type: 'nav', id: prev.id })}
          >
            <CaretLeft size={24} color="#5d5d5d" weight="regular" />
          </button>
          <Neighbor logo={prev} label={kind.label(prev)} side="prev" element={kind.anyFile} onOpen={() => request({ type: 'nav', id: prev.id })} />
        </>
      ) : null}
      {next ? (
        <>
          <button
            type="button"
            className="viewer__round viewer__arrow viewer__arrow--next"
            aria-label={kind.hasName ? 'Próximo elemento' : 'Próxima logo'}
            onClick={() => request({ type: 'nav', id: next.id })}
          >
            <CaretRight size={24} color="#5d5d5d" weight="regular" />
          </button>
          <Neighbor logo={next} label={kind.label(next)} side="next" element={kind.anyFile} onOpen={() => request({ type: 'nav', id: next.id })} />
        </>
      ) : null}

      <LogoDetailsPanel
        key={logo.id}
        logo={logo}
        kind={kind}
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

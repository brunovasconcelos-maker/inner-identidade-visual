import { useState } from 'react'
import { DownloadSimple, FilePlus, Trash } from '@phosphor-icons/react'
import TagsEditor from './TagsEditor.jsx'
import UsageRightsSelect from './UsageRightsSelect.jsx'
import VersionThumb from './VersionThumb.jsx'
import { newId } from '../../data/identities.jsx'
import { findLogoType } from '../../data/logoTypes.js'
import { BUILTIN_RIGHTS, addCustomRight, toggleUsageRight } from '../../data/usageRights.js'
import { saveBlob } from '../../utils/download.js'
import { pickImage } from '../../utils/files.js'

function dimensions(logo) {
  return logo.width && logo.height ? `${logo.width}×${logo.height}px` : 'Não disponível'
}

// Side panel of the viewer. Read only chips on top, editable fields below. The draft
// lives in the viewer, so it can guard navigation and closing.
export default function LogoDetailsPanel({
  logo,
  draft,
  setDraft,
  dirty,
  saving,
  saveError,
  onSave,
  onCancel,
}) {
  const type = findLogoType(logo.type)
  const [pendingColor, setPendingColor] = useState(null) // new color waiting for its name
  const [colorError, setColorError] = useState(null)
  const options = [...BUILTIN_RIGHTS, ...draft.customRights]

  function patch(values) {
    setDraft((current) => ({ ...current, ...values }))
  }

  async function startAddColor() {
    const picked = await pickImage(setColorError)
    if (picked) setPendingColor({ ...picked, name: '' })
  }

  function confirmColor() {
    const name = pendingColor.name.trim()
    if (!name) return
    setDraft((current) => ({
      ...current,
      monoVersions: [
        ...current.monoVersions,
        {
          id: newId(),
          name,
          file: pendingColor.file,
          fileName: pendingColor.file.name,
          previewBg: pendingColor.previewBg,
        },
      ],
    }))
    setPendingColor(null)
  }

  function cancelEdits() {
    setPendingColor(null)
    setColorError(null)
    onCancel()
  }

  return (
    <aside className="viewer-panel" aria-label="Detalhes da logo">
      <div className="viewer-panel__content">
        <section className="vp-section">
          <p className="panel-field__label">Tipo de logo</p>
          <span className="info-chip">{type.label}</span>
        </section>

        <div className="vp-row">
          <section className="vp-section vp-section--format">
            <p className="panel-field__label">Formato</p>
            <span className="info-chip">{logo.format}</span>
          </section>
          <section className="vp-section vp-section--grow">
            <p className="panel-field__label">Dimensões</p>
            <span className="info-chip">{dimensions(logo)}</span>
          </section>
        </div>

        <section className="vp-section">
          <label className="panel-field__label" htmlFor="viewer-description">
            Descrição
          </label>
          <textarea
            id="viewer-description"
            className="textarea textarea--viewer"
            value={draft.description}
            placeholder="Descreva esse arquivo"
            onChange={(event) => patch({ description: event.target.value })}
          />
        </section>

        <section className="vp-section">
          <label className="panel-field__label" htmlFor="viewer-use-cases">
            Casos de uso
          </label>
          <textarea
            id="viewer-use-cases"
            className="textarea textarea--viewer"
            value={draft.useCases}
            placeholder="Onde você pode usar esse arquivo"
            onChange={(event) => patch({ useCases: event.target.value })}
          />
        </section>

        <div className="vp-divider" />

        <section className="vp-section">
          <p className="panel-field__label">Variação de cor</p>
          <div className="version-list">
            {draft.monoVersions.map((version) => (
              <div className="version-row" key={version.id}>
                <VersionThumb file={version.file} bg={version.previewBg} />
                <span className="version-row__name">{version.name}</span>
                <span className="version-row__actions">
                  <button
                    type="button"
                    className="icon-action"
                    aria-label={`Remover ${version.name}`}
                    onClick={() =>
                      patch({
                        monoVersions: draft.monoVersions.filter((item) => item.id !== version.id),
                      })
                    }
                  >
                    <Trash size={20} color="#5d5d5d" weight="regular" />
                  </button>
                  <button
                    type="button"
                    className="icon-action"
                    aria-label={`Baixar ${version.name}`}
                    onClick={() => saveBlob(version.file, version.fileName)}
                  >
                    <DownloadSimple size={20} color="#5d5d5d" weight="regular" />
                  </button>
                </span>
              </div>
            ))}
            {pendingColor ? (
              <div className="version-row">
                <VersionThumb file={pendingColor.file} bg={pendingColor.previewBg} />
                <input
                  className="inline-input inline-input--boxed"
                  type="text"
                  value={pendingColor.name}
                  placeholder="Nome da cor"
                  autoFocus
                  autoComplete="off"
                  aria-label="Nome da cor"
                  onChange={(event) => setPendingColor({ ...pendingColor, name: event.target.value })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      confirmColor()
                    } else if (event.key === 'Escape') {
                      event.preventDefault()
                      event.stopPropagation()
                      setPendingColor(null)
                    }
                  }}
                />
              </div>
            ) : (
              <button type="button" className="version-row version-row--add" onClick={startAddColor}>
                <span className="mono-row__tile">
                  <FilePlus size={24} color="#5d5d5d" weight="regular" />
                </span>
                <span className="version-row__name">Adicionar cor</span>
              </button>
            )}
            {colorError ? <p className="panel-error">{colorError}</p> : null}
          </div>
        </section>

        <div className="vp-divider" />

        <section className="vp-section">
          <p className="panel-field__label">Tags</p>
          <TagsEditor tags={draft.tags} onChange={(tags) => patch({ tags })} />
        </section>

        <div className="vp-divider" />

        <section className="vp-section">
          <p className="panel-field__label">Direitos de uso</p>
          <UsageRightsSelect
            options={options}
            selected={draft.usageRights}
            onToggle={(right) => patch({ usageRights: toggleUsageRight(draft.usageRights, right) })}
            onCreate={(name) => setDraft((current) => addCustomRight(current, name))}
          />
        </section>
      </div>

      {saveError ? <p className="viewer-panel__error">{saveError}</p> : null}
      <div className="side-panel__footer">
        <button type="button" className="btn btn--ghost" disabled={saving} onClick={cancelEdits}>
          <span className="btn__label">Cancelar</span>
        </button>
        <button type="button" className="btn btn--primary" disabled={!dirty || saving} onClick={onSave}>
          <span className="btn__label">Salvar</span>
        </button>
      </div>
    </aside>
  )
}

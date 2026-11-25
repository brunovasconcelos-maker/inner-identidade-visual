import { Circle, RadioButton } from '@phosphor-icons/react'
import TagsEditor from '../logo/TagsEditor.jsx'
import UsageRightsSelect from '../logo/UsageRightsSelect.jsx'
import { BUILTIN_RIGHTS, addCustomRight, toggleUsageRight } from '../../data/usageRights.js'

// "1.512 ícones", "1 ícone".
export const iconsLabel = (count) => `${count.toLocaleString('pt-BR')} ${count === 1 ? 'ícone' : 'ícones'}`

// Side panel of the library viewer. Read only chips on top (library, origin, number of icons),
// editable fields below: the style (free libraries with more than one style: the featured grid
// follows the choice live, it is stored on "Salvar"), name, description, use cases, tags and
// usage rights. The draft lives in the viewer, so it can guard closing.
export default function LibraryDetailsPanel({
  item,
  library,
  count,
  draft,
  setDraft,
  dirty,
  saving,
  saveError,
  onSave,
  onCancel,
}) {
  const options = [...BUILTIN_RIGHTS, ...draft.customRights]
  const isUpload = item.source === 'upload'

  function patch(values) {
    setDraft((current) => ({ ...current, ...values }))
  }

  // The style tag follows the chosen style, unless the user removed it.
  function chooseStyle(style) {
    setDraft((current) => {
      if (current.style === style) return current
      let tags = current.tags
      if (tags.includes(current.style)) {
        tags = tags.includes(style)
          ? tags.filter((tag) => tag !== current.style)
          : tags.map((tag) => (tag === current.style ? style : tag))
      }
      return { ...current, style, tags }
    })
  }

  return (
    <aside className="viewer-panel" aria-label="Detalhes da biblioteca">
      <div className="viewer-panel__content">
        <section className="vp-section">
          <p className="panel-field__label">Biblioteca</p>
          <span className="info-chip">{isUpload ? 'Biblioteca própria' : library.name}</span>
        </section>

        <div className="vp-row">
          <section className="vp-section vp-section--format">
            <p className="panel-field__label">Origem</p>
            <span className="info-chip">{isUpload ? 'Upload' : 'Gratuita'}</span>
          </section>
          <section className="vp-section vp-section--grow">
            <p className="panel-field__label">Ícones</p>
            <span className="info-chip">{iconsLabel(count)}</span>
          </section>
        </div>

        {!isUpload && library.styles.length > 1 ? (
          <>
            <div className="vp-divider" />
            <section className="vp-section">
              <p className="panel-field__label" id="viewer-style-label">
                Estilo
              </p>
              <div className="weights-list weights-list--viewer" role="radiogroup" aria-labelledby="viewer-style-label">
                {library.styles.map((style) => {
                  const checked = draft.style === style.label
                  return (
                    <button
                      key={style.id}
                      type="button"
                      className="weights-row"
                      role="radio"
                      aria-checked={checked}
                      onClick={() => chooseStyle(style.label)}
                    >
                      {checked ? (
                        <RadioButton size={24} color="#000000" weight="fill" />
                      ) : (
                        <Circle size={24} color="#5d5d5d" weight="regular" />
                      )}
                      <span className="weights-row__label">{style.label}</span>
                    </button>
                  )
                })}
              </div>
            </section>
          </>
        ) : null}

        <div className="vp-divider" />

        <section className="vp-section">
          <label className="panel-field__label" htmlFor="viewer-name">
            Nome
          </label>
          <input
            id="viewer-name"
            className="input"
            type="text"
            value={draft.name}
            placeholder="Nome da biblioteca"
            autoComplete="off"
            onChange={(event) => patch({ name: event.target.value })}
          />
        </section>

        <section className="vp-section">
          <label className="panel-field__label" htmlFor="viewer-description">
            Descrição
          </label>
          <textarea
            id="viewer-description"
            className="textarea textarea--viewer"
            value={draft.description}
            placeholder="Descreva essa biblioteca"
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
            placeholder="Onde você pode usar essa biblioteca"
            onChange={(event) => patch({ useCases: event.target.value })}
          />
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
        <button type="button" className="btn btn--ghost" disabled={saving} onClick={onCancel}>
          <span className="btn__label">Cancelar</span>
        </button>
        <button type="button" className="btn btn--primary" disabled={!dirty || saving} onClick={onSave}>
          <span className="btn__label">Salvar</span>
        </button>
      </div>
    </aside>
  )
}

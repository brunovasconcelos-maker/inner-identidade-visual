import { CheckSquare, Square } from '@phosphor-icons/react'
import TagsEditor from '../logo/TagsEditor.jsx'
import UsageRightsSelect from '../logo/UsageRightsSelect.jsx'
import { findFontType, pesosLabel, sortWeights, weightKey } from '../../data/typography.js'
import { BUILTIN_RIGHTS, addCustomRight, toggleUsageRight } from '../../data/usageRights.js'

// Side panel of the font viewer. Read only chips on top (type, origin, number of weights),
// editable fields below: the weights (same checkbox list and rule as the add flow: at least
// one stays checked), description, use cases, tags and usage rights. The draft lives in the
// viewer, so it can guard navigation and closing.
export default function FontDetailsPanel({
  font,
  draft,
  setDraft,
  dirty,
  saving,
  saveError,
  onSave,
  onCancel,
}) {
  const type = findFontType(font.type)
  const options = [...BUILTIN_RIGHTS, ...draft.customRights]

  function patch(values) {
    setDraft((current) => ({ ...current, ...values }))
  }

  function toggleWeight(key) {
    setDraft((current) => {
      const selected = current.selectedWeights
      if (!selected.includes(key)) return { ...current, selectedWeights: [...selected, key] }
      return selected.length === 1 ? current : { ...current, selectedWeights: selected.filter((item) => item !== key) }
    })
  }

  return (
    <aside className="viewer-panel" aria-label="Detalhes da tipografia">
      <div className="viewer-panel__content">
        <section className="vp-section">
          <p className="panel-field__label">Tipo de tipografia</p>
          <span className="info-chip">{type.label}</span>
        </section>

        <div className="vp-row">
          <section className="vp-section vp-section--format">
            <p className="panel-field__label">Origem</p>
            <span className="info-chip">{font.source === 'google' ? 'Google Fonts' : 'Upload'}</span>
          </section>
          <section className="vp-section vp-section--grow">
            <p className="panel-field__label">Pesos</p>
            <span className="info-chip">{pesosLabel(font.selectedWeights.length)}</span>
          </section>
        </div>

        <div className="vp-divider" />

        <section className="vp-section">
          <p className="panel-field__label" id="viewer-weights-label">
            Pesos
          </p>
          <div className="weights-list weights-list--viewer" role="group" aria-labelledby="viewer-weights-label">
            {sortWeights(font.weights).map((weight) => {
              const key = weightKey(weight)
              const checked = draft.selectedWeights.includes(key)
              return (
                <button
                  key={key}
                  type="button"
                  className="weights-row"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => toggleWeight(key)}
                >
                  {checked ? (
                    <CheckSquare size={24} color="#000000" weight="fill" />
                  ) : (
                    <Square size={24} color="#5d5d5d" weight="regular" />
                  )}
                  <span className="weights-row__label">{weight.name}</span>
                </button>
              )
            })}
          </div>
        </section>

        <div className="vp-divider" />

        <section className="vp-section">
          <label className="panel-field__label" htmlFor="viewer-description">
            Descrição
          </label>
          <textarea
            id="viewer-description"
            className="textarea textarea--viewer"
            value={draft.description}
            placeholder="Descreva essa tipografia"
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
            placeholder="Onde você pode usar essa tipografia"
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

import { useEffect, useRef, useState } from 'react'
import { CheckSquare, Minus, Plus, Square, X } from '@phosphor-icons/react'
import CreditsIcon from '../icons/CreditsIcon.jsx'
import { sortLogos } from '../../data/logoTypes.js'
import { useObjectUrl } from '../../hooks/useObjectUrl.js'

const MIN_COLORS = 1
const MAX_COLORS = 5

function LogoTile({ logo, selected, onToggle }) {
  const url = useObjectUrl(logo.file)
  return (
    <button
      type="button"
      className={`gen-logo${selected ? ' gen-logo--selected' : ''}`}
      role="checkbox"
      aria-checked={selected}
      aria-label={`Usar a logo ${logo.fileName}`}
      onClick={onToggle}
    >
      {url ? <img className="gen-logo__img" src={url} alt="" /> : null}
      {selected ? (
        <span className="gen-logo__check">
          <CheckSquare size={24} color="#000000" weight="fill" />
        </span>
      ) : null}
    </button>
  )
}

function CategoryRow({ label, checked, onToggle, counter }) {
  return (
    <div className="gen-row">
      <button
        type="button"
        className="gen-row__check"
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        onClick={onToggle}
      >
        {checked ? (
          <CheckSquare size={24} color="#000000" weight="fill" />
        ) : (
          <Square size={24} color="#5d5d5d" weight="regular" />
        )}
      </button>
      <span className="gen-row__label">{label}</span>
      {counter ? (
        <div className={`gen-counter${checked ? '' : ' gen-counter--disabled'}`}>
          <span className="gen-counter__text">Cores</span>
          <button
            type="button"
            className="gen-counter__btn"
            aria-label={`Menos cores em ${label}`}
            disabled={!checked || counter.value <= MIN_COLORS}
            onClick={() => counter.onChange(counter.value - 1)}
          >
            <Minus size={20} color="currentColor" weight="regular" />
          </button>
          <span className="gen-counter__text" aria-live="polite">
            {counter.value}
          </span>
          <button
            type="button"
            className="gen-counter__btn"
            aria-label={`Mais cores em ${label}`}
            disabled={!checked || counter.value >= MAX_COLORS}
            onClick={() => counter.onChange(counter.value + 1)}
          >
            <Plus size={20} color="currentColor" weight="regular" />
          </button>
        </div>
      ) : null}
    </div>
  )
}

// "Gerar paleta" (Figma node 6430:28942): pick the reference logos and the colors to
// generate. "Criar" hands the choice to the page, which runs the generation.
export default function GeneratePaletteModal({ identity, onClose, onCreate }) {
  const logos = sortLogos(identity.logos)
  const brandTaken = identity.paleta.some((color) => color.category === 'marca')
  // Only the principal logo is selected, or the first one in type order.
  const [selectedIds, setSelectedIds] = useState(() => {
    const principal = logos.find((logo) => logo.type === 'principal')
    return [(principal || logos[0]).id]
  })
  const [marca, setMarca] = useState(true)
  const [primaria, setPrimaria] = useState({ checked: true, count: 1 })
  const [secundaria, setSecundaria] = useState({ checked: true, count: 1 })

  const canCreate = selectedIds.length > 0 && ((!brandTaken && marca) || primaria.checked || secundaria.checked)

  // Esc closes directly.
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape' && !event.defaultPrevented) closeRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  function toggleLogo(id) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  function handleCreate() {
    if (!canCreate) return
    onCreate({
      files: logos.filter((logo) => selectedIds.includes(logo.id)).map((logo) => logo.file),
      counts: {
        marca: !brandTaken && marca ? 1 : 0,
        primaria: primaria.checked ? primaria.count : 0,
        secundaria: secundaria.checked ? secundaria.count : 0,
      },
    })
    onClose()
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="modal modal--logo" role="dialog" aria-modal="true" aria-labelledby="gen-title">
        <div className="modal__header">
          <h2 id="gen-title" className="modal__title">
            Gerar paleta
          </h2>
          <button type="button" className="modal__close" aria-label="Fechar" onClick={onClose}>
            <X size={24} color="#5d5d5d" weight="regular" />
          </button>
        </div>

        <div className="gen-section">
          <p className="gen-section__title">Selecione as logos que quer usar como referência</p>
          <div className="gen-logos">
            {logos.map((logo) => (
              <LogoTile
                key={logo.id}
                logo={logo}
                selected={selectedIds.includes(logo.id)}
                onToggle={() => toggleLogo(logo.id)}
              />
            ))}
          </div>
        </div>

        <div className="gen-section">
          <p className="gen-section__title">Quais cores você gostaria de gerar?</p>
          <div className="gen-rows">
            {brandTaken ? null : <CategoryRow label="Cor da marca" checked={marca} onToggle={() => setMarca(!marca)} />}
            <CategoryRow
              label="Paleta primária"
              checked={primaria.checked}
              onToggle={() => setPrimaria({ ...primaria, checked: !primaria.checked })}
              counter={{ value: primaria.count, onChange: (count) => setPrimaria({ ...primaria, count }) }}
            />
            <CategoryRow
              label="Paleta secundária"
              checked={secundaria.checked}
              onToggle={() => setSecundaria({ ...secundaria, checked: !secundaria.checked })}
              counter={{ value: secundaria.count, onChange: (count) => setSecundaria({ ...secundaria, count }) }}
            />
          </div>
        </div>

        <div className="gen-footer">
          <button type="button" className="btn btn--ghost gen-footer__cancel" onClick={onClose}>
            <span className="btn__label">Cancelar</span>
          </button>
          <button type="button" className="btn btn--primary gen-create" disabled={!canCreate} onClick={handleCreate}>
            <span className="btn__label">Criar</span>
            <span className="gen-create__credits">
              <CreditsIcon />
              <span className="gen-create__value">120</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

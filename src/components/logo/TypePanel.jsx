import { useState } from 'react'
import { Check } from '@phosphor-icons/react'
import SidePanel from './SidePanel.jsx'
import { LOGO_TYPES } from '../../data/logoTypes.js'

// Single selection, never empty. Types used by another logo of the identity are disabled.
export default function TypePanel({
  currentType,
  usedTypes,
  onSave,
  onCancel,
  title = 'Tipo de logo',
  options = LOGO_TYPES,
}) {
  const [selected, setSelected] = useState(currentType)

  return (
    <SidePanel title={title} onCancel={onCancel} onSave={() => onSave(selected)}>
      <div className="option-list">
        {options.map((type) => {
          const disabled = usedTypes.has(type.id)
          const isSelected = selected === type.id
          return (
            <button
              key={type.id}
              type="button"
              className={`option-card${isSelected ? ' option-card--selected' : ''}`}
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => setSelected(type.id)}
            >
              <span className="option-card__texts">
                <span className="option-card__title">{type.label}</span>
                <span className="option-card__description">{type.description}</span>
              </span>
              <span className="option-card__check">
                {isSelected ? <Check size={24} color="#000000" weight="regular" /> : null}
              </span>
            </button>
          )
        })}
      </div>
    </SidePanel>
  )
}

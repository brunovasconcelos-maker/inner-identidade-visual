import { useState } from 'react'
import { Circle, RadioButton } from '@phosphor-icons/react'
import SidePanel from '../logo/SidePanel.jsx'

// Radio list of the styles of a library (Figma node 6512:14369, "Pesos" there). Single
// selection, never empty.
export default function LibraryStylePanel({ library, selected: initial, onSave, onCancel }) {
  const [selected, setSelected] = useState(initial)
  return (
    <SidePanel title="Estilo" onCancel={onCancel} onSave={() => onSave(selected)}>
      <div className="weights-list" role="radiogroup" aria-label="Estilo">
        {library.styles.map((style) => {
          const checked = selected === style.label
          return (
            <button
              key={style.id}
              type="button"
              className="weights-row"
              role="radio"
              aria-checked={checked}
              onClick={() => setSelected(style.label)}
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
    </SidePanel>
  )
}

import { useState } from 'react'
import { CheckSquare, Square } from '@phosphor-icons/react'
import SidePanel from '../logo/SidePanel.jsx'
import { sortWeights, weightKey } from '../../data/typography.js'

// Checkbox list of the weights available in the font. At least one stays checked: the last
// checked weight cannot be unchecked.
export default function WeightsPanel({ weights, selected: initial, onSave, onCancel }) {
  const [selected, setSelected] = useState(initial)

  function toggle(key) {
    setSelected((current) => {
      if (!current.includes(key)) return [...current, key]
      return current.length === 1 ? current : current.filter((item) => item !== key)
    })
  }

  return (
    <SidePanel title="Pesos" onCancel={onCancel} onSave={() => onSave(selected)}>
      <div className="weights-list">
        {sortWeights(weights).map((weight) => {
          const key = weightKey(weight)
          const checked = selected.includes(key)
          return (
            <button
              key={key}
              type="button"
              className="weights-row"
              role="checkbox"
              aria-checked={checked}
              onClick={() => toggle(key)}
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
    </SidePanel>
  )
}

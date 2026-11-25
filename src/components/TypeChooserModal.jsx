import { useEffect } from 'react'
import { X } from '@phosphor-icons/react'

// Type chooser shown before a logo or a typography is added (Figma nodes 6512:11235,
// 6512:11520 and 6512:11660). `rows` is how many cards each row holds, e.g. [2, 3].
// Types already used in the identity use the disabled card style and cannot be picked.
// Closes with X, Esc or a click on the overlay, with no confirmation.
export default function TypeChooserModal({ title, options, usedTypes, rows, onPick, onClose }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape' && !event.defaultPrevented) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  let index = 0
  const lines = rows.map((count) => {
    const line = options.slice(index, index + count)
    index += count
    return line
  })

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="modal modal--logo" role="dialog" aria-modal="true" aria-labelledby="type-chooser-title">
        <div className="modal__header">
          <h2 id="type-chooser-title" className="modal__title">
            {title}
          </h2>
          <button type="button" className="modal__close" aria-label="Fechar" onClick={onClose}>
            <X size={24} color="#5d5d5d" weight="regular" />
          </button>
        </div>
        <div className="type-chooser">
          {lines.map((line, row) => (
            <div className="type-chooser__row" key={row}>
              {line.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className="type-card"
                  disabled={usedTypes.has(type.id)}
                  aria-disabled={usedTypes.has(type.id)}
                  onClick={() => onPick(type.id)}
                >
                  <span className="type-card__texts">
                    <span className="type-card__title">{type.label}</span>
                    <span className="type-card__description">{type.description}</span>
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

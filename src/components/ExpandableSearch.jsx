import { useEffect } from 'react'
import { MagnifyingGlass, X } from '@phosphor-icons/react'

// Magnifier that expands an input to its left. The parent owns `open` and `query`.
// `onClose` must clear the query and collapse the field (X button and Esc).
export default function ExpandableSearch({
  open,
  onOpen,
  onClose,
  query,
  onQueryChange,
  placeholder,
  triggerClassName = 'icon-btn',
  iconSize = 20,
  escapeEnabled = true,
}) {
  useEffect(() => {
    if (!open || !escapeEnabled) return undefined
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, escapeEnabled, onClose])

  return (
    <>
      {open ? (
        <div className="search-field">
          <input
            className="search-field__input"
            type="text"
            value={query}
            placeholder={placeholder}
            autoFocus
            autoComplete="off"
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <button
            type="button"
            className="search-field__clear"
            aria-label="Limpar busca"
            onClick={onClose}
          >
            <X size={16} color="#5d5d5d" weight="regular" />
          </button>
        </div>
      ) : null}
      <button type="button" className={triggerClassName} aria-label={placeholder} onClick={onOpen}>
        <MagnifyingGlass size={iconSize} color="#5d5d5d" weight="regular" />
      </button>
    </>
  )
}

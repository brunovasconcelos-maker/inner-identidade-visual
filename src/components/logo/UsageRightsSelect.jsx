import { useEffect, useRef, useState } from 'react'
import { CaretDown, CheckSquare, Plus, Square } from '@phosphor-icons/react'
import { usageRightsSummary } from '../../data/usageRights.js'

// Multi-select dropdown. `options` is the full ordered list (built-in plus custom).
// The "Criar direito" row opens an inline input inside the dropdown.
export default function UsageRightsSelect({ options, selected, onToggle, onCreate }) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [openUp, setOpenUp] = useState(false)
  const rootRef = useRef(null)

  const creatingRef = useRef(false)
  creatingRef.current = creating

  useEffect(() => {
    if (!open) return undefined
    function onMouseDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) closeMenu()
    }
    // Capture phase, so Esc closes only the inline input or the dropdown and never the
    // panel behind it, even when focus was lost (for example after pressing Enter).
    function onKeyDown(event) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      if (creatingRef.current) {
        setCreating(false)
        setNewName('')
      } else {
        closeMenu()
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [open])

  function openMenu() {
    // Opens upward when there is not enough room below the field (panel footer is 73px).
    const rect = rootRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - 73 - rect.bottom
    setOpenUp(spaceBelow < 340 && rect.top > spaceBelow)
    setOpen(true)
  }

  function closeMenu() {
    setOpen(false)
    setCreating(false)
    setNewName('')
  }

  function submitNew() {
    const name = newName.trim()
    if (!name) return
    onCreate(name)
    setCreating(false)
    setNewName('')
  }

  const summary = usageRightsSummary(options, selected)

  return (
    <div className="select" ref={rootRef}>
      <button
        type="button"
        className="select__field"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? closeMenu() : openMenu())}
      >
        <span className="select__value">{summary || 'Selecione os direitos de uso'}</span>
        <CaretDown size={20} color="#5d5d5d" weight="regular" />
      </button>
      {open ? (
        <div
          className={`select__menu${openUp ? ' select__menu--up' : ''}`}
          role="listbox"
          aria-multiselectable="true"
        >
          {options.map((option) => {
            const checked = selected.includes(option)
            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={checked}
                className="menu-row"
                onClick={() => onToggle(option)}
              >
                {checked ? (
                  <CheckSquare size={24} color="#000000" weight="fill" />
                ) : (
                  <Square size={24} color="#5d5d5d" weight="regular" />
                )}
                <span className="menu-row__label">{option}</span>
              </button>
            )
          })}
          {creating ? (
            <div className="menu-row menu-row--input">
              <Plus size={24} color="#5d5d5d" weight="regular" />
              <input
                className="inline-input"
                type="text"
                value={newName}
                placeholder="Nome do direito"
                autoFocus
                autoComplete="off"
                onChange={(event) => setNewName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    submitNew()
                  }
                }}
              />
            </div>
          ) : (
            <button type="button" className="menu-row" onClick={() => setCreating(true)}>
              <Plus size={24} color="#5d5d5d" weight="regular" />
              <span className="menu-row__label">Criar direito</span>
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}

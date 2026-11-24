import { useEffect, useRef } from 'react'
import {
  CheckSquare,
  Copy,
  DotsThreeVertical,
  PencilSimple,
  Square,
  Trash,
} from '@phosphor-icons/react'
import { CATEGORIES, sortTones, textColorFor } from '../../data/palette.js'

const MENU_ITEMS = [
  { action: 'edit', label: 'Editar', Icon: PencilSimple },
  { action: 'copy', label: 'Copiar hex', Icon: Copy },
  { action: 'delete', label: 'Excluir', Icon: Trash },
]

// Card of a color: swatch with the main hex, strip with the other tones, name and
// category. Hover, checkbox, kebab and menu follow the logo card.
export default function ColorCard({
  color,
  selected,
  selecting,
  menuOpen,
  copiedTip,
  onToggleSelect,
  onOpenMenu,
  onCloseMenu,
  onAction,
  onOpen,
}) {
  const kebabRef = useRef(null)
  const others = sortTones(color.tones).filter((tone) => !tone.isMain)
  const textColor = textColorFor(color.hex)
  // Checkbox and kebab sit on the swatch, so their ink follows its contrast.
  const ink = textColor === '#ffffff' ? '#ffffff' : '#5d5d5d'
  const selectedInk = textColor === '#ffffff' ? '#ffffff' : '#000000'

  useEffect(() => {
    if (!menuOpen) return undefined
    function onMouseDown(event) {
      if (kebabRef.current && !kebabRef.current.contains(event.target)) onCloseMenu()
    }
    function onKeyDown(event) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      onCloseMenu()
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [menuOpen, onCloseMenu])

  const classes = [
    'logo-card',
    'color-card',
    selected ? 'logo-card--selected' : '',
    selecting ? 'logo-card--selecting' : '',
    menuOpen ? 'logo-card--menu-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      <div className="logo-card__top">
        <div
          className="logo-card__preview"
          style={{ background: color.hex }}
          role="button"
          tabIndex={0}
          aria-label={`Abrir ${color.name}`}
          onClick={() => onOpen(color.id)}
          onKeyDown={(event) => {
            if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault()
              onOpen(color.id)
            }
          }}
        >
          <span className="color-card__hex" style={{ color: textColor }}>
            {color.hex}
          </span>
          <button
            type="button"
            className="logo-card__check"
            role="checkbox"
            aria-checked={selected}
            aria-label={`Selecionar ${color.name}`}
            onClick={(event) => {
              event.stopPropagation()
              onToggleSelect(color.id)
            }}
          >
            {selected ? (
              <CheckSquare size={24} color={selectedInk} weight="fill" />
            ) : (
              <Square size={24} color={ink} weight="regular" />
            )}
          </button>
          <div className="logo-card__kebab" ref={kebabRef} onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="logo-card__kebab-btn"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={`Mais opções de ${color.name}`}
              onClick={() => (menuOpen ? onCloseMenu() : onOpenMenu(color.id))}
            >
              <DotsThreeVertical size={24} color={ink} weight="bold" />
            </button>
            {menuOpen ? (
              <div className="logo-menu" role="menu">
                {MENU_ITEMS.map(({ action, label, Icon }) => (
                  <button
                    key={action}
                    type="button"
                    role="menuitem"
                    className="menu-row"
                    onClick={() => onAction(action, color)}
                  >
                    <Icon size={24} color="#5d5d5d" weight="regular" />
                    <span className="menu-row__label">{label}</span>
                  </button>
                ))}
              </div>
            ) : null}
            {copiedTip ? <span className="tooltip tooltip--end">Copiado</span> : null}
          </div>
        </div>

        {others.length > 0 ? (
          <div className="color-strip">
            {others.map((tone) => (
              <span key={tone.step} className="color-strip__tone" style={{ background: tone.hex }} />
            ))}
          </div>
        ) : null}
      </div>

      <div className="logo-card__texts">
        <p className="logo-card__name">{color.name}</p>
        <p className="logo-card__date">{CATEGORIES[color.category].cardLabel}</p>
      </div>
    </div>
  )
}

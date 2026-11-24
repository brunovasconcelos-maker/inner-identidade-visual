import { useEffect, useRef } from 'react'
import {
  CheckSquare,
  DotsThreeVertical,
  DownloadSimple,
  PencilSimple,
  Square,
  Trash,
} from '@phosphor-icons/react'
import { findFontType, pesosLabel } from '../../data/typography.js'
import { useFontPreview } from '../../utils/fonts.js'

const MENU_ITEMS = [
  { action: 'edit', label: 'Editar', Icon: PencilSimple },
  { action: 'download', label: 'Baixar', Icon: DownloadSimple },
  { action: 'delete', label: 'Excluir', Icon: Trash },
]

// Card of a font: big "Aa" in the font, "Family (N pesos)" and the type. Hover, checkbox,
// kebab and menu follow the logo card. Clicking the card does nothing yet.
export default function FontCard({
  font,
  selected,
  selecting,
  menuOpen,
  onToggleSelect,
  onOpenMenu,
  onCloseMenu,
  onAction,
}) {
  const kebabRef = useRef(null)
  const preview = useFontPreview(font, font.selectedWeights)
  const type = findFontType(font.type)

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
    'font-card',
    selected ? 'logo-card--selected' : '',
    selecting ? 'logo-card--selecting' : '',
    menuOpen ? 'logo-card--menu-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      <div className="logo-card__top">
        <div className="logo-card__preview">
          <span
            className="font-card__aa"
            style={{
              fontFamily: preview.fontFamily,
              fontWeight: preview.weight,
              fontStyle: preview.italic ? 'italic' : 'normal',
            }}
          >
            Aa
          </span>
          <button
            type="button"
            className="logo-card__check"
            role="checkbox"
            aria-checked={selected}
            aria-label={`Selecionar ${font.family}`}
            onClick={(event) => {
              event.stopPropagation()
              onToggleSelect(font.id)
            }}
          >
            {selected ? (
              <CheckSquare size={24} color="#000000" weight="fill" />
            ) : (
              <Square size={24} color="#5d5d5d" weight="regular" />
            )}
          </button>
          <div className="logo-card__kebab" ref={kebabRef} onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="logo-card__kebab-btn"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={`Mais opções de ${font.family}`}
              onClick={() => (menuOpen ? onCloseMenu() : onOpenMenu(font.id))}
            >
              <DotsThreeVertical size={24} color="#5d5d5d" weight="bold" />
            </button>
            {menuOpen ? (
              <div className="logo-menu" role="menu">
                {MENU_ITEMS.map(({ action, label, Icon }) => (
                  <button
                    key={action}
                    type="button"
                    role="menuitem"
                    className="menu-row"
                    onClick={() => onAction(action, font)}
                  >
                    <Icon size={24} color="#5d5d5d" weight="regular" />
                    <span className="menu-row__label">{label}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="logo-card__texts">
        <p className="logo-card__name">
          {font.family} ({pesosLabel(font.selectedWeights.length)})
        </p>
        <p className="logo-card__date">{type.label}</p>
      </div>
    </div>
  )
}

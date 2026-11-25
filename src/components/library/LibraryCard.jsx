import { useEffect, useRef } from 'react'
import { CheckSquare, DotsThreeVertical, DownloadSimple, Square, Trash } from '@phosphor-icons/react'
import { findLibrary } from '../../icon-libraries/libraries.js'
import LibraryPattern from './LibraryPattern.jsx'

const MENU_ITEMS = [
  { action: 'download', label: 'Baixar', Icon: DownloadSimple },
  { action: 'delete', label: 'Excluir', Icon: Trash },
]

// Card of the library of an identity (Figma node 6512:13402): the icon pattern in the chosen
// style (or the icons of the uploaded .zip), the name and, below it, the style or the icon
// count. Hover, checkbox, kebab and selection follow the other cards. Clicking does nothing yet.
export default function LibraryCard({
  item,
  selected,
  selecting,
  menuOpen,
  onToggleSelect,
  onOpenMenu,
  onCloseMenu,
  onAction,
}) {
  const kebabRef = useRef(null)
  const library = item.source === 'library' ? findLibrary(item.libraryId) : null
  const subtitle = library ? item.style : item.iconCount === 1 ? '1 ícone' : `${item.iconCount} ícones`

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
    'lib-item',
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
          <div className="lib-item__clip">
            <LibraryPattern library={library} style={item.style} file={library ? null : item.file} />
          </div>
          <button
            type="button"
            className="logo-card__check"
            role="checkbox"
            aria-checked={selected}
            aria-label={`Selecionar ${item.name}`}
            onClick={(event) => {
              event.stopPropagation()
              onToggleSelect(item.id)
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
              aria-label={`Mais opções de ${item.name}`}
              onClick={() => (menuOpen ? onCloseMenu() : onOpenMenu(item.id))}
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
                    onClick={() => onAction(action, item)}
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
        <p className="logo-card__name">{item.name}</p>
        <p className="logo-card__date">{subtitle}</p>
      </div>
    </div>
  )
}

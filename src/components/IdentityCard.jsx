import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { CopySimple, DotsThreeVertical, PaintBrush, Trash } from '@phosphor-icons/react'
import { sortLogos } from '../data/logoTypes.js'
import { sortColors } from '../data/palette.js'
import { useObjectUrl } from '../hooks/useObjectUrl.js'
import { formatDate } from '../utils/format.js'

const MENU_ITEMS = [
  { action: 'duplicate', label: 'Duplicar', Icon: CopySimple },
  { action: 'delete', label: 'Excluir', Icon: Trash },
]

// The logo slot shows the principal logo, or the first existing logo in type order
// (secundária, vertical, horizontal, com tagline). Without logos it keeps the PaintBrush.
// The cover is the solid main hex of the first color: brand color, else first primary,
// else first secondary (oldest first). An empty palette keeps the gray cover.
// The kebab shows on hover (Figma node 6453:2343) and opens "Duplicar" and "Excluir".
export default function IdentityCard({ identity, menuOpen, onOpenMenu, onCloseMenu, onAction }) {
  const { id, name, createdAt, logos, cover, paleta } = identity
  const coverColor = sortColors(paleta || [])[0]?.hex
  const logo = sortLogos(logos)[0]
  const logoUrl = useObjectUrl(logo ? logo.file : null)
  const kebabRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return undefined
    function onMouseDown(event) {
      if (kebabRef.current && !kebabRef.current.contains(event.target)) onCloseMenu()
    }
    // Capture phase: Esc closes only the menu.
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

  return (
    <div className={`identity-card${menuOpen ? ' identity-card--menu-open' : ''}`}>
      <Link to={`/id/${id}`} className="identity-card__link">
        <div className="identity-card__cover" style={coverColor ? { background: coverColor } : undefined}>
          {cover ? <img src={cover} alt="" className="identity-card__cover-img" /> : null}
        </div>
        <div className="identity-card__logo">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="identity-card__logo-img" />
          ) : (
            <PaintBrush size={24} color="#5d5d5d" weight="fill" />
          )}
        </div>
        <div className="identity-card__text">
          <div className="identity-card__texts">
            <p className="identity-card__name">{name}</p>
            <p className="identity-card__date">Criado em {formatDate(createdAt)}</p>
          </div>
        </div>
      </Link>
      <div className="identity-card__kebab" ref={kebabRef}>
        <button
          type="button"
          className="logo-card__kebab-btn"
          aria-haspopup="menu"
          aria-expanded={Boolean(menuOpen)}
          aria-label={`Mais opções de ${name}`}
          onClick={() => (menuOpen ? onCloseMenu() : onOpenMenu(id))}
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
                onClick={() => onAction(action, identity)}
              >
                <Icon size={24} color="#5d5d5d" weight="regular" />
                <span className="menu-row__label">{label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

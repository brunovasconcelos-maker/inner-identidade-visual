import { useEffect, useRef } from 'react'
import {
  CheckSquare,
  DotsThreeVertical,
  DownloadSimple,
  Export,
  PencilSimple,
  Square,
  Trash,
} from '@phosphor-icons/react'
import LogoThumb from './LogoThumb.jsx'
import { findLogoType } from '../../data/logoTypes.js'
import { useObjectUrl } from '../../hooks/useObjectUrl.js'
import { formatDate } from '../../utils/format.js'

const MENU_ITEMS = [
  { action: 'edit', label: 'Editar', Icon: PencilSimple },
  { action: 'download', label: 'Baixar', Icon: DownloadSimple },
  { action: 'share', label: 'Compartilhar', Icon: Export },
  { action: 'delete', label: 'Excluir', Icon: Trash },
]

// More than 3 versions: 2 thumbnails plus a "+N" chip with the remaining count.
function thumbSlots(versions) {
  if (versions.length <= 3) return { shown: versions, rest: 0 }
  return { shown: versions.slice(0, 2), rest: versions.length - 2 }
}

export default function LogoCard({
  logo,
  selected,
  selecting,
  menuOpen,
  shareTip,
  onToggleSelect,
  onOpenMenu,
  onCloseMenu,
  onAction,
}) {
  const type = findLogoType(logo.type)
  const url = useObjectUrl(logo.file)
  const kebabRef = useRef(null)
  const { shown, rest } = thumbSlots(logo.monoVersions)

  useEffect(() => {
    if (!menuOpen) return undefined
    function onMouseDown(event) {
      if (kebabRef.current && !kebabRef.current.contains(event.target)) onCloseMenu()
    }
    // Capture phase: Esc closes only the menu, never the selection behind it.
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
    selected ? 'logo-card--selected' : '',
    selecting ? 'logo-card--selecting' : '',
    menuOpen ? 'logo-card--menu-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      <div className="logo-card__top">
        {/* Clicking the preview does nothing yet: it will open the viewer. */}
        <div className="logo-card__preview">
          {url ? <img className="logo-card__img" src={url} alt={type.label} /> : null}
          <button
            type="button"
            className="logo-card__check"
            role="checkbox"
            aria-checked={selected}
            aria-label={`Selecionar ${type.label}`}
            onClick={() => onToggleSelect(logo.id)}
          >
            {selected ? (
              <CheckSquare size={24} color="#000000" weight="fill" />
            ) : (
              <Square size={24} color="#5d5d5d" weight="regular" />
            )}
          </button>
          <div className="logo-card__kebab" ref={kebabRef}>
            <button
              type="button"
              className="logo-card__kebab-btn"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={`Mais opções de ${type.label}`}
              onClick={() => (menuOpen ? onCloseMenu() : onOpenMenu(logo.id))}
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
                    onClick={() => onAction(action, logo)}
                  >
                    <Icon size={24} color="#5d5d5d" weight="fill" />
                    <span className="menu-row__label">{label}</span>
                  </button>
                ))}
              </div>
            ) : null}
            {shareTip ? <span className="tooltip tooltip--end">Em breve</span> : null}
          </div>
        </div>

        {logo.monoVersions.length > 0 ? (
          <div className="logo-card__thumbs">
            {shown.map((version) => (
              <LogoThumb key={version.id} file={version.file} bg={version.previewBg} />
            ))}
            {rest > 0 ? <span className="logo-thumb logo-thumb--more">+{rest}</span> : null}
          </div>
        ) : null}
      </div>

      <div className="logo-card__texts">
        <p className="logo-card__name">{type.label}</p>
        <p className="logo-card__date">{formatDate(logo.createdAt)}</p>
      </div>
    </div>
  )
}

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
import AssetPreview from './AssetPreview.jsx'
import LogoThumb from './LogoThumb.jsx'
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
  label,
  icon = false,
  element = false,
  selected,
  selecting,
  menuOpen,
  shareTip,
  onToggleSelect,
  onOpenMenu,
  onCloseMenu,
  onAction,
  onOpen,
}) {
  const url = useObjectUrl(element ? null : logo.file)
  const kebabRef = useRef(null)
  const monoVersions = logo.monoVersions || []
  const { shown, rest } = thumbSlots(monoVersions)

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
        <div
          className="logo-card__preview"
          role="button"
          tabIndex={0}
          aria-label={`Abrir ${label}`}
          onClick={() => onOpen(logo.id)}
          onKeyDown={(event) => {
            if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault()
              onOpen(logo.id)
            }
          }}
        >
          {element ? (
            <AssetPreview
              file={logo.file}
              format={logo.format}
              className="logo-card__img logo-card__img--element"
              alt={label}
            />
          ) : url ? (
            <img className="logo-card__img" src={url} alt={label} />
          ) : null}
          <button
            type="button"
            className="logo-card__check"
            role="checkbox"
            aria-checked={selected}
            aria-label={`Selecionar ${label}`}
            onClick={(event) => {
              event.stopPropagation()
              onToggleSelect(logo.id)
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
              aria-label={`Mais opções de ${label}`}
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
                    <Icon size={24} color="#5d5d5d" weight="regular" />
                    <span className="menu-row__label">{label}</span>
                  </button>
                ))}
              </div>
            ) : null}
            {shareTip ? <span className="tooltip tooltip--end">Em breve</span> : null}
          </div>
        </div>

        {monoVersions.length > 0 ? (
          <div className="logo-card__thumbs">
            {shown.map((version) => (
              <LogoThumb key={version.id} file={version.file} bg={version.previewBg} icon={icon} />
            ))}
            {rest > 0 ? <span className="logo-thumb logo-thumb--more">+{rest}</span> : null}
          </div>
        ) : null}
      </div>

      <div className="logo-card__texts">
        <p className="logo-card__name">{label}</p>
        <p className="logo-card__date">{element ? logo.format.toUpperCase() : formatDate(logo.createdAt)}</p>
      </div>
    </div>
  )
}

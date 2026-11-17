import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, CirclesFour, Plus, Smiley, UserSound } from '@phosphor-icons/react'

export const OUTROS_ITEMS = [
  { slug: 'biblioteca-de-icones', label: 'Biblioteca de ícones' },
  { slug: 'fotografia', label: 'Fotografia' },
  { slug: 'tom-de-voz', label: 'Tom de voz' },
  { slug: 'personalidade', label: 'Personalidade' },
]

const ICONS = {
  'biblioteca-de-icones': <CirclesFour size={24} color="#db5757" weight="fill" />,
  fotografia: <Camera size={24} color="#57dbd0" weight="fill" />,
  'tom-de-voz': <UserSound size={24} color="#a457db" weight="fill" />,
  personalidade: <Smiley size={24} color="#db9957" weight="fill" />,
}

export default function OutrosMenu({ identityId }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function onMouseDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="outros" ref={rootRef}>
      <button
        type="button"
        className={`outros__card${open ? ' outros__card--selected' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="outros__icon">
          <Plus size={20} color="#5d5d5d" weight="regular" />
        </span>
        <span className="outros__label">Outros</span>
      </button>
      {open ? (
        <div className="outros__menu" role="menu">
          {OUTROS_ITEMS.map((item) => (
            <Link
              key={item.slug}
              role="menuitem"
              className="outros__item"
              to={`/id/${identityId}/${item.slug}`}
            >
              {ICONS[item.slug]}
              <span className="outros__item-label">{item.label}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUp, Plus, X } from '@phosphor-icons/react'
import MagoAvatar from './MagoAvatar'

const CLOSE_MS = 200

// Mago chat overlay, first state (empty chat). Sending is not built yet.
export default function MagoChat({ value, onChange, onClose }) {
  const [closing, setClosing] = useState(false)
  const inputRef = useRef(null)
  const closingRef = useRef(false)

  const requestClose = () => {
    if (closingRef.current) return
    closingRef.current = true
    setClosing(true)
    window.setTimeout(onClose, CLOSE_MS)
  }
  const closeRef = useRef(requestClose)
  closeRef.current = requestClose

  // Focus the chat input straight away.
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Lock the page scroll while the chat is open.
  useEffect(() => {
    const body = document.body
    const previous = { overflow: body.style.overflow, paddingRight: body.style.paddingRight }
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    body.style.overflow = 'hidden'
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`
    return () => {
      body.style.overflow = previous.overflow
      body.style.paddingRight = previous.paddingRight
    }
  }, [])

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const canSend = value.trim().length > 0

  return createPortal(
    <div className={`mago-chat${closing ? ' mago-chat--closing' : ''}`} role="dialog" aria-modal="true" aria-label="Mago">
      <div className="mago-chat__panel">
        <button type="button" className="mago-chat__close" aria-label="Fechar" onClick={requestClose}>
          <X size={24} color="#5d5d5d" weight="regular" />
        </button>
        <span className="mago-chat__today">Hoje</span>
        <div className="mago-chat__empty">
          <MagoAvatar size={48} />
          <p className="mago__title">O que você precisa achar?</p>
        </div>
        <div className="mago-chat__bar">
          <div className="mago__field">
            <button type="button" className="mago__plus" aria-label="Adicionar">
              <Plus size={20} color="#5d5d5d" weight="regular" />
            </button>
            <input
              ref={inputRef}
              className="mago__input"
              type="text"
              placeholder="Digite sua busca aqui..."
              value={value}
              onChange={(event) => onChange(event.target.value)}
            />
            <button
              type="button"
              className={`mago__send${canSend ? ' mago__send--active' : ''}`}
              aria-label="Enviar"
              aria-disabled={!canSend}
              tabIndex={canSend ? 0 : -1}
            >
              <ArrowUp size={20} color={canSend ? '#ffffff' : '#798282'} weight="regular" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

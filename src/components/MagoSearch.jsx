import { useRef, useState } from 'react'
import { ArrowUp, Plus } from '@phosphor-icons/react'
import MagoAvatar from './MagoAvatar'
import MagoChat from './MagoChat'

// Clicking or focusing the input opens the Mago chat overlay.
export default function MagoSearch() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const inputRef = useRef(null)
  const skipOpen = useRef(false)
  const fieldRef = useRef(null)

  const handleClose = () => {
    setOpen(false)
    // Return focus to the page input without reopening the chat.
    skipOpen.current = true
    inputRef.current?.focus()
    skipOpen.current = false
  }

  const openChat = () => {
    if (!skipOpen.current) setOpen(true)
  }

  return (
    <div className="mago">
      <div className="mago__head">
        <MagoAvatar size={48} />
        <p className="mago__title">O que você precisa achar?</p>
      </div>
      <div className="mago__field" ref={fieldRef}>
        <button type="button" className="mago__plus" aria-label="Adicionar">
          <Plus size={20} color="#5d5d5d" weight="regular" />
        </button>
        <input
          ref={inputRef}
          className="mago__input"
          type="text"
          placeholder="Digite sua busca aqui..."
          onFocus={openChat}
          onClick={openChat}
        />
        <div className="mago__send">
          <ArrowUp size={20} color="#798282" weight="regular" />
        </div>
      </div>
      {open && <MagoChat
          value={text}
          onChange={setText}
          onClose={handleClose}
          getOriginRect={() => fieldRef.current.getBoundingClientRect()}
        />}
    </div>
  )
}

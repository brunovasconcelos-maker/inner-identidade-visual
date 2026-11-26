import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUp, Plus } from '@phosphor-icons/react'
import MagoAvatar from './MagoAvatar'
import MagoChat from './MagoChat'

// The Mago chat opens on a real user action on the input: a click or tap, a typed character
// (it becomes the first character of the chat input), a paste or Enter. Focus alone never opens
// it: the browser focuses the input by itself when the window comes back (switching tabs or
// apps), and closing the chat leaves the input without focus.
export default function MagoSearch({ identity }) {
  const [chat, setChat] = useState(null) // null (closed) or { initial } (the text it starts with)
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const fieldRef = useRef(null)

  const openChat = (initial = '') => setChat({ initial })

  const handleClose = () => {
    setChat(null)
    // Not back on the page input: a focused input would take the browser focus back when the
    // window returns.
    inputRef.current?.blur()
  }

  const onKeyDown = (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return
    if (event.key === 'Enter') {
      event.preventDefault()
      openChat()
    } else if (event.key.length === 1) {
      event.preventDefault()
      openChat(event.key)
    }
  }

  const onPaste = (event) => {
    event.preventDefault()
    openChat(event.clipboardData.getData('text'))
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
          onClick={() => openChat()}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
        />
        <div className="mago__send">
          <ArrowUp size={20} color="#798282" weight="regular" />
        </div>
      </div>
      {chat && (
        <MagoChat
          identity={identity}
          initialDraft={chat.initial}
          onClose={handleClose}
          onOpenFolder={(slug) => navigate(`/id/${identity.id}/${slug}`)}
          getOriginRect={() => fieldRef.current.getBoundingClientRect()}
        />
      )}
    </div>
  )
}

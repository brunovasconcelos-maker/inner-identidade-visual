import { useEffect, useRef, useState } from 'react'
import { X } from '@phosphor-icons/react'

export default function NewIdentityModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const inputRef = useRef(null)
  const canCreate = name.trim().length > 0

  useEffect(() => {
    inputRef.current?.focus()
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function handleSubmit(event) {
    event.preventDefault()
    if (canCreate) onCreate(name)
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-identity-title"
        onSubmit={handleSubmit}
      >
        <div className="modal__header">
          <h2 id="new-identity-title" className="modal__title">
            Nova identidade visual
          </h2>
          <button type="button" className="modal__close" aria-label="Fechar" onClick={onClose}>
            <X size={24} color="#5d5d5d" weight="regular" />
          </button>
        </div>
        <div className="modal__field">
          <label htmlFor="identity-name" className="modal__label">
            Nome da identidade
          </label>
          <input
            id="identity-name"
            ref={inputRef}
            className="modal__input"
            type="text"
            value={name}
            placeholder="Dê um nome à sua identidade"
            autoComplete="off"
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <button type="submit" className="btn btn--primary btn--wide" disabled={!canCreate}>
          <span className="btn__label">Criar</span>
        </button>
      </form>
    </div>
  )
}

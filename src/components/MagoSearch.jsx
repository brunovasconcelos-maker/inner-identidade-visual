import { ArrowUp, Plus } from '@phosphor-icons/react'
import MagoAvatar from './MagoAvatar'

// Visual only (the chat opens in a later step).
export default function MagoSearch() {
  return (
    <div className="mago">
      <div className="mago__head">
        <MagoAvatar size={48} />
        <p className="mago__title">O que você precisa achar?</p>
      </div>
      <div className="mago__field">
        <button type="button" className="mago__plus" aria-label="Adicionar">
          <Plus size={20} color="#5d5d5d" weight="regular" />
        </button>
        <input className="mago__input" type="text" placeholder="Digite sua busca aqui..." />
        <div className="mago__send">
          <ArrowUp size={20} color="#798282" weight="regular" />
        </div>
      </div>
    </div>
  )
}

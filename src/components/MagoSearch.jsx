import { ArrowUp } from '@phosphor-icons/react'

// Visual only.
export default function MagoSearch() {
  return (
    <div className="mago">
      <p className="mago__title">O que você precisa achar?</p>
      <div className="mago__field">
        <div className="mago__avatar" />
        <span className="mago__placeholder">Digite sua busca aqui...</span>
        <div className="mago__send">
          <ArrowUp size={20} color="#798282" weight="regular" />
        </div>
      </div>
    </div>
  )
}

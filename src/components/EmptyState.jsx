import { PaintBrush, Plus } from '@phosphor-icons/react'
import EmptyStateArt from './EmptyStateArt.jsx'

export default function EmptyState({ onCreate }) {
  return (
    <div className="empty-state">
      <EmptyStateArt icon={<PaintBrush size={47} color="#5d5d5d" weight="fill" />} />
      <div className="empty-state__content">
        <div className="empty-state__texts">
          <p className="empty-state__title">Nenhuma identidade criada</p>
          <p className="empty-state__subtitle">Você pode criar uma no botão abaixo</p>
        </div>
        <button type="button" className="btn btn--primary btn--with-icon" onClick={onCreate}>
          <Plus size={16} weight="regular" />
          <span className="btn__label btn__label--plain">Nova identidade</span>
        </button>
      </div>
    </div>
  )
}

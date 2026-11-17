import { X } from '@phosphor-icons/react'

// Shared shell of the side panels: slides in from the right, header, scrollable
// content and a footer with "Cancelar" and "Salvar".
export default function SidePanel({ title, onCancel, onSave, children }) {
  return (
    <aside className="side-panel" role="dialog" aria-label={title}>
      <div className="side-panel__header">
        <h2 className="side-panel__title">{title}</h2>
        <button type="button" className="icon-close" aria-label="Fechar" onClick={onCancel}>
          <X size={24} color="#5d5d5d" weight="regular" />
        </button>
      </div>
      <div className="side-panel__content">{children}</div>
      <div className="side-panel__footer">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          <span className="btn__label">Cancelar</span>
        </button>
        <button type="button" className="btn btn--primary" onClick={onSave}>
          <span className="btn__label">Salvar</span>
        </button>
      </div>
    </aside>
  )
}

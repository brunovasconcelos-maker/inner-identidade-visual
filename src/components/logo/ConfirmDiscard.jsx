// Confirmation shown when closing the "Nova logo" modal with unsaved changes.
// Same style as the "Nova identidade visual" modal.
export default function ConfirmDiscard({ onCancel, onDiscard }) {
  return (
    <div
      className="modal-overlay modal-overlay--confirm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <div
        className="modal modal--confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="discard-title"
        aria-describedby="discard-text"
      >
        <h2 id="discard-title" className="modal__title">
          Descartar logo?
        </h2>
        <p id="discard-text" className="modal__text">
          As informações adicionadas serão perdidas.
        </p>
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            <span className="btn__label">Cancelar</span>
          </button>
          <button type="button" className="btn btn--primary btn--wide" onClick={onDiscard}>
            <span className="btn__label">Descartar</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Confirmation dialog in the style of the "Nova identidade visual" modal.
// Esc handling belongs to the caller, which knows which layer is on top.
export default function ConfirmDialog({
  title,
  text,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  error = null,
  busy = false,
}) {
  return (
    <div
      className="modal-overlay modal-overlay--confirm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel()
      }}
    >
      <div
        className="modal modal--confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-text"
      >
        <h2 id="confirm-title" className="modal__title">
          {title}
        </h2>
        <p id="confirm-text" className="modal__text">
          {text}
        </p>
        {error ? <p className="modal__text modal__error">{error}</p> : null}
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" disabled={busy} onClick={onCancel}>
            <span className="btn__label">{cancelLabel}</span>
          </button>
          <button type="button" className="btn btn--primary btn--wide" disabled={busy} onClick={onConfirm}>
            <span className="btn__label">{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

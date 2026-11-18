import ConfirmDialog from '../ConfirmDialog.jsx'

// Confirmation shown when closing the "Nova logo" modal with unsaved changes.
export default function ConfirmDiscard({ title = 'Descartar logo?', onCancel, onDiscard }) {
  return (
    <ConfirmDialog
      title={title}
      text="As informações adicionadas serão perdidas."
      cancelLabel="Cancelar"
      confirmLabel="Descartar"
      onCancel={onCancel}
      onConfirm={onDiscard}
    />
  )
}

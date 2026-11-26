import { DownloadSimple, Trash, X } from '@phosphor-icons/react'

// Replaces the total text while at least one logo is selected.
export default function SelectionBar({
  count,
  onClear,
  onDelete,
  onDownload,
  onlyDelete = false,
  downloadTip = null,
}) {
  return (
    <div className="selection-bar">
      <button type="button" className="selection-bar__btn" aria-label="Limpar seleção" onClick={onClear}>
        <X size={20} color="#5d5d5d" weight="regular" />
      </button>
      <p className="selection-bar__text">
        {count === 1 ? '1 item selecionado' : `${count} itens selecionados`}
      </p>
      <div className="selection-bar__actions">
        <button type="button" className="selection-bar__btn" aria-label="Excluir" onClick={onDelete}>
          <Trash size={20} color="#5d5d5d" weight="regular" />
        </button>
        {onlyDelete ? null : (
          <>
            <span className="selection-bar__action">
              <button type="button" className="selection-bar__btn" aria-label="Baixar" onClick={onDownload}>
                <DownloadSimple size={20} color="#5d5d5d" weight="regular" />
              </button>
              {downloadTip ? <span className="tooltip">{downloadTip}</span> : null}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

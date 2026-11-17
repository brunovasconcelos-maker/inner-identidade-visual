import { DownloadSimple, Share, Trash, X } from '@phosphor-icons/react'

// Replaces the total text while at least one logo is selected.
export default function SelectionBar({
  count,
  shareTip,
  onClear,
  onDelete,
  onDownload,
  onShare,
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
        <button type="button" className="selection-bar__btn" aria-label="Baixar" onClick={onDownload}>
          <DownloadSimple size={20} color="#5d5d5d" weight="regular" />
        </button>
        <span className="selection-bar__share">
          <button type="button" className="selection-bar__btn" aria-label="Compartilhar" onClick={onShare}>
            <Share size={20} color="#5d5d5d" weight="regular" />
          </button>
          {shareTip ? <span className="tooltip">Em breve</span> : null}
        </span>
      </div>
    </div>
  )
}

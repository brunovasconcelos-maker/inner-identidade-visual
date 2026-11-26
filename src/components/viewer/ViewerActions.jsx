import { CircleNotch, DownloadSimple, Trash } from '@phosphor-icons/react'

// Round white action buttons at the top left of a viewer card (delete and download), used by
// the viewers. `downloadBusy` shows a spinner on the download button while a file is being built.
export default function ViewerActions({ onDelete, onDownload, downloadBusy = false }) {
  return (
    <div className="viewer__actions">
      <button type="button" className="viewer__round" aria-label="Excluir" onClick={onDelete}>
        <Trash size={20} color="#5d5d5d" weight="regular" />
      </button>
      <button
        type="button"
        className="viewer__round"
        aria-label="Baixar"
        aria-busy={downloadBusy}
        disabled={downloadBusy}
        onClick={onDownload}
      >
        {downloadBusy ? (
          <CircleNotch className="lib-spin" size={20} color="#5d5d5d" weight="bold" />
        ) : (
          <DownloadSimple size={20} color="#5d5d5d" weight="regular" />
        )}
      </button>
    </div>
  )
}

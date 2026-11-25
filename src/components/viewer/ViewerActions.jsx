import { CircleNotch, DownloadSimple, Share, Trash } from '@phosphor-icons/react'

// Round white action buttons at the top left of a viewer card (delete, optionally share, and
// download), shared by the viewers. `onShare` is only given where there is a share button;
// `downloadBusy` shows a spinner on the download button while a file is being built.
export default function ViewerActions({ onDelete, onDownload, onShare, shareTip = false, downloadBusy = false }) {
  return (
    <div className="viewer__actions">
      <button type="button" className="viewer__round" aria-label="Excluir" onClick={onDelete}>
        <Trash size={20} color="#5d5d5d" weight="regular" />
      </button>
      {onShare ? (
        <span className="viewer__share">
          <button type="button" className="viewer__round" aria-label="Compartilhar" onClick={onShare}>
            <Share size={20} color="#5d5d5d" weight="regular" />
          </button>
          {shareTip ? <span className="tooltip">Em breve</span> : null}
        </span>
      ) : null}
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

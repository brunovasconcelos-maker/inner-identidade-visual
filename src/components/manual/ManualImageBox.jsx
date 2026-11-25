import { DownloadSimple } from '@phosphor-icons/react'
import { useObjectUrl } from '../../hooks/useObjectUrl.js'
import { saveBlob } from '../../utils/download.js'

export const BOX_LIGHT = '#f7f7f7'
export const BOX_DARK = '#000000'

// Gray (or black) box with the image contained and centered. The download button shows on
// hover only. Shared by the Logo and Ícone pages.
export function ImageBox({ file, fileName, bg, height, inner, label }) {
  const url = useObjectUrl(file)
  return (
    <div className="manual-box" style={{ background: bg, height }}>
      {url ? (
        <img
          className="manual-box__img"
          style={{ width: inner[0], height: inner[1] }}
          src={url}
          alt={label}
        />
      ) : null}
      <button
        type="button"
        className="manual-box__download"
        aria-label={`Baixar ${label}`}
        onClick={() => saveBlob(file, fileName)}
      >
        <DownloadSimple size={24} color="#000000" weight="regular" />
      </button>
    </div>
  )
}

// The original is always shown on the neutral gray.
export function OriginalBox({ file, fileName, height, inner, label }) {
  return <ImageBox file={file} fileName={fileName} bg={BOX_LIGHT} height={height} inner={inner} label={label} />
}

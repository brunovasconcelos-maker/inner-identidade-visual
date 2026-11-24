import { File, FileAudio, FilePdf, FileVideo, FileZip } from '@phosphor-icons/react'
import { useObjectUrl } from '../../hooks/useObjectUrl.js'
import { fileIconKind, isImageFormat } from '../../utils/files.js'

const ICONS = { pdf: FilePdf, zip: FileZip, video: FileVideo, audio: FileAudio, file: File }

// Preview of an element: the image itself (SVG, PNG, JPG, WEBP, GIF) contained in its
// box, or a Phosphor icon that matches the file type. `size` is the icon size in px.
export default function AssetPreview({ file, format, size = 86, className = '', iconClassName = '', alt = '' }) {
  const image = isImageFormat(format)
  const url = useObjectUrl(image ? file : null)
  if (image) {
    return url ? <img className={className} src={url} alt={alt} /> : null
  }
  const Icon = ICONS[fileIconKind(format)]
  return <Icon className={iconClassName} size={size} color="#000000" weight="fill" aria-hidden="true" />
}

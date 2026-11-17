import { CaretRight } from '@phosphor-icons/react'
import MonoThumb from './MonoThumb.jsx'

// Summary card shown in the modal once at least one monochrome version exists:
// overlapping thumbnails (max 3), names ("Preto, Branco, +2") and "Editar".
export default function MonoSummary({ versions, onEdit }) {
  const names = versions.slice(0, 2).map((version) => version.name)
  const rest = versions.length - names.length
  const text = rest > 0 ? `${names.join(', ')}, +${rest}` : names.join(', ')

  return (
    <button type="button" className="mono-summary" onClick={onEdit}>
      <span className="mono-summary__thumbs">
        {versions.slice(0, 3).map((version) => (
          <MonoThumb key={version.id} file={version.file} bg={version.previewBg} />
        ))}
      </span>
      <span className="mono-summary__text">{text}</span>
      <span className="mono-summary__edit">Editar</span>
      <CaretRight size={20} color="#5d5d5d" weight="regular" />
    </button>
  )
}

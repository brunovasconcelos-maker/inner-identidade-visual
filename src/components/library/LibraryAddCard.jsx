import LibraryPattern from './LibraryPattern.jsx'

// One of the five free library cards (Figma node 6512:11836): the library tint, a fade of the
// same color over the icon pattern and the label on top. Hover shadow like the other cards.
export default function LibraryAddCard({ library, onClick }) {
  return (
    <button
      type="button"
      className="lib-card"
      style={{ background: library.tint, color: library.ink, '--lib-icon': library.iconColor }}
      onClick={onClick}
    >
      <LibraryPattern library={library} />
      <span className="lib-card__fade" style={{ background: library.tint }} />
      <span className="lib-card__label">{library.cardLabel}</span>
    </button>
  )
}

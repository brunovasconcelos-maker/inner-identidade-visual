// Visual only: it does not open anything yet. A disabled card uses the dashed
// style from Figma, has no hover and shows the not-allowed cursor.
export default function AddCard({ icon, label, disabled = false }) {
  return (
    <button type="button" className="add-card" disabled={disabled} aria-disabled={disabled}>
      <span className="add-card__icon">{icon}</span>
      <span className="add-card__label">{label}</span>
    </button>
  )
}

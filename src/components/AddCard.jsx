// `onClick` is only set on cards that already do something. A disabled card uses the dashed
// style from Figma, has no hover and shows the not-allowed cursor.
export default function AddCard({ icon, label, disabled = false, disabledStyle, onClick }) {
  return (
    <button
      type="button"
      className={`add-card${disabled && disabledStyle === 'filled' ? ' add-card--filled-disabled' : ''}`}
      disabled={disabled}
      aria-disabled={disabled}
      onClick={onClick}
    >
      <span className="add-card__icon">{icon}</span>
      <span className="add-card__label">{label}</span>
    </button>
  )
}

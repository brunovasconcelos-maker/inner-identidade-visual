// Visual only. `icon` is the Phosphor icon (Fill) shown in Figma.
export default function FolderCard({ icon, tint, title, description }) {
  return (
    <div className="folder-card">
      <div className="folder-card__icon" style={{ background: tint }}>
        {icon}
      </div>
      <div className="folder-card__texts">
        <p className="folder-card__title">{title}</p>
        <p className="folder-card__description">{description}</p>
      </div>
    </div>
  )
}

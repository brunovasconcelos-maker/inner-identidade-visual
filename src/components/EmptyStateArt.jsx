import EmptyStateGrid from './EmptyStateGrid.jsx'

// Illustration of the empty states: grid background and a tilted white card with `icon`.
export default function EmptyStateArt({ icon }) {
  return (
    <div className="empty-state__art">
      <div className="empty-state__grid-mask">
        <EmptyStateGrid />
      </div>
      <div className="empty-state__card-wrap">
        <div className="empty-state__card">
          <div className="empty-state__card-icon">{icon}</div>
        </div>
      </div>
    </div>
  )
}

import avatar from '../assets/Avatar-Mago.png'

// Reusable Mago avatar (circle). Used in the search bar and, later, the chat.
export default function MagoAvatar({ size = 48, className = '' }) {
  return (
    <img
      className={`mago-avatar ${className}`.trim()}
      src={avatar}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  )
}

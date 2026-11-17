import { Link } from 'react-router-dom'
import { PaintBrush } from '@phosphor-icons/react'
import { formatDate } from '../utils/format.js'

// Cover and logo come later from the identity assets. While they are null,
// the card shows a neutral cover and a PaintBrush logo tile.
export default function IdentityCard({ identity }) {
  const { id, name, createdAt, logo, cover } = identity
  return (
    <Link to={`/id/${id}`} className="identity-card">
      <div className="identity-card__cover">
        {cover ? <img src={cover} alt="" className="identity-card__cover-img" /> : null}
      </div>
      <div className="identity-card__logo">
        {logo ? (
          <img src={logo} alt="" className="identity-card__logo-img" />
        ) : (
          <PaintBrush size={24} color="#5d5d5d" weight="fill" />
        )}
      </div>
      <div className="identity-card__text">
        <div className="identity-card__texts">
          <p className="identity-card__name">{name}</p>
          <p className="identity-card__date">Criado em {formatDate(createdAt)}</p>
        </div>
      </div>
    </Link>
  )
}

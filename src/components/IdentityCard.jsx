import { Link } from 'react-router-dom'
import { PaintBrush } from '@phosphor-icons/react'
import { sortLogos } from '../data/logoTypes.js'
import { useObjectUrl } from '../hooks/useObjectUrl.js'
import { formatDate } from '../utils/format.js'

// The logo slot shows the principal logo, or the first existing logo in type order
// (secundária, vertical, horizontal, com tagline). Without logos it keeps the PaintBrush.
// The cover comes later: while it is null the card shows a neutral cover.
export default function IdentityCard({ identity }) {
  const { id, name, createdAt, logos, cover } = identity
  const logo = sortLogos(logos)[0]
  const logoUrl = useObjectUrl(logo ? logo.file : null)
  return (
    <Link to={`/id/${id}`} className="identity-card">
      <div className="identity-card__cover">
        {cover ? <img src={cover} alt="" className="identity-card__cover-img" /> : null}
      </div>
      <div className="identity-card__logo">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="identity-card__logo-img" />
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

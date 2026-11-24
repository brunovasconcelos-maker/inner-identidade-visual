import { Link } from 'react-router-dom'
import { PaintBrush } from '@phosphor-icons/react'
import { sortLogos } from '../data/logoTypes.js'
import { sortColors } from '../data/palette.js'
import { useObjectUrl } from '../hooks/useObjectUrl.js'
import { formatDate } from '../utils/format.js'

// The logo slot shows the principal logo, or the first existing logo in type order
// (secundária, vertical, horizontal, com tagline). Without logos it keeps the PaintBrush.
// The cover is the solid main hex of the first color: brand color, else first primary,
// else first secondary (oldest first). An empty palette keeps the gray cover.
export default function IdentityCard({ identity }) {
  const { id, name, createdAt, logos, cover, paleta } = identity
  const coverColor = sortColors(paleta || [])[0]?.hex
  const logo = sortLogos(logos)[0]
  const logoUrl = useObjectUrl(logo ? logo.file : null)
  return (
    <Link to={`/id/${id}`} className="identity-card">
      <div className="identity-card__cover" style={coverColor ? { background: coverColor } : undefined}>
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

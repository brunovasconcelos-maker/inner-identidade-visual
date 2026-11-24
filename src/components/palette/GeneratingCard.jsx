import purple from '../../assets/gen-ellipse-purple.svg'
import blue from '../../assets/gen-ellipse-blue.svg'
import { CATEGORIES } from '../../data/palette.js'

// Placeholder of a color being generated (Figma node 6430:29952): the gradient swatch with
// a soft shimmer, the category label and "Gerando...". No hover, no checkbox, not clickable.
export default function GeneratingCard({ category }) {
  return (
    <div className="logo-card gen-card" aria-busy="true">
      <div className="gen-card__swatch">
        <img className="gen-card__glow gen-card__glow--purple" src={purple} alt="" />
        <img className="gen-card__glow gen-card__glow--blue" src={blue} alt="" />
        <span className="gen-card__shimmer" />
      </div>
      <div className="logo-card__texts">
        <p className="logo-card__name">{CATEGORIES[category].cardLabel}</p>
        <p className="logo-card__date">Gerando...</p>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { subOptions, manualPath, visibleSections } from '../../data/manual.js'
import { selectionColors } from '../../data/manualTheme.js'

// Sidebar of the brand manual (Figma node 6479:5211). Icons are Phosphor, Fill weight.
// The selected item gets the tinted tile; a selected sub option uses the blue text.
export default function ManualSidebar({ identity, slug, sub }) {
  const { foreground } = selectionColors(identity)
  return (
    <nav className="manual-nav" aria-label="Manual da marca">
      {visibleSections(identity).map(({ slug: itemSlug, label, Icon }) => {
        const selected = slug === itemSlug
        const subs = selected ? subOptions(itemSlug, identity) : []
        const first = subOptions(itemSlug, identity)[0]
        return (
          <div key={itemSlug} className="manual-nav__group">
            <Link
              to={manualPath(identity.id, itemSlug, first ? first.id : undefined)}
              className="manual-nav__item"
              aria-current={selected && !sub ? 'page' : undefined}
            >
              <span className={`manual-nav__tile${selected ? ' manual-nav__tile--selected' : ''}`}>
                <Icon size={18} color={selected ? foreground : '#96bfe9'} weight="fill" />
              </span>
              <span className="manual-nav__label">{label}</span>
            </Link>
            {subs.map((option) => (
              <Link
                key={option.id}
                to={manualPath(identity.id, itemSlug, option.id)}
                className={`manual-nav__item manual-nav__sub${sub === option.id ? ' manual-nav__sub--selected' : ''}`}
                aria-current={sub === option.id ? 'page' : undefined}
              >
                <span className="manual-nav__tile manual-nav__tile--spacer" />
                <span className="manual-nav__label">{option.label}</span>
              </Link>
            ))}
          </div>
        )
      })}
    </nav>
  )
}

import { Link } from 'react-router-dom'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { manualPath, subOptions, visibleSections } from '../../data/manual.js'

// Previous / next navigation at the end of every page of the manual (Figma node 6498:8824).
// Same order as the sidebar, only the pages the sidebar shows. The first page has no
// "Anterior", the last has no "Próximo".
export default function ManualPager({ identity, slug }) {
  const sections = visibleSections(identity)
  const index = sections.findIndex((section) => section.slug === slug)
  if (index < 0) return null
  const previous = index > 0 ? sections[index - 1] : null
  const next = index < sections.length - 1 ? sections[index + 1] : null
  const pathTo = (section) => {
    const first = subOptions(section.slug, identity)[0]
    return manualPath(identity.id, section.slug, first ? first.id : undefined)
  }

  return (
    <nav className="manual-pager" aria-label="Navegação entre páginas">
      {previous ? (
        <Link className="manual-pager__link" to={pathTo(previous)} rel="prev">
          <span className="manual-pager__caret">
            <CaretLeft size={24} color="#000000" weight="regular" />
          </span>
          <span className="manual-pager__texts">
            <span className="manual-pager__label">Anterior</span>
            <span className="manual-pager__name">{previous.label}</span>
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link className="manual-pager__link" to={pathTo(next)} rel="next">
          <span className="manual-pager__texts">
            <span className="manual-pager__label">Próximo</span>
            <span className="manual-pager__name">{next.label}</span>
          </span>
          <span className="manual-pager__caret">
            <CaretRight size={24} color="#000000" weight="regular" />
          </span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}

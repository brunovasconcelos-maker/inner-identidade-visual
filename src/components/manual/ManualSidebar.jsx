import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LOGO_GOTO_EVENT } from './ManualLogoPage.jsx'
import { subOptions, manualPath, visibleSections } from '../../data/manual.js'

// Height of a top level row and the gap between rows (Figma node 6479:5211).
const ROW = 32
const GAP = 8

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return reduced
}

// Sidebar of the brand manual (Figma node 6479:5211). Icons are Phosphor, Fill weight.
// Motion follows Material 3: the groups with sub options open and close by animating their
// height, one shared indicator slides to the selected item and colors cross fade (see the
// `.manual-nav` rules in index.css for the tokens and durations).
export default function ManualSidebar({ identity, slug, sub }) {
  const reducedMotion = usePrefersReducedMotion()
  const sections = visibleSections(identity)
  // Only the selected group is ever expanded, so the rows above the selected one are
  // collapsed and its final position is simply its index. The indicator moves there at once,
  // while the rows below still settle.
  const selectedIndex = sections.findIndex((section) => section.slug === slug)

  return (
    <nav className="manual-nav" aria-label="Manual da marca">
      {selectedIndex >= 0 ? (
        <span
          // With reduced motion the indicator fades in at its new place instead of sliding.
          key={reducedMotion ? slug : 'indicator'}
          className="manual-nav__indicator"
          style={{ transform: `translateY(${selectedIndex * (ROW + GAP)}px)` }}
          aria-hidden="true"
        />
      ) : null}
      {sections.map(({ slug: itemSlug, label, Icon }) => {
        const selected = slug === itemSlug
        const options = subOptions(itemSlug, identity)
        const first = options[0]
        return (
          <div key={itemSlug} className="manual-nav__group">
            <Link
              to={manualPath(identity.id, itemSlug, first ? first.id : undefined)}
              className={`manual-nav__item${selected ? ' manual-nav__item--selected' : ''}`}
              aria-current={selected && !sub ? 'page' : undefined}
              aria-expanded={options.length > 0 ? selected : undefined}
            >
              <span className="manual-nav__tile">
                <span className="manual-nav__icon">
                  <Icon size={18} color="currentColor" weight="fill" />
                </span>
              </span>
              <span className="manual-nav__label">{label}</span>
            </Link>
            {options.length > 0 ? (
              <div
                className={`manual-nav__subs${selected ? ' manual-nav__subs--open' : ''}`}
                inert={!selected}
              >
                <div className="manual-nav__subs-clip">
                  <div className="manual-nav__subs-list">
                    {options.map((option, index) => (
                      <Link
                        key={option.id}
                        to={manualPath(identity.id, itemSlug, option.id)}
                        className={`manual-nav__item manual-nav__sub${sub === option.id ? ' manual-nav__sub--selected' : ''}`}
                        style={{ '--i': index }}
                        aria-current={sub === option.id ? 'page' : undefined}
                        onClick={
                          itemSlug === 'logo'
                            ? (event) => {
                                // The Logo page is one scroll: go to the section, no page change.
                                event.preventDefault()
                                window.dispatchEvent(new CustomEvent(LOGO_GOTO_EVENT, { detail: option.id }))
                              }
                            : undefined
                        }
                      >
                        <span className="manual-nav__tile" />
                        <span className="manual-nav__label">{option.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )
      })}
    </nav>
  )
}

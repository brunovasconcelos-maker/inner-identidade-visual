import { useLayoutEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { DotsThreeVertical } from '@phosphor-icons/react'
import ManualPager from '../components/manual/ManualPager.jsx'
import ManualIntroPage from '../components/manual/ManualIntroPage.jsx'
import ManualKit from '../components/manual/ManualKit.jsx'
import ManualSidebar from '../components/manual/ManualSidebar.jsx'
import ManualLogoPage from '../components/manual/ManualLogoPage.jsx'
import ManualIconPage from '../components/manual/ManualIconPage.jsx'
import ManualLibraryPage from '../components/manual/ManualLibraryPage.jsx'
import ManualPalettePage from '../components/manual/ManualPalettePage.jsx'
import ManualTypographyPage from '../components/manual/ManualTypographyPage.jsx'
import { useIdentities } from '../data/identities.jsx'
import { headerLogo as pickHeaderLogo, selectionColors } from '../data/manualTheme.js'
import { sortColors } from '../data/palette.js'
import { principalHex } from '../data/manualIcon.js'
import { MANUAL_SECTIONS, manualPath, subOptions, visibleSections } from '../data/manual.js'
import { useObjectUrl } from '../hooks/useObjectUrl.js'

// Brand manual of an identity: its own layout, no platform sidebar.
export default function ManualPage() {
  const { id, section = 'intro', sub } = useParams()
  const { identities, loading } = useIdentities()
  const identity = identities.find((item) => item.id === id)
  const headerLogo = identity ? pickHeaderLogo(identity) : null
  const headerUrl = useObjectUrl(headerLogo ? headerLogo.file : null)

  // Changing page shows the new one from the top, title visible. (Sub options of a scrolling
  // page do not change `section`: they scroll inside the page.)
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [section, id])

  if (loading) return null
  if (!identity) return <Navigate to="/" replace />

  const current = visibleSections(identity).find((item) => item.slug === section)
  if (!current) return <Navigate to={manualPath(identity.id)} replace />
  const subs = subOptions(section, identity)
  if (subs.length > 0 && !subs.some((option) => option.id === sub)) {
    return <Navigate to={manualPath(identity.id, section, subs[0].id)} replace />
  }

  const selection = selectionColors(identity)
  // Brand color principal hex (hover of the navigation); #1A1A1A without a brand color.
  const brand = sortColors(identity.paleta).find((color) => color.category === 'marca')
  const brandHex = brand ? principalHex(brand) : '#1A1A1A'
  const meta = MANUAL_SECTIONS.find((item) => item.slug === section)

  const themeStyle = {
    '--manual-select-bg': selection.background,
    '--manual-select-fg': selection.foreground,
    '--manual-brand': brandHex,
  }

  return (
    <div className="manual" style={themeStyle}>
      <aside className="manual-side">
        <div className="manual-side__logo">
          {/* The logo goes to Intro, at the top of the page. */}
          <Link
            to={manualPath(identity.id)}
            className="manual-side__logo-link"
            aria-label={`${identity.name}: Intro`}
            onClick={() => {
              if (section === 'intro') window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            {headerUrl ? (
              <img src={headerUrl} alt={identity.name} className="manual-side__logo-img" />
            ) : (
              <span className="manual-side__logo-text">{identity.name}</span>
            )}
          </Link>
        </div>
        <ManualSidebar identity={identity} slug={section} sub={sub} />
      </aside>
      {/* Visual only. */}
      <button type="button" className="manual-kebab" aria-label="Mais opções">
        <DotsThreeVertical size={24} color="#000000" weight="regular" />
      </button>
      <main className="manual-main">
        <h1 className="manual-title">{meta.label}</h1>
        {section === 'intro' ? <ManualIntroPage identity={identity} /> : null}
        {section === 'logo' ? <ManualLogoPage identity={identity} sub={sub} /> : null}
        {section === 'icone' ? <ManualIconPage identity={identity} /> : null}
        {section === 'biblioteca-de-icones' ? <ManualLibraryPage identity={identity} /> : null}
        {section === 'paleta-de-cores' ? <ManualPalettePage identity={identity} sub={sub} /> : null}
        {section === 'tipografia' ? <ManualTypographyPage identity={identity} sub={sub} /> : null}
        {section === 'intro' ? <ManualKit identity={identity} themeStyle={themeStyle} /> : null}
        <ManualPager identity={identity} slug={section} />
      </main>
    </div>
  )
}

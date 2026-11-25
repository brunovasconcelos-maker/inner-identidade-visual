import { Navigate, useParams } from 'react-router-dom'
import { DotsThreeVertical } from '@phosphor-icons/react'
import ManualSidebar from '../components/manual/ManualSidebar.jsx'
import ManualLogoPage from '../components/manual/ManualLogoPage.jsx'
import ManualIconPage from '../components/manual/ManualIconPage.jsx'
import ManualPalettePage from '../components/manual/ManualPalettePage.jsx'
import ManualTypographyPage from '../components/manual/ManualTypographyPage.jsx'
import { useIdentities } from '../data/identities.jsx'
import { headerLogo as pickHeaderLogo, selectionColors } from '../data/manualTheme.js'
import { MANUAL_SECTIONS, manualPath, subOptions, visibleSections } from '../data/manual.js'
import { useObjectUrl } from '../hooks/useObjectUrl.js'

// Brand manual of an identity: its own layout, no platform sidebar.
export default function ManualPage() {
  const { id, section = 'intro', sub } = useParams()
  const { identities, loading } = useIdentities()
  const identity = identities.find((item) => item.id === id)
  const headerLogo = identity ? pickHeaderLogo(identity) : null
  const headerUrl = useObjectUrl(headerLogo ? headerLogo.file : null)

  if (loading) return null
  if (!identity) return <Navigate to="/" replace />

  const current = visibleSections(identity).find((item) => item.slug === section)
  if (!current) return <Navigate to={manualPath(identity.id)} replace />
  const subs = subOptions(section, identity)
  if (subs.length > 0 && !subs.some((option) => option.id === sub)) {
    return <Navigate to={manualPath(identity.id, section, subs[0].id)} replace />
  }

  const selection = selectionColors(identity)
  const meta = MANUAL_SECTIONS.find((item) => item.slug === section)

  return (
    <div
      className="manual"
      style={{
        '--manual-select-bg': selection.background,
        '--manual-select-fg': selection.foreground,
      }}
    >
      <aside className="manual-side">
        <div className="manual-side__logo">
          {headerUrl ? (
            <img src={headerUrl} alt={identity.name} className="manual-side__logo-img" />
          ) : (
            <span className="manual-side__logo-text">{identity.name}</span>
          )}
        </div>
        <ManualSidebar identity={identity} slug={section} sub={sub} />
      </aside>
      {/* Visual only. */}
      <button type="button" className="manual-kebab" aria-label="Mais opções">
        <DotsThreeVertical size={24} color="#000000" weight="regular" />
      </button>
      <main className="manual-main">
        <h1 className="manual-title">{meta.label}</h1>
        {section === 'logo' ? <ManualLogoPage identity={identity} sub={sub} /> : null}
        {section === 'icone' ? <ManualIconPage identity={identity} /> : null}
        {section === 'paleta-de-cores' ? <ManualPalettePage identity={identity} sub={sub} /> : null}
        {section === 'tipografia' ? <ManualTypographyPage identity={identity} sub={sub} /> : null}
      </main>
    </div>
  )
}

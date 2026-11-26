import { createPortal } from 'react-dom'
import ManualIntroPage from './ManualIntroPage.jsx'
import ManualLogoPage from './ManualLogoPage.jsx'
import ManualIconPage from './ManualIconPage.jsx'
import ManualLibraryPage from './ManualLibraryPage.jsx'
import ManualPalettePage from './ManualPalettePage.jsx'
import ManualTypographyPage from './ManualTypographyPage.jsx'
import { visibleSections } from '../../data/manual.js'

// Pages of the manual that have content, by slug. The others only have their title for now.
const PAGES = {
  intro: ManualIntroPage,
  logo: ManualLogoPage,
  icone: ManualIconPage,
  'paleta-de-cores': ManualPalettePage,
  tipografia: ManualTypographyPage,
  'biblioteca-de-icones': ManualLibraryPage,
}

// Print view of the whole manual: every active page stacked in sidebar order, a page break
// between topics. It is real HTML (vector text and SVG) that stays off screen and is the only
// thing visible when printing (see the @media print rules). `themeStyle` is the CSS variables
// of the manual.
export default function ManualPrintView({ identity, themeStyle }) {
  return createPortal(
    <div className="manual manual-print" style={themeStyle} data-manual-print>
      {visibleSections(identity).map((section) => {
        const Page = PAGES[section.slug]
        return (
          <section className="manual-print__page" key={section.slug}>
            <h1 className="manual-title">{section.label}</h1>
            {Page ? <Page identity={identity} /> : null}
          </section>
        )
      })}
    </div>,
    document.body,
  )
}

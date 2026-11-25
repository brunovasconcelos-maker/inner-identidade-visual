import ManualLogoSection from './ManualLogoSection.jsx'
import ManualScrollSections from './ManualScrollSections.jsx'
import { LOGO_TYPES } from '../../data/logoTypes.js'
import { LOGO_INTRO } from '../../data/manual.js'

// The Logo page: the intro (once, at the top), then one continuous scroll with a section per
// existing logo type, in type order.
export default function ManualLogoPage({ identity, sub }) {
  const types = LOGO_TYPES.filter((type) => identity.logos.some((logo) => logo.type === type.id))
  return (
    <>
      <div className="manual-intro">
        {LOGO_INTRO(identity.name).map((text) => (
          <p key={text}>{text}</p>
        ))}
      </div>
      <ManualScrollSections
      slug="logo"
      idPrefix="logo"
      ids={types.map((type) => type.id)}
      sub={sub}
      identityId={identity.id}
      className="manual-sections"
    >
      {types.map((type) => (
        <ManualLogoSection key={type.id} identity={identity} logo={identity.logos.find((logo) => logo.type === type.id)} />
      ))}
    </ManualScrollSections>
    </>
  )
}

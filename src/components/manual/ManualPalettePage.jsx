import ManualScrollSections from './ManualScrollSections.jsx'
import {
  CATEGORY_TEXTS,
  PALETTE_INTRO,
  colorsOfCategory,
  inkFor,
  toneRows,
  upperHex,
  visibleCategories,
} from '../../data/manualPalette.js'

// One swatch: step and hex at the bottom left, the contrast badge at the top left. The text
// is black or white, whichever has the better contrast against the swatch.
function Swatch({ tone, className }) {
  const hex = upperHex(tone.hex)
  const { ink, rating } = inkFor(hex)
  return (
    <div className={className} style={{ background: hex, color: ink }}>
      <div className="manual-swatch__badge">
        <span className="manual-swatch__square" style={{ background: ink }} />
        <span className="manual-swatch__rating">{rating}</span>
      </div>
      <div className="manual-swatch__codes">
        <span>{tone.step}</span>
        <span>{hex}</span>
      </div>
    </div>
  )
}

function ColorBlock({ color }) {
  const { main, others } = toneRows(color)
  return (
    <div className="manual-color">
      <h3 className="manual-h2">{color.name}</h3>
      <div className="manual-color__swatches">
        <Swatch tone={main} className="manual-swatch manual-swatch--main" />
        {others.length > 0 ? (
          <div className="manual-color__strip">
            {others.map((tone) => (
              <Swatch key={tone.step} tone={tone} className="manual-swatch manual-swatch--tone" />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

// The Paleta de cores page (Figma node 6479:5557): the intro, then a block per category with
// all its colors and, after the last one, the category text once.
export default function ManualPalettePage({ identity, sub }) {
  const categories = visibleCategories(identity)
  const marca = identity.name
  return (
    <>
      <div className="manual-intro">
        {PALETTE_INTRO(marca).map((text) => (
          <p key={text}>{text}</p>
        ))}
      </div>
      <ManualScrollSections
        slug="paleta-de-cores"
        idPrefix="palette"
        ids={categories}
        sub={sub}
        identityId={identity.id}
        className="manual-palette-list"
      >
        {categories.map((category, index) => (
          <section key={category} id={`palette-${category}`} className="manual-palette-section">
            {colorsOfCategory(identity, category).map((color) => (
              <ColorBlock key={color.id} color={color} />
            ))}
            <div className="manual-text-block manual-palette-text">
              <h2 className="manual-h2">{CATEGORY_TEXTS[category].title}</h2>
              <div className="manual-p manual-p--spaced">
                {CATEGORY_TEXTS[category].paragraphs(marca).map((text) => (
                  <p key={text}>{text}</p>
                ))}
              </div>
            </div>
            {index < categories.length - 1 ? <div className="manual-divider" /> : null}
          </section>
        ))}
      </ManualScrollSections>
    </>
  )
}

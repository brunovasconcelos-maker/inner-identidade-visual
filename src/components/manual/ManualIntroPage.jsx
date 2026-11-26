import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, Smiley, UserSound } from '@phosphor-icons/react'
import AssetPreview from '../logo/AssetPreview.jsx'
import LibraryGlyphs from '../../icon-libraries/LibraryGlyphs.jsx'
import { findLibrary, iconPool } from '../../icon-libraries/libraries.js'
import { useObjectUrl } from '../../hooks/useObjectUrl.js'
import { useFontFamily } from '../../hooks/useFontFamily.js'
import { useIconVersions } from '../../hooks/useIconVersions.js'
import { useHeroBackground } from '../../hooks/useHeroBackground.js'
import { inkFor } from '../../data/manualPalette.js'
import { pickTileStyle } from '../../data/manualIcon.js'
import { LOGO_SECTIONS, manualPath, subOptions, visibleSections } from '../../data/manual.js'
import { selectedWeights } from '../../data/manualTypography.js'
import {
  INTRO_TEXT,
  TOPIC_TEXTS,
  HERO_FALLBACK_BACKGROUND,
  heroLogo,
  libraryBackground,
  paletteStripes,
  pickCardWeights,
  principalFont,
  typographyBackground,
} from '../../data/manualIntro.js'
import { recolorSingleColor, zipSvgs } from '../../utils/iconZip.js'
import { ImageBox } from './ManualImageBox.jsx'
import FitLines from './FitLines.jsx'

const LIBRARY_ICONS = 25 // 5 columns x 5 rows of 24px icons with 15px gaps, as in Figma

// ---------- name instead of the logo (identity without logos) ----------

// The identity name in the principal typography (Inter Bold without one).
function FontName({ font, name, size, className }) {
  const family = useFontFamily(font)
  return (
    <span className={className} style={{ fontFamily: family.css, fontWeight: 400, fontSize: size, letterSpacing: '-0.04em' }}>
      {name}
    </span>
  )
}

function NameMark({ identity, size, className }) {
  const font = principalFont(identity)
  if (font) return <FontName font={font} name={identity.name} size={size} className={className} />
  return (
    <span className={className} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: size, letterSpacing: '-0.04em' }}>
      {identity.name}
    </span>
  )
}

// ---------- cards: image (140px high, 16px radius), title and text ----------

function CardShell({ identity, section, background, children }) {
  const { slug, label } = section
  const first = subOptions(slug, identity)[0]
  const to = manualPath(identity.id, slug, first ? first.id : undefined)
  return (
    <Link className="intro-card" to={to}>
      <span className="intro-card__image" style={{ background }}>
        {children}
      </span>
      <span className="intro-card__texts">
        <span className="intro-card__title">{label}</span>
        <span className="intro-card__text">{TOPIC_TEXTS[slug]}</span>
      </span>
    </Link>
  )
}

// The principal logo on the hero background.
function LogoCard({ identity, section, hero }) {
  const logo = heroLogo(identity)
  const url = useObjectUrl(logo ? logo.file : null)
  return (
    <CardShell identity={identity} section={section} background={hero}>
      {logo ? url ? <img className="intro-card__logo" src={url} alt="" /> : null : <NameMark identity={identity} size={28} className="intro-card__name" />}
    </CardShell>
  )
}

// The icon on the brand color, in the version with the best contrast (as the Aplicativo tile).
function IconCard({ identity, section }) {
  const icon = identity.icones[0]
  const versions = useIconVersions(icon)
  const ready = versions.every((version) => version.color)
  const style = ready ? pickTileStyle(versions, identity.paleta) : null
  const url = useObjectUrl(style ? style.version.file : null)
  return (
    <CardShell identity={identity} section={section} background={style ? style.background : HERO_FALLBACK_BACKGROUND}>
      {url ? <img className="intro-card__icon" src={url} alt="" /> : null}
    </CardShell>
  )
}

function PaletteCard({ identity, section }) {
  const stripes = paletteStripes(identity)
  return (
    <CardShell identity={identity} section={section} background={stripes[0] || HERO_FALLBACK_BACKGROUND}>
      <span className="intro-card__stripes">
        {stripes.map((hex, index) => (
          <span key={`${hex}-${index}`} style={{ background: hex }} />
        ))}
      </span>
    </CardShell>
  )
}

// The family name in three lines, light to bold.
function TypographyCard({ identity, section }) {
  const font = principalFont(identity)
  const family = useFontFamily(font)
  const background = typographyBackground(identity) || HERO_FALLBACK_BACKGROUND
  const lines = useMemo(
    () => pickCardWeights(selectedWeights(font)).map((weight) => ({ text: font.family, weight: weight.weight, italic: weight.italic })),
    [font],
  )
  return (
    <CardShell identity={identity} section={section} background={background}>
      <FitLines lines={lines} family={family.css} color={inkFor(background).ink} ready={family.ready} />
    </CardShell>
  )
}

// Up to four elements on the hero background (non image files show their type icon).
function ElementsCard({ identity, section, hero }) {
  return (
    <CardShell identity={identity} section={section} background={hero}>
      <span className="intro-card__elements">
        {identity.elementos.slice(0, 4).map((element) => (
          <span className="intro-card__element" key={element.id}>
            <AssetPreview
              file={element.file}
              format={element.format}
              size={32}
              className="intro-card__element-img"
              iconClassName="intro-card__element-icon"
            />
          </span>
        ))}
      </span>
    </CardShell>
  )
}

// Icons of an uploaded library: the first SVGs of the zip, recolored when single-colored.
function UploadGlyphs({ file, ink }) {
  const [urls, setUrls] = useState([])
  useEffect(() => {
    let alive = true
    let made = []
    zipSvgs(file, (entries) => entries.slice(0, LIBRARY_ICONS))
      .then((svgs) => {
        made = svgs.map((svg) => URL.createObjectURL(new Blob([recolorSingleColor(svg.text, ink)], { type: 'image/svg+xml' })))
        if (alive) setUrls(made)
        else made.forEach((url) => URL.revokeObjectURL(url))
      })
      .catch(() => {})
    return () => {
      alive = false
      made.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [file, ink])
  return urls.map((url) => <img key={url} className="lib-glyph lib-glyph--img" src={url} alt="" />)
}

// Icons of the chosen library and style on a palette color.
function LibraryCard({ identity, section }) {
  const item = identity.bibliotecaDeIcones[0]
  const library = item.source === 'upload' ? null : findLibrary(item.libraryId)
  const names = useMemo(() => (library ? iconPool(library).slice(0, LIBRARY_ICONS) : []), [library])
  const background = libraryBackground(identity) || HERO_FALLBACK_BACKGROUND
  const ink = inkFor(background).ink
  return (
    <CardShell identity={identity} section={section} background={background}>
      <span className="intro-card__glyphs" style={{ color: ink }}>
        {library ? <LibraryGlyphs library={library} style={item.style} names={names} /> : <UploadGlyphs file={item.file} ink={ink} />}
      </span>
    </CardShell>
  )
}

// Fotografia, Tom de voz and Personalidade: the page icon on the hero background.
const PAGE_ICONS = { fotografia: Camera, 'tom-de-voz': UserSound, personalidade: Smiley }
function PageIconCard({ identity, section, hero }) {
  const PageIcon = PAGE_ICONS[section.slug]
  return (
    <CardShell identity={identity} section={section} background={hero}>
      <PageIcon size={48} color={inkFor(hero).ink} weight="fill" />
    </CardShell>
  )
}

const CARDS = {
  logo: LogoCard,
  icone: IconCard,
  'paleta-de-cores': PaletteCard,
  tipografia: TypographyCard,
  elementos: ElementsCard,
  'biblioteca-de-icones': LibraryCard,
}

// ---------- the page ----------

// The Intro page of the brand manual (Figma node 6479:5446): hero with the logo, intro text and
// one card per active page of the manual. Everything comes from the data of the identity.
export default function ManualIntroPage({ identity }) {
  const logo = heroLogo(identity)
  const hero = useHeroBackground(identity)
  const sections = visibleSections(identity).filter((section) => section.slug !== 'intro')

  return (
    <>
      {logo ? (
        <div className="manual-intro-hero">
          <ImageBox
            file={logo.file}
            fileName={logo.fileName}
            bg={hero}
            height={420}
            inner={LOGO_SECTIONS.principal.hero}
            label={identity.name}
          />
        </div>
      ) : (
        <div className="manual-box manual-intro-hero manual-intro-hero--name" style={{ background: hero, height: 420 }}>
          <NameMark identity={identity} size={96} className="manual-intro-hero__name" />
        </div>
      )}

      <div className="manual-intro manual-intro--after-hero">
        {INTRO_TEXT(identity.name).map((text) => (
          <p key={text}>{text}</p>
        ))}
      </div>

      <div className="intro-cards">
        {sections.map((section) => {
          const Component = CARDS[section.slug] || PageIconCard
          return <Component key={section.slug} identity={identity} section={section} hero={hero} />
        })}
      </div>
    </>
  )
}

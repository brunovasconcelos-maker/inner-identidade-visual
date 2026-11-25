import { useEffect, useMemo, useState } from 'react'
import { CircleNotch, DownloadSimple } from '@phosphor-icons/react'
import LibraryGlyphs from '../../icon-libraries/LibraryGlyphs.jsx'
import { findLibrary, iconPool, libraryUrl, normalizeSvg } from '../../icon-libraries/libraries.js'
import { loadOverview } from '../../icon-libraries/sets.js'
import { LIBRARY_INTRO, heroColors } from '../../data/manualLibrary.js'
import { saveBlob } from '../../utils/download.js'
import { buildLibraryZip } from '../../utils/libraryZip.js'
import { baseName, randomEntries, recolorSingleColor, zipSvgs } from '../../utils/iconZip.js'

const HERO_COUNT = 77 // 11 per row, 7 rows: the last rows are cut by the box, as in Figma
const OVERVIEW_COUNT = 48 // 6 rows of 8

function shuffled(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Hero icons of an uploaded library: random SVGs, recolored to the brand color when they have a
// single color, untouched when they have several.
function UploadHeroGlyphs({ file, ink }) {
  const [urls, setUrls] = useState([])
  useEffect(() => {
    let alive = true
    let made = []
    zipSvgs(file, (entries) => randomEntries(entries, HERO_COUNT))
      .then((svgs) => {
        made = svgs.map((svg) =>
          URL.createObjectURL(new Blob([recolorSingleColor(svg.text, ink)], { type: 'image/svg+xml' })),
        )
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

// One tile of the overview: the icon and its name. On hover: the gray overlay with its border
// and a download button that saves only this icon as SVG.
function OverviewTile({ name, children, onDownload }) {
  return (
    <div className="lib-tile" data-icon={name}>
      <div className="lib-tile__icon">
        {children}
        <button type="button" className="lib-tile__download" aria-label={`Baixar ${name}`} onClick={onDownload}>
          <DownloadSimple size={24} color="#000000" weight="regular" />
        </button>
      </div>
      <p className="lib-tile__name" title={name}>
        {name}
      </p>
    </div>
  )
}

function FreeOverview({ library, style }) {
  const [icons, setIcons] = useState([])
  useEffect(() => {
    let alive = true
    setIcons([])
    loadOverview(library, style).then((pairs) => alive && setIcons(pairs))
    return () => {
      alive = false
    }
  }, [library, style])
  return icons.slice(0, OVERVIEW_COUNT).map(([name, svg]) => (
    <OverviewTile
      key={name}
      name={name}
      onDownload={() => saveBlob(new Blob([svg], { type: 'image/svg+xml' }), `${name}.svg`)}
    >
      <span className="lib-tile__svg" dangerouslySetInnerHTML={{ __html: normalizeSvg(svg) }} />
    </OverviewTile>
  ))
}

function UploadOverview({ file }) {
  const [icons, setIcons] = useState([])
  useEffect(() => {
    let alive = true
    let made = []
    zipSvgs(file, (entries) =>
      [...entries].sort((a, b) => (baseName(a.name) < baseName(b.name) ? -1 : baseName(a.name) > baseName(b.name) ? 1 : 0)).slice(0, OVERVIEW_COUNT),
    )
      .then((svgs) => {
        made = svgs.map((svg) => ({
          name: baseName(svg.name),
          text: svg.text,
          url: URL.createObjectURL(new Blob([svg.text], { type: 'image/svg+xml' })),
        }))
        if (alive) setIcons(made)
        else made.forEach((icon) => URL.revokeObjectURL(icon.url))
      })
      .catch(() => {})
    return () => {
      alive = false
      made.forEach((icon) => URL.revokeObjectURL(icon.url))
    }
  }, [file])
  return icons.map((icon) => (
    <OverviewTile
      key={icon.url}
      name={icon.name}
      onDownload={() => saveBlob(new Blob([icon.text], { type: 'image/svg+xml' }), `${icon.name}.svg`)}
    >
      <img className="lib-tile__img" src={icon.url} alt="" />
    </OverviewTile>
  ))
}

// The Biblioteca de ícones page of the brand manual (Figma node 6512:10627): intro, hero with
// random icons in the brand colors, library info with its buttons, and an overview of the
// first 48 icons.
export default function ManualLibraryPage({ identity }) {
  const item = identity.bibliotecaDeIcones[0]
  const isUpload = item.source === 'upload'
  const library = isUpload ? null : findLibrary(item.libraryId)
  const colors = useMemo(() => heroColors(identity.paleta), [identity.paleta])
  const heroNames = useMemo(
    () => (isUpload ? [] : shuffled(iconPool(library)).slice(0, HERO_COUNT)),
    [isUpload, library],
  )
  const [building, setBuilding] = useState(false)
  const title = isUpload ? item.name : library.name

  async function handleDownload() {
    if (isUpload) {
      saveBlob(item.file, item.fileName)
      return
    }
    if (building) return
    setBuilding(true)
    try {
      saveBlob(await buildLibraryZip(library, item.style), `${library.name}-${item.style}.zip`)
    } catch (error) {
      console.error('Could not build the library zip', error)
    } finally {
      setBuilding(false)
    }
  }

  return (
    <>
      <div className="manual-intro">
        {LIBRARY_INTRO(identity.name).map((text) => (
          <p key={text}>{text}</p>
        ))}
      </div>

      <section className="manual-lib">
        <div className="manual-lib__top">
          <div className="lib-hero" style={{ background: colors.background, color: colors.ink }}>
            <div className="lib-hero__grid">
              {isUpload ? (
                <UploadHeroGlyphs file={item.file} ink={colors.ink} />
              ) : (
                <LibraryGlyphs library={library} style={item.style} names={heroNames} />
              )}
            </div>
          </div>

          <div className="manual-block manual-block--info lib-info">
            <div className="manual-text-block manual-text-block--wide">
              <h2 className="manual-h2">{title}</h2>
              {item.description ? <p className="manual-p">{item.description}</p> : null}
            </div>
            <div className="manual-actions">
              <button
                type="button"
                className="manual-btn manual-btn--primary"
                aria-busy={building}
                disabled={building}
                onClick={handleDownload}
              >
                {building ? (
                  <span className="lib-btn-busy">
                    <CircleNotch className="lib-spin" size={20} color="#ffffff" weight="bold" />
                    Gerando biblioteca
                  </span>
                ) : (
                  'Download biblioteca'
                )}
              </button>
              {isUpload ? null : (
                <button
                  type="button"
                  className="manual-btn manual-btn--secondary"
                  onClick={() => window.open(libraryUrl(library), '_blank', 'noopener')}
                >
                  {`Ir para o site da ${library.name}`}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="manual-divider" />

        <div className="lib-overview">
          <h2 className="manual-h2">Overview</h2>
          <div className="lib-overview__grid">
            {isUpload ? <UploadOverview file={item.file} /> : <FreeOverview library={library} style={item.style} />}
          </div>
        </div>
      </section>
    </>
  )
}

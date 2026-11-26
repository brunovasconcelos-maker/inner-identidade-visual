import { useEffect, useState } from 'react'
import { useObjectUrl } from '../../hooks/useObjectUrl.js'
import { contrastRatio } from '../../data/manualPalette.js'
import {
  ICON_INTRO,
  ICON_TEXTS,
  bestVersion,
  faviconAddress,
  pickAvatarBackground,
  pickTileStyle,
} from '../../data/manualIcon.js'
import { useIconVersions } from '../../hooks/useIconVersions.js'
import { downloadLogoVersions, saveBlob } from '../../utils/download.js'
import { dominantColors, fitInCircle, visibleBounds } from '../../utils/imageColor.js'
import { BOX_DARK, BOX_LIGHT, ImageBox, OriginalBox } from './ManualImageBox.jsx'
import FaviconMockup from './FaviconMockup.jsx'

// Light blue of the manual guides (same as the logo safe space).
const GUIDE = 'rgba(150, 191, 233, 0.93)'
const BOX = { width: 580, height: 360 }
const HERO = [225.045, 280]
const VARIANT = [160.746, 200]
const WHITE = '#FFFFFF'

function useBounds(file) {
  const [bounds, setBounds] = useState(null)
  useEffect(() => {
    let alive = true
    visibleBounds(file).then((value) => alive && setBounds(value))
    return () => {
      alive = false
    }
  }, [file])
  return bounds
}

// Safe space of the icon, one SVG on a square canvas (C = 60% of the box height):
//  - outer square: the canvas; s = C / 8;
//  - inner square (safe area): the canvas inset by s on all sides, side 0.75C;
//  - circle (round crop): inscribed in the inner square, same center;
//  - an s x s crossed square in each corner between the outer and the inner square;
//  - the icon with its transparent pixels trimmed, scaled so its visible bounds fit
//    entirely inside the circle.
const CANVAS = BOX.height * 0.6
function IconSafeSpace({ file }) {
  const url = useObjectUrl(file)
  const s = CANVAS / 8
  const cx = BOX.width / 2
  const cy = BOX.height / 2
  const radius = (CANVAS * 0.75) / 2
  const [fit, setFit] = useState(null)
  useEffect(() => {
    let alive = true
    setFit(null)
    fitInCircle(file, radius).then((value) => alive && setFit(value))
    return () => {
      alive = false
    }
  }, [file, radius])
  const outer = { x: cx - CANVAS / 2, y: cy - CANVAS / 2 }
  const inner = { x: outer.x + s, y: outer.y + s, size: CANVAS - 2 * s }
  const corners = [
    [outer.x, outer.y],
    [outer.x + CANVAS - s, outer.y],
    [outer.x, outer.y + CANVAS - s],
    [outer.x + CANVAS - s, outer.y + CANVAS - s],
  ]
  return (
    <svg className="manual-safe" viewBox={`0 0 ${BOX.width} ${BOX.height}`} role="img" aria-label="Safe space">
      {url && fit ? (
        <image
          href={url}
          x={cx + fit.dx}
          y={cy + fit.dy}
          width={fit.width}
          height={fit.height}
          preserveAspectRatio="none"
        />
      ) : null}
      <g fill="none" stroke={GUIDE} strokeWidth="1">
        <rect x={outer.x} y={outer.y} width={CANVAS} height={CANVAS} />
        <rect x={inner.x} y={inner.y} width={inner.size} height={inner.size} />
        <circle cx={cx} cy={cy} r={radius} />
        {corners.map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <rect x={x} y={y} width={s} height={s} />
            <line x1={x} y1={y} x2={x + s} y2={y + s} />
            <line x1={x + s} y1={y} x2={x} y2={y + s} />
          </g>
        ))}
      </g>
    </svg>
  )
}

// Minimum size: the icon at 64, 32 and 16 px (real pixels), centered in the box with equal
// gaps and a shared baseline, each label centered below its icon.
const SIZES = [64, 32, 16]
const GAP = 32
function MinSize({ file }) {
  const url = useObjectUrl(file)
  return (
    <div className="icon-min" style={{ gap: GAP }}>
      {SIZES.map((size) => (
        <div className="icon-min__item" key={size} style={{ width: size, height: size }}>
          {url ? <img src={url} alt="" width={size} height={size} style={{ width: size, height: size }} /> : null}
          <span className="icon-min__label">{`${size}px`}</span>
        </div>
      ))}
    </div>
  )
}

// One application tile: the icon of the chosen version fitted by its visible bounds.
const TILE = 136
function Tile({ version, background, shape, round }) {
  const url = useObjectUrl(version.file)
  const bounds = useBounds(version.file)
  let image = null
  if (url && bounds) {
    const w = (bounds.x1 - bounds.x0) * bounds.ratio
    const h = bounds.y1 - bounds.y0
    // Square tiles: 1/8 padding on each side. Round: the visible bounds fit inside a circle
    // inset by 1/8 of the diameter.
    const k = round
      ? (TILE * 3) / 8 / Math.hypot(w / 2, h / 2)
      : Math.min((TILE * 0.75) / w, (TILE * 0.75) / h)
    image = {
      width: bounds.ratio * k,
      height: k,
      left: TILE / 2 - ((bounds.x0 + bounds.x1) / 2) * bounds.ratio * k,
      top: TILE / 2 - ((bounds.y0 + bounds.y1) / 2) * k,
    }
  }
  return (
    <div className="icon-tile" style={{ background, borderRadius: shape, width: TILE, height: TILE }}>
      {image ? <img src={url} alt="" style={{ position: 'absolute', ...image }} /> : null}
    </div>
  )
}

function Application({ title, text, children }) {
  return (
    <div className="icon-app">
      <div className="manual-text-block icon-app__text">
        <h3 className="manual-h2">{title}</h3>
        <p className="manual-p">{text}</p>
      </div>
      <div className="manual-box manual-box--static icon-app__box" style={{ background: BOX_LIGHT }}>
        {children}
      </div>
    </div>
  )
}

// The Ícone page of the brand manual (Figma node 6479:5504).
export default function ManualIconPage({ identity }) {
  const icon = identity.icones[0]
  const monoVersions = icon.monoVersions || []
  const versions = useIconVersions(icon)
  const ready = versions.every((version) => version.color)
  const style = ready ? pickTileStyle(versions, identity.paleta) : null
  // Avatars use the original icon on a palette color picked against its dominant colors.
  const [dominant, setDominant] = useState(null)
  useEffect(() => {
    let alive = true
    dominantColors(icon.file).then((value) => alive && setDominant(value))
    return () => {
      alive = false
    }
  }, [icon.file])
  const avatarBackground = dominant ? pickAvatarBackground(dominant, identity.paleta) : null
  const faviconVersion = ready ? bestVersion(versions, WHITE).version : versions[0]

  return (
    <>
      <div className="manual-intro">
        {ICON_INTRO(identity.name).map((text) => (
          <p key={text}>{text}</p>
        ))}
      </div>
      <section className="manual-logo-section manual-icon" id="icone">
        <OriginalBox file={icon.file} fileName={icon.fileName} height={520} inner={HERO} label="Ícone" />

        <div className="manual-block manual-block--info">
          <div className="manual-text-block manual-text-block--wide">
            <h2 className="manual-h2">Ícone</h2>
            {icon.description ? <p className="manual-p">{icon.description}</p> : null}
            <h3 className="manual-h3">Casos de uso</h3>
            {icon.useCases ? <p className="manual-p">{icon.useCases}</p> : null}
          </div>
          <div className="manual-actions">
            <button type="button" className="manual-btn manual-btn--primary" onClick={() => saveBlob(icon.file, icon.fileName)}>
              Download ícone
            </button>
            <button
              type="button"
              className="manual-btn manual-btn--secondary"
              onClick={() => downloadLogoVersions(identity.name, icon, 'icone')}
            >
              Download todas as versões
            </button>
          </div>
        </div>

        {monoVersions.length > 0 ? (
          <>
            <div className="manual-divider" />
            <section className="manual-block manual-block--column">
              {monoVersions.map((version, index) => {
                const box = (
                  <div className="manual-box-wrap" key={version.id}>
                    <ImageBox
                      file={version.file}
                      fileName={version.fileName}
                      bg={version.previewBg === '#000000' ? BOX_DARK : BOX_LIGHT}
                      height={360}
                      inner={VARIANT}
                      label={version.name}
                    />
                  </div>
                )
                return index === 0 ? (
                  <div className="manual-row" key={version.id}>
                    <div className="manual-text-block manual-text-block--narrow">
                      <h2 className="manual-h2">Variantes do ícone</h2>
                      <p className="manual-p">{ICON_TEXTS.variants}</p>
                    </div>
                    {box}
                  </div>
                ) : (
                  box
                )
              })}
            </section>
          </>
        ) : null}

        <div className="manual-divider" />

        <section className="manual-block manual-block--row">
          <div className="manual-text-block manual-text-block--narrow">
            <h2 className="manual-h2">Safe space</h2>
            <div className="manual-p manual-p--spaced">
              {ICON_TEXTS.safeSpace.map((text) => (
                <p key={text}>{text}</p>
              ))}
            </div>
          </div>
          <div className="manual-box-wrap">
            <div className="manual-box manual-box--static" style={{ background: BOX_LIGHT, height: 360 }}>
              <IconSafeSpace file={icon.file} />
            </div>
          </div>
        </section>

        <div className="manual-divider" />

        <section className="manual-block manual-block--row">
          <div className="manual-text-block manual-text-block--narrow">
            <h2 className="manual-h2">Tamanho mínimo</h2>
            <p className="manual-p">{ICON_TEXTS.minSize}</p>
          </div>
          <div className="manual-box-wrap">
            <div className="manual-box manual-box--static" style={{ background: BOX_LIGHT, height: 360 }}>
              <MinSize file={icon.file} />
            </div>
          </div>
        </section>

        <div className="manual-divider" />

        <section className="manual-block manual-block--column icon-apps">
          <div className="manual-text-block manual-text-block--full">
            <h2 className="manual-h2">Aplicações</h2>
            <p className="manual-p">{ICON_TEXTS.applications}</p>
          </div>
          <div className="icon-apps__grid">
            <Application title="Aplicativo" text={ICON_TEXTS.app}>
              {style ? <Tile version={style.version} background={style.background} shape="22.37%" /> : null}
            </Application>
            <Application title="Avatar quadrado" text={ICON_TEXTS.square}>
              {avatarBackground ? <Tile version={versions[0]} background={avatarBackground} shape="4px" /> : null}
            </Application>
            <Application title="Avatar redondo" text={ICON_TEXTS.round}>
              {avatarBackground ? <Tile version={versions[0]} background={avatarBackground} shape="50%" round /> : null}
            </Application>
          </div>
        </section>

        <div className="manual-divider" />

        <section className="manual-block manual-block--row">
          <div className="manual-text-block manual-text-block--narrow">
            <h2 className="manual-h2">Favicon</h2>
            <p className="manual-p">{ICON_TEXTS.favicon(identity.name)}</p>
          </div>
          <div className="manual-box-wrap">
            <FaviconMockup file={faviconVersion.file} title={identity.name} address={faviconAddress(identity.name)} />
          </div>
        </section>
      </section>
    </>
  )
}

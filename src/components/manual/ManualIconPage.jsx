import { useEffect, useMemo, useState } from 'react'
import { useObjectUrl } from '../../hooks/useObjectUrl.js'
import { contrastRatio } from '../../data/manualPalette.js'
import {
  ICON_INTRO,
  ICON_TEXTS,
  bestVersion,
  faviconAddress,
  pickTileStyle,
  versionKey,
} from '../../data/manualIcon.js'
import { downloadLogoVersions, saveBlob } from '../../utils/download.js'
import { dominantColor, visibleBounds } from '../../utils/imageColor.js'
import { BOX_DARK, BOX_LIGHT, ImageBox, OriginalBox } from './ManualImageBox.jsx'
import FaviconMockup from './FaviconMockup.jsx'

// Light blue of the manual guides (same as the logo safe space).
const GUIDE = 'rgba(150, 191, 233, 0.93)'
const BOX = { width: 580, height: 360 }
const SAFE_AREA = [112.522, 140]
const HERO = [225.045, 280]
const VARIANT = [160.746, 200]
const WHITE = '#FFFFFF'

// Versions of the icon (original first, then each monochrome) with their dominant color.
function useVersions(icon) {
  const [colors, setColors] = useState({})
  const monos = icon.monoVersions || []
  const list = useMemo(
    () => [
      { key: versionKey(0), file: icon.file },
      ...monos.map((version, index) => ({ key: versionKey(index + 1), file: version.file })),
    ],
    [icon.file, monos],
  )
  useEffect(() => {
    let alive = true
    Promise.all(list.map((item) => dominantColor(item.file).catch(() => '#000000'))).then((values) => {
      if (!alive) return
      const next = {}
      list.forEach((item, index) => {
        next[item.key] = values[index]
      })
      setColors(next)
    })
    return () => {
      alive = false
    }
  }, [list])
  return list.map((item) => ({ ...item, color: colors[item.key] || null }))
}

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

// Safe space of the icon: s = 1/8 of the visible icon width, a crossed square of s x s in
// each corner of the outer rectangle, and the circle for round applications.
function IconSafeSpace({ file }) {
  const url = useObjectUrl(file)
  const bounds = useBounds(file)
  if (!url || !bounds) return <svg className="manual-safe" viewBox={`0 0 ${BOX.width} ${BOX.height}`} />
  const area = {
    x: (BOX.width - SAFE_AREA[0]) / 2,
    y: (BOX.height - SAFE_AREA[1]) / 2,
    width: SAFE_AREA[0],
    height: SAFE_AREA[1],
  }
  const drawnHeight = Math.min(area.width / bounds.ratio, area.height)
  const drawnWidth = drawnHeight * bounds.ratio
  const image = {
    x: area.x + (area.width - drawnWidth) / 2,
    y: area.y + (area.height - drawnHeight) / 2,
    width: drawnWidth,
    height: drawnHeight,
  }
  const inner = {
    x: image.x + bounds.x0 * image.width,
    y: image.y + bounds.y0 * image.height,
    width: (bounds.x1 - bounds.x0) * image.width,
    height: (bounds.y1 - bounds.y0) * image.height,
  }
  const s = inner.width / 8
  const outer = { x: inner.x - s, y: inner.y - s, width: inner.width + 2 * s, height: inner.height + 2 * s }
  const right = inner.x + inner.width
  const bottom = inner.y + inner.height
  const cx = inner.x + inner.width / 2
  const cy = inner.y + inner.height / 2
  // Circle inscribed in the outer square (side = the larger outer side), inset by s.
  const radius = (Math.max(outer.width, outer.height) - 2 * s) / 2
  const corners = [
    [outer.x, outer.y],
    [right, outer.y],
    [outer.x, bottom],
    [right, bottom],
  ]
  return (
    <svg className="manual-safe" viewBox={`0 0 ${BOX.width} ${BOX.height}`} role="img" aria-label="Safe space">
      <image href={url} x={image.x} y={image.y} width={image.width} height={image.height} preserveAspectRatio="xMidYMid meet" />
      <g fill="none" stroke={GUIDE} strokeWidth="1">
        <rect x={outer.x} y={outer.y} width={outer.width} height={outer.height} />
        <rect x={inner.x} y={inner.y} width={inner.width} height={inner.height} />
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

// Minimum size: the icon at 64, 32 and 16 px (real pixels) on one baseline and a 1:1 ruler.
const SIZES = [64, 32, 16]
const GAP = 32
function MinSize({ file }) {
  const url = useObjectUrl(file)
  const total = SIZES.reduce((sum, size) => sum + size, 0) + GAP * (SIZES.length - 1)
  const left = Math.round((BOX.width - total) / 2)
  const ticks = []
  for (let value = 0; value <= 64; value += 4) ticks.push(value)
  let offset = 0
  return (
    <div className="icon-min" style={{ paddingLeft: left }}>
      <div className="icon-min__row" style={{ gap: GAP }}>
        {SIZES.map((size) => {
          offset += size
          return (
            <div className="icon-min__item" key={size} style={{ width: size }}>
              {url ? <img src={url} alt="" width={size} height={size} style={{ width: size, height: size }} /> : null}
              <span className="icon-min__label">{`${size}px`}</span>
            </div>
          )
        })}
      </div>
      <svg className="icon-min__ruler" width="65" height="30" viewBox="0 0 65 30" aria-hidden="true" overflow="visible">
        <g stroke={GUIDE} strokeWidth="1" shapeRendering="crispEdges">
          <line x1="0.5" y1="0.5" x2="64.5" y2="0.5" />
          {ticks.map((value) => (
            <line key={value} x1={value + 0.5} y1="0.5" x2={value + 0.5} y2={value % 16 === 0 ? 10.5 : 5.5} />
          ))}
        </g>
        {[0, 16, 32, 48, 64].map((value) => (
          <text key={value} x={value + 0.5} y="24" textAnchor="middle" fontSize="10" fill={GUIDE} fontFamily="Inter, sans-serif">
            {value}
          </text>
        ))}
      </svg>
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
  const versions = useVersions(icon)
  const ready = versions.every((version) => version.color)
  const style = ready ? pickTileStyle(versions, identity.paleta) : null
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
              {style ? <Tile version={style.version} background={style.background} shape="4px" /> : null}
            </Application>
            <Application title="Avatar redondo" text={ICON_TEXTS.round}>
              {style ? <Tile version={style.version} background={style.background} shape="50%" round /> : null}
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

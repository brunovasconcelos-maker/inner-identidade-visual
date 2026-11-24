import { useEffect, useState } from 'react'
import { useObjectUrl } from '../../hooks/useObjectUrl.js'
import { useFontPreview } from '../../utils/fonts.js'
import { visibleBounds } from '../../utils/imageColor.js'

// Box of the Figma frames: 580 x 360.
const BOX = { width: 580, height: 360 }
// Light blue of the manual in Figma (the selected sidebar tile, 96BFE9 at 93%).
const GUIDE = 'rgba(150, 191, 233, 0.93)'
// Safe space `s` = height of the wordmark letters, detected in the logo image. Without a row
// of letters (an icon, for example) it is 15% of the smaller side of the visible logo.
const FALLBACK_RATIO = 0.15
// The diagram never touches the edge of its box.
const PADDING = 20

// Cap height of a letter in a font, as a fraction of the font size (measured on a canvas).
function useCapRatio(letter, font) {
  const [ratio, setRatio] = useState(0.727) // Inter
  const spec = `${font.italic ? 'italic ' : ''}${font.weight} 100px ${font.fontFamily}`
  useEffect(() => {
    let alive = true
    const measure = () => {
      const context = document.createElement('canvas').getContext('2d')
      context.font = spec
      const ascent = context.measureText(letter).actualBoundingBoxAscent
      // A failed measure (font not ready) keeps the Inter cap height.
      if (alive && ascent / 100 > 0.3 && ascent / 100 < 1.2) setRatio(ascent / 100)
    }
    if (document.fonts && document.fonts.load) {
      document.fonts.load(spec, letter).then(measure, measure)
    } else {
      measure()
    }
    return () => {
      alive = false
    }
  }, [spec, letter, font.ready])
  return ratio
}

// The logo with its safe space: inner rectangle on the visible bounds, outer rectangle
// expanded by `s` on all sides, the reference letter in each gap and a crossed square of
// s x s in each corner. Drawn as SVG, so it scales with its box.
export default function SafeSpaceDiagram({ file, identity, letter, area }) {
  // The logo area is centered in the box (Figma: 255.008 x 197 for the principal logo).
  const AREA = {
    x: (BOX.width - area[0]) / 2,
    y: (BOX.height - area[1]) / 2,
    width: area[0],
    height: area[1],
  }
  const url = useObjectUrl(file)
  const [bounds, setBounds] = useState(null)
  useEffect(() => {
    let alive = true
    visibleBounds(file).then((value) => alive && setBounds(value))
    return () => {
      alive = false
    }
  }, [file])

  const principalFont = identity.tipografia.find((font) => font.type === 'principal')
  const preview = useFontPreview(principalFont || null, principalFont ? principalFont.selectedWeights : null)
  const font = principalFont
    ? preview
    : { fontFamily: 'Inter, sans-serif', weight: 700, italic: false, ready: true }
  const capRatio = useCapRatio(letter, font)

  if (!url || !bounds) return <svg className="manual-safe" viewBox={`0 0 ${BOX.width} ${BOX.height}`} />

  // The logo is contained in its area, never stretched.
  const scale = Math.min(AREA.width, AREA.height * bounds.ratio) / bounds.ratio
  const drawnHeight = scale
  const drawnWidth = scale * bounds.ratio
  const image = {
    x: AREA.x + (AREA.width - drawnWidth) / 2,
    y: AREA.y + (AREA.height - drawnHeight) / 2,
    width: drawnWidth,
    height: drawnHeight,
  }
  const inner = {
    x: image.x + bounds.x0 * image.width,
    y: image.y + bounds.y0 * image.height,
    width: (bounds.x1 - bounds.x0) * image.width,
    height: (bounds.y1 - bounds.y0) * image.height,
  }
  const s =
    bounds.letterHeight !== null
      ? bounds.letterHeight * image.height
      : FALLBACK_RATIO * Math.min(inner.width, inner.height)
  const outer = { x: inner.x - s, y: inner.y - s, width: inner.width + 2 * s, height: inner.height + 2 * s }
  const innerRight = inner.x + inner.width
  const innerBottom = inner.y + inner.height
  const outerRight = outer.x + outer.width
  const outerBottom = outer.y + outer.height
  const cx = inner.x + inner.width / 2
  const cy = inner.y + inner.height / 2
  const fontSize = s / capRatio

  const letterAt = (x, y, rotate) => (
    <text
      x={x}
      y={y + s / 2}
      transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
      textAnchor="middle"
      fontFamily={font.fontFamily}
      fontWeight={font.weight}
      fontStyle={font.italic ? 'italic' : 'normal'}
      fontSize={fontSize}
      fill={GUIDE}
    >
      {letter}
    </text>
  )

  const corners = [
    [outer.x, outer.y],
    [innerRight, outer.y],
    [outer.x, innerBottom],
    [innerRight, innerBottom],
  ]

  // The diagram scales down when the outer rectangle would not fit, and stays centered.
  const fit = Math.min(1, (BOX.width - 2 * PADDING) / outer.width, (BOX.height - 2 * PADDING) / outer.height)
  const ocx = outer.x + outer.width / 2
  const ocy = outer.y + outer.height / 2

  return (
    <svg className="manual-safe" viewBox={`0 0 ${BOX.width} ${BOX.height}`} role="img" aria-label="Safe space">
      <g transform={`translate(${BOX.width / 2} ${BOX.height / 2}) scale(${fit}) translate(${-ocx} ${-ocy})`}>
      <image href={url} x={image.x} y={image.y} width={image.width} height={image.height} preserveAspectRatio="xMidYMid meet" />
      <g fill="none" stroke={GUIDE} strokeWidth="1">
        <rect x={outer.x} y={outer.y} width={outer.width} height={outer.height} />
        <rect x={inner.x} y={inner.y} width={inner.width} height={inner.height} />
        {corners.map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <rect x={x} y={y} width={s} height={s} />
            <line x1={x} y1={y} x2={x + s} y2={y + s} />
            <line x1={x + s} y1={y} x2={x} y2={y + s} />
          </g>
        ))}
      </g>
      {letterAt(cx, outer.y + s / 2, 0)}
      {letterAt(cx, innerBottom + s / 2, 0)}
      {letterAt(outer.x + s / 2, cy, -90)}
      {letterAt(innerRight + s / 2, cy, 90)}
      </g>
    </svg>
  )
}

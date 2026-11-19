import { isVeryLight } from '../../data/palette.js'

// 24px slot with the 19.5px color dot of the Figma "Circle" icon. Without a color the
// dot is gray; very light colors get a thin ring.
export default function ColorDot({ hex }) {
  const light = hex && isVeryLight(hex)
  return (
    <span className="color-dot" aria-hidden="true">
      <span
        className={`color-dot__fill${light ? ' color-dot__fill--ring' : ''}`}
        style={{ background: hex || '#dedede' }}
      />
    </span>
  )
}

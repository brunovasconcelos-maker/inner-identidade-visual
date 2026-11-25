import { useEffect, useRef, useState } from 'react'

// Copy a hex on click with a tooltip that follows the cursor (the behavior of the color viewer
// of the platform, shared with the swatches of the brand manual). `area(key, hex)` gives the
// props of a clickable color area; `tooltip` is the element to render once: the hex, or
// "Copiado" for 1.5 s after a click. The tooltip sits 32px to the right of the cursor and
// flips to the left near the right edge of the screen.
export function useCopyHex() {
  const [hover, setHover] = useState(null) // { key, hex, x, y }
  const [copiedKey, setCopiedKey] = useState(null)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy(key, hex) {
    try {
      await navigator.clipboard.writeText(hex)
    } catch (error) {
      console.error('Could not copy', error)
    }
    setCopiedKey(key)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopiedKey(null), 1500)
  }

  const area = (key, hex) => ({
    role: 'button',
    tabIndex: 0,
    'aria-label': `Copiar ${hex}`,
    onMouseEnter: (event) => setHover({ key, hex, x: event.clientX, y: event.clientY }),
    onMouseMove: (event) => setHover({ key, hex, x: event.clientX, y: event.clientY }),
    onMouseLeave: () => setHover(null),
    onClick: () => copy(key, hex),
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        copy(key, hex)
      }
    },
  })

  const left = hover && (hover.x + 32 + 110 > window.innerWidth ? hover.x - 32 - 100 : hover.x + 32)
  const tooltip = hover ? (
    <div className="cv-tooltip" style={{ left, top: hover.y }}>
      {copiedKey === hover.key ? 'Copiado' : hover.hex}
    </div>
  ) : null

  return { area, tooltip, clear: () => setHover(null) }
}

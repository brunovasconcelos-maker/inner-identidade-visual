import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

// Lines of text in one font that start at `maxSize` and shrink together until the widest one
// fits the width of its box (minus `padding` on each side). `lines`: [{ text, weight, italic }].
export default function FitLines({ lines, family, color, maxSize = 32, padding = 12, ready = true }) {
  const box = useRef(null)
  const sample = useRef(null)
  const [size, setSize] = useState(maxSize)

  const fit = useCallback(async () => {
    if (!box.current || !sample.current) return
    try {
      await Promise.all(
        lines.map((line) =>
          document.fonts.load(`${line.italic ? 'italic ' : ''}${line.weight} ${maxSize}px ${family}`, line.text),
        ),
      )
    } catch {
      // Measure with whatever font is there.
    }
    if (!box.current || !sample.current) return
    const available = box.current.clientWidth - 2 * padding
    const widest = Math.max(...[...sample.current.children].map((el) => el.getBoundingClientRect().width))
    setSize(widest > available && widest > 0 ? Math.max(8, (maxSize * available) / widest) : maxSize)
  }, [family, lines, maxSize, padding])

  useLayoutEffect(() => {
    fit()
  }, [fit, ready])

  useEffect(() => {
    if (!box.current) return undefined
    const observer = new ResizeObserver(() => fit())
    observer.observe(box.current)
    return () => observer.disconnect()
  }, [fit])

  const lineStyle = (line, fontSize) => ({
    fontFamily: family,
    fontWeight: line.weight,
    fontStyle: line.italic ? 'italic' : 'normal',
    fontSize,
    letterSpacing: '-0.04em',
    lineHeight: 'normal',
    whiteSpace: 'nowrap',
  })

  return (
    <div className="fit-lines" ref={box} style={{ color }}>
      <div className="fit-lines__sample" ref={sample} aria-hidden="true">
        {lines.map((line, index) => (
          <span key={index} style={lineStyle(line, maxSize)}>
            {line.text}
          </span>
        ))}
      </div>
      <div className="fit-lines__text">
        {lines.map((line, index) => (
          <span key={index} style={lineStyle(line, size)}>
            {line.text}
          </span>
        ))}
      </div>
    </div>
  )
}

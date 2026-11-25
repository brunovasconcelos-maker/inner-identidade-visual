import { useEffect, useState } from 'react'
import { loadLibraryStyle } from './libraries.js'

// The icons of a library, in one style, drawn with the real SVGs of that library. They take
// the text color (currentColor). Nothing is drawn until the lazy chunk of the style is in.
export default function LibraryGlyphs({ library, style, names }) {
  const [loaded, setLoaded] = useState({ key: '', svgs: null })
  const key = `${library.id}:${style}`
  useEffect(() => {
    let alive = true
    loadLibraryStyle(library, style).then((svgs) => alive && setLoaded({ key, svgs }))
    return () => {
      alive = false
    }
  }, [library, style, key])
  // Icons of the previous style stay until the new style arrives: no flash of empty space.
  if (!loaded.svgs) return null
  return names.map((name) => (
    <span
      key={name}
      className="lib-glyph"
      data-icon={name}
      data-style-key={loaded.key}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: loaded.svgs[name] || '' }}
    />
  ))
}

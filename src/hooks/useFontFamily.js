import { useEffect, useState } from 'react'
import { loadGoogleFamily, registerUploadedFont, uploadAlias } from '../utils/fonts.js'

// Registers or loads the font so the page can show it. Returns its CSS family.
export function useFontFamily(font) {
  const [ready, setReady] = useState(false)
  const alias = font.source === 'upload' ? uploadAlias(font.id) : null
  useEffect(() => {
    let alive = true
    setReady(false)
    const done = () => alive && setReady(true)
    if (font.source === 'upload') registerUploadedFont(alias, font.weights).then(done)
    else {
      loadGoogleFamily(font.family, font.weights)
      done()
    }
    return () => {
      alive = false
    }
    // The font is identified by its id and family; its weights never change once saved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [font.id, font.family])
  return { css: alias ? `"${alias}", Inter, sans-serif` : `"${font.family}", Inter, sans-serif`, ready }
}


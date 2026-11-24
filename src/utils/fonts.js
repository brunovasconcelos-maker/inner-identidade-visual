import { useEffect, useState } from 'react'
import { previewWeight } from '../data/typography.js'

// ---------- uploaded fonts (FontFace API) ----------

const registered = new Map() // alias -> Promise

// CSS family used for an uploaded font: one alias per font, so two fonts with the same
// family name never clash.
export const uploadAlias = (id) => `font-${id}`

// Registers every weight file of an uploaded font with the FontFace API.
export function registerUploadedFont(alias, weights) {
  if (registered.has(alias)) return registered.get(alias)
  const promise = Promise.all(
    weights
      .filter((weight) => weight.file)
      .map(async (weight) => {
        const face = new FontFace(alias, await weight.file.arrayBuffer(), {
          weight: String(weight.weight),
          style: weight.italic ? 'italic' : 'normal',
        })
        await face.load()
        document.fonts.add(face)
      }),
  ).catch((error) => {
    registered.delete(alias)
    console.error('Could not register font', error)
  })
  registered.set(alias, promise)
  return promise
}

export function unregisterUploadedFont(alias) {
  registered.delete(alias)
  document.fonts.forEach((face) => {
    if (face.family === alias || face.family === `"${alias}"`) document.fonts.delete(face)
  })
}

// ---------- Google fonts (CSS API) ----------

const loadedLinks = new Set()

function addStylesheet(href) {
  if (loadedLinks.has(href)) return
  loadedLinks.add(href)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

const familyParam = (family) => encodeURIComponent(family).replace(/%20/g, '+')

// A family with all the weights and styles given: [{ weight, italic }].
export function loadGoogleFamily(family, weights) {
  const axes = [...new Set(weights.map((weight) => `${weight.italic ? 1 : 0},${weight.weight}`))]
    .sort((a, b) => {
      const [ai, aw] = a.split(',').map(Number)
      const [bi, bw] = b.split(',').map(Number)
      return ai - bi || aw - bw
    })
    .join(';')
  const spec = axes ? `${familyParam(family)}:ital,wght@${axes}` : familyParam(family)
  addStylesheet(`https://fonts.googleapis.com/css2?family=${spec}&display=swap`)
}

// Only the letters of the family name: small and fast, used by the picker rows.
export function loadGooglePreview(family) {
  addStylesheet(
    `https://fonts.googleapis.com/css2?family=${familyParam(family)}&text=${encodeURIComponent(family)}&display=swap`,
  )
}

// ---------- hook ----------

// CSS font-family and weight of a font item (or draft) for its "Aa" preview. Uploaded
// fonts are registered from their stored files; Google fonts load from the CSS API.
export function useFontPreview(font, selected) {
  const [ready, setReady] = useState(false)
  const alias = font && font.source === 'upload' ? uploadAlias(font.id) : null

  useEffect(() => {
    let cancelled = false
    setReady(false)
    if (!font) return undefined
    if (font.source === 'upload') {
      registerUploadedFont(alias, font.weights).then(() => !cancelled && setReady(true))
    } else {
      loadGoogleFamily(font.family, font.weights)
      setReady(true)
    }
    return () => {
      cancelled = true
    }
    // The font is identified by its id and family; weights never change after saving.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [font && font.id, font && font.family])

  if (!font) return { fontFamily: 'inherit', weight: 600, italic: false, ready }
  const chosen = selected && selected.length ? font.weights.filter((w) => selected.includes(`${w.weight}${w.italic ? 'i' : ''}`)) : font.weights
  const preview = previewWeight(chosen)
  return {
    fontFamily: alias ? `"${alias}", Inter, sans-serif` : `"${font.family}", Inter, sans-serif`,
    weight: preview.weight,
    italic: preview.italic,
    ready,
  }
}

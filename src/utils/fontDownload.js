import { zipSync } from 'fflate'
import { styleName } from '../data/typography.js'
import { saveBlob } from './download.js'

const compact = (text) => text.replace(/\s+/g, '')
const safe = (name) => name.replace(/[\\/:*?"<>|]/g, '-').trim() || 'fonte'

// File name of a Google font weight: "OpenSans-BoldItalic.woff2".
export const googleFileName = (family, weight) =>
  `${compact(family)}-${compact(styleName(weight.weight, weight.italic))}.woff2`

// Fetches the font file of one weight and style through the Google Fonts CSS2 API: the CSS
// lists one file per unicode range ("subset"); the latin one is used.
export async function fetchGoogleWeight(family, weight) {
  const name = encodeURIComponent(family).replace(/%20/g, '+')
  const css = await (
    await fetch(`https://fonts.googleapis.com/css2?family=${name}:ital,wght@${weight.italic ? 1 : 0},${weight.weight}&display=swap`)
  ).text()
  const blocks = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)]
  // Only the blocks of the requested style and weight count (a range such as "100 900" covers
  // it too): never the file of another weight or of the other style.
  const matching = blocks.filter((match) => {
    const body = match[2]
    const style = /font-style:\s*(\w+)/.exec(body)
    const range = /font-weight:\s*(\d+)(?:\s+(\d+))?/.exec(body)
    if (style && (style[1] === 'italic') !== Boolean(weight.italic)) return false
    if (range) {
      const low = Number(range[1])
      const high = Number(range[2] || range[1])
      if (weight.weight < low || weight.weight > high) return false
    }
    return true
  })
  const block = matching.find((match) => match[1] === 'latin') || matching[matching.length - 1]
  const url = block && /url\((https:[^)]+)\)/.exec(block[2])
  if (!url) throw new Error(`No file for ${family} ${weight.weight}${weight.italic ? ' italic' : ''}`)
  const response = await fetch(url[1])
  if (!response.ok) throw new Error('Font file could not be fetched')
  return new Blob([await response.blob()], { type: 'font/woff2' })
}

const sameStyle = (a, b) => a.weight === b.weight && Boolean(a.italic) === Boolean(b.italic)

// The stored weight of the font with exactly this weight AND style (normal or italic).
function storedWeight(font, weight) {
  return font.weights.find((item) => sameStyle(item, weight)) || null
}

// "Download peso": ONLY the weight and style of the row. An uploaded font gives the stored file
// of that weight and style (original name); a Google font gives the file fetched for that
// weight and style as "[Family]-[Style].woff2". It fails, and the button says so, when that
// exact file is not there; it never falls back to another weight or to the whole family.
export async function downloadWeight(font, weight) {
  if (font.source === 'upload') {
    const stored = storedWeight(font, weight)
    if (!stored || !stored.file) throw new Error(`No file for ${weight.weight}${weight.italic ? ' italic' : ''}`)
    saveBlob(stored.file, stored.file.name)
    return
  }
  saveBlob(await fetchGoogleWeight(font.family, weight), googleFileName(font.family, weight))
}

// "[family].zip" with every given weight. Weights whose file cannot be found are skipped;
// it fails only when nothing could be added.
export async function downloadFamily(font, weights) {
  const entries = {}
  await Promise.all(
    weights.map(async (weight) => {
      try {
        if (font.source === 'upload') {
          if (!weight.file) return
          entries[weight.file.name] = new Uint8Array(await weight.file.arrayBuffer())
        } else {
          const blob = await fetchGoogleWeight(font.family, weight)
          entries[googleFileName(font.family, weight)] = new Uint8Array(await blob.arrayBuffer())
        }
      } catch (error) {
        console.error('Could not add a weight to the zip', error)
      }
    }),
  )
  if (Object.keys(entries).length === 0) throw new Error('No font files to download')
  saveBlob(new Blob([zipSync(entries)], { type: 'application/zip' }), `${safe(font.family)}.zip`)
}

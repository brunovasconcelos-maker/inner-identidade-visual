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
  const block = blocks.find((match) => match[1] === 'latin') || blocks[blocks.length - 1]
  const url = block && /url\((https:[^)]+)\)/.exec(block[2])
  if (!url) throw new Error(`No file for ${family} ${weight.weight}${weight.italic ? ' italic' : ''}`)
  const response = await fetch(url[1])
  if (!response.ok) throw new Error('Font file could not be fetched')
  return new Blob([await response.blob()], { type: 'font/woff2' })
}

// "Download peso": the stored file of an uploaded font (original name), or the file fetched
// from Google as "[Family]-[Style].woff2".
export async function downloadWeight(font, weight) {
  if (font.source === 'upload') {
    if (weight.file) saveBlob(weight.file, weight.file.name)
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

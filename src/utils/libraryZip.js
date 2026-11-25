import { strToU8, zipSync } from 'fflate'
import { loadFullSet } from '../icon-libraries/sets.js'

// Zip with ALL the icons of a library in one style, one SVG per icon ("[icon-name].svg").
export async function buildLibraryZip(library, styleLabel) {
  const files = {}
  for (const [name, svg] of await loadFullSet(library, styleLabel)) files[`${name}.svg`] = strToU8(svg)
  return new Blob([zipSync(files)], { type: 'application/zip' })
}

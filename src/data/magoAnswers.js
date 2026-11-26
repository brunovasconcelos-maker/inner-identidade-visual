import { normalize, formatFileSize } from '../utils/format.js'
import { buildOriginalLogosZip } from '../utils/download.js'
import { sortLogos } from './logoTypes.js'

// MOCK of the Mago AI. Replace answerFor() with a real call later: it receives the user
// text and the identity and resolves with an answer object the chat knows how to render:
//   { kind: 'logos', logos, zip: null, zipPromise: Promise<{ blob, fileName, sizeLabel }> | null }
//   (the zip is built when the answer is created; the chat shows a skeleton until it is ready)
//   { kind: 'noLogos' }
//   { kind: 'unknown', text }

export const UNKNOWN_TEXT =
  'Ainda estou aprendendo a buscar esse tipo de conteúdo. Por enquanto, posso te ajudar a encontrar suas logos.'

// "logo", "logos", "logotipo(s)", "logomarca(s)": a word that starts with "logo".
export function matchesLogoIntent(text) {
  return /\blogo/.test(normalize(text))
}

export async function answerFor(text, identity) {
  if (!matchesLogoIntent(text)) return { kind: 'unknown', text: UNKNOWN_TEXT }
  // Original files only (monochrome versions are not included), ordered by type.
  const logos = sortLogos(identity.logos || []).map((logo) => ({
    id: logo.id,
    type: logo.type,
    file: logo.file,
    fileName: logo.fileName,
  }))
  if (logos.length === 0) return { kind: 'noLogos' }
  const zipPromise =
    logos.length > 1
      ? buildOriginalLogosZip(logos).then((blob) => ({
          blob,
          fileName: 'Logos.zip',
          sizeLabel: formatFileSize(blob.size),
        }))
      : null
  return { kind: 'logos', logos, zip: null, zipPromise }
}

import { normalize, formatFileSize } from '../utils/format.js'
import { buildOriginalLogosZip } from '../utils/download.js'
import { sortLogos } from './logoTypes.js'
import { CATEGORIES, CATEGORY_ORDER, sortColors, sortTones } from './palette.js'

// MOCK of the Mago AI. Replace answerFor() with a real call later: it receives the user
// text and the identity and resolves with an answer object the chat knows how to render:
//   { kind: 'logos', logos, zip: null, zipPromise: Promise<{ blob, fileName, sizeLabel }> | null }
//   (the zip is built when the answer is created; the chat shows a skeleton until it is ready)
//   { kind: 'noLogos' }
//   { kind: 'unknown', text }
//   { kind: 'blocks', blocks }  (the color answers; see blocksFor)
//
// blocksFor(answer) turns any answer into the lines the chat plays one after the other:
//   { type: 'text', segments: [{ t, b? }], link?: { label, slug } }
//   { type: 'chips', chips: [{ hex, name? }] }
//   { type: 'tiles', logos }
//   { type: 'zip' }

export const UNKNOWN_TEXT =
  'Ainda estou aprendendo a buscar esse tipo de conteúdo. Por enquanto, posso te ajudar a encontrar suas logos.'

// "logo", "logos", "logotipo(s)", "logomarca(s)": a word that starts with "logo".
export function matchesLogoIntent(text) {
  return /\blogo/.test(normalize(text))
}

const plain = (t) => ({ type: 'text', segments: [{ t }] })

export function blocksFor(answer) {
  if (answer.kind === 'blocks') return answer.blocks
  if (answer.kind === 'logos') {
    return [
      { type: 'text', segments: [{ t: 'Segue todas as logos que encontrei em' }], link: { label: 'Logos', slug: 'logo' } },
      { type: 'tiles', logos: answer.logos },
      ...(answer.logos.length > 1 ? [plain('Ou baixe todas juntas'), { type: 'zip' }] : []),
    ]
  }
  if (answer.kind === 'noLogos') {
    return [
      { type: 'text', segments: [{ t: 'Você ainda não adicionou nenhuma logo.' }], link: { label: 'Adicionar logo', slug: 'logo' } },
    ]
  }
  return [plain(answer.text)]
}

// ---------- colors ----------

const COLOR_FOLDER = 'paleta-de-cores'
const NUMBER_WORDS = { 1: 'uma', 2: 'duas', 3: 'três', 4: 'quatro', 5: 'cinco', 6: 'seis', 7: 'sete', 8: 'oito', 9: 'nove' }
const upper = (hex) => String(hex).toUpperCase()

// Wording of each category: "A cor [singular] é", "As cores [plural] são", "uma cor [missing]".
const CATEGORY_WORDS = {
  marca: { singular: 'da marca', plural: 'da marca', missing: 'da marca' },
  primaria: { singular: 'primária', plural: 'primárias', missing: 'primária' },
  secundaria: { singular: 'secundária', plural: 'secundárias', missing: 'secundária' },
}

// Which color answer a message asks for, or null. The logo intent is checked before this.
export function colorIntent(text) {
  const normalized = normalize(text)
  if (/\bcor (principal )?da marca\b/.test(normalized)) return 'marca'
  if (/\bprimarias?\b/.test(normalized)) return 'primaria'
  if (/\bsecundarias?\b/.test(normalized)) return 'secundaria'
  if (/\b(cor|cores|paleta)\b/.test(normalized)) return 'paleta'
  return null
}

const addColorLink = { label: 'Adicionar cor', slug: COLOR_FOLDER }

// Tone chips of a color, by step (the principal color included).
function toneChips(color) {
  const tones = sortTones(color.tones || [])
  return (tones.length > 0 ? tones : [{ hex: color.hex }]).map((tone) => ({ hex: upper(tone.hex) }))
}

function categoryAnswer(categoryId, identity) {
  const words = CATEGORY_WORDS[categoryId]
  const colors = sortColors((identity.paleta || []).filter((color) => color.category === categoryId))
  if (colors.length === 0) {
    return {
      kind: 'blocks',
      blocks: [
        { type: 'text', segments: [{ t: `Você ainda não adicionou uma cor ${words.missing}.` }], link: addColorLink },
      ],
    }
  }
  if (colors.length === 1) {
    const [color] = colors
    const chips = toneChips(color)
    return {
      kind: 'blocks',
      blocks: [
        { type: 'text', segments: [{ t: `A cor ${words.singular} é ` }, { t: color.name, b: true }, { t: ':' }] },
        { type: 'chips', chips: [{ hex: upper(color.hex) }] },
        plain(`A paleta completa é composta por ${NUMBER_WORDS[chips.length] || chips.length} ${chips.length === 1 ? 'cor' : 'cores'}:`),
        { type: 'chips', chips },
      ],
    }
  }
  // Several colors: "A, B e C", then one line with the tones of each.
  const segments = [{ t: `As cores ${words.plural} são ` }]
  colors.forEach((color, index) => {
    if (index > 0) segments.push({ t: index === colors.length - 1 ? ' e ' : ', ' })
    segments.push({ t: color.name, b: true })
  })
  segments.push({ t: '.' })
  return {
    kind: 'blocks',
    blocks: [
      { type: 'text', segments },
      ...colors.flatMap((color) => [
        { type: 'text', segments: [{ t: color.name, b: true }, { t: ':' }] },
        { type: 'chips', chips: toneChips(color) },
      ]),
    ],
  }
}

function paletteAnswer(identity) {
  const colors = sortColors(identity.paleta || [])
  if (colors.length === 0) {
    return {
      kind: 'blocks',
      blocks: [{ type: 'text', segments: [{ t: 'Você ainda não adicionou cores à paleta.' }], link: addColorLink }],
    }
  }
  const blocks = [plain(`A paleta de ${identity.name} tem estas cores:`)]
  for (const categoryId of CATEGORY_ORDER) {
    const inCategory = colors.filter((color) => color.category === categoryId)
    if (inCategory.length === 0) continue
    blocks.push({ type: 'text', segments: [{ t: CATEGORIES[categoryId].rowLabel, b: true }] })
    blocks.push({ type: 'chips', chips: inCategory.map((color) => ({ hex: upper(color.hex), name: color.name })) })
  }
  return { kind: 'blocks', blocks }
}

export async function answerFor(text, identity) {
  if (!matchesLogoIntent(text)) {
    const color = colorIntent(text)
    if (color === 'paleta') return paletteAnswer(identity)
    if (color) return categoryAnswer(color, identity)
    return { kind: 'unknown', text: UNKNOWN_TEXT }
  }
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

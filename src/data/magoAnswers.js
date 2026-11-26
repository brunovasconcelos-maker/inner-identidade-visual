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
//   { kind: 'blocks', blocks, category? }  (the color answers; see blocksFor)
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
const upper = (hex) => String(hex).toUpperCase()

// Wording of each category: "A cor [singular] é", "As cores [plural] são", "uma cor [missing]".
const CATEGORY_WORDS = {
  marca: { singular: 'da marca', plural: 'da marca', missing: 'da marca' },
  primaria: { singular: 'primária', plural: 'primárias', missing: 'primária' },
  secundaria: { singular: 'secundária', plural: 'secundárias', missing: 'secundária' },
}

export const ASK_WHICH_COLOR_TEXT =
  'De qual cor você quer ver os tons? Cor da marca, primária ou secundária?'

// Which color answer a message asks for, or null. The logo intent is checked before this.
//   'marca' | 'primaria' | 'secundaria' | 'tons' (a follow-up about tones) | 'paleta' (all colors)
export function colorIntent(text) {
  const normalized = normalize(text)
  if (/\bcor da marca\b|\bcor principal\b|\bcor mais importante\b/.test(normalized)) return 'marca'
  if (/\bprimarias?\b/.test(normalized)) return 'primaria'
  if (/\bsecundarias?\b/.test(normalized)) return 'secundaria'
  if (/\b(tons?|derivad\w*|complementar\w*|variacao|variacoes)\b/.test(normalized)) return 'tons'
  if (/\b(cor|cores|paleta)\b/.test(normalized)) return 'paleta'
  return null
}

// The color category of the last color answer the Mago gave in the conversation, if any.
function lastColorCategory(messages) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message.role === 'mago' && message.answer?.category) return message.answer.category
  }
  return null
}

const addColorLink = { label: 'Adicionar cor', slug: COLOR_FOLDER }

// Chips with the tones of a color, by step. The principal tone is marked.
function toneChips(color) {
  const tones = sortTones(color.tones || [])
  if (tones.length === 0) return [{ hex: upper(color.hex), main: true }]
  return tones.map((tone) => ({ hex: upper(tone.hex), step: tone.step, main: Boolean(tone.isMain) }))
}

// The blocks of one category: only its colors and their derived tones.
function categoryBlocks(categoryId, colors) {
  const words = CATEGORY_WORDS[categoryId]
  if (colors.length === 1) {
    const [color] = colors
    return [
      { type: 'text', segments: [{ t: `A cor ${words.singular} é ` }, { t: color.name, b: true }, { t: ':' }] },
      { type: 'chips', chips: [{ hex: upper(color.hex) }] },
      plain('Os tons derivados dela são:'),
      { type: 'chips', chips: toneChips(color) },
    ]
  }
  // Several colors: "A e B" (or "A, B e C"), then one line with the tones of each.
  const segments = [{ t: `As cores ${words.plural} são ` }]
  colors.forEach((color, index) => {
    if (index > 0) segments.push({ t: index === colors.length - 1 ? ' e ' : ', ' })
    segments.push({ t: color.name, b: true })
  })
  segments.push({ t: '.' })
  return [
    { type: 'text', segments },
    ...colors.flatMap((color) => [
      { type: 'text', segments: [{ t: color.name, b: true }, { t: ':' }] },
      { type: 'chips', chips: toneChips(color) },
    ]),
  ]
}

const colorsOf = (identity, categoryId) =>
  sortColors((identity.paleta || []).filter((color) => color.category === categoryId))

// `category` is remembered so a later "e os tons?" knows which colors it is about.
function categoryAnswer(categoryId, identity) {
  const colors = colorsOf(identity, categoryId)
  if (colors.length === 0) {
    return {
      kind: 'blocks',
      category: categoryId,
      blocks: [
        {
          type: 'text',
          segments: [{ t: `Você ainda não adicionou uma cor ${CATEGORY_WORDS[categoryId].missing}.` }],
          link: addColorLink,
        },
      ],
    }
  }
  return { kind: 'blocks', category: categoryId, blocks: categoryBlocks(categoryId, colors) }
}

// Every category, each in the format of the category answers. Empty categories are skipped.
function paletteAnswer(identity) {
  const blocks = CATEGORY_ORDER.flatMap((categoryId) => {
    const colors = colorsOf(identity, categoryId)
    return colors.length > 0 ? categoryBlocks(categoryId, colors) : []
  })
  if (blocks.length === 0) {
    return {
      kind: 'blocks',
      blocks: [{ type: 'text', segments: [{ t: 'Você ainda não adicionou cores à paleta.' }], link: addColorLink }],
    }
  }
  return { kind: 'blocks', blocks }
}

// `history` are the messages of the conversation so far (used by the tones follow-up).
export async function answerFor(text, identity, history = []) {
  if (!matchesLogoIntent(text)) {
    const color = colorIntent(text)
    if (color === 'paleta') return paletteAnswer(identity)
    if (color === 'tons') {
      const last = lastColorCategory(history)
      return last ? categoryAnswer(last, identity) : { kind: 'unknown', text: ASK_WHICH_COLOR_TEXT }
    }
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

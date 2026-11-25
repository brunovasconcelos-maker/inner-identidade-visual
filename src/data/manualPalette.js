import { CATEGORY_ORDER, mainStepFor } from './palette.js'

// ---------- contrast (WCAG 2.1) ----------

function relativeLuminance(hex) {
  const value = parseInt(hex.replace('#', ''), 16)
  const channel = (c) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel((value >> 16) & 255) + 0.7152 * channel((value >> 8) & 255) + 0.0722 * channel(value & 255)
}

export function contrastRatio(a, b) {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// Black or white, whichever has the higher contrast against the swatch, with the rating of
// that contrast: AAA from 7:1, AA from 4.5:1, "AA grande" from 3:1, "Baixo contraste" below.
export function inkFor(hex) {
  const white = contrastRatio(hex, '#FFFFFF')
  const black = contrastRatio(hex, '#000000')
  const ratio = Math.max(white, black)
  const rating = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA grande' : 'Baixo contraste'
  return { ink: white >= black ? '#FFFFFF' : '#000000', ratio, rating }
}

// ---------- tones ----------

export const upperHex = (hex) => `#${String(hex).replace('#', '').toUpperCase()}`

// The principal tone (isMain) and the other saved tones by step, as saved: nothing is
// recalculated. A color saved without tones shows only its main color.
export function toneRows(color) {
  const tones = Array.isArray(color.tones) ? color.tones : []
  const main = tones.find((tone) => tone.isMain) || { step: mainStepFor(color.hex), hex: color.hex }
  const others = tones.filter((tone) => tone !== main && !tone.isMain).sort((a, b) => a.step - b.step)
  return { main, others }
}

// Colors of one category, oldest first.
export function colorsOfCategory(identity, category) {
  return identity.paleta
    .filter((color) => color.category === category)
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
}

export const visibleCategories = (identity) =>
  CATEGORY_ORDER.filter((category) => identity.paleta.some((color) => color.category === category))

// ---------- texts ----------

export const PALETTE_INTRO = (marca) => [
  `As cores são uma das formas mais rápidas de reconhecer uma marca. A paleta de ${marca} está organizada em três níveis, da cor mais representativa às cores de apoio, para que cada peça mantenha a identidade e ainda tenha flexibilidade.`,
  'Use as cores sempre a partir dos códigos deste manual. Pequenas variações de tom, mesmo que pareçam iguais, enfraquecem o reconhecimento da marca ao longo do tempo.',
]

// Titles of the category texts of the manual (the texts themselves are editable, see
// paletteTexts.js).
export const CATEGORY_TITLES = {
  marca: 'Cor da marca',
  primaria: 'Paleta primária',
  secundaria: 'Paleta secundária',
}

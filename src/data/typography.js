// Font types of an identity: one font per type.
export const FONT_TYPES = [
  {
    id: 'principal',
    label: 'Tipografia principal',
    short: 'Principal',
    description: 'Fonte usada em títulos e peças de maior impacto.',
  },
  {
    id: 'secundaria',
    label: 'Tipografia secundária',
    short: 'Secundária',
    description: 'Ideal pra textos corridos, com foco em legibilidade.',
  },
  {
    id: 'digital',
    label: 'Digital/fallback',
    short: 'Digital',
    description: 'Fonte de apoio para onde a fonte principal não carrega.',
  },
]

export const findFontType = (id) => FONT_TYPES.find((type) => type.id === id)
export const usedFontTypes = (fonts) => new Set(fonts.map((font) => font.type))
// True while at least one of the three types is still free in the identity.
export const hasFreeFontType = (fonts) => {
  const used = usedFontTypes(fonts)
  return FONT_TYPES.some((type) => !used.has(type.id))
}

// Fonts in the order of the types.
export function sortFonts(fonts) {
  const rank = (font) => FONT_TYPES.findIndex((type) => type.id === font.type)
  return [...fonts].sort((a, b) => rank(a) - rank(b))
}

// ---------- weights ----------

// Weight names follow the market standard, an exception to the sentence case rule.
const WEIGHT_NAMES = {
  100: 'Thin',
  200: 'ExtraLight',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'Semibold',
  700: 'Bold',
  800: 'Extrabold',
  900: 'Black',
}

// CSS weight of a font file, rounded to the nearest hundred between 100 and 900.
export const normalizeWeight = (value) =>
  Math.min(900, Math.max(100, Math.round((Number(value) || 400) / 100) * 100))

// Style name of a weight, e.g. "Regular", "Bold Italic".
export const styleName = (weight, italic) => `${WEIGHT_NAMES[weight] || weight}${italic ? ' Italic' : ''}`

export const weightLabel = (weight, italic) =>
  `${WEIGHT_NAMES[weight] || weight} ${weight}${italic ? ' Italic' : ''}`

export const makeWeight = (weight, italic, extra = {}) => ({
  name: weightLabel(weight, italic),
  weight,
  italic,
  ...extra,
})

// Identifies a weight inside a font ("400", "400i").
export const weightKey = (weight) => `${weight.weight}${weight.italic ? 'i' : ''}`

// By weight, normal before italic.
export function sortWeights(weights) {
  return [...weights].sort((a, b) => a.weight - b.weight || Number(a.italic) - Number(b.italic))
}

export const pesosLabel = (count) => (count === 1 ? '1 peso' : `${count} pesos`)

// Weight the "Aa" preview uses: semibold if the font has it, else the closest one
// among the chosen weights (normal style first).
export function previewWeight(weights) {
  const pool = weights.filter((weight) => !weight.italic)
  const list = pool.length ? pool : weights
  if (list.length === 0) return { weight: 600, italic: false }
  return list.reduce((best, weight) =>
    Math.abs(weight.weight - 600) < Math.abs(best.weight - 600) ? weight : best,
  )
}

// Tags pre-filled in the advanced options: "Tipografia", the family and the short type.
export const defaultFontTags = (family, typeId) => [
  'Tipografia',
  family,
  findFontType(typeId).short,
]

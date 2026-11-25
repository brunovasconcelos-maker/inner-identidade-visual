import { FONT_TYPES, sortWeights, weightKey } from './typography.js'

export const TYPOGRAPHY_INTRO = (marca) => [
  `A tipografia é a voz visual de ${marca}. As fontes escolhidas e a forma como são combinadas ajudam a marca a comunicar com personalidade, clareza e consistência em todas as peças.`,
  'Use apenas as fontes e os pesos definidos neste manual. Trocar fontes, mesmo por outras parecidas, muda o tom da comunicação e enfraquece a identidade da marca.',
]

export const FONT_SECTION_TITLES = {
  principal: 'Tipografia principal',
  secundaria: 'Tipografia secundária',
  digital: 'Digital/fallback',
}

// Font types of the identity that have a font, in order: principal, secundária, digital.
export const visibleFontTypes = (identity) =>
  FONT_TYPES.filter((type) => identity.tipografia.some((font) => font.type === type.id)).map((type) => type.id)

// The selected weights of a font (italics included), by weight, each normal style followed
// by its italic.
export function selectedWeights(font) {
  const keys = Array.isArray(font.selectedWeights) ? font.selectedWeights : []
  const chosen = font.weights.filter((weight) => keys.includes(weightKey(weight)))
  return sortWeights(chosen.length > 0 ? chosen : font.weights)
}

// The weight the family name uses in the hero: Regular 400, or the closest selected one
// (normal style first).
export function heroWeight(weights) {
  const pool = weights.filter((weight) => !weight.italic)
  const list = pool.length > 0 ? pool : weights
  return list.reduce((best, weight) => (Math.abs(weight.weight - 400) < Math.abs(best.weight - 400) ? weight : best))
}

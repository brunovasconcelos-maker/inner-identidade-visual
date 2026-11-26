import { toneRows, colorsOfCategory } from './manualPalette.js'
import { principalHex } from './manualIcon.js'
import { sortColors } from './palette.js'
import { sortLogos } from './logoTypes.js'

// Intro text of the Intro page, under the hero.
export const INTRO_TEXT = (marca) => [
  `Este é o manual da marca ${marca}. Aqui você encontra tudo o que precisa para aplicar a identidade visual com consistência: logos, cores, tipografia e os demais elementos da marca.`,
  'Use este manual como referência sempre que for criar uma peça. Na dúvida, siga as orientações de cada seção e use sempre os arquivos originais disponíveis para download.',
]

// Short text of each topic card.
export const TOPIC_TEXTS = {
  logo: 'Versões, área de proteção e usos corretos.',
  icone: 'Variantes, tamanho mínimo e aplicações.',
  'paleta-de-cores': 'Cores da marca, códigos e tons.',
  tipografia: 'Fontes, pesos e quando usar cada uma.',
  elementos: 'Padrões, ilustrações e recursos visuais.',
  'biblioteca-de-icones': 'Estilo e ícones para download.',
  fotografia: 'Estilo, luz e clima das imagens.',
  'tom-de-voz': 'Como a marca fala e o que evitar.',
  personalidade: 'Os traços que definem a marca.',
}

export const HERO_FALLBACK_BACKGROUND = '#F7F7F7'

// The logo of the hero: the principal one, otherwise the first in type order.
export const heroLogo = (identity) => sortLogos(identity.logos)[0] || null

// Stripes of the Paleta de cores card: every tone of the brand color by step (its principal
// tone included); without a brand color, the first color that exists. A color saved without
// tones is a single stripe.
export function paletteStripes(identity) {
  const colors = sortColors(identity.paleta)
  const color = colors.find((item) => item.category === 'marca') || colors[0]
  if (!color) return []
  const { main, others } = toneRows(color)
  const tones = [...others, main].sort((a, b) => a.step - b.step)
  return tones.map((tone) => `#${String(tone.hex).replace('#', '').toUpperCase()}`)
}

// The principal font of the Tipografia card (the first one when there is no principal).
export const principalFont = (identity) =>
  identity.tipografia.find((font) => font.type === 'principal') || identity.tipografia[0] || null

// Background of the Tipografia card: the first secondary color, then the first primary,
// then the brand color. Null without any palette color.
export function typographyBackground(identity) {
  for (const category of ['secundaria', 'primaria', 'marca']) {
    const [first] = colorsOfCategory(identity, category)
    if (first) return principalHex(first)
  }
  return null
}

// Background of the Biblioteca de ícones card: the second secondary color, otherwise any other
// palette color that is not the Tipografia card one. Null when there is none.
export function libraryBackground(identity) {
  const second = colorsOfCategory(identity, 'secundaria')[1]
  if (second) return principalHex(second)
  const taken = typographyBackground(identity)
  const other = sortColors(identity.paleta)
    .map((color) => principalHex(color))
    .find((hex) => hex !== taken)
  return other || null
}

// The three weights shown by the Tipografia card: the lightest, one in the middle and the
// boldest of the selected weights (repeated when there are fewer than three).
export function pickCardWeights(weights) {
  if (weights.length === 0) return []
  const last = weights.length - 1
  return [weights[0], weights[Math.floor(last / 2)], weights[last]]
}

import { luminance, sortColors, toneHex } from './palette.js'
import { sortLogos } from './logoTypes.js'

// Neutral selection colors used when the identity has no brand color.
const NEUTRAL = { background: '#EFEFEF', foreground: '#1A1A1A' }

const contrastOnWhite = (hex) => 1.05 / (luminance(hex) + 0.05)

// Logo for the wide header slot: the horizontal one, otherwise the one with the widest
// aspect ratio (width / height). Ties and missing sizes fall back to the type order.
export function headerLogo(identity) {
  const ordered = sortLogos(identity.logos)
  const horizontal = ordered.find((logo) => logo.type === 'horizontal')
  if (horizontal) return horizontal
  const ratio = (logo) => (logo.width && logo.height ? logo.width / logo.height : 0)
  return ordered.reduce((best, logo) => (best === null || ratio(logo) > ratio(best) ? logo : best), null)
}

// Colors of every selected state in the manual, from the "Cor da marca":
// background = its tone 100; icon and sub option text = its main hex, or the darkest
// existing tone that reaches 4.5:1 against white when the main hex does not.
export function selectionColors(identity) {
  const brand = sortColors(identity.paleta).find((color) => color.category === 'marca')
  if (!brand) return NEUTRAL
  const tones = brand.tones && brand.tones.length > 0 ? brand.tones : [{ step: 500, hex: brand.hex }]
  const light = tones.find((tone) => tone.step === 100)
  const background = light ? light.hex : toneHex(brand.hex, 100)
  let foreground = brand.hex
  if (contrastOnWhite(foreground) < 4.5) {
    const passing = tones
      .filter((tone) => contrastOnWhite(tone.hex) >= 4.5)
      .sort((a, b) => luminance(a.hex) - luminance(b.hex))
    foreground = passing.length > 0 ? passing[0].hex : NEUTRAL.foreground
  }
  return { background, foreground }
}

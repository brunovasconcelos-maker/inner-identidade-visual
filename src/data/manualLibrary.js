import { toneHex } from './palette.js'
import { principalHex } from './manualIcon.js'

export const LIBRARY_INTRO = (marca) => [
  `Os ícones ajudam ${marca} a comunicar de forma rápida e visual, guiando a leitura em sites, aplicativos, apresentações e peças digitais. Usar sempre a mesma biblioteca e o mesmo estilo mantém a comunicação organizada e consistente.`,
  'Escolha os ícones apenas da biblioteca definida neste manual. Misturar ícones de bibliotecas ou estilos diferentes, mesmo que pareçam parecidos, quebra a unidade visual da marca.',
]

export const HERO_FALLBACK = { background: '#F7F7F7', ink: '#1A1A1A' }

// Colors of the hero: background = tone 100 of the brand color, icons = its principal hex.
// Without a brand color: #F7F7F7 and #1A1A1A.
export function heroColors(palette) {
  const brand = palette.find((color) => color.category === 'marca')
  if (!brand) return HERO_FALLBACK
  const ink = principalHex(brand)
  const tone = (Array.isArray(brand.tones) ? brand.tones : []).find((item) => item.step === 100)
  return { background: tone ? `#${String(tone.hex).replace('#', '').toUpperCase()}` : toneHex(ink, 100), ink }
}

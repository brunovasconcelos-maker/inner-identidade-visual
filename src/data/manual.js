import {
  AppleLogo,
  Camera,
  Flag,
  Palette,
  PuzzlePiece,
  Smiley,
  SquaresFour,
  TextAa,
  TrademarkRegistered,
  UserSound,
} from '@phosphor-icons/react'
import { LOGO_TYPES } from './logoTypes.js'
import { FONT_TYPES } from './typography.js'
import { CATEGORY_ORDER, CATEGORIES } from './palette.js'

// Sections of the brand manual, in the order of the sidebar. `key` is the folder array of
// the identity; a section shows only if that folder has at least one item ("Intro" always).
export const MANUAL_SECTIONS = [
  { slug: 'intro', label: 'Intro', Icon: Flag, key: null },
  { slug: 'logo', label: 'Logo', Icon: TrademarkRegistered, key: 'logos' },
  { slug: 'icone', label: 'Ícone', Icon: AppleLogo, key: 'icones' },
  { slug: 'paleta-de-cores', label: 'Paleta de cores', Icon: Palette, key: 'paleta' },
  { slug: 'tipografia', label: 'Tipografia', Icon: TextAa, key: 'tipografia' },
  { slug: 'elementos', label: 'Elementos', Icon: PuzzlePiece, key: 'elementos' },
  { slug: 'biblioteca-de-icones', label: 'Biblioteca de ícones', Icon: SquaresFour, key: 'bibliotecaDeIcones' },
  { slug: 'fotografia', label: 'Fotografia', Icon: Camera, key: 'fotografia' },
  { slug: 'tom-de-voz', label: 'Tom de voz', Icon: UserSound, key: 'tomDeVoz' },
  { slug: 'personalidade', label: 'Personalidade', Icon: Smiley, key: 'personalidade' },
]

// Sections that are visible for this identity.
export function visibleSections(identity) {
  return MANUAL_SECTIONS.filter((section) => !section.key || identity[section.key].length > 0)
}

// Sub options of a section, only the ones that exist: [{ id, label }].
export function subOptions(slug, identity) {
  if (slug === 'logo') {
    return LOGO_TYPES.filter((type) => identity.logos.some((logo) => logo.type === type.id)).map(
      (type) => ({ id: type.id, label: type.short }),
    )
  }
  if (slug === 'paleta-de-cores') {
    return CATEGORY_ORDER.filter((id) => identity.paleta.some((color) => color.category === id)).map(
      (id) => ({ id, label: CATEGORIES[id].cardLabel }),
    )
  }
  if (slug === 'tipografia') {
    const labels = { principal: 'Principal', secundaria: 'Secundária', digital: 'Digital/fallback' }
    return FONT_TYPES.filter((type) => identity.tipografia.some((font) => font.type === type.id)).map(
      (type) => ({ id: type.id, label: labels[type.id] }),
    )
  }
  return []
}

export function manualPath(identityId, slug, sub) {
  const base = `/manual/${identityId}`
  if (!slug || slug === 'intro') return base
  return sub ? `${base}/${slug}/${sub}` : `${base}/${slug}`
}

// Full URL of the manual (opened in a new tab). The app uses a hash router.
export function manualUrl(identityId) {
  return `${window.location.origin}${import.meta.env.BASE_URL}#/manual/${identityId}`
}

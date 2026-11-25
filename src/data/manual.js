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

// Intro text of the Logo page, under the title.
export const LOGO_INTRO = (marca) => [
  `A logo é a assinatura de ${marca} e o elemento mais importante da identidade visual. Cada versão foi pensada para um tipo de espaço e aplicação, garantindo leitura e reconhecimento em qualquer formato.`,
  'Use sempre os arquivos originais deste manual e escolha a versão que melhor se encaixa na peça. Respeitar as variantes, a área de proteção e os usos corretos mantém a marca forte e consistente.',
]

export function manualPath(identityId, slug, sub) {
  const base = `/manual/${identityId}`
  if (!slug || slug === 'intro') return base
  return sub ? `${base}/${slug}/${sub}` : `${base}/${slug}`
}

// Full URL of the manual (opened in a new tab). The app uses a hash router.
export function manualUrl(identityId) {
  return `${window.location.origin}${import.meta.env.BASE_URL}#/manual/${identityId}`
}

// Logo sections of the manual: title, download label, zip name and the size of the area
// where the logo is drawn (Figma nodes 6479:5211 and 6488:7870). `hero` is the area in the
// big preview, `box` the one in the variants and safe space boxes. Types without a Figma
// frame use the principal sizes.
const PRINCIPAL_AREAS = { hero: [324.153, 250.416], box: [255.008, 197] }
export const LOGO_SECTIONS = {
  principal: { title: 'Logo principal', download: 'logo principal', zip: 'logo-principal', ...PRINCIPAL_AREAS },
  secundaria: {
    title: 'Logo secundária',
    download: 'logo secundária',
    zip: 'logo-secundaria',
    hero: [368.493, 334.575],
    box: [237.897, 216],
  },
  vertical: { title: 'Logo vertical', download: 'logo vertical', zip: 'logo-vertical', ...PRINCIPAL_AREAS },
  horizontal: { title: 'Logo horizontal', download: 'logo horizontal', zip: 'logo-horizontal', ...PRINCIPAL_AREAS },
  tagline: { title: 'Logo com tagline', download: 'logo com tagline', zip: 'logo-tagline', ...PRINCIPAL_AREAS },
}

import { FilePlus, Package, Palette, Sparkle, TextAa } from '@phosphor-icons/react'
import { firstFreeLogoType } from './logoTypes.js'

// Folder pages of an identity. `key` is the array on the identity, `slug` the route.
// A card with `requires` is disabled until that rule is true for the identity.
const ICON = { size: 24, color: '#5d5d5d', weight: 'regular' }

const upload = (label, extra = {}) => ({
  id: 'upload',
  icon: <FilePlus {...ICON} />,
  label,
  ...extra,
})

export const FOLDERS = [
  {
    slug: 'logo',
    key: 'logos',
    title: 'Logo',
    cards: [
      upload('Adicione uma logo que você já tem', {
        action: 'upload-asset',
        disabledStyle: 'filled',
        // Disabled once all five logo types exist in the identity.
        isEnabled: (identity) => firstFreeLogoType(identity.logos) !== null,
      }),
    ],
  },
  {
    slug: 'icone',
    key: 'icones',
    title: 'Ícone',
    cards: [
      upload('Adicione um ícone que você já tem', {
        action: 'upload-asset',
        disabledStyle: 'filled',
        // An identity has a single icon: the card is disabled while it exists.
        isEnabled: (identity) => identity.icones.length === 0,
      }),
    ],
  },
  {
    slug: 'paleta-de-cores',
    key: 'paleta',
    title: 'Paleta de cores',
    cards: [
      {
        id: 'create',
        icon: <Palette {...ICON} />,
        label: 'Crie sua paleta\nde cores',
        action: 'create-palette',
      },
      {
        id: 'from-logo',
        icon: <Sparkle {...ICON} />,
        label: 'Gerar a partir\nda logo',
        // Disabled while the identity has no logo.
        isEnabled: (identity) => identity.logos.length > 0,
      },
    ],
  },
  {
    slug: 'tipografia',
    key: 'tipografia',
    title: 'Tipografia',
    cards: [
      upload('Faça upload de uma tipografia'),
      { id: 'free', icon: <TextAa {...ICON} />, label: 'Selecione uma tipografia grátis' },
    ],
  },
  {
    slug: 'elementos',
    key: 'elementos',
    title: 'Elementos',
    cards: [upload('Adicione elementos que você já tem')],
  },
  {
    slug: 'biblioteca-de-icones',
    key: 'bibliotecaDeIcones',
    title: 'Biblioteca de ícones',
    cards: [
      upload('Faça upload da sua biblioteca'),
      { id: 'free', icon: <Package {...ICON} />, label: 'Selecione uma biblioteca grátis' },
    ],
  },
  { slug: 'fotografia', key: 'fotografia', title: 'Fotografia', cards: [] },
  { slug: 'tom-de-voz', key: 'tomDeVoz', title: 'Tom de voz', cards: [] },
  { slug: 'personalidade', key: 'personalidade', title: 'Personalidade', cards: [] },
]

export function findFolder(slug) {
  return FOLDERS.find((folder) => folder.slug === slug)
}

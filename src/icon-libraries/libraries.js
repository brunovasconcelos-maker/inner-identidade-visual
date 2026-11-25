import { ICON_NAMES, EVERYDAY_COUNT } from './names.js'
import { STYLE_LOADERS } from './loaders.js'
import { ICON_COUNTS } from './counts.js'

// The five free icon libraries of the "Biblioteca de ícones" folder. Colors are the card
// tints of Figma (nodes 6512:11836): background, text and icon color.
export const ICON_LIBRARIES = [
  {
    id: 'material',
    name: 'Google Material Symbols',
    cardLabel: 'Usar Google\nMaterial Symbols',
    site: 'fonts.google.com/icons',
    styles: [
      { id: 'outlined', label: 'Outlined' },
      { id: 'rounded', label: 'Rounded' },
      { id: 'sharp', label: 'Sharp' },
    ],
    defaultStyle: 'Outlined',
    tint: '#eafbf0',
    ink: '#125428',
    iconColor: '#2acc60',
  },
  {
    id: 'remix',
    name: 'Remix Icon',
    cardLabel: 'Usar\nRemix Icon',
    site: 'remixicon.com',
    styles: [
      { id: 'line', label: 'Line' },
      { id: 'fill', label: 'Fill' },
    ],
    defaultStyle: 'Line',
    tint: '#eaf2fb',
    ink: '#123354',
    iconColor: '#5799db',
  },
  {
    id: 'phosphor',
    name: 'Phosphor Icons',
    cardLabel: 'Usar\nPhosphor Icons',
    site: 'phosphoricons.com',
    styles: [
      { id: 'thin', label: 'Thin' },
      { id: 'light', label: 'Light' },
      { id: 'regular', label: 'Regular' },
      { id: 'bold', label: 'Bold' },
      { id: 'fill', label: 'Fill' },
      { id: 'duotone', label: 'Duotone' },
    ],
    defaultStyle: 'Regular',
    tint: '#ebeafb',
    ink: '#171254',
    iconColor: '#6257db',
  },
  {
    id: 'lucide',
    name: 'Lucide Icons',
    cardLabel: 'Usar\nLucide Icons',
    site: 'lucide.dev',
    styles: [{ id: 'default', label: 'Padrão' }],
    defaultStyle: 'Padrão',
    tint: '#faf7eb',
    ink: '#524714',
    iconColor: '#d6c25c',
  },
  {
    id: 'hero',
    name: 'Hero Icons',
    cardLabel: 'Usar\nHero Icons',
    site: 'heroicons.com',
    styles: [
      { id: 'outline', label: 'Outline' },
      { id: 'solid', label: 'Solid' },
    ],
    defaultStyle: 'Outline',
    tint: '#fbeaf2',
    ink: '#541233',
    iconColor: '#db5799',
  },
]

export const findLibrary = (id) => ICON_LIBRARIES.find((library) => library.id === id)

// Style id of a style label ("Regular" -> "regular", "Padrão" -> "default").
export function styleIdOf(library, label) {
  const style = library.styles.find((item) => item.label === label) || library.styles[0]
  return style.id
}

// Address that opens in a new tab ("Baixar" of a free library).
export const libraryUrl = (library) => `https://${library.site}`

// Icon names of a library: the first EVERYDAY_COUNT are the same everyday concepts in every
// library (the folder cards use them).
export const everydayIcons = (library) => ICON_NAMES[library.id].slice(0, EVERYDAY_COUNT)
export const iconPool = (library) => ICON_NAMES[library.id]

export function normalizeSvg(raw) {
  return raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<svg\b([^>]*)>/, (match, attrs) => {
      let next = attrs.replace(/\s(?:width|height|class)="[^"]*"/g, '')
      if (!/\sfill=/.test(next) && !/\sstroke=/.test(next)) next += ' fill="currentColor"'
      return `<svg${next}>`
    })
    .trim()
}

const cache = new Map()

// Loads (once) the SVGs of one style of a library: { name: svg }. One lazy chunk each.
export function loadLibraryStyle(library, styleLabel) {
  const key = `${library.id}:${styleIdOf(library, styleLabel)}`
  if (!cache.has(key)) {
    cache.set(
      key,
      STYLE_LOADERS[key]().then((module) =>
        Object.fromEntries(Object.entries(module.default).map(([name, raw]) => [name, normalizeSvg(raw)])),
      ),
    )
  }
  return cache.get(key)
}

// Total number of icons of a library in a style.
export const iconCount = (library, styleLabel) => ICON_COUNTS[`${library.id}:${styleIdOf(library, styleLabel)}`] || 0

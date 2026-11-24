import { findLogoType } from './logoTypes.js'

// The Logo and Ícone folders share every component. This is what differs between them.
// An icon has no type and an identity holds only one.
export const ASSET_KINDS = {
  logo: {
    id: 'logo',
    key: 'logos',
    hasType: true,
    hasMono: true,
    modalTitle: 'Nova logo',
    discardTitle: 'Descartar logo?',
    zipSuffix: 'logos',
    label: (asset) => findLogoType(asset.type).label,
    deleteTitle: (count) => (count === 1 ? 'Excluir logo?' : `Excluir ${count} logos?`),
    // Pre-filled tags: "Logo", the file format and the short type name.
    autoTags: (format, type) => ['Logo', format, type.short],
    zipFolder: (asset) => findLogoType(asset.type)?.id || asset.id,
  },
  icone: {
    id: 'icone',
    key: 'icones',
    hasType: false,
    hasMono: true,
    modalTitle: 'Novo ícone',
    discardTitle: 'Descartar ícone?',
    zipSuffix: 'icone',
    label: () => 'Ícone',
    deleteTitle: (count) => (count === 1 ? 'Excluir ícone?' : `Excluir ${count} ícones?`),
    autoTags: (format) => ['Ícone', format],
    zipFolder: () => 'icone',
  },
  // Elementos: any file type, a name field, no monochrome versions, newest first.
  elemento: {
    id: 'elemento',
    key: 'elementos',
    hasType: false,
    hasMono: false,
    hasName: true,
    anyFile: true,
    newestFirst: true,
    modalTitle: 'Novo elemento',
    discardTitle: 'Descartar elemento?',
    zipSuffix: 'elementos',
    label: (asset) => asset.name,
    deleteTitle: (count) => (count === 1 ? 'Excluir elemento?' : `Excluir ${count} elementos?`),
    autoTags: (format) => ['Elemento', format],
    zipFolder: () => '',
  },
}

// Kind of a folder route slug, or undefined for folders without an asset flow yet.
export function kindForSection(section) {
  if (section === 'logo') return ASSET_KINDS.logo
  if (section === 'icone') return ASSET_KINDS.icone
  if (section === 'elementos') return ASSET_KINDS.elemento
  return undefined
}

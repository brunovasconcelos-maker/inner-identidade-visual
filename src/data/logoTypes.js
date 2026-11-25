// Logo types, in the order shown in the "Tipo de logo" panel. Descriptions are from Figma.
export const LOGO_TYPES = [
  {
    id: 'principal',
    label: 'Logo principal',
    short: 'Principal',
    description: 'A versão oficial, usada na maioria das suas peças',
  },
  {
    id: 'secundaria',
    label: 'Logo secundária',
    short: 'Secundária',
    description: 'Uma alternativa pronta pra quando a principal não encaixa',
  },
  {
    id: 'vertical',
    label: 'Logo vertical',
    short: 'Vertical',
    description: 'Ideal pra espaços estreitos, como posts e stories',
  },
  {
    id: 'horizontal',
    label: 'Logo horizontal',
    short: 'Horizontal',
    description: 'Ideal pra espaços largos, como banners e cabeçalhos',
  },
  {
    id: 'tagline',
    label: 'Com tagline',
    short: 'Tagline',
    description: 'Reforce sua mensagem com a logo e a tagline juntas',
  },
]

export function findLogoType(id) {
  return LOGO_TYPES.find((type) => type.id === id)
}

export function usedLogoTypes(logos) {
  return new Set(logos.map((logo) => logo.type))
}

// True while at least one of the five types is still free in the identity.
export function hasFreeLogoType(logos) {
  const used = usedLogoTypes(logos)
  return LOGO_TYPES.some((type) => !used.has(type.id))
}

// Logos in the order of the types: principal, secundária, vertical, horizontal, com tagline.
export function sortLogos(logos) {
  const order = (logo) => LOGO_TYPES.findIndex((type) => type.id === logo.type)
  return [...logos].sort((a, b) => order(a) - order(b))
}

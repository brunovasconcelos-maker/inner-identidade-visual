// Text of each palette category: one text per category, shared by every color of it. It is
// shown in the brand manual after the last color of the category and edited in the color
// viewer. `identity.paletteTexts[category]` is null (the default text) or the custom string.

export const PALETTE_TEXT_CATEGORIES = ['marca', 'primaria', 'secundaria']

// Default texts, both paragraphs separated by a blank line. {marca} is the identity name.
const DEFAULTS = {
  marca:
    'A cor da marca é a que mais representa {marca} à primeira vista. É ela que as pessoas associam à marca, mesmo antes de ler o nome ou ver a logo.\n\nUse em destaque nos pontos de maior impacto, como fundos de capa, botões principais, chamadas e elementos de assinatura. Para manter a força, evite dividir esse protagonismo com outras cores intensas na mesma peça.',
  primaria:
    'As cores primárias são a base visual de {marca} e aparecem na maior parte das peças. Elas sustentam a identidade no dia a dia, em layouts, textos, fundos e composições.\n\nCombine as cores primárias com a cor da marca para criar peças consistentes. Elas devem ocupar a maior parte da área das composições, deixando a cor da marca para os pontos de destaque.',
  secundaria:
    'As cores secundárias são cores de apoio, criadas para dar variedade sem perder a identidade de {marca}. Elas ajudam a diferenciar temas, campanhas, categorias e informações.\n\nUse em detalhes, ilustrações, gráficos e elementos de apoio, sempre em menor proporção que as cores primárias. Elas complementam a paleta, mas nunca substituem a cor da marca como protagonista.',
}

export const emptyPaletteTexts = () => ({ marca: null, primaria: null, secundaria: null })

// The default text of a category with the identity name in place of {marca}.
export function defaultCategoryText(identity, category) {
  return DEFAULTS[category].replaceAll('{marca}', identity.name)
}

// The text to show: the custom one, or the default (so renaming the identity updates it
// while nothing was edited).
export function categoryText(identity, category) {
  const custom = identity.paletteTexts ? identity.paletteTexts[category] : null
  return typeof custom === 'string' && custom.trim() !== '' ? custom : defaultCategoryText(identity, category)
}

// What to store after an edit: null when the field is empty or equal to the default, so the
// default (with the current identity name) comes back.
export function storedCategoryText(identity, category, text) {
  const trimmed = text.trim()
  if (trimmed === '' || trimmed === defaultCategoryText(identity, category).trim()) return null
  return text
}

// Paragraphs split on blank lines.
export const paragraphsOf = (text) => text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean)

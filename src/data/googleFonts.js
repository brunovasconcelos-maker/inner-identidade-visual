import { makeWeight, sortWeights } from './typography.js'

// The Google Fonts catalog ships as static JSON (built from the google-font-metadata npm
// package, see scripts/build-google-fonts.mjs), so no API key is needed. It loads on
// demand: [family, category, normalWeights, italicWeights].
export const GOOGLE_CATEGORIES = [
  { id: 'all', label: 'Todas' },
  { id: 'sans', label: 'Sem serifa' },
  { id: 'serif', label: 'Serifadas' },
  { id: 'display', label: 'Display' },
  { id: 'handwriting', label: 'Manuscritas' },
  { id: 'mono', label: 'Monoespaçadas' },
]

let catalog = null

export async function loadGoogleFonts() {
  if (!catalog) {
    const module = await import('./googleFonts.json')
    catalog = module.default.map(([family, category, normal, italic]) => ({
      family,
      category,
      normal,
      italic,
    }))
  }
  return catalog
}

// Weights of a family as font weights: [{ name, weight, italic }].
export const googleWeights = (entry) =>
  sortWeights([
    ...entry.normal.map((weight) => makeWeight(weight, false)),
    ...entry.italic.map((weight) => makeWeight(weight, true)),
  ])

// Page of the family on fonts.google.com.
export const googleFamilyPage = (family) =>
  `https://fonts.google.com/specimen/${encodeURIComponent(family).replace(/%20/g, '+')}`

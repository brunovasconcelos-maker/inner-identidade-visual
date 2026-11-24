// Builds src/data/googleFonts.json from the "google-font-metadata" npm package, so the app
// needs no Google API key. Run: npm install --no-save google-font-metadata && node scripts/build-google-fonts.mjs
// Each entry is [family, category, normalWeights, italicWeights].
import { readFileSync, writeFileSync } from 'node:fs'

const data = JSON.parse(
  readFileSync(
    new URL('../node_modules/google-font-metadata/data/google-fonts-v2.json', import.meta.url),
    'utf8',
  ),
)
const CATEGORY = {
  'sans-serif': 'sans',
  serif: 'serif',
  display: 'display',
  handwriting: 'handwriting',
  monospace: 'mono',
}

const families = Object.values(data)
  .map((font) => {
    const normal = []
    const italic = []
    for (const weight of font.weights) {
      const variant = font.variants[String(weight)] || {}
      if (variant.normal) normal.push(weight)
      if (variant.italic) italic.push(weight)
    }
    return [font.family, CATEGORY[font.category] || 'display', normal, italic]
  })
  .sort((a, b) => a[0].localeCompare(b[0]))

writeFileSync(new URL('../src/data/googleFonts.json', import.meta.url), JSON.stringify(families))
console.log(`${families.length} families`)

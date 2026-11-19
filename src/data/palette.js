// Color categories of the Paleta de cores folder. `rowLabel` is the label of the row in
// the category modal and the title of the color side panel.
export const CATEGORIES = {
  marca: {
    id: 'marca',
    chooserTitle: 'Cor da marca',
    modalTitle: 'Cor da marca',
    rowLabel: 'Cor da marca',
    cardLabel: 'Cor da marca',
    description: 'A cor que mais representa sua marca, à primeira vista.',
    single: true,
  },
  primaria: {
    id: 'primaria',
    chooserTitle: 'Paleta primária',
    modalTitle: 'Paleta primária',
    rowLabel: 'Primária',
    cardLabel: 'Primária',
    description: 'As cores centrais, presentes na maior parte das suas peças.',
    single: false,
  },
  secundaria: {
    id: 'secundaria',
    chooserTitle: 'Paleta secundária',
    modalTitle: 'Paleta secundária',
    rowLabel: 'Secundária',
    cardLabel: 'Secundária',
    description: 'Cores de apoio, pra dar variedade sem perder identidade.',
    single: false,
  },
}

export const CATEGORY_ORDER = ['marca', 'primaria', 'secundaria']

// Colors in the order of the grid: brand color, primary, secondary, each by creation date.
export function sortColors(colors) {
  const rank = (color) => CATEGORY_ORDER.indexOf(color.category)
  return [...colors].sort(
    (a, b) => rank(a) - rank(b) || String(a.createdAt).localeCompare(String(b.createdAt)),
  )
}

// ---------- hex and rgb ----------

// "#abc", "abc", "#AABBCC" ... to "#AABBCC", or null when it is not a valid hex.
export function parseHex(text) {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(text).trim())
  if (!match) return null
  let digits = match[1]
  if (digits.length === 3) digits = digits.replace(/./g, '$&$&')
  return `#${digits.toUpperCase()}`
}

export function hexToRgb(hex) {
  const value = parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

export function rgbToHex(r, g, b) {
  const part = (n) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0')
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase()
}

// ---------- OKLCH ----------

const toLinear = (c) => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
const fromLinear = (x) => 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055)

export function hexToOklch(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLinear)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return { L, C: Math.hypot(a, bb), h: Math.atan2(bb, a) }
}

// Linear sRGB of an OKLCH color (can be outside 0..1).
function oklchToLinear({ L, C, h }) {
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

const inGamut = (rgb) => rgb.every((v) => v >= -0.0005 && v <= 1.0005)

// OKLCH to hex. A color outside sRGB loses chroma until it fits, keeping L and hue.
export function oklchToHex(color) {
  let { C } = color
  let rgb = oklchToLinear({ ...color, C })
  if (!inGamut(rgb)) {
    let low = 0
    let high = C
    for (let i = 0; i < 24; i += 1) {
      C = (low + high) / 2
      rgb = oklchToLinear({ ...color, C })
      if (inGamut(rgb)) low = C
      else high = C
    }
    rgb = oklchToLinear({ ...color, C: low })
  }
  const [r, g, b] = rgb.map((v) => fromLinear(Math.min(1, Math.max(0, v))))
  return rgbToHex(r, g, b)
}

// ---------- tones ----------

// Target OKLCH lightness of each step, fitted on the Figma sample scale.
const TARGET_L = {
  100: 0.96,
  200: 0.88,
  300: 0.8,
  400: 0.69,
  500: 0.58,
  600: 0.48,
  700: 0.38,
  800: 0.3,
  900: 0.22,
}

export const BASE_STEPS = [100, 300, 500, 700, 900]
export const EXTRA_STEPS = [200, 400, 600, 800]
export const MAX_TONES = 9

// Step (among the base ones) whose lightness is the closest to the color's lightness.
export function mainStepFor(hex) {
  const { L } = hexToOklch(hex)
  return BASE_STEPS.reduce((best, step) =>
    Math.abs(TARGET_L[step] - L) < Math.abs(TARGET_L[best] - L) ? step : best,
  )
}

// Chroma is strongest in the mid tones and fades toward white and black.
const chromaCurve = (L) => 4 * L * (1 - L)

// Hex of a step of the scale of `mainHex`: same hue, lightness of the step and chroma
// adapted to that lightness.
export function toneHex(mainHex, step) {
  const main = hexToOklch(mainHex)
  const ratio = chromaCurve(TARGET_L[step]) / Math.max(chromaCurve(main.L), 0.05)
  const C = main.C * Math.min(1.6, Math.max(0.15, ratio))
  return oklchToHex({ L: TARGET_L[step], C, h: main.h })
}

// Tones of a main color on the given steps (the base ones by default). The main color
// itself sits, unchanged, on its step, which is always part of the result.
export function generateTones(mainHex, steps = BASE_STEPS) {
  const mainStep = mainStepFor(mainHex)
  const all = [...new Set([...steps, mainStep])].sort((a, b) => a - b)
  return all.map((step) => ({
    step,
    hex: step === mainStep ? mainHex : toneHex(mainHex, step),
    isMain: step === mainStep,
  }))
}

// Next intermediate step to add (200, 400, 600, 800), or null when there is none or the
// scale already has the maximum of tones.
export function nextExtraStep(tones) {
  if (tones.length >= MAX_TONES) return null
  const present = new Set(tones.map((tone) => tone.step))
  return EXTRA_STEPS.find((step) => !present.has(step)) ?? null
}

export const sortTones = (tones) => [...tones].sort((a, b) => a.step - b.step)

// ---------- contrast ----------

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// White text on dark colors, black on light ones (the one with the better contrast).
export function textColorFor(hex) {
  return luminance(hex) < 0.179 ? '#ffffff' : '#000000'
}

// Very light colors get a thin ring so they do not vanish on white.
export const isVeryLight = (hex) => luminance(hex) > 0.8

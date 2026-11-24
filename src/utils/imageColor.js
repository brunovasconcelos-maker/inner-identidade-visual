import { hexToOklch, luminance, oklchToHex } from '../data/palette.js'

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = url
  })
}

// Draws the file on a canvas whose longer side is `max` px. Returns { data, width, height,
// naturalWidth, naturalHeight }.
async function rasterize(file, max) {
  const url = URL.createObjectURL(file)
  try {
    const image = await loadImage(url)
    const naturalWidth = image.naturalWidth || 1
    const naturalHeight = image.naturalHeight || 1
    const scale = max / Math.max(naturalWidth, naturalHeight)
    const width = Math.max(1, Math.round(naturalWidth * scale))
    const height = Math.max(1, Math.round(naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    context.drawImage(image, 0, 0, width, height)
    return { data: context.getImageData(0, 0, width, height).data, width, height, naturalWidth, naturalHeight }
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Dominant color: the most present opaque color. Pixels are grouped in 4 bit per channel
// buckets (weighted by alpha); the winning bucket gives the average of its own pixels.
export async function dominantColor(file) {
  try {
    const { data } = await rasterize(file, 96)
    const buckets = new Map()
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3] / 255
      if (alpha < 0.5) continue
      const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4)
      const bucket = buckets.get(key) || { r: 0, g: 0, b: 0, weight: 0 }
      bucket.r += data[i] * alpha
      bucket.g += data[i + 1] * alpha
      bucket.b += data[i + 2] * alpha
      bucket.weight += alpha
      buckets.set(key, bucket)
    }
    let best = null
    for (const bucket of buckets.values()) if (!best || bucket.weight > best.weight) best = bucket
    if (!best) return '#000000'
    const hex = (n) => Math.round(n / best.weight).toString(16).padStart(2, '0')
    return `#${hex(best.r)}${hex(best.g)}${hex(best.b)}`
  } catch {
    return '#000000'
  }
}

// Visible bounds of an image (transparent pixels trimmed) as fractions of its natural size:
// { x0, y0, x1, y1, ratio } with ratio = natural width / natural height. An image without
// transparency, or one that cannot be read, is visible as a whole.
export async function visibleBounds(file) {
  const whole = { x0: 0, y0: 0, x1: 1, y1: 1, ratio: 1 }
  try {
    const { data, width, height, naturalWidth, naturalHeight } = await rasterize(file, 512)
    let x0 = width
    let y0 = height
    let x1 = -1
    let y1 = -1
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (data[(y * width + x) * 4 + 3] <= 8) continue
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
    const ratio = naturalWidth / naturalHeight
    if (x1 < 0) return { ...whole, ratio }
    return { x0: x0 / width, y0: y0 / height, x1: (x1 + 1) / width, y1: (y1 + 1) / height, ratio }
  } catch {
    return whole
  }
}

const contrastBetween = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// Background for "Não use sem contraste": the dominant color shifted in lightness (OKLCH)
// until the contrast ratio against it is between 1.5:1 and 2:1, aiming at the middle.
// Lighter is preferred; darker is used when no lighter shade reaches the range.
export function lowContrastBackground(dominantHex) {
  const base = hexToOklch(dominantHex)
  const search = (direction) => {
    let best = null
    for (let L = base.L; L >= 0 && L <= 1; L += direction * 0.005) {
      const hex = oklchToHex({ L, C: base.C, h: base.h })
      const ratio = contrastBetween(hex, dominantHex)
      if (ratio >= 1.5 && ratio <= 2) {
        if (!best || Math.abs(ratio - 1.75) < Math.abs(best.ratio - 1.75)) best = { hex, ratio }
      } else if (best) break
    }
    return best ? best.hex : null
  }
  return search(1) || search(-1) || dominantHex
}

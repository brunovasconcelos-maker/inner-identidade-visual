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

// Connected components (8 neighbors) of the opaque pixels. Each one: bounding box + area.
function components(mask, width, height) {
  const seen = new Uint8Array(mask.length)
  const stack = new Int32Array(mask.length)
  const list = []
  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || seen[start]) continue
    let top = 0
    stack[top++] = start
    seen[start] = 1
    let minX = width
    let maxX = -1
    let minY = height
    let maxY = -1
    let area = 0
    while (top > 0) {
      const index = stack[--top]
      const x = index % width
      const y = (index - x) / width
      area += 1
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
          const next = ny * width + nx
          if (mask[next] && !seen[next]) {
            seen[next] = 1
            stack[top++] = next
          }
        }
      }
    }
    list.push({ minX, maxX, minY, maxY, area, height: maxY - minY + 1, bottom: maxY + 1 })
  }
  return list
}

// Height of the wordmark letters (the cap height), in pixels of the mask: the largest group
// of 3 or more components with similar height (within 15%) and aligned bottoms (within 10%
// of that height). Returns the median height of that group, or null without a row of letters.
export function wordmarkLetterHeight(blobs) {
  const candidates = blobs
    .filter((blob) => blob.height >= 3 && blob.area >= 6)
    .sort((a, b) => b.area - a.area)
    .slice(0, 400)
  let best = null
  for (const ref of candidates) {
    const group = candidates.filter(
      (blob) =>
        Math.abs(blob.height - ref.height) <= 0.15 * ref.height &&
        Math.abs(blob.bottom - ref.bottom) <= 0.1 * ref.height,
    )
    if (group.length < 3) continue
    const heights = group.map((blob) => blob.height).sort((a, b) => a - b)
    const median =
      heights.length % 2 ? heights[(heights.length - 1) / 2] : (heights[heights.length / 2 - 1] + heights[heights.length / 2]) / 2
    if (!best || group.length > best.count || (group.length === best.count && median > best.median)) {
      best = { count: group.length, median }
    }
  }
  return best ? best.median : null
}

// Analysis of a logo image: its visible bounds (transparent pixels trimmed) and the height
// of its wordmark letters, both as fractions of the natural size:
// { x0, y0, x1, y1, ratio, letterHeight } with ratio = natural width / natural height and
// letterHeight null when no row of letters is found. An image without transparency, or one
// that cannot be read, is visible as a whole.
export async function visibleBounds(file) {
  const whole = { x0: 0, y0: 0, x1: 1, y1: 1, ratio: 1, letterHeight: null }
  try {
    const { data, width, height, naturalWidth, naturalHeight } = await rasterize(file, 768)
    const mask = new Uint8Array(width * height)
    let x0 = width
    let y0 = height
    let x1 = -1
    let y1 = -1
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (data[(y * width + x) * 4 + 3] <= 8) continue
        mask[y * width + x] = 1
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
    const ratio = naturalWidth / naturalHeight
    if (x1 < 0) return { ...whole, ratio }
    const letters = wordmarkLetterHeight(components(mask, width, height))
    return {
      x0: x0 / width,
      y0: y0 / height,
      x1: (x1 + 1) / width,
      y1: (y1 + 1) / height,
      ratio,
      letterHeight: letters === null ? null : letters / height,
    }
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

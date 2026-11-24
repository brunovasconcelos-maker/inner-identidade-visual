import { hexToOklch, oklchToHex, rgbToHex } from './palette.js'

// Local color generation for "Gerar a partir da logo". It is isolated on purpose: the whole
// feature calls only `generatePaletteColors`, so it can be replaced by a real AI call later
// with the same input and output.
//
//   generatePaletteColors({ files, counts, existing, identityName })
//     files:        logo files (Blob/File), SVG or raster
//     counts:       { marca: 0 | 1, primaria: n, secundaria: n }
//     existing:     hexes already in the palette (the new colors must differ from them)
//     existingBrand: hex of the brand color already in the palette, if any (base of the harmonies)
//     identityName: used in the names, "Azul Bigode Shop"
//     existingNames: names already in the palette (to number repeated ones)
//   resolves with [{ category, hex, name }] in the order brand, primary, secondary.

const DEG = Math.PI / 180
const MIN_DELTA_E = 14 // OKLab deltaE (x100) between any two colors; the rule asks for more than 10, this keeps a margin
const FALLBACK_BRAND = '#1A68E6'

// ---------- OKLab helpers ----------

const lab = ({ L, C, h }) => [L, C * Math.cos(h), C * Math.sin(h)]
const labOfHex = (hex) => lab(hexToOklch(hex))
const deltaE = (a, b) => 100 * Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

// A color as { hex, lch } after gamut mapping, so every check uses what is really saved.
function finalize({ L, C, h }) {
  const hex = oklchToHex({ L: clamp(L, 0.05, 0.97), C: Math.max(0, C), h })
  return { hex, lch: hexToOklch(hex) }
}

// ---------- reading the logos ----------

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = url
  })
}

// Pixels of a logo (SVGs are rasterized first) as { r, g, b } histogram buckets, ignoring
// transparent pixels and the background: near white or near black pixels connected to the
// border of the image.
async function readPixels(file, size = 160) {
  const url = URL.createObjectURL(file)
  try {
    const image = await loadImage(url)
    const scale = size / Math.max(image.naturalWidth || size, image.naturalHeight || size)
    const width = Math.max(1, Math.round((image.naturalWidth || size) * scale))
    const height = Math.max(1, Math.round((image.naturalHeight || size) * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    context.drawImage(image, 0, 0, width, height)
    const { data } = context.getImageData(0, 0, width, height)

    const opaque = (i) => data[i * 4 + 3] >= 128
    const klass = (i) => {
      const r = data[i * 4]
      const g = data[i * 4 + 1]
      const b = data[i * 4 + 2]
      if (r >= 232 && g >= 232 && b >= 232) return 1 // near white
      if (r <= 30 && g <= 30 && b <= 30) return 2 // near black
      return 0
    }
    // Flood the near white / near black area that touches the border: that is the background.
    const background = new Uint8Array(width * height)
    const stack = []
    const push = (i) => {
      if (!background[i] && opaque(i) && klass(i) !== 0) {
        background[i] = klass(i)
        stack.push(i)
      }
    }
    for (let x = 0; x < width; x += 1) {
      push(x)
      push((height - 1) * width + x)
    }
    for (let y = 0; y < height; y += 1) {
      push(y * width)
      push(y * width + width - 1)
    }
    while (stack.length > 0) {
      const i = stack.pop()
      const x = i % width
      const y = (i - x) / width
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
        const next = ny * width + nx
        if (!background[next] && opaque(next) && klass(next) === background[i]) {
          background[next] = background[i]
          stack.push(next)
        }
      }
    }

    const buckets = new Map()
    for (let i = 0; i < width * height; i += 1) {
      if (!opaque(i) || background[i]) continue
      const r = data[i * 4]
      const g = data[i * 4 + 1]
      const b = data[i * 4 + 2]
      const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)
      const bucket = buckets.get(key)
      if (bucket) bucket.w += 1
      else buckets.set(key, { r: (r >> 3 << 3) + 4, g: (g >> 3 << 3) + 4, b: (b >> 3 << 3) + 4, w: 1 })
    }
    return [...buckets.values()]
  } catch {
    return []
  } finally {
    URL.revokeObjectURL(url)
  }
}

// ---------- median cut in OKLab ----------

function medianCut(points, boxes = 12) {
  const queue = [points]
  while (queue.length < boxes) {
    // Split the box with the largest spread along its widest axis.
    let target = -1
    let widest = 0
    let axis = 0
    queue.forEach((box, index) => {
      if (box.length < 2) return
      for (let a = 0; a < 3; a += 1) {
        const values = box.map((p) => p.lab[a])
        const spread = Math.max(...values) - Math.min(...values)
        if (spread > widest) {
          widest = spread
          target = index
          axis = a
        }
      }
    })
    if (target === -1 || widest < 0.005) break
    const box = queue[target].slice().sort((p, q) => p.lab[axis] - q.lab[axis])
    const half = box.reduce((sum, p) => sum + p.w, 0) / 2
    let acc = 0
    let cut = 1
    for (let i = 0; i < box.length - 1; i += 1) {
      acc += box[i].w
      cut = i + 1
      if (acc >= half) break
    }
    queue.splice(target, 1, box.slice(0, cut), box.slice(cut))
  }
  return queue
    .filter((box) => box.length > 0)
    .map((box) => {
      const weight = box.reduce((sum, p) => sum + p.w, 0)
      const mean = [0, 1, 2].map((a) => box.reduce((sum, p) => sum + p.lab[a] * p.w, 0) / weight)
      return { lab: mean, weight }
    })
}

// Dominant colors of the logos: [{ lab, weight, lch }] by weight, similar ones merged.
async function dominantColors(files) {
  const merged = new Map()
  for (const file of files) {
    for (const px of await readPixels(file)) {
      const key = `${px.r},${px.g},${px.b}`
      const found = merged.get(key)
      if (found) found.w += px.w
      else merged.set(key, px)
    }
  }
  const points = [...merged.values()].map((px) => ({
    w: px.w,
    lab: labOfHex(rgbToHex(px.r, px.g, px.b)),
  }))
  if (points.length === 0) return []
  const clusters = medianCut(points).sort((a, b) => b.weight - a.weight)
  const kept = []
  for (const cluster of clusters) {
    const near = kept.find((other) => deltaE(other.lab, cluster.lab) < 6)
    if (near) near.weight += cluster.weight
    else kept.push({ ...cluster })
  }
  const total = kept.reduce((sum, c) => sum + c.weight, 0)
  return kept
    .filter((c) => c.weight / total >= 0.01)
    .sort((a, b) => b.weight - a.weight)
    .map((c) => ({ ...c, lch: { L: c.lab[0], C: Math.hypot(c.lab[1], c.lab[2]), h: Math.atan2(c.lab[2], c.lab[1]) } }))
}

// ---------- choosing colors ----------

const isFar = (color, taken) => taken.every((other) => deltaE(labOfHex(color.hex), other) > MIN_DELTA_E)

// Tries the base color, then shifts of lightness and hue, until it is far from `taken`.
function farVariant(base, taken) {
  let best = null
  const consider = (candidate) => {
    const labs = labOfHex(candidate.hex)
    const gap = Math.min(...taken.map((other) => deltaE(labs, other)), Infinity)
    if (!best || gap > best.gap) best = { candidate, gap }
    return gap > MIN_DELTA_E
  }
  const first = finalize(base)
  if (consider(first)) return first
  for (let step = 1; step <= 24; step += 1) {
    for (const [dL, dh] of [[0, 12 * step * DEG], [0, -12 * step * DEG], [0.07 * step, 0], [-0.07 * step, 0], [0.05 * step, 14 * step * DEG], [-0.05 * step, -14 * step * DEG]]) {
      const candidate = finalize({ L: clamp(base.L + dL, 0.2, 0.92), C: base.C, h: base.h + dh })
      if (consider(candidate)) return candidate
    }
  }
  return best.candidate
}

// Harmony color: hue rotated from the brand hue, lightness and chroma kept pleasant.
function harmony(brand, degrees, lightnessShift = 0) {
  const C = clamp(Math.max(brand.C * 0.9, 0.08), 0.08, 0.2)
  return { L: clamp(brand.L + lightnessShift, 0.5, 0.78), C, h: brand.h + degrees * DEG }
}

// ---------- names ----------

function baseName({ L, C, h }) {
  const hue = (((h / DEG) % 360) + 360) % 360
  if (C < 0.03) return L > 0.93 ? 'Branco' : L < 0.2 ? 'Preto' : 'Cinza'
  if (C < 0.06 && L > 0.8 && hue >= 40 && hue <= 110) return 'Bege'
  if (hue >= 330 || hue < 12) return L > 0.78 || C < 0.1 ? 'Rosa' : 'Vermelho'
  if (hue < 40) return L > 0.85 ? 'Rosa' : 'Vermelho'
  if (hue < 70) return L < 0.55 ? 'Marrom' : 'Laranja'
  if (hue < 95) return L < 0.55 ? 'Marrom' : L < 0.82 ? 'Dourado' : 'Amarelo'
  if (hue < 115) return L < 0.7 ? 'Dourado' : 'Amarelo'
  if (hue < 180) return 'Verde'
  if (hue < 285) return 'Azul'
  return hue < 330 ? 'Roxo' : 'Rosa'
}

// ---------- the function ----------

export async function generatePaletteColors({
  files,
  counts,
  existing = [],
  existingNames = [],
  existingBrand = null,
  identityName,
}) {
  const taken = existing.map(labOfHex)
  const dominant = await dominantColors(files)
  const result = []
  const pick = (category, color) => {
    result.push({ category, hex: color.hex, lch: color.lch })
    taken.push(labOfHex(color.hex))
  }

  // Cor da marca: the most dominant color with the highest chroma.
  let brandLch = hexToOklch(FALLBACK_BRAND)
  if (dominant.length > 0) {
    const strongest = dominant[0].weight
    const colorful = dominant.filter((c) => c.weight >= strongest * 0.1)
    const byChroma = [...colorful].sort((a, b) => b.lch.C - a.lch.C)
    brandLch = (byChroma[0].lch.C >= 0.04 ? byChroma[0] : dominant[0]).lch
  }
  if (!counts.marca && existingBrand) brandLch = hexToOklch(existingBrand)
  const brand = farVariant(brandLch, counts.marca ? taken : [])
  if (counts.marca) pick('marca', brand)

  // Primária: the next dominant colors of the logos, then analogous colors.
  const wanted = counts.primaria || 0
  const primaries = []
  const candidates = dominant.map((c) => c.lch)
  for (const lch of candidates) {
    if (primaries.length >= wanted) break
    const color = finalize(lch)
    if (isFar(color, [...taken, labOfHex(brand.hex)])) {
      primaries.push(color)
      taken.push(labOfHex(color.hex))
    }
  }
  const analogous = [30, -30, 60, -60, 15, -15, 90, -90]
  for (let i = 0; primaries.length < wanted; i += 1) {
    const base = harmony(brand.lch, analogous[i % analogous.length], i % 2 ? 0.1 : -0.06)
    const color = farVariant(base, [...taken, labOfHex(brand.hex)])
    primaries.push(color)
    taken.push(labOfHex(color.hex))
  }
  // The brand color of this run is reserved even when it was not asked for.
  const reserved = counts.marca ? [] : [labOfHex(brand.hex)]
  primaries.forEach((color) => result.push({ category: 'primaria', hex: color.hex, lch: color.lch }))

  // Secundária: complementary, split complementary and similar harmonies.
  const wantedSecondary = counts.secundaria || 0
  const rotations = [180, 150, 210, 120, 240, 90, 270, 60]
  for (let i = 0; i < wantedSecondary; i += 1) {
    const base = harmony(brand.lch, rotations[i % rotations.length], i % 2 ? -0.08 : 0)
    const color = farVariant(base, [...taken, ...reserved])
    taken.push(labOfHex(color.hex))
    result.push({ category: 'secundaria', hex: color.hex, lch: color.lch })
  }

  // Names: "Azul Bigode Shop", "Azul 2 Bigode Shop" when it already exists.
  const names = new Set(existingNames.map((name) => name.trim().toLowerCase()))
  const order = { marca: 0, primaria: 1, secundaria: 2 }
  return result
    .sort((a, b) => order[a.category] - order[b.category])
    .map(({ category, hex, lch }) => {
      const base = baseName(lch)
      let name = `${base} ${identityName}`
      for (let n = 2; names.has(name.toLowerCase()); n += 1) name = `${base} ${n} ${identityName}`
      names.add(name.toLowerCase())
      return { category, hex, name }
    })
}


export const MAX_ZIP_SIZE = 50 * 1024 * 1024 // 50 MB

const isSvgEntry = (entry) =>
  !entry.dir && /\.svg$/i.test(entry.name) && !entry.name.startsWith('__MACOSX/') && !/(^|\/)\./.test(entry.name)

async function openZip(file) {
  const { default: JSZip } = await import('jszip')
  return JSZip.loadAsync(file)
}

// Accepts ONE .zip up to 50 MB with at least one SVG. Resolves { ok: true, name, count } (name
// without the extension) or { ok: false, error }.
export async function readIconZip(file) {
  if (!/\.zip$/i.test(file.name)) return { ok: false, error: 'Formato não suportado' }
  if (file.size > MAX_ZIP_SIZE) return { ok: false, error: 'Arquivo maior que 50 MB' }
  try {
    const zip = await openZip(file)
    const count = Object.values(zip.files).filter(isSvgEntry).length
    if (count === 0) return { ok: false, error: 'Nenhum SVG encontrado no .zip' }
    return { ok: true, name: file.name.replace(/\.zip$/i, ''), count }
  } catch {
    return { ok: false, error: 'Não foi possível ler o arquivo .zip' }
  }
}

// SVG files of the zip as { name, text }, sorted by name. `pick` chooses which entries are
// read (all of them by default).
export async function zipSvgs(file, pick = (entries) => entries) {
  const zip = await openZip(file)
  const entries = Object.values(zip.files)
    .filter(isSvgEntry)
    .sort((a, b) => a.name.localeCompare(b.name))
  const chosen = pick(entries)
  return Promise.all(chosen.map(async (entry) => ({ name: entry.name, text: await entry.async('string') })))
}

// `count` entries at random.
export function randomEntries(entries, count) {
  const copy = [...entries]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, count)
}

// An SVG recolored to `hex` when it has a single color; one with several colors (or a gradient)
// comes back unchanged. No explicit color counts as single (the default is black).
export function recolorSingleColor(text, hex) {
  if (/url\(\s*#|stop-color/i.test(text)) return text
  const colors = new Set()
  const pattern = /\b(fill|stroke)(\s*[=:]\s*)(["']?)([^"';\s>}]+)\3/gi
  for (const match of text.matchAll(pattern)) {
    const value = match[4].toLowerCase()
    if (value === 'none' || value === 'transparent' || value === 'inherit') continue
    colors.add(value)
  }
  if (colors.size > 1) return text
  if (colors.size === 0) return text.replace(/<svg\b/i, `<svg fill="${hex}"`)
  return text.replace(pattern, (whole, prop, glue, quote, value) => {
    const lower = value.toLowerCase()
    if (lower === 'none' || lower === 'transparent' || lower === 'inherit') return whole
    return `${prop}${glue}${quote}${hex}${quote}`
  })
}

// Base name of an SVG entry without folders or extension.
export const baseName = (path) => path.split('/').pop().replace(/\.svg$/i, '')

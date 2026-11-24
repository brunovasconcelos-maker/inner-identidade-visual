import { makeWeight, normalizeWeight } from '../data/typography.js'

export const FONT_ACCEPT = '.ttf,.otf,.woff,.woff2,.zip'
export const MAX_FONT_SIZE = 10 * 1024 * 1024 // 10 MB
export const MAX_ZIP_SIZE = 30 * 1024 * 1024 // 30 MB

const FONT_EXTENSIONS = ['ttf', 'otf', 'woff', 'woff2']
const extensionOf = (name) => (name.includes('.') ? name.split('.').pop().toLowerCase() : '')

// One font file (TTF, OTF, WOFF, WOFF2) up to 10 MB, or one .zip up to 30 MB.
export function validateFontFile(file) {
  const extension = extensionOf(file.name)
  if (extension === 'zip') {
    if (file.size > MAX_ZIP_SIZE) return { ok: false, error: 'Arquivo maior que 30 MB' }
    return { ok: true, zip: true }
  }
  if (!FONT_EXTENSIONS.includes(extension)) return { ok: false, error: 'Formato não suportado' }
  if (file.size > MAX_FONT_SIZE) return { ok: false, error: 'Arquivo maior que 10 MB' }
  return { ok: true, zip: false }
}

// Family, weight and italic from the font's own metadata. The weight is the OS/2 weight
// class; italic comes from the OS/2 selection bits, the head table or the style name.
async function readMetadata(file) {
  const [{ default: opentype }, buffer] = await Promise.all([
    import('opentype.js'),
    file.arrayBuffer(),
  ])
  let data = buffer
  if (extensionOf(file.name) === 'woff2') {
    // opentype.js has no WOFF2 decoder: decompress it to TTF first.
    const { default: decompress } = await import('woff2-encoder/decompress')
    const bytes = await decompress(new Uint8Array(buffer))
    data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  }
  const font = opentype.parse(data)
  const name = (key) => font.getEnglishName(key) || ''
  const family = (name('preferredFamily') || name('fontFamily')).trim()
  if (!family) throw new Error('Font has no family name')
  const style = `${name('preferredSubfamily')} ${name('fontSubfamily')}`
  const os2 = font.tables.os2 || {}
  const italic =
    Boolean((os2.fsSelection || 0) & 1) ||
    Boolean(((font.tables.head && font.tables.head.macStyle) || 0) & 2) ||
    /italic|oblique/i.test(style)
  return { family, weight: normalizeWeight(os2.usWeightClass), italic }
}

const isIgnoredEntry = (path) =>
  path.endsWith('/') ||
  path.startsWith('__MACOSX/') ||
  path.split('/').some((part) => part.startsWith('.')) ||
  !FONT_EXTENSIONS.includes(extensionOf(path))

// Files of the picked file: the file itself, or the font files inside a .zip (anything
// else is ignored).
async function collectFiles(file, isZip) {
  if (!isZip) return [file]
  const { default: JSZip } = await import('jszip')
  const zip = await JSZip.loadAsync(file)
  const entries = Object.values(zip.files).filter((entry) => !entry.dir && !isIgnoredEntry(entry.name))
  return Promise.all(
    entries.map(async (entry) => {
      const blob = await entry.async('blob')
      return new File([blob], entry.name.split('/').pop())
    }),
  )
}

// Reads a picked font file or .zip. Resolves with
//   { ok: true, family, weights: [{ name, weight, italic, file }] }
// or { ok: false, error } with the message to show near the card.
export async function readFontUpload(file, isZip) {
  let files
  try {
    files = await collectFiles(file, isZip)
  } catch {
    return { ok: false, error: 'Não foi possível ler o arquivo' }
  }
  if (files.length === 0) return { ok: false, error: 'Nenhuma fonte encontrada no .zip' }

  const parsed = []
  for (const item of files) {
    try {
      parsed.push({ ...(await readMetadata(item)), file: item })
    } catch (error) {
      console.error('Could not read font', item.name, error)
      if (!isZip) return { ok: false, error: 'Não foi possível ler a fonte' }
    }
  }
  if (parsed.length === 0) return { ok: false, error: 'Nenhuma fonte encontrada no .zip' }

  const families = new Set(parsed.map((font) => font.family.toLowerCase()))
  if (families.size > 1) return { ok: false, error: 'O .zip deve conter apenas uma família de fonte' }

  // One file per style: a repeated weight and style keeps the first file.
  const seen = new Set()
  const weights = []
  for (const font of parsed) {
    const key = `${font.weight}${font.italic}`
    if (seen.has(key)) continue
    seen.add(key)
    weights.push(makeWeight(font.weight, font.italic, { file: font.file }))
  }
  return { ok: true, family: parsed[0].family, weights }
}

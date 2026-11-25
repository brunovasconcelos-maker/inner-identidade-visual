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

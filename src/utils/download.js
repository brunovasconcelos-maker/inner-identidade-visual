import { zipSync } from 'fflate'
import { ASSET_KINDS } from '../data/assetKinds.js'

// Starts a browser download of a Blob.
export function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

function safeName(name) {
  // eslint-disable-next-line no-control-regex
  return name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-').trim() || 'arquivo'
}

function extensionOf(fileName) {
  const dot = fileName.lastIndexOf('.')
  return dot > 0 ? fileName.slice(dot) : ''
}

async function bytesOf(blob) {
  return new Uint8Array(await blob.arrayBuffer())
}

// One logo without monochrome versions downloads the original file with its original
// name. One logo with versions, or several logos, downloads "[identity name]-logos.zip"
// with every main file and its monochrome versions, one folder per logo type:
//   principal/logo.svg
//   principal/monocromaticas/Preto.svg
export async function downloadLogos(identityName, logos, kind = ASSET_KINDS.logo) {
  if (logos.length === 1 && (logos[0].monoVersions || []).length === 0) {
    saveBlob(logos[0].file, logos[0].fileName)
    return
  }
  const files = {}
  for (const logo of logos) {
    const folder = kind.zipFolder(logo)
    const prefix = folder ? `${folder}/` : ''
    const base = safeName(logo.fileName)
    let main = `${prefix}${base}`
    // Same file name twice (flat zips): "name-2.ext".
    const ext = extensionOf(base)
    const stem = ext ? base.slice(0, -ext.length) : base
    for (let n = 2; files[main]; n += 1) main = `${prefix}${stem}-${n}${ext}`
    files[main] = await bytesOf(logo.file)
    for (const version of logo.monoVersions || []) {
      const base = `${folder}/monocromaticas/${safeName(version.name)}`
      const extension = extensionOf(version.fileName)
      let path = `${base}${extension}`
      for (let n = 2; files[path]; n += 1) path = `${base}-${n}${extension}`
      files[path] = await bytesOf(version.file)
    }
  }
  const zipped = zipSync(files)
  saveBlob(new Blob([zipped], { type: 'application/zip' }), `${safeName(identityName)}-${kind.zipSuffix}.zip`)
}

// Fonts: one uploaded font with a single file downloads that file; one with several files
// downloads "[family].zip"; several fonts go in one "[identity name]-tipografia.zip", one
// folder per family. Google fonts have no files, so they are skipped. Resolves with how
// many were skipped.
export async function downloadFonts(identityName, fonts) {
  const uploads = fonts.filter((font) => font.source === 'upload')
  const skipped = fonts.length - uploads.length
  if (uploads.length === 0) return { skipped }

  const filesOf = (font) => font.weights.filter((weight) => weight.file).map((weight) => weight.file)
  const addAll = async (target, prefix, files) => {
    for (const file of files) {
      const base = safeName(file.name)
      const extension = extensionOf(base)
      const stem = extension ? base.slice(0, -extension.length) : base
      let path = `${prefix}${base}`
      for (let n = 2; target[path]; n += 1) path = `${prefix}${stem}-${n}${extension}`
      target[path] = await bytesOf(file)
    }
  }

  if (uploads.length === 1) {
    const [font] = uploads
    const files = filesOf(font)
    if (files.length === 1) {
      saveBlob(files[0], files[0].name)
    } else {
      const entries = {}
      await addAll(entries, '', files)
      saveBlob(new Blob([zipSync(entries)], { type: 'application/zip' }), `${safeName(font.family)}.zip`)
    }
    return { skipped }
  }

  const entries = {}
  for (const font of uploads) await addAll(entries, `${safeName(font.family)}/`, filesOf(font))
  saveBlob(
    new Blob([zipSync(entries)], { type: 'application/zip' }),
    `${safeName(identityName)}-tipografia.zip`,
  )
  return { skipped }
}

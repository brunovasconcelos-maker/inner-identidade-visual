import { zipSync } from 'fflate'
import { findLogoType } from '../data/logoTypes.js'

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
export async function downloadLogos(identityName, logos) {
  if (logos.length === 1 && logos[0].monoVersions.length === 0) {
    saveBlob(logos[0].file, logos[0].fileName)
    return
  }
  const files = {}
  for (const logo of logos) {
    const folder = findLogoType(logo.type)?.id || logo.id
    files[`${folder}/${safeName(logo.fileName)}`] = await bytesOf(logo.file)
    for (const version of logo.monoVersions) {
      const base = `${folder}/monocromaticas/${safeName(version.name)}`
      const extension = extensionOf(version.fileName)
      let path = `${base}${extension}`
      for (let n = 2; files[path]; n += 1) path = `${base}-${n}${extension}`
      files[path] = await bytesOf(version.file)
    }
  }
  const zipped = zipSync(files)
  saveBlob(new Blob([zipped], { type: 'application/zip' }), `${safeName(identityName)}-logos.zip`)
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
export const ACCEPT =
  '.svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp'

const FORMAT_BY_MIME = {
  'image/svg+xml': 'SVG',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/webp': 'WEBP',
}
const FORMAT_BY_EXTENSION = { svg: 'SVG', png: 'PNG', jpg: 'JPG', jpeg: 'JPG', webp: 'WEBP' }

// Accepted: SVG, PNG, JPG, WEBP up to 10 MB.
export function validateImageFile(file) {
  const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : ''
  const format = file.type ? FORMAT_BY_MIME[file.type] : FORMAT_BY_EXTENSION[extension]
  if (!format) return { ok: false, error: 'Formato não suportado' }
  if (file.size > MAX_FILE_SIZE) return { ok: false, error: 'Arquivo maior que 10 MB' }
  return { ok: true, format }
}

// Opens the native file picker (one file). Call it straight from a click handler.
// Resolves with the file, or null if the picker was dismissed.
export function openFilePicker(accept = ACCEPT) {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.multiple = false
    input.onchange = () => resolve(input.files && input.files[0] ? input.files[0] : null)
    input.oncancel = () => resolve(null)
    input.click()
  })
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Image could not be loaded'))
    image.src = url
  })
}

async function svgSize(file) {
  const text = await file.text()
  const width = /<svg[^>]*\swidth="([\d.]+)(?:px)?"/i.exec(text)
  const height = /<svg[^>]*\sheight="([\d.]+)(?:px)?"/i.exec(text)
  if (width && height) return { width: Math.round(+width[1]), height: Math.round(+height[1]) }
  const box = /viewBox="[\d.\-]+[\s,]+[\d.\-]+[\s,]+([\d.]+)[\s,]+([\d.]+)"/i.exec(text)
  if (box) return { width: Math.round(+box[1]), height: Math.round(+box[2]) }
  return null
}

// Pixel size of an image file.
export async function readImageSize(file) {
  if (file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)) {
    const fromMarkup = await svgSize(file)
    if (fromMarkup) return fromMarkup
  }
  const url = URL.createObjectURL(file)
  try {
    const image = await loadImage(url)
    return { width: image.naturalWidth, height: image.naturalHeight }
  } catch {
    return { width: 0, height: 0 }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export const PREVIEW_BG_LIGHT_IMAGE = '#000000'
export const PREVIEW_BG_DARK_IMAGE = '#efefef'

// Thumbnail background from the average luminance of the image: black for light
// images, the light gray from Figma for dark images.
export async function previewBgFor(file) {
  const url = URL.createObjectURL(file)
  try {
    const image = await loadImage(url)
    const size = 48
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d', { willReadFrequently: true })
    context.drawImage(image, 0, 0, size, size)
    const { data } = context.getImageData(0, 0, size, size)
    let luminance = 0
    let weight = 0
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3] / 255
      if (alpha < 0.05) continue
      luminance += ((0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255) * alpha
      weight += alpha
    }
    const average = weight > 0 ? luminance / weight : 0
    return average > 0.5 ? PREVIEW_BG_LIGHT_IMAGE : PREVIEW_BG_DARK_IMAGE
  } catch {
    return PREVIEW_BG_DARK_IMAGE
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Opens the file picker and validates the choice. Returns { file, previewBg } or null.
// `onError` receives the short message of an invalid file (or null for a valid one).
export async function pickImage(onError) {
  const file = await openFilePicker()
  if (!file) return null
  const result = validateImageFile(file)
  if (!result.ok) {
    onError(result.error)
    return null
  }
  onError(null)
  return { file, previewBg: await previewBgFor(file) }
}

// ---------- Elementos: any file type, one at a time, up to 50 MB ----------
export const MAX_ELEMENT_SIZE = 50 * 1024 * 1024 // 50 MB

const PREVIEW_IMAGE_FORMATS = ['SVG', 'PNG', 'JPG', 'WEBP', 'GIF']

// Upper case format of any file: its extension (JPEG counts as JPG), otherwise the MIME
// subtype, otherwise "ARQUIVO".
export function elementFormat(file) {
  const dot = file.name.lastIndexOf('.')
  const extension = dot > 0 ? file.name.slice(dot + 1).trim().toUpperCase() : ''
  if (extension) return extension === 'JPEG' ? 'JPG' : extension
  const subtype = file.type ? file.type.split('/')[1] : ''
  if (subtype) {
    const clean = subtype.split('+')[0].toUpperCase()
    return clean === 'JPEG' ? 'JPG' : clean
  }
  return 'ARQUIVO'
}

// True for the formats the browser can show as an image (SVG, PNG, JPG, WEBP, GIF).
export function isImageFormat(format) {
  return PREVIEW_IMAGE_FORMATS.includes(String(format).toUpperCase())
}

export function validateElementFile(file) {
  if (file.size > MAX_ELEMENT_SIZE) return { ok: false, error: 'Arquivo maior que 50 MB' }
  return { ok: true, format: elementFormat(file) }
}

const ZIP_FORMATS = ['ZIP', 'RAR', '7Z', 'TAR', 'GZ', 'TGZ', 'BZ2']
const VIDEO_FORMATS = ['MP4', 'MOV', 'AVI', 'MKV', 'WEBM', 'M4V', 'WMV', 'FLV']
const AUDIO_FORMATS = ['MP3', 'WAV', 'OGG', 'M4A', 'AAC', 'FLAC', 'AIFF']

// Which Phosphor icon stands for a non-image file: FilePdf, FileZip, FileVideo, FileAudio
// or File.
export function fileIconKind(format) {
  const upper = String(format).toUpperCase()
  if (upper === 'PDF') return 'pdf'
  if (ZIP_FORMATS.includes(upper)) return 'zip'
  if (VIDEO_FORMATS.includes(upper)) return 'video'
  if (AUDIO_FORMATS.includes(upper)) return 'audio'
  return 'file'
}

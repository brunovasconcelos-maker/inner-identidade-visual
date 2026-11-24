// Dominant color of an image: the average of its opaque pixels, as "#RRGGBB".
export async function dominantColor(file) {
  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = url
    })
    const size = 48
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d', { willReadFrequently: true })
    context.drawImage(image, 0, 0, size, size)
    const { data } = context.getImageData(0, 0, size, size)
    let r = 0
    let g = 0
    let b = 0
    let weight = 0
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3] / 255
      if (alpha < 0.3) continue
      r += data[i] * alpha
      g += data[i + 1] * alpha
      b += data[i + 2] * alpha
      weight += alpha
    }
    if (weight === 0) return '#000000'
    const hex = (n) => Math.round(n / weight).toString(16).padStart(2, '0')
    return `#${hex(r)}${hex(g)}${hex(b)}`
  } catch {
    return '#000000'
  } finally {
    URL.revokeObjectURL(url)
  }
}

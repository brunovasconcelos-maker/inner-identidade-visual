import { hexToRgb } from './palette.js'

// CIELAB (D65) of a hex color.
export function hexToLab(hex) {
  const lin = (c) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  const [r, g, b] = hexToRgb(hex).map(lin)
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116)
  const [fx, fy, fz] = [f(x), f(y), f(z)]
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) }
}

// Chroma of a hex color in CIELAB.
export const labChroma = (hex) => {
  const { a, b } = hexToLab(hex)
  return Math.hypot(a, b)
}

// CIEDE2000 color difference between two hex colors.
export function deltaE(hexA, hexB) {
  const p = hexToLab(hexA)
  const q = hexToLab(hexB)
  const rad = (d) => (d * Math.PI) / 180
  const deg = (r) => (r * 180) / Math.PI
  const c1 = Math.hypot(p.a, p.b)
  const c2 = Math.hypot(q.a, q.b)
  const cBar = (c1 + c2) / 2
  const g = 0.5 * (1 - Math.sqrt(cBar ** 7 / (cBar ** 7 + 25 ** 7)))
  const a1 = (1 + g) * p.a
  const a2 = (1 + g) * q.a
  const C1 = Math.hypot(a1, p.b)
  const C2 = Math.hypot(a2, q.b)
  const hue = (b, a) => {
    if (a === 0 && b === 0) return 0
    const h = deg(Math.atan2(b, a))
    return h >= 0 ? h : h + 360
  }
  const h1 = hue(p.b, a1)
  const h2 = hue(q.b, a2)
  const dL = q.L - p.L
  const dC = C2 - C1
  let dh = 0
  if (C1 * C2 !== 0) {
    dh = h2 - h1
    if (dh > 180) dh -= 360
    else if (dh < -180) dh += 360
  }
  const dH = 2 * Math.sqrt(C1 * C2) * Math.sin(rad(dh / 2))
  const Lbar = (p.L + q.L) / 2
  const Cbar = (C1 + C2) / 2
  let hbar = h1 + h2
  if (C1 * C2 !== 0) {
    if (Math.abs(h1 - h2) > 180) hbar += h1 + h2 < 360 ? 360 : -360
    hbar /= 2
  }
  const T =
    1 -
    0.17 * Math.cos(rad(hbar - 30)) +
    0.24 * Math.cos(rad(2 * hbar)) +
    0.32 * Math.cos(rad(3 * hbar + 6)) -
    0.2 * Math.cos(rad(4 * hbar - 63))
  const dTheta = 30 * Math.exp(-(((hbar - 275) / 25) ** 2))
  const Rc = 2 * Math.sqrt(Cbar ** 7 / (Cbar ** 7 + 25 ** 7))
  const Sl = 1 + (0.015 * (Lbar - 50) ** 2) / Math.sqrt(20 + (Lbar - 50) ** 2)
  const Sc = 1 + 0.045 * Cbar
  const Sh = 1 + 0.015 * Cbar * T
  const Rt = -Math.sin(rad(2 * dTheta)) * Rc
  return Math.sqrt((dL / Sl) ** 2 + (dC / Sc) ** 2 + (dH / Sh) ** 2 + Rt * (dC / Sc) * (dH / Sh))
}

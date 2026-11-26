import { useEffect, useMemo, useState } from 'react'
import { versionKey } from '../data/manualIcon.js'
import { dominantColor } from '../utils/imageColor.js'

// Versions of the icon (original first, then each monochrome) with their dominant color.
export function useIconVersions(icon) {
  const [colors, setColors] = useState({})
  const monos = icon.monoVersions || []
  const list = useMemo(
    () => [
      { key: versionKey(0), file: icon.file },
      ...monos.map((version, index) => ({ key: versionKey(index + 1), file: version.file })),
    ],
    [icon.file, monos],
  )
  useEffect(() => {
    let alive = true
    Promise.all(list.map((item) => dominantColor(item.file).catch(() => '#000000'))).then((values) => {
      if (!alive) return
      const next = {}
      list.forEach((item, index) => {
        next[item.key] = values[index]
      })
      setColors(next)
    })
    return () => {
      alive = false
    }
  }, [list])
  return list.map((item) => ({ ...item, color: colors[item.key] || null }))
}


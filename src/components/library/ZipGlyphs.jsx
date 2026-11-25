import { useEffect, useState } from 'react'
import { randomEntries, zipSvgs } from '../../utils/iconZip.js'

// Icons of an uploaded .zip: `count` of its SVGs, at random (the modal) or the first ones by
// name (the folder card, so it does not change at every render). Each SVG is drawn as an
// image, so nothing of the file runs in the page.
export default function ZipGlyphs({ file, count, random = false }) {
  const [urls, setUrls] = useState([])
  useEffect(() => {
    let alive = true
    let made = []
    zipSvgs(file, (entries) => (random ? randomEntries(entries, count) : entries.slice(0, count)))
      .then((svgs) => {
        made = svgs.map((svg) => URL.createObjectURL(new Blob([svg.text], { type: 'image/svg+xml' })))
        if (alive) setUrls(made)
        else made.forEach((url) => URL.revokeObjectURL(url))
      })
      .catch(() => {})
    return () => {
      alive = false
      made.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [file, count, random])
  return urls.map((url) => <img key={url} className="lib-glyph lib-glyph--img" src={url} alt="" />)
}

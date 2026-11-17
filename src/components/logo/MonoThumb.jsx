import { useObjectUrl } from '../../hooks/useObjectUrl.js'

// 60 x 60 thumbnail of a monochrome version. The background comes from the image
// luminance (`bg`), the image is contained in a 48 x 37.08 box.
export default function MonoThumb({ file, bg }) {
  const url = useObjectUrl(file)
  return (
    <span className="mono-thumb" style={{ background: bg }}>
      {url ? <img className="mono-thumb__img" src={url} alt="" /> : null}
    </span>
  )
}

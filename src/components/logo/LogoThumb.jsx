import { useObjectUrl } from '../../hooks/useObjectUrl.js'

// 52 x 52 monochrome thumbnail of a logo card. The background is the saved previewBg.
export default function LogoThumb({ file, bg }) {
  const url = useObjectUrl(file)
  return (
    <span className="logo-thumb" style={{ background: bg }}>
      {url ? <img className="logo-thumb__img" src={url} alt="" /> : null}
    </span>
  )
}

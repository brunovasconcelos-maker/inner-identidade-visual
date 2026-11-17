import { useObjectUrl } from '../../hooks/useObjectUrl.js'

// 48 x 48 thumbnail of a monochrome version in the viewer panel.
export default function VersionThumb({ file, bg }) {
  const url = useObjectUrl(file)
  return (
    <span className="version-thumb" style={{ background: bg }}>
      {url ? <img className="version-thumb__img" src={url} alt="" /> : null}
    </span>
  )
}

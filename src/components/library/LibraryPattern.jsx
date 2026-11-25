import LibraryGlyphs from '../../icon-libraries/LibraryGlyphs.jsx'
import { everydayIcons } from '../../icon-libraries/libraries.js'
import ZipGlyphs from './ZipGlyphs.jsx'

// The 24-icon pattern of the folder cards (Figma: a 180 x 180 wrap of 24px icons, 15px apart,
// at -2.33 / -9 in the card), drawn with the icons of the library itself. For an uploaded
// library the icons come from its .zip.
export default function LibraryPattern({ library, style, file }) {
  return (
    <div className="lib-pattern" aria-hidden="true">
      {file ? (
        <ZipGlyphs file={file} count={24} />
      ) : (
        <LibraryGlyphs library={library} style={style || library.defaultStyle} names={everydayIcons(library)} />
      )}
    </div>
  )
}

import { useObjectUrl } from '../../hooks/useObjectUrl.js'
import background from '../../assets/browser-mockup/background.svg'
import trafficLights from '../../assets/browser-mockup/traffic-lights.svg'
import navigation from '../../assets/browser-mockup/navigation.svg'
import close from '../../assets/browser-mockup/close.svg'
import plus from '../../assets/browser-mockup/plus.svg'
import lock from '../../assets/browser-mockup/lock.svg'

const at = (left, top, width, height) => ({ position: 'absolute', left, top, width, height })
// Image that bleeds past its frame by the given percentages (Figma insets), in pixels.
const bleed = (w, h, top, right, bottom, left) => ({
  position: 'absolute',
  left: (left / 100) * w,
  top: (top / 100) * h,
  width: w - (left / 100) * w - (right / 100) * w,
  height: h - (top / 100) * h - (bottom / 100) * h,
})

// Browser window of the Favicon section (Figma node 6512:11073) rebuilt in code, with the
// real icon in the tab and the identity name as the tab title. Positions are the Figma
// ones, in the 580 x 360 box.
export default function FaviconMockup({ file, title, address }) {
  const url = useObjectUrl(file)
  return (
    <div className="icon-fav">
      <img style={at(63, 67, 651, 225.306)} src={background} alt="" />
      <img style={at(111.8, 122.03, 73.718, 16.612)} src={trafficLights} alt="" />
      <div style={at(113.36, 218.07, 207, 24.4)}>
        <img style={bleed(207, 24.4, -6.02, -0.35, -4.26, -0.71)} src={navigation} alt="" className="icon-fav__fill" />
      </div>
      <div className="icon-fav__slot" style={at(269.62, 111.65, 37.378, 37.378)}>
        {url ? <img src={url} alt="" /> : null}
      </div>
      <p className="icon-fav__text" style={{ left: 323.09, top: 115.28, width: 192.081 }}>
        {title}
      </p>
      <div style={at(550.99, 123.59, 13.498, 13.498)}>
        <img style={bleed(13.498, 13.498, -5.44, -5.44, -5.44, 0)} src={close} alt="" className="icon-fav__fill" />
      </div>
      <div className="icon-fav__plus" style={at(634.57, 120.99, 18.689, 18.689)}>
        <div style={{ position: 'relative', width: 13.215, height: 13.215, transform: 'rotate(-45deg)' }}>
          <img style={bleed(13.215, 13.215, -5.56, -5.56, -5.55, 0)} src={plus} alt="" className="icon-fav__fill" />
        </div>
      </div>
      <div className="icon-fav__bar" style={at(375.52, 192.63, 338.478, 75.794)} />
      <p className="icon-fav__text" style={{ left: 434.09, top: 215.47, width: 279.906 }}>
        {address}
      </p>
      <div style={at(405.11, 221.18, 15.574, 20.766)}>
        <img style={bleed(15.574, 20.766, -2.5, 0, 0, 0)} src={lock} alt="" className="icon-fav__fill" />
      </div>
    </div>
  )
}

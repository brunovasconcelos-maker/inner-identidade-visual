import { useId } from 'react'

// The Inner credits icon (Figma component "Credit", node 6420:3), 24 x 24. It is a local SVG
// exported from Figma, not a Phosphor icon (approved exception). Three layers: the hexagon
// with gradient and inner shadow, the sparkle with drop shadow and the overlay outline.
export default function CreditsIcon({ className }) {
  const id = useId().replace(/:/g, '')
  const f = (name) => `${name}-${id}`
  return (
    <span className={className} style={{ position: 'relative', display: 'block', width: 24, height: 24, flex: 'none' }} aria-hidden="true">
      {/* Polygon 1 */}
      <svg
        style={{ position: 'absolute', display: 'block', left: 5.1352, top: 4.0732, overflow: 'visible' }}
        width="13.7295"
        height="15.8535"
        viewBox="0 0 13.7295 15.8535"
        fill="none"
      >
        <g filter={`url(#${f('inner')})`}>
          <path d="M6.86477 0L13.7295 3.96338V11.8901L6.86477 15.8535L0 11.8901V3.96338L6.86477 0Z" fill="#D9D9D9" />
          <path d="M6.86477 0L13.7295 3.96338V11.8901L6.86477 15.8535L0 11.8901V3.96338L6.86477 0Z" fill={`url(#${f('hex')})`} />
        </g>
        <defs>
          <filter id={f('inner')} x="0" y="0" width="13.7295" height="15.8535" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
            <feOffset />
            <feGaussianBlur stdDeviation="0.396338" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0" />
            <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
          </filter>
          <linearGradient id={f('hex')} x1="6.86479" y1="0" x2="6.86479" y2="15.8535" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FEE8C1" />
            <stop offset="1" stopColor="#F2985C" />
          </linearGradient>
        </defs>
      </svg>
      {/* Vector (sparkle) */}
      <svg
        style={{ position: 'absolute', display: 'block', left: 1.9186 + 5.1352, top: 3.4949 + 4.0732, overflow: 'visible' }}
        width="9.88247"
        height="9.88315"
        viewBox="0 0 9.88247 9.88315"
        fill="none"
      >
        <g filter={`url(#${f('shadow')})`}>
          <path
            d="M5.01934 1.32079L5.312 2.13144C5.63699 3.03099 6.3453 3.7402 7.24574 4.06519L8.05639 4.35784C8.13001 4.38478 8.13001 4.48802 8.05639 4.51405L7.24574 4.80671C6.3462 5.1317 5.63699 5.84001 5.312 6.74045L5.01934 7.5511C4.99241 7.62472 4.88917 7.62472 4.86313 7.5511L4.57048 6.74045C4.24549 5.84091 3.53718 5.1317 2.63673 4.80671L1.82608 4.51405C1.75247 4.48712 1.75247 4.38388 1.82608 4.35784L2.63673 4.06519C3.53628 3.7402 4.24549 3.03189 4.57048 2.13144L4.86313 1.32079C4.88917 1.24628 4.99331 1.24628 5.01934 1.32079Z"
            fill={`url(#${f('spark')})`}
          />
        </g>
        <defs>
          <filter id={f('shadow')} x="0" y="0" width="9.88248" height="9.88315" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
            <feOffset dy="0.505963" />
            <feGaussianBlur stdDeviation="0.885436" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.704378 0 0 0 0 0.602612 0 0 0 0 0.399079 0 0 0 0.6 0" />
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
          </filter>
          <linearGradient id={f('spark')} x1="4.94124" y1="1.26491" x2="4.94124" y2="7.60631" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FEEFDF" />
            <stop offset="1" stopColor="#FFC983" />
          </linearGradient>
        </defs>
      </svg>
      {/* Polygon 2 (overlay outline) */}
      <svg
        style={{ position: 'absolute', display: 'block', left: 1.32 + 5.1352, top: 1.59 + 4.0732, overflow: 'visible', mixBlendMode: 'overlay' }}
        width="11.0898"
        height="12.8054"
        viewBox="0 0 11.0898 12.8054"
        fill="none"
      >
        <mask id={f('mask')} fill="white">
          <path d="M5.54492 0L11.0898 3.20136V9.60408L5.54492 12.8054L0 9.60408V3.20136L5.54492 0Z" />
        </mask>
        <path
          d="M5.54492 0L11.0898 3.20136V9.60408L5.54492 12.8054L0 9.60408V3.20136L5.54492 0Z"
          strokeWidth="1.70739"
          stroke={`url(#${f('line')})`}
          strokeOpacity="0.2"
          mask={`url(#${f('mask')})`}
        />
        <defs>
          <linearGradient id={f('line')} x1="5.54492" y1="0" x2="5.54492" y2="12.8054" gradientUnits="userSpaceOnUse">
            <stop />
            <stop offset="1" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  )
}

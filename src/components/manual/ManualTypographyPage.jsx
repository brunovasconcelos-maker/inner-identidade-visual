import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { DownloadSimple } from '@phosphor-icons/react'
import GoogleIcon from '../icons/GoogleIcon.jsx'
import ManualScrollSections from './ManualScrollSections.jsx'
import {
  FONT_SECTION_TITLES,
  TYPOGRAPHY_INTRO,
  heroWeight,
  selectedWeights,
  visibleFontTypes,
} from '../../data/manualTypography.js'
import { pesosLabel, styleName } from '../../data/typography.js'
import { downloadFamily, downloadWeight } from '../../utils/fontDownload.js'
import { useFontFamily } from '../../hooks/useFontFamily.js'

// The size of the family name in the hero (Figma node 6508:9725) and the space kept on both
// sides of it. The name shrinks from this size until it fits on one line.
const NAME_SIZE = 190
const NAME_PADDING = 28
// Baseline of the family name inside the 520px box, taken from the Figma frames.
const NAME_BASELINE = 460

// A download that can fail (Google fonts are fetched): the button says so for a moment.
function useDownload(run) {
  const [state, setState] = useState('idle') // idle | busy | error
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  const start = async () => {
    setState('busy')
    try {
      await run()
      setState('idle')
    } catch (error) {
      console.error('Could not download', error)
      setState('error')
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setState('idle'), 3000)
    }
  }
  return [state, start]
}

// Hero box: the Google icon (Google fonts only) and the number of weights at the top left, a
// download button on hover at the top right and the family name in the font itself, on one
// line: it starts at the Figma size and shrinks until it fits the box width.
function FontHero({ font, weights, family }) {
  const box = useRef(null)
  const sample = useRef(null)
  const [size, setSize] = useState(NAME_SIZE)
  const weight = heroWeight(weights)
  const [download, start] = useDownload(() => downloadFamily(font, weights))

  const fit = useCallback(async () => {
    if (!box.current || !sample.current) return
    try {
      await document.fonts.load(`${weight.italic ? 'italic ' : ''}${weight.weight} ${NAME_SIZE}px ${family.css}`, font.family)
    } catch {
      // Measure with whatever font is there.
    }
    if (!box.current || !sample.current) return
    const available = box.current.clientWidth - 2 * NAME_PADDING
    const width = sample.current.getComputedTextLength()
    setSize(width > available && width > 0 ? Math.max(8, (NAME_SIZE * available) / width) : NAME_SIZE)
  }, [family.css, font.family, weight.italic, weight.weight])

  useLayoutEffect(() => {
    fit()
  }, [fit, family.ready])

  useEffect(() => {
    if (!box.current) return undefined
    const observer = new ResizeObserver(() => fit())
    observer.observe(box.current)
    return () => observer.disconnect()
  }, [fit])

  const textProps = {
    x: NAME_PADDING,
    y: NAME_BASELINE,
    fontFamily: family.css,
    fontWeight: weight.weight,
    fontStyle: weight.italic ? 'italic' : 'normal',
    style: { letterSpacing: '-0.04em' },
  }

  return (
    <div className="manual-box manual-font-hero" ref={box}>
      <svg className="manual-font-hero__svg" aria-hidden="true">
        <text ref={sample} {...textProps} fontSize={NAME_SIZE} visibility="hidden">
          {font.family}
        </text>
        <text {...textProps} fontSize={size}>
          {font.family}
        </text>
      </svg>
      <span className="manual-font-hero__name-label">{font.family}</span>
      <div className="manual-font-hero__top">
        {font.source === 'google' ? (
          <span className="manual-font-hero__google">
            <GoogleIcon />
          </span>
        ) : null}
        <span className="manual-font-hero__count">{pesosLabel(weights.length)}</span>
      </div>
      <button
        type="button"
        className="manual-box__download"
        aria-label={`Baixar ${font.family}`}
        disabled={download === 'busy'}
        onClick={start}
      >
        <DownloadSimple size={24} color="#000000" weight="regular" />
      </button>
      {download === 'error' ? <span className="manual-font-hero__error">Não foi possível baixar</span> : null}
    </div>
  )
}

function WeightRow({ font, weight, family }) {
  const [download, start] = useDownload(() => downloadWeight(font, weight))
  return (
    <div className="manual-weight">
      <div className="manual-weight__info">
        <span
          className="manual-weight__aa"
          style={{ fontFamily: family.css, fontWeight: weight.weight, fontStyle: weight.italic ? 'italic' : 'normal' }}
        >
          Aa
        </span>
        <span className="manual-weight__text">{styleName(weight.weight, weight.italic)}</span>
        <span className="manual-weight__text">{weight.weight}</span>
      </div>
      <button type="button" className="manual-weight__download" disabled={download === 'busy'} onClick={start}>
        {download === 'error' ? 'Não foi possível baixar' : 'Download peso'}
      </button>
    </div>
  )
}

function FontSection({ font }) {
  const family = useFontFamily(font)
  const weights = selectedWeights(font)
  return (
    <section id={`font-${font.type}`} className="manual-font-section">
      <FontHero font={font} weights={weights} family={family} />
      <div className="manual-text-block manual-font-info">
        <h2 className="manual-h2">{FONT_SECTION_TITLES[font.type]}</h2>
        {font.description ? <p className="manual-p">{font.description}</p> : null}
        <h3 className="manual-h3">Casos de uso</h3>
        {font.useCases ? <p className="manual-p">{font.useCases}</p> : null}
      </div>
      <div className="manual-weights">
        <h2 className="manual-h2">Pesos</h2>
        <div className="manual-weights__list">
          {weights.map((weight, index) => (
            <div key={`${weight.weight}${weight.italic ? 'i' : ''}`} className="manual-weights__item">
              <WeightRow font={font} weight={weight} family={family} />
              {index < weights.length - 1 ? <div className="manual-divider" /> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// The Tipografia page (Figma node 6479:5610): the intro, then a section per font type with
// the hero box, the description and the list of weights.
export default function ManualTypographyPage({ identity, sub }) {
  const types = visibleFontTypes(identity)
  return (
    <>
      <div className="manual-intro">
        {TYPOGRAPHY_INTRO(identity.name).map((text) => (
          <p key={text}>{text}</p>
        ))}
      </div>
      <ManualScrollSections
        slug="tipografia"
        idPrefix="font"
        ids={types}
        sub={sub}
        identityId={identity.id}
        className="manual-font-list"
      >
        {types.map((type) => (
          <FontSection key={type} font={identity.tipografia.find((font) => font.type === type)} />
        ))}
      </ManualScrollSections>
    </>
  )
}

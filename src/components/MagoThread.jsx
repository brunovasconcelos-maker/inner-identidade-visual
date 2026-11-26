import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, Copy, DownloadSimple, FileArchive, TrademarkRegistered } from '@phosphor-icons/react'
import { useObjectUrl } from '../hooks/useObjectUrl.js'
import { findLogoType } from '../data/logoTypes.js'
import { finishMessage } from '../data/magoChatStore.js'
import { blocksFor } from '../data/magoAnswers.js'
import { isVeryLight } from '../data/palette.js'
import { saveBlob } from '../utils/download.js'
import { EASE_DECELERATE } from '../motion/tokens.js'

const DECELERATE = EASE_DECELERATE
const WORD_MS = 40
const TILE_REVEAL_MS = 400
const TILE_FADE_MS = 300
const ZIP_MIN_MS = 600
const CHIP_REVEAL_MS = 200
const CHIP_FADE_MS = 200

// Calls `fn` once, whenever it is first needed (stable across re-renders).
function useLatest(fn) {
  const ref = useRef(fn)
  ref.current = fn
  return ref
}

// ---------- pieces of an answer. mode: 'active' (plays, then calls onDone) | 'done' (static) ----------

// Streams the text word by word, each word fading in. `segments` are { t, b } (b = bold).
// Reduced motion: the whole text fades in.
function StreamText({ segments, mode, reduced, onDone }) {
  const words = useMemo(
    () => segments.flatMap((segment) => (segment.t.match(/\S+\s*|\s+/g) || []).map((w) => ({ w, b: Boolean(segment.b) }))),
    [segments],
  )
  const [count, setCount] = useState(mode === 'done' || reduced ? words.length : 0)
  const done = useLatest(onDone)

  useEffect(() => {
    if (mode !== 'active') return undefined
    if (reduced) {
      const id = setTimeout(() => done.current(), 150)
      return () => clearTimeout(id)
    }
    let shown = 0
    const id = setInterval(() => {
      shown += 1
      setCount(shown)
      if (shown >= words.length) {
        clearInterval(id)
        done.current()
      }
    }, WORD_MS)
    return () => clearInterval(id)
  }, [mode, reduced, words, done])

  const animated = mode === 'active'
  return (
    <span className={reduced && animated ? 'mago-fade' : undefined}>
      {words.slice(0, count).map((word, index) => {
        const classes = [word.b ? 'mago-msg__bold' : '', animated && !reduced ? 'mago-word' : ''].filter(Boolean).join(' ')
        return (
          <span key={index} className={classes || undefined}>
            {word.w}
          </span>
        )
      })}
    </span>
  )
}

// Fades its children in (duration in seconds) and then calls onDone.
function FadeIn({ mode, duration = 0.2, onDone, className, children }) {
  const done = useLatest(onDone)
  return (
    <motion.span
      className={className}
      initial={mode === 'active' ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration, ease: DECELERATE }}
      onAnimationComplete={() => {
        if (mode === 'active') done.current()
      }}
    >
      {children}
    </motion.span>
  )
}

// Green dot (the Logo folder icon, small) plus an underlined link.
function FolderLink({ href, onOpen, children }) {
  return (
    <span className="mago-msg__link-group">
      <span className="mago-msg__dot" aria-hidden="true">
        <TrademarkRegistered size={8} color="#2acc60" weight="fill" />
      </span>
      <a
        className="mago-msg__link"
        href={href}
        onClick={(event) => {
          event.preventDefault()
          onOpen()
        }}
      >
        {children}
      </a>
    </span>
  )
}

function LogoTile({ logo, shown, instant }) {
  const url = useObjectUrl(logo.file)
  const label = findLogoType(logo.type)?.label || 'Logo'
  return (
    <motion.div
      className="mago-tile"
      initial={instant ? false : { opacity: 0, scale: 0.96 }}
      animate={shown ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
      transition={{ duration: TILE_FADE_MS / 1000, ease: DECELERATE }}
      style={{ pointerEvents: shown ? 'auto' : 'none' }}
    >
      {url && <img className="mago-tile__image" src={url} alt={label} draggable="false" />}
      <button
        type="button"
        className="mago-tile__download"
        aria-label={`Baixar ${logo.fileName}`}
        onClick={() => saveBlob(logo.file, logo.fileName)}
      >
        <DownloadSimple size={16} color="#5d5d5d" weight="regular" />
      </button>
    </motion.div>
  )
}

// All tiles show as skeletons, then turn into their logo one at a time, left to right.
function LogoTiles({ logos, mode, reduced, onDone }) {
  const [revealed, setRevealed] = useState(mode === 'done' || reduced ? logos.length : 0)
  const done = useLatest(onDone)

  useEffect(() => {
    if (mode !== 'active') return undefined
    if (reduced) {
      const id = setTimeout(() => done.current(), 150)
      return () => clearTimeout(id)
    }
    let timer
    let shown = 0
    const step = () => {
      shown += 1
      setRevealed(shown)
      timer = setTimeout(shown >= logos.length ? () => done.current() : step, shown >= logos.length ? TILE_FADE_MS : TILE_REVEAL_MS)
    }
    timer = setTimeout(step, TILE_REVEAL_MS)
    return () => clearTimeout(timer)
  }, [mode, reduced, logos.length, done])

  const showSkeleton = !reduced && mode !== 'done'
  return (
    <div className={`mago-msg__tiles${reduced && mode === 'active' ? ' mago-fade' : ''}`}>
      {logos.map((logo, index) => (
        <div className="mago-tile-slot" key={logo.id}>
          {showSkeleton && (
            <motion.div
              className="mago-skeleton mago-skeleton--tile"
              initial={false}
              animate={{ opacity: revealed > index ? 0 : 1 }}
              transition={{ duration: TILE_FADE_MS / 1000, ease: DECELERATE }}
            />
          )}
          <LogoTile logo={logo} shown={revealed > index} instant={mode === 'done' || reduced} />
        </div>
      ))}
    </div>
  )
}

function ZipSkeleton() {
  return (
    <div className="mago-zip-skeleton" aria-hidden="true">
      <span className="mago-skeleton mago-zip-skeleton__icon" />
      <span className="mago-zip-skeleton__lines">
        <span className="mago-skeleton mago-zip-skeleton__line mago-zip-skeleton__line--name" />
        <span className="mago-skeleton mago-zip-skeleton__line mago-zip-skeleton__line--meta" />
      </span>
    </div>
  )
}

// A skeleton card until the zip is ready (at least 600ms), then it crossfades into the real card.
function ZipStep({ zip, mode, reduced, onDone }) {
  const instant = mode === 'done' || reduced
  const [minElapsed, setMinElapsed] = useState(instant)
  const done = useLatest(onDone)
  const ready = Boolean(zip) && minElapsed

  useEffect(() => {
    if (mode !== 'active' || instant) return undefined
    const id = setTimeout(() => setMinElapsed(true), ZIP_MIN_MS)
    return () => clearTimeout(id)
  }, [mode, instant])

  useEffect(() => {
    if (mode !== 'active' || !ready) return undefined
    const id = setTimeout(() => done.current(), instant ? 150 : TILE_FADE_MS)
    return () => clearTimeout(id)
  }, [mode, ready, instant, done])

  return (
    <div className="mago-zipbox">
      {!reduced && (
        <motion.div
          className="mago-zipbox__layer"
          initial={false}
          animate={{ opacity: ready ? 0 : 1 }}
          transition={{ duration: TILE_FADE_MS / 1000, ease: DECELERATE }}
        >
          <ZipSkeleton />
        </motion.div>
      )}
      <motion.div
        className="mago-zipbox__layer"
        initial={instant && mode === 'done' ? false : { opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: instant ? 0.15 : TILE_FADE_MS / 1000, ease: DECELERATE }}
        style={{ pointerEvents: ready ? 'auto' : 'none' }}
      >
        {zip && (
          <button type="button" className="mago-zip" onClick={() => saveBlob(zip.blob, zip.fileName)}>
            <span className="mago-zip__icon">
              <FileArchive size={24} color="#5d5d5d" weight="regular" />
            </span>
            <span className="mago-zip__texts">
              <span className="mago-zip__name">{zip.fileName}</span>
              <span className="mago-zip__meta">{`Documento · ZIP · ${zip.sizeLabel}`}</span>
            </span>
            <DownloadSimple size={24} color="#5d5d5d" weight="regular" />
          </button>
        )}
      </motion.div>
    </div>
  )
}

// Color chip: swatch, hex, (name) and the copy icon. Clicking copies the hex.
function ColorChip({ chip, shown, instant }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(chip.hex)
    } catch (error) {
      console.error('Could not copy', error)
    }
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1500)
  }

  return (
    <motion.button
      type="button"
      className="mago-chip"
      aria-label={`Copiar ${chip.hex}`}
      onClick={copy}
      initial={instant ? false : { opacity: 0 }}
      animate={{ opacity: shown ? 1 : 0 }}
      transition={{ duration: CHIP_FADE_MS / 1000, ease: DECELERATE }}
      style={{ pointerEvents: shown ? 'auto' : 'none' }}
    >
      <span
        className="mago-chip__swatch"
        style={{ background: chip.hex, boxShadow: isVeryLight(chip.hex) ? 'inset 0 0 0 1px #dedede' : undefined }}
      />
      <span className="mago-chip__hex">{chip.hex}</span>
      {chip.step && <span className="mago-chip__step">{`· ${chip.step}`}</span>}
      {chip.step && chip.main && <span className="mago-chip__step">(principal)</span>}
      {copied ? (
        <Check size={20} color="#5d5d5d" weight="regular" />
      ) : (
        <Copy size={20} color="#5d5d5d" weight="regular" />
      )}
      {copied && (
        <span className="mago-chip__tip" role="status">
          Copiado
        </span>
      )}
    </motion.button>
  )
}

// A group of chips: skeletons first, then each one fills in, 200ms apart.
function ChipGroup({ chips, mode, reduced, onDone }) {
  const [revealed, setRevealed] = useState(mode === 'done' || reduced ? chips.length : 0)
  const done = useLatest(onDone)

  useEffect(() => {
    if (mode !== 'active') return undefined
    if (reduced) {
      const id = setTimeout(() => done.current(), 150)
      return () => clearTimeout(id)
    }
    let timer
    let shown = 0
    const step = () => {
      shown += 1
      setRevealed(shown)
      timer = setTimeout(shown >= chips.length ? () => done.current() : step, shown >= chips.length ? CHIP_FADE_MS : CHIP_REVEAL_MS)
    }
    timer = setTimeout(step, CHIP_REVEAL_MS)
    return () => clearTimeout(timer)
  }, [mode, reduced, chips.length, done])

  const showSkeleton = !reduced && mode !== 'done'
  return (
    <div className={`mago-chips${reduced && mode === 'active' ? ' mago-fade' : ''}`}>
      {chips.map((chip, index) => (
        <div className="mago-chip-slot" key={`${chip.hex}-${index}`}>
          {showSkeleton && (
            <motion.div
              className="mago-skeleton mago-skeleton--chip"
              initial={false}
              animate={{ opacity: revealed > index ? 0 : 1 }}
              transition={{ duration: CHIP_FADE_MS / 1000, ease: DECELERATE }}
            />
          )}
          <ColorChip chip={chip} shown={revealed > index} instant={mode === 'done' || reduced} />
        </div>
      ))}
    </div>
  )
}

// ---------- the answer: each line starts only after the previous one finished ----------

// One step per line: a text, then its link (if any), a group of tiles or chips, the zip,
// and the timestamp last.
function stepsFor(answer) {
  const steps = []
  blocksFor(answer).forEach((block, index) => {
    steps.push({ key: `${index}`, block })
    if (block.type === 'text' && block.link) steps.push({ key: `${index}:link`, block, link: true })
  })
  steps.push({ key: 'time', time: true })
  return steps
}

function Answer({ identityId, message, onOpenFolder }) {
  const reduced = useReducedMotion()
  const { answer } = message
  const steps = useMemo(() => stepsFor(answer), [answer])
  const [stage, setStage] = useState(message.done ? steps.length : 0)
  const finished = useRef(Boolean(message.done))

  // Reaching the end (or leaving the chat mid-way) marks the answer as played.
  useEffect(() => {
    if (stage >= steps.length && !finished.current) {
      finished.current = true
      finishMessage(identityId, message.id)
    }
  }, [stage, steps.length, identityId, message.id])
  useEffect(
    () => () => {
      if (!finished.current) {
        finished.current = true
        finishMessage(identityId, message.id)
      }
    },
    [identityId, message.id],
  )

  const modeOf = (index) => (index > stage ? null : index === stage ? 'active' : 'done')
  const advance = (index) => () => setStage((current) => (current === index ? current + 1 : current))

  const nodes = []
  steps.forEach((step, index) => {
    const mode = modeOf(index)
    if (!mode) return
    if (step.time) {
      nodes.push(
        <FadeIn key={step.key} mode={mode} duration={reduced ? 0.15 : 0.2} onDone={advance(index)} className="mago-msg__time">
          {message.time}
        </FadeIn>,
      )
      return
    }
    const { block } = step
    if (block.type === 'text') {
      // The text and its link share one row; the link fades in after the last word.
      if (step.link) return
      const linkIndex = block.link ? index + 1 : -1
      const linkMode = linkIndex > 0 ? modeOf(linkIndex) : null
      nodes.push(
        <div className="mago-msg__row" key={step.key}>
          <StreamText segments={block.segments} mode={mode} reduced={reduced} onDone={advance(index)} />
          {linkMode && (
            <FadeIn mode={linkMode} duration={reduced ? 0.15 : 0.2} onDone={advance(linkIndex)}>
              <FolderLink href={`#/id/${identityId}/${block.link.slug}`} onOpen={() => onOpenFolder(block.link.slug)}>
                {block.link.label}
              </FolderLink>
            </FadeIn>
          )}
        </div>,
      )
    } else if (block.type === 'tiles') {
      nodes.push(<LogoTiles key={step.key} logos={block.logos} mode={mode} reduced={reduced} onDone={advance(index)} />)
    } else if (block.type === 'chips') {
      nodes.push(<ChipGroup key={step.key} chips={block.chips} mode={mode} reduced={reduced} onDone={advance(index)} />)
    } else if (block.type === 'zip') {
      nodes.push(<ZipStep key={step.key} zip={answer.zip} mode={mode} reduced={reduced} onDone={advance(index)} />)
    }
  })

  return <div className="mago-msg__mago-stack">{nodes}</div>
}

function Message({ message, animate, identityId, onOpenFolder }) {
  const user = message.role === 'user'
  return (
    <motion.div
      className={`mago-msg ${user ? 'mago-msg--user' : 'mago-msg--mago'}`}
      initial={animate && user ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: DECELERATE }}
    >
      {user ? (
        <div className="mago-msg__user-stack">
          <div className="mago-msg__bubble">{message.text}</div>
          <span className="mago-msg__time mago-msg__time--right">{message.time}</span>
        </div>
      ) : (
        <Answer identityId={identityId} message={message} onOpenFolder={onOpenFolder} />
      )}
    </motion.div>
  )
}

// Three gray dots bouncing in sequence.
function Typing() {
  return (
    <motion.div
      className="mago-typing"
      aria-label="Mago está digitando"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: DECELERATE }}
    >
      <span />
      <span />
      <span />
    </motion.div>
  )
}

// The conversation below the "Hoje" pill. Keeps the newest content in view.
export default function MagoThread({ messages, pending, initialCount, identityId, onOpenFolder, bottomExtra }) {
  const reduced = useReducedMotion()
  const scroller = useRef(null)
  const column = useRef(null)
  const stick = useRef(true)
  const first = useRef(true)
  const behavior = reduced ? 'auto' : 'smooth'

  // A new question always scrolls to the bottom.
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const last = messages[messages.length - 1]
    if (first.current || last?.role === 'user') stick.current = true
    el.scrollTo({ top: el.scrollHeight, behavior: first.current ? 'auto' : behavior })
    first.current = false
  }, [messages.length, pending, behavior])

  // While the answer grows, keep following it unless the user scrolled up.
  useEffect(() => {
    const el = scroller.current
    const col = column.current
    if (!el || !col || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(() => {
      if (stick.current) el.scrollTo({ top: el.scrollHeight, behavior })
    })
    observer.observe(col)
    return () => observer.disconnect()
  }, [behavior])

  const onWheel = (event) => {
    if (event.deltaY < 0) stick.current = false
  }
  const onScroll = () => {
    const el = scroller.current
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 8) stick.current = true
  }

  return (
    <div className="mago-thread" ref={scroller} style={{ bottom: 86 + bottomExtra }} onWheel={onWheel} onScroll={onScroll}>
      <div className="mago-thread__column" ref={column}>
        {messages.map((message, index) => (
          <Message
            key={message.id}
            message={message}
            animate={index >= initialCount}
            identityId={identityId}
            onOpenFolder={onOpenFolder}
          />
        ))}
        {pending > 0 && <Typing />}
      </div>
    </div>
  )
}

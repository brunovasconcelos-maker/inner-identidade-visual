import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { DownloadSimple, FileArchive, TrademarkRegistered } from '@phosphor-icons/react'
import { useObjectUrl } from '../hooks/useObjectUrl.js'
import { findLogoType } from '../data/logoTypes.js'
import { finishMessage } from '../data/magoChatStore.js'
import { saveBlob } from '../utils/download.js'
import { EASE_DECELERATE } from '../motion/tokens.js'

const DECELERATE = EASE_DECELERATE
const WORD_MS = 40
const TILE_REVEAL_MS = 400
const TILE_FADE_MS = 300
const ZIP_MIN_MS = 600

// Calls `fn` once, whenever it is first needed (stable across re-renders).
function useLatest(fn) {
  const ref = useRef(fn)
  ref.current = fn
  return ref
}

// ---------- pieces of an answer. mode: 'active' (plays, then calls onDone) | 'done' (static) ----------

// Streams the text word by word, each word fading in. Reduced motion: the whole text fades in.
function StreamText({ text, mode, reduced, onDone }) {
  const words = useMemo(() => text.split(' '), [text])
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
      {words.slice(0, count).map((word, index) => (
        <span key={index} className={animated && !reduced ? 'mago-word' : undefined}>
          {word}
          {index < words.length - 1 ? ' ' : ''}
        </span>
      ))}
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

// ---------- the answer: each line starts only after the previous one finished ----------

function stepsFor(answer) {
  if (answer.kind === 'logos') {
    return answer.logos.length > 1
      ? ['text', 'link', 'tiles', 'text2', 'zip', 'time']
      : ['text', 'link', 'tiles', 'time']
  }
  if (answer.kind === 'noLogos') return ['text', 'link', 'time']
  return ['text', 'time']
}

function Answer({ identityId, message, folderHref, onOpenFolder }) {
  const reduced = useReducedMotion()
  const { answer } = message
  const steps = useMemo(() => stepsFor(answer), [answer.kind, answer.logos?.length]) // eslint-disable-line react-hooks/exhaustive-deps
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

  const modeOf = (name) => {
    const index = steps.indexOf(name)
    if (index < 0 || index > stage) return null
    return index === stage ? 'active' : 'done'
  }
  const advance = (name) => () => setStage((current) => (steps.indexOf(name) === current ? current + 1 : current))

  const text = modeOf('text')
  const link = modeOf('link')
  const tiles = modeOf('tiles')
  const text2 = modeOf('text2')
  const zip = modeOf('zip')
  const time = modeOf('time')

  const sentence =
    answer.kind === 'logos'
      ? 'Segue todas as logos que encontrei em'
      : answer.kind === 'noLogos'
        ? 'Você ainda não adicionou nenhuma logo.'
        : answer.text
  const linkLabel = answer.kind === 'logos' ? 'Logos' : 'Adicionar logo'

  return (
    <div className="mago-msg__mago-stack">
      {text && (
        <div className="mago-msg__row">
          <StreamText text={sentence} mode={text} reduced={reduced} onDone={advance('text')} />
          {link && (
            <FadeIn mode={link} duration={reduced ? 0.15 : 0.2} onDone={advance('link')}>
              <FolderLink href={folderHref} onOpen={onOpenFolder}>
                {linkLabel}
              </FolderLink>
            </FadeIn>
          )}
        </div>
      )}
      {tiles && <LogoTiles logos={answer.logos} mode={tiles} reduced={reduced} onDone={advance('tiles')} />}
      {text2 && (
        <div className="mago-msg__row">
          <StreamText text="Ou baixe todas juntas" mode={text2} reduced={reduced} onDone={advance('text2')} />
        </div>
      )}
      {zip && <ZipStep zip={answer.zip} mode={zip} reduced={reduced} onDone={advance('zip')} />}
      {time && (
        <FadeIn mode={time} duration={reduced ? 0.15 : 0.2} onDone={advance('time')} className="mago-msg__time">
          {message.time}
        </FadeIn>
      )}
    </div>
  )
}

function Message({ message, animate, identityId, folderHref, onOpenFolder }) {
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
        <Answer identityId={identityId} message={message} folderHref={folderHref} onOpenFolder={onOpenFolder} />
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
            folderHref={`#/id/${identityId}/logo`}
            onOpenFolder={onOpenFolder}
          />
        ))}
        {pending > 0 && <Typing />}
      </div>
    </div>
  )
}

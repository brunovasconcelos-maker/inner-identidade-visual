import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from 'framer-motion'
import { ArrowUp, Plus, X } from '@phosphor-icons/react'
import MagoAvatar from './MagoAvatar'

const MARGIN = 12
const DECELERATE = [0.05, 0.7, 0.1, 1]
const ACCELERATE = [0.3, 0, 0.8, 0.15]
const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (v) => Math.min(1, Math.max(0, v))
const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms))

// Content appears in this order, 60ms apart.
const itemVariants = {
  hidden: { opacity: 0, y: 8, transition: { duration: 0.15 } },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: DECELERATE, delay: index * 0.06 },
  }),
}
const itemVariantsReduced = {
  hidden: { opacity: 0, transition: { duration: 0.15 } },
  visible: { opacity: 1, transition: { duration: 0.15 } },
}

// Mago chat overlay, first state (empty chat). Sending is not built yet.
// The panel morphs from the page input (getOriginRect) to the full panel and back.
export default function MagoChat({ value, onChange, onClose, getOriginRect }) {
  const reduced = useReducedMotion()
  const [contentVisible, setContentVisible] = useState(false)
  const [pulseOn, setPulseOn] = useState(false)
  const inputRef = useRef(null)
  const closingRef = useRef(false)
  const shownRef = useRef(false)
  const openAnim = useRef(null)
  const aliveRef = useRef(true)

  const origin = useRef(getOriginRect()).current
  const progress = useMotionValue(0)
  const rootOpacity = useMotionValue(reduced ? 0 : 1)
  const ox = useMotionValue(origin.left)
  const oy = useMotionValue(origin.top)
  const ow = useMotionValue(origin.width)
  const oh = useMotionValue(origin.height)
  const vw = useMotionValue(window.innerWidth)
  const vh = useMotionValue(window.innerHeight)
  const geo = [progress, ox, oy, ow, oh, vw, vh]

  const left = useTransform(geo, ([p, x]) => lerp(x, MARGIN, p))
  const top = useTransform(geo, ([p, , y]) => lerp(y, MARGIN, p))
  const width = useTransform(geo, ([p, , , w, , viewW]) => lerp(w, viewW - MARGIN * 2, p))
  const height = useTransform(geo, ([p, , , , h, , viewH]) => lerp(h, viewH - MARGIN * 2, p))
  // The input is a pill, so its rendered radius is half its height.
  const radius = useTransform(geo, ([p, , , , h]) => lerp(Math.min(360, h / 2), 0, p))
  const border = useTransform(progress, (p) => `inset 0 0 0 1px rgba(222, 222, 222, ${1 - clamp01(p)})`)
  const layerX = useTransform([left], ([l]) => MARGIN - l)
  const layerY = useTransform([top], ([t]) => MARGIN - t)
  const layerW = useTransform(vw, (viewW) => viewW - MARGIN * 2)
  const layerH = useTransform(vh, (viewH) => viewH - MARGIN * 2)
  const backdropOpacity = useTransform(progress, (p) => clamp01(p))
  const backdropBlur = useTransform(progress, (p) => `blur(${clamp01(p) * 8}px)`)

  const focusInput = () => inputRef.current?.focus({ preventScroll: true })

  // Content shows once the panel is about 70% open.
  useMotionValueEvent(progress, 'change', (p) => {
    if (p >= 0.7 && !shownRef.current && !closingRef.current) {
      shownRef.current = true
      setContentVisible(true)
    }
  })

  // Open: morph (spring), or a plain fade with reduced motion.
  useEffect(() => {
    aliveRef.current = true
    // Take focus now so typing during the animation goes to the chat, not the page input.
    focusInput()
    if (reduced) {
      progress.set(1)
      shownRef.current = true
      setContentVisible(true)
      openAnim.current = animate(rootOpacity, 1, { duration: 0.15 })
    } else {
      openAnim.current = animate(progress, 1, { type: 'spring', stiffness: 260, damping: 30, restDelta: 0.001 })
    }
    openAnim.current.then(() => {
      if (aliveRef.current && !closingRef.current) focusInput()
    })
    return () => {
      aliveRef.current = false
      openAnim.current?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the final size in sync with the window.
  useEffect(() => {
    const onResize = () => {
      vw.set(window.innerWidth)
      vh.set(window.innerHeight)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [vw, vh])

  // Lock the page scroll while the chat is open.
  useEffect(() => {
    const body = document.body
    const previous = { overflow: body.style.overflow, paddingRight: body.style.paddingRight }
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    body.style.overflow = 'hidden'
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`
    return () => {
      body.style.overflow = previous.overflow
      body.style.paddingRight = previous.paddingRight
    }
  }, [])

  // Close: content fades (150ms), then the panel morphs back into the input (300ms).
  const requestClose = async () => {
    if (closingRef.current) return
    closingRef.current = true
    openAnim.current?.stop()
    setPulseOn(false)
    setContentVisible(false)
    if (reduced) {
      await animate(rootOpacity, 0, { duration: 0.15 })
    } else {
      await wait(150)
      const rect = getOriginRect()
      ox.set(rect.left)
      oy.set(rect.top)
      ow.set(rect.width)
      oh.set(rect.height)
      await animate(progress, 0, { duration: 0.3, ease: ACCELERATE })
    }
    if (aliveRef.current) onClose()
  }
  const closeRef = useRef(requestClose)
  closeRef.current = requestClose

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const canSend = value.trim().length > 0
  const variants = reduced ? itemVariantsReduced : itemVariants
  const state = contentVisible ? 'visible' : 'hidden'

  return createPortal(
    <motion.div className="mago-chat" role="dialog" aria-modal="true" aria-label="Mago" style={{ opacity: rootOpacity }}>
      <motion.div
        className="mago-chat__backdrop"
        style={{ opacity: backdropOpacity, backdropFilter: backdropBlur, WebkitBackdropFilter: backdropBlur }}
      />
      <motion.div
        className="mago-chat__panel"
        style={{ left, top, width, height, borderRadius: radius, boxShadow: border }}
      >
        <motion.div className="mago-chat__layer" style={{ x: layerX, y: layerY, width: layerW, height: layerH }}>
          <motion.button
            type="button"
            className="mago-chat__close"
            aria-label="Fechar"
            onClick={requestClose}
            variants={variants}
            custom={3}
            initial="hidden"
            animate={state}
          >
            <X size={24} color="#5d5d5d" weight="regular" />
          </motion.button>
          <div className="mago-chat__today-pos">
            <motion.span className="mago-chat__today" variants={variants} custom={0} initial="hidden" animate={state}>
              Hoje
            </motion.span>
          </div>
          <div className="mago-chat__empty">
            <motion.div
              className="mago-chat__avatar"
              variants={variants}
              custom={1}
              initial="hidden"
              animate={state}
              onAnimationComplete={(definition) => {
                if (definition === 'visible' && !reduced && !closingRef.current) setPulseOn(true)
              }}
            >
              {pulseOn && (
                <>
                  <span className="mago-chat__ring" aria-hidden="true" />
                  <span className="mago-chat__ring mago-chat__ring--2" aria-hidden="true" />
                </>
              )}
              <MagoAvatar size={48} />
            </motion.div>
            <motion.p className="mago__title" variants={variants} custom={2} initial="hidden" animate={state}>
              O que você precisa achar?
            </motion.p>
          </div>
          <div className="mago-chat__bar">
            <motion.div variants={variants} custom={3} initial="hidden" animate={state}>
              <div className="mago__field">
                <button type="button" className="mago__plus" aria-label="Adicionar">
                  <Plus size={20} color="#5d5d5d" weight="regular" />
                </button>
                <input
                  ref={inputRef}
                  className="mago__input"
                  type="text"
                  placeholder="Digite sua busca aqui..."
                  value={value}
                  onChange={(event) => onChange(event.target.value)}
                />
                <button
                  type="button"
                  className={`mago__send${canSend ? ' mago__send--active' : ''}`}
                  aria-label="Enviar"
                  aria-disabled={!canSend}
                  tabIndex={canSend ? 0 : -1}
                >
                  <ArrowUp size={20} color={canSend ? '#ffffff' : '#798282'} weight="regular" />
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>,
    document.body,
  )
}

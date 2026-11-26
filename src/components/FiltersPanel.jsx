import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { X } from '@phosphor-icons/react'
import { useScrollLock } from '../hooks/useScrollLock.js'
import { EASE_ACCELERATE, EASE_DECELERATE } from '../motion/tokens.js'

// "Filtros" side panel (Figma node 6531:20193), shared by every folder page. Render it inside
// an AnimatePresence so it can play its exit: it slides in from the right (400ms, decelerate)
// and out to the right (250ms, accelerate). Reduced motion: a 150ms fade. The content area is
// empty for now; it scrolls on its own, behind the fixed footer.
export default function FiltersPanel({ onClose, onSave = onClose, returnFocusRef }) {
  const reduced = useReducedMotion()
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useScrollLock()

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

  // Focus returns to the "Filtros" button when the panel is gone.
  useEffect(() => {
    const target = returnFocusRef?.current
    return () => target?.focus({ preventScroll: true })
  }, [returnFocusRef])

  const fade = { duration: 0.15 }
  const overlay = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1, transition: fade }, exit: { opacity: 0, transition: fade } }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.4, ease: EASE_DECELERATE } },
        exit: { opacity: 0, transition: { duration: 0.25, ease: EASE_ACCELERATE } },
      }
  const panel = reduced
    ? overlay
    : {
        initial: { x: '100%' },
        animate: { x: 0, transition: { duration: 0.4, ease: EASE_DECELERATE } },
        exit: { x: '100%', transition: { duration: 0.25, ease: EASE_ACCELERATE } },
      }

  return createPortal(
    <div className="filters-panel-root">
      <motion.div className="filters-panel__overlay" onClick={onClose} {...overlay} />
      <motion.aside className="filters-panel" role="dialog" aria-modal="true" aria-label="Filtros" {...panel}>
        <div className="filters-panel__header">
          <h2 className="filters-panel__title">Filtros</h2>
          <button type="button" className="filters-panel__close" aria-label="Fechar" onClick={onClose}>
            <X size={24} color="#5d5d5d" weight="regular" />
          </button>
        </div>
        <div className="filters-panel__content" />
        <div className="filters-panel__footer">
          <button type="button" className="btn btn--ghost filters-panel__cancel" onClick={onClose}>
            <span className="btn__label btn__label--plain">Cancelar</span>
          </button>
          <button type="button" className="btn btn--primary filters-panel__save" onClick={onSave}>
            <span className="btn__label btn__label--plain">Salvar filtros</span>
          </button>
        </div>
      </motion.aside>
    </div>,
    document.body,
  )
}

import { useEffect, useLayoutEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ManualLogoSection from './ManualLogoSection.jsx'
import { LOGO_TYPES } from '../../data/logoTypes.js'
import { manualPath } from '../../data/manual.js'

// Event the sidebar sends when a logo sub option is clicked.
export const LOGO_GOTO_EVENT = 'manual-logo-goto'

// A section counts as the one in view when its top has passed this line (px from the top).
const SPY_LINE = 200

// The Logo page: one continuous scroll with a section per existing logo type, in type
// order. The sidebar follows the scroll (scroll spy), a click on a sub option scrolls to its
// section, and the URL follows with `replace`, so the scroll adds no history entries.
export default function ManualLogoPage({ identity, sub }) {
  const navigate = useNavigate()
  const types = LOGO_TYPES.filter((type) => identity.logos.some((logo) => logo.type === type.id))
  const state = useRef({ sub, handled: null, locked: false, unlock: 0 })
  state.current.sub = sub
  const idRef = useRef(identity.id)
  idRef.current = identity.id

  function lockSpy() {
    state.current.locked = true
    clearTimeout(state.current.unlock)
    // Fallback: a scroll that never starts (already in place) must not lock the spy forever.
    state.current.unlock = setTimeout(() => {
      state.current.locked = false
    }, 1000)
  }

  // Opening the URL (or arriving from another page) scrolls to the section. Changes that
  // come from the spy or from a click have already handled their own scrolling.
  useLayoutEffect(() => {
    if (state.current.handled === sub) {
      state.current.handled = null
      return
    }
    const el = document.getElementById(`logo-${sub}`)
    if (!el) return
    lockSpy()
    el.scrollIntoView({ block: 'start', behavior: 'auto' })
  }, [sub])

  useEffect(() => {
    let idleTimer
    const sections = () => types.map((type) => document.getElementById(`logo-${type.id}`)).filter(Boolean)

    function onScroll() {
      // While scrolling by code, the spy waits for the scroll to settle.
      if (state.current.locked) {
        clearTimeout(idleTimer)
        idleTimer = setTimeout(() => {
          state.current.locked = false
        }, 150)
        return
      }
      const list = sections()
      if (list.length === 0) return
      let active = list[0]
      for (const el of list) if (el.getBoundingClientRect().top <= SPY_LINE) active = el
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      if (atBottom && window.scrollY > 0) active = list[list.length - 1]
      const id = active.id.replace('logo-', '')
      if (id !== state.current.sub) {
        state.current.handled = id
        navigate(manualPath(idRef.current, 'logo', id), { replace: true })
      }
    }

    function onGoto(event) {
      const id = event.detail
      const el = document.getElementById(`logo-${id}`)
      if (!el) return
      lockSpy()
      if (id !== state.current.sub) {
        state.current.handled = id
        navigate(manualPath(idRef.current, 'logo', id), { replace: true })
      }
      el.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener(LOGO_GOTO_EVENT, onGoto)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener(LOGO_GOTO_EVENT, onGoto)
      clearTimeout(idleTimer)
    }
    // The set of types only changes with the identity data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types.map((type) => type.id).join(), navigate])

  return (
    <div className="manual-sections">
      {types.map((type) => (
        <ManualLogoSection key={type.id} identity={identity} logo={identity.logos.find((logo) => logo.type === type.id)} />
      ))}
    </div>
  )
}

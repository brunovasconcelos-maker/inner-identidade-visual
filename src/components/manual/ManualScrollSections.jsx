import { useEffect, useLayoutEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { manualPath } from '../../data/manual.js'

// Event the sidebar sends when a sub option of a scrolling page is clicked:
// detail = { slug, id }.
export const MANUAL_GOTO_EVENT = 'manual-goto'

// A section counts as the one in view when its top has passed this line (px from the top).
const SPY_LINE = 200

// Pages of the manual with sub options (Logo, Paleta de cores) are one continuous scroll with
// a section per sub option. Every section is an element with the id `${idPrefix}-${id}`.
// The sidebar follows the scroll (scroll spy), a click on a sub option scrolls to its section
// and the URL follows with `replace`, so scrolling adds no history entries. The first
// section shows the page from the very top, with its title.
export default function ManualScrollSections({ slug, idPrefix, ids, sub, identityId, className, children }) {
  const navigate = useNavigate()
  const state = useRef({ sub, handled: null, locked: false, unlock: 0 })
  state.current.sub = sub
  const idRef = useRef(identityId)
  idRef.current = identityId
  const idsKey = ids.join()

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
    const el = document.getElementById(`${idPrefix}-${sub}`)
    if (!el) return
    lockSpy()
    if (ids[0] === sub) window.scrollTo(0, 0)
    else el.scrollIntoView({ block: 'start', behavior: 'auto' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub])

  useEffect(() => {
    let idleTimer
    const sections = () => ids.map((id) => document.getElementById(`${idPrefix}-${id}`)).filter(Boolean)

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
      const id = active.id.slice(idPrefix.length + 1)
      if (id !== state.current.sub) {
        state.current.handled = id
        navigate(manualPath(idRef.current, slug, id), { replace: true })
      }
    }

    function onGoto(event) {
      if (event.detail.slug !== slug) return
      const id = event.detail.id
      const el = document.getElementById(`${idPrefix}-${id}`)
      if (!el) return
      lockSpy()
      if (id !== state.current.sub) {
        state.current.handled = id
        navigate(manualPath(idRef.current, slug, id), { replace: true })
      }
      if (ids[0] === id) window.scrollTo({ top: 0, behavior: 'smooth' })
      else el.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener(MANUAL_GOTO_EVENT, onGoto)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener(MANUAL_GOTO_EVENT, onGoto)
      clearTimeout(idleTimer)
    }
    // The set of sections only changes with the identity data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, navigate, slug, idPrefix])

  return <div className={className}>{children}</div>
}

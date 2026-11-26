import { useEffect } from 'react'

// Locks the page scroll while the component is mounted. The scrollbar width is added as
// padding so the page does not shift.
export function useScrollLock() {
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
}

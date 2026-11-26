import { useCallback, useEffect, useRef, useState } from 'react'
import { answerFor } from '../data/magoAnswers.js'
import { newId } from '../data/identities.jsx'
import { formatClock } from '../utils/format.js'

// The conversation of ONE open Mago chat. It lives only while the chat is mounted: closing the
// chat drops everything (messages, draft, pending answers). `cancel()` stops the pending answer
// right away (its timers are cleared and nothing is added afterwards).
const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
// The typing indicator lasts 3s (1s with reduced motion).
const typingMs = () => (reducedMotion() ? 1000 : 3000)

// True while the typing indicator shows or an answer is still being played.
export function isAnswering({ messages, pending }) {
  return pending > 0 || messages.some((m) => m.role === 'mago' && !m.done)
}

export function useMagoConversation(identity) {
  const [state, setState] = useState({ messages: [], draft: '', pending: 0 })
  const stateRef = useRef(state)
  stateRef.current = state
  const identityRef = useRef(identity)
  identityRef.current = identity
  const cancelled = useRef(false)
  const timers = useRef(new Set())
  const chain = useRef(Promise.resolve())

  const cancel = useCallback(() => {
    cancelled.current = true
    timers.current.forEach(clearTimeout)
    timers.current.clear()
  }, [])

  // Unmounting cancels too (StrictMode remounts re-arm it).
  useEffect(() => {
    cancelled.current = false
    return cancel
  }, [cancel])

  const sleep = (ms) =>
    new Promise((resolve) => {
      const id = setTimeout(() => {
        timers.current.delete(id)
        resolve()
      }, ms)
      timers.current.add(id)
    })

  const setDraft = useCallback((draft) => setState((current) => ({ ...current, draft })), [])

  const finishMessage = useCallback((messageId) => {
    setState((current) =>
      current.messages.some((m) => m.id === messageId && !m.done)
        ? { ...current, messages: current.messages.map((m) => (m.id === messageId ? { ...m, done: true } : m)) }
        : current,
    )
  }, [])

  // Adds the user message, shows the typing indicator and then adds the answer.
  const send = useCallback((rawText) => {
    const text = rawText.trim()
    if (!text || cancelled.current || isAnswering(stateRef.current)) return
    const history = stateRef.current.messages
    setState((current) => ({
      ...current,
      draft: '',
      pending: current.pending + 1,
      messages: [...current.messages, { id: newId(), role: 'user', text, time: formatClock() }],
    }))

    const run = async () => {
      if (cancelled.current) return
      const startedAt = Date.now()
      let answer
      try {
        answer = await answerFor(text, identityRef.current, history)
      } catch (error) {
        console.error('Mago could not answer', error)
        answer = { kind: 'unknown', text: 'Não consegui buscar isso agora. Tente de novo.' }
      }
      await sleep(Math.max(0, typingMs() - (Date.now() - startedAt)))
      if (cancelled.current) return
      const messageId = newId()
      setState((current) => ({
        ...current,
        pending: current.pending - 1,
        messages: [...current.messages, { id: messageId, role: 'mago', answer, time: formatClock(), done: false }],
      }))
      // The zip is built when the answer is created; the card shows when it is ready.
      if (answer.zipPromise) {
        answer.zipPromise.then((zip) => {
          if (cancelled.current) return
          setState((current) => ({
            ...current,
            messages: current.messages.map((m) => (m.id === messageId ? { ...m, answer: { ...m.answer, zip } } : m)),
          }))
        })
      }
    }
    chain.current = chain.current.then(run)
  }, [])

  return { ...state, answering: isAnswering(state), setDraft, send, finishMessage, cancel }
}

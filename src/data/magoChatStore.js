import { newId } from './identities.jsx'
import { answerFor } from './magoAnswers.js'
import { formatClock } from '../utils/format.js'

// Mago conversations, one per identity. Lives in memory: it survives closing the chat and
// navigating inside the app, and resets on page refresh.
const EMPTY = { messages: [], draft: '', pending: 0 }
const conversations = new Map()
const chains = new Map()
const listeners = new Set()

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
// The typing indicator lasts 3s (1s with reduced motion).
const typingMs = () => (reducedMotion() ? 1000 : 3000)

// True while the typing indicator shows or an answer is still being played.
export function isAnswering(conversation) {
  return conversation.pending > 0 || conversation.messages.some((m) => m.role === 'mago' && !m.done)
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getConversation(identityId) {
  return conversations.get(identityId) || EMPTY
}

function update(identityId, change) {
  conversations.set(identityId, { ...getConversation(identityId), ...change })
  listeners.forEach((listener) => listener())
}

// Marks an answer as fully played (reopening the chat shows it complete).
export function finishMessage(identityId, messageId) {
  const current = getConversation(identityId)
  if (!current.messages.some((m) => m.id === messageId && !m.done)) return
  update(identityId, {
    messages: current.messages.map((m) => (m.id === messageId ? { ...m, done: true } : m)),
  })
}

function setAnswerZip(identityId, messageId, zip) {
  const current = getConversation(identityId)
  update(identityId, {
    messages: current.messages.map((m) =>
      m.id === messageId ? { ...m, answer: { ...m.answer, zip } } : m,
    ),
  })
}

export function setDraft(identityId, draft) {
  update(identityId, { draft })
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Adds the user message, shows the typing indicator for 800ms and then adds the answer.
export function sendMessage(identity, rawText) {
  const text = rawText.trim()
  if (!text) return
  const id = identity.id
  const current = getConversation(id)
  if (isAnswering(current)) return
  update(id, {
    draft: '',
    pending: current.pending + 1,
    messages: [...current.messages, { id: newId(), role: 'user', text, time: formatClock() }],
  })

  const run = async () => {
    const startedAt = Date.now()
    let answer
    try {
      answer = await answerFor(text, identity, getConversation(id).messages)
    } catch (error) {
      console.error('Mago could not answer', error)
      answer = { kind: 'unknown', text: 'Não consegui buscar isso agora. Tente de novo.' }
    }
    await wait(Math.max(0, typingMs() - (Date.now() - startedAt)))
    const latest = getConversation(id)
    const messageId = newId()
    update(id, {
      pending: latest.pending - 1,
      messages: [...latest.messages, { id: messageId, role: 'mago', answer, time: formatClock(), done: false }],
    })
    // The zip is built when the answer is created; the card shows when it is ready.
    if (answer.zipPromise) answer.zipPromise.then((zip) => setAnswerZip(id, messageId, zip))
  }
  // Answers keep the order of the questions.
  const previous = chains.get(id) || Promise.resolve()
  chains.set(id, previous.then(run))
}

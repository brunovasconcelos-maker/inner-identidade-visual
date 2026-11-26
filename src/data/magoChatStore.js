import { newId } from './identities.jsx'
import { answerFor } from './magoAnswers.js'
import { formatClock } from '../utils/format.js'

// Mago conversations, one per identity. Lives in memory: it survives closing the chat and
// navigating inside the app, and resets on page refresh.
const EMPTY = { messages: [], draft: '', pending: 0 }
const conversations = new Map()
const chains = new Map()
const listeners = new Set()

const TYPING_MS = 800

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
  update(id, {
    draft: '',
    pending: current.pending + 1,
    messages: [...current.messages, { id: newId(), role: 'user', text, time: formatClock() }],
  })

  const run = async () => {
    const startedAt = Date.now()
    let answer
    try {
      answer = await answerFor(text, identity)
    } catch (error) {
      console.error('Mago could not answer', error)
      answer = { kind: 'unknown', text: 'Não consegui buscar isso agora. Tente de novo.' }
    }
    await wait(Math.max(0, TYPING_MS - (Date.now() - startedAt)))
    const latest = getConversation(id)
    update(id, {
      pending: latest.pending - 1,
      messages: [...latest.messages, { id: newId(), role: 'mago', answer, time: formatClock() }],
    })
  }
  // Answers keep the order of the questions.
  const previous = chains.get(id) || Promise.resolve()
  chains.set(id, previous.then(run))
}

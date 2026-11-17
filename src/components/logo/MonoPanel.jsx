import { useState } from 'react'
import { ArrowsCounterClockwise, FilePlus, Trash } from '@phosphor-icons/react'
import SidePanel from './SidePanel.jsx'
import MonoThumb from './MonoThumb.jsx'
import { newId } from '../../data/identities.jsx'
import { pickImage } from '../../utils/files.js'

const SLOTS = [
  { id: 'preto', name: 'Preto', description: 'Pronta pra fundos claros e impressões em preto.' },
  {
    id: 'branco',
    name: 'Branco',
    description: 'Pronta pra fundos escuros e aplicações em negativo.',
  },
]
const SLOT_IDS = SLOTS.map((slot) => slot.id)

export default function MonoPanel({ initial, onSave, onCancel }) {
  const [versions, setVersions] = useState(initial)
  const [pending, setPending] = useState(null) // new color waiting for its name
  const [error, setError] = useState(null)

  const byId = (id) => versions.find((version) => version.id === id)
  const customs = versions.filter((version) => !SLOT_IDS.includes(version.id))

  async function fillSlot(slot) {
    const picked = await pickImage(setError)
    if (!picked) return
    setVersions((current) => [
      ...current.filter((version) => version.id !== slot.id),
      {
        id: slot.id,
        name: slot.name,
        file: picked.file,
        fileName: picked.file.name,
        previewBg: picked.previewBg,
      },
    ])
  }

  async function replace(version) {
    const picked = await pickImage(setError)
    if (!picked) return
    setVersions((current) =>
      current.map((item) =>
        item.id === version.id
          ? { ...item, file: picked.file, fileName: picked.file.name, previewBg: picked.previewBg }
          : item,
      ),
    )
  }

  function remove(version) {
    setVersions((current) => current.filter((item) => item.id !== version.id))
  }

  async function startAddColor() {
    const picked = await pickImage(setError)
    if (picked) setPending({ ...picked, name: '' })
  }

  function confirmColor() {
    const name = pending.name.trim()
    if (!name) return
    setVersions((current) => [
      ...current,
      {
        id: newId(),
        name,
        file: pending.file,
        fileName: pending.file.name,
        previewBg: pending.previewBg,
      },
    ])
    setPending(null)
  }

  function handleSave() {
    // Slots first (Preto, Branco), then the custom colors in the order they were added.
    const ordered = [...SLOT_IDS.map(byId).filter(Boolean), ...customs]
    onSave(ordered)
  }

  function filledRow(version) {
    return (
      <div className="mono-row mono-row--filled" key={version.id}>
        <MonoThumb file={version.file} bg={version.previewBg} />
        <span className="mono-row__name">{version.name}</span>
        <button
          type="button"
          className="icon-action"
          aria-label={`Remover ${version.name}`}
          onClick={() => remove(version)}
        >
          <Trash size={20} color="#5d5d5d" weight="regular" />
        </button>
        <button
          type="button"
          className="icon-action"
          aria-label={`Substituir ${version.name}`}
          onClick={() => replace(version)}
        >
          <ArrowsCounterClockwise size={20} color="#5d5d5d" weight="regular" />
        </button>
      </div>
    )
  }

  return (
    <SidePanel title="Versões monocromáticas" onCancel={onCancel} onSave={handleSave}>
      <div className="option-list">
        {SLOTS.map((slot) => {
          const version = byId(slot.id)
          if (version) return filledRow(version)
          return (
            <button
              type="button"
              className="mono-row mono-row--slot"
              key={slot.id}
              onClick={() => fillSlot(slot)}
            >
              <span className="mono-row__tile">
                <FilePlus size={24} color="#5d5d5d" weight="regular" />
              </span>
              <span className="option-card__texts">
                <span className="option-card__title">{slot.name}</span>
                <span className="option-card__description">{slot.description}</span>
              </span>
            </button>
          )
        })}
        {customs.map(filledRow)}
        {pending ? (
          <div className="mono-row mono-row--filled">
            <MonoThumb file={pending.file} bg={pending.previewBg} />
            <input
              className="inline-input inline-input--boxed"
              type="text"
              value={pending.name}
              placeholder="Nome da cor"
              autoFocus
              autoComplete="off"
              aria-label="Nome da cor"
              onChange={(event) => setPending({ ...pending, name: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  confirmColor()
                } else if (event.key === 'Escape') {
                  event.preventDefault()
                  event.stopPropagation()
                  setPending(null)
                }
              }}
            />
          </div>
        ) : (
          <button type="button" className="mono-row mono-row--slot" onClick={startAddColor}>
            <span className="mono-row__tile">
              <FilePlus size={24} color="#5d5d5d" weight="regular" />
            </span>
            <span className="option-card__title">Adicionar cor</span>
          </button>
        )}
        {error ? <p className="panel-error">{error}</p> : null}
      </div>
    </SidePanel>
  )
}

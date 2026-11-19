import { useEffect, useState } from 'react'
import { Plus, Trash } from '@phosphor-icons/react'
import SidePanel from '../logo/SidePanel.jsx'
import ColorDot from './ColorDot.jsx'
import {
  BASE_STEPS,
  generateTones,
  hexToRgb,
  nextExtraStep,
  parseHex,
  rgbToHex,
  sortTones,
  toneHex,
} from '../../data/palette.js'

// Native color picker laid over the color dot: clicking the dot opens the browser picker.
function SwatchPicker({ hex, label, onPick, disabled = false }) {
  return (
    <span className="swatch-picker">
      <ColorDot hex={hex} />
      {disabled ? null : (
        <input
          type="color"
          className="swatch-picker__input"
          aria-label={label}
          value={hex || '#000000'}
          onChange={(event) => onPick(event.target.value.toUpperCase())}
        />
      )}
    </span>
  )
}

// Hex field with its own text, so a half typed value does not fight the color. A valid
// 6 digit hex applies right away; 3 digits and the "#" shortcut apply when leaving.
function HexInput({ hex, label, onCommit, readOnly = false, placeholder }) {
  const [text, setText] = useState(hex || '')
  useEffect(() => setText(hex || ''), [hex])
  return (
    <input
      className="pal-hex-input"
      type="text"
      value={text}
      placeholder={placeholder}
      aria-label={label}
      readOnly={readOnly}
      maxLength={7}
      spellCheck={false}
      autoComplete="off"
      onChange={(event) => {
        const value = event.target.value.toUpperCase()
        setText(value)
        if (/^#?[0-9A-F]{6}$/.test(value)) onCommit(parseHex(value))
      }}
      onBlur={() => {
        const parsed = parseHex(text)
        if (parsed) onCommit(parsed)
        else setText(hex || '')
      }}
    />
  )
}

export function ToneRow({ tone, onChange, onRemove }) {
  return (
    <div className="pal-tone">
      <p className="pal-tone__step">
        {tone.step}
        {tone.isMain ? ' (principal)' : ''}
      </p>
      <div className="pal-hexbox pal-hexbox--tone">
        <SwatchPicker
          hex={tone.hex}
          label={`Cor do tom ${tone.step}`}
          disabled={tone.isMain}
          onPick={(hex) => onChange(tone.step, hex)}
        />
        <HexInput
          hex={tone.hex}
          label={`Hex do tom ${tone.step}`}
          readOnly={tone.isMain}
          onCommit={(hex) => onChange(tone.step, hex)}
        />
      </div>
      {tone.isMain ? (
        <span className="pal-tone__spacer" />
      ) : (
        <button
          type="button"
          className="icon-action"
          aria-label={`Remover o tom ${tone.step}`}
          onClick={() => onRemove(tone.step)}
        >
          <Trash size={20} color="#5d5d5d" weight="regular" />
        </button>
      )}
    </div>
  )
}

// Color side panel: name, hex and RGB of the main color, and its generated tones.
// `initial` is { name, hex, tones } (empty strings and no tones for a new color).
export default function ColorPanel({ title, initial, onSave, onCancel }) {
  const [name, setName] = useState(initial.name)
  const [color, setColor] = useState(initial.hex || null)
  const [rgbText, setRgbText] = useState(initial.hex ? hexToRgb(initial.hex).map(String) : ['', '', ''])
  const [tones, setTones] = useState(initial.tones)

  // Sets the main color and rebuilds every tone from it, on the steps already in use.
  function applyColor(hex, { keepRgbText = false } = {}) {
    if (hex === color) return
    setColor(hex)
    if (!keepRgbText) setRgbText(hexToRgb(hex).map(String))
    setTones((current) => generateTones(hex, current.length ? current.map((tone) => tone.step) : BASE_STEPS))
  }

  function changeRgb(index, raw) {
    const digits = raw.replace(/\D/g, '').slice(0, 3)
    const value = digits === '' ? '' : String(Math.min(255, Number(digits)))
    const next = rgbText.map((item, i) => (i === index ? value : item))
    setRgbText(next)
    if (next.every((item) => item !== '')) applyColor(rgbToHex(...next.map(Number)), { keepRgbText: true })
  }

  function changeTone(step, hex) {
    setTones((current) => current.map((tone) => (tone.step === step ? { ...tone, hex } : tone)))
  }

  function removeTone(step) {
    setTones((current) => current.filter((tone) => tone.step !== step))
  }

  function addTone() {
    const step = nextExtraStep(tones)
    if (step === null || !color) return
    setTones((current) => sortTones([...current, { step, hex: toneHex(color, step), isMain: false }]))
  }

  const canSave = name.trim() !== '' && color !== null
  const canAdd = color !== null && nextExtraStep(tones) !== null

  return (
    <SidePanel
      title={title}
      saveDisabled={!canSave}
      onCancel={onCancel}
      onSave={() => onSave({ name: name.trim(), hex: color, tones: sortTones(tones) })}
    >
      <div className="pal-panel">
        <div className="pal-large-input">
          <input
            className="pal-large-input__field"
            type="text"
            value={name}
            placeholder="Nome da cor (ex.: Azul)"
            aria-label="Nome da cor"
            autoFocus
            autoComplete="off"
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="pal-values">
          <div className="pal-values__row">
            <p className="pal-values__label">Hex</p>
            <div className="pal-hexbox">
              <SwatchPicker hex={color} label="Escolher cor" onPick={(hex) => applyColor(hex)} />
              <HexInput hex={color} label="Hex" placeholder="#000000" onCommit={applyColor} />
            </div>
          </div>
          <div className="pal-values__row">
            <p className="pal-values__label">RGB</p>
            <div className="pal-rgb">
              {['R', 'G', 'B'].map((channel, index) => (
                <input
                  key={channel}
                  className="pal-rgb__box"
                  type="text"
                  inputMode="numeric"
                  value={rgbText[index]}
                  placeholder="0"
                  aria-label={channel}
                  autoComplete="off"
                  onChange={(event) => changeRgb(index, event.target.value)}
                />
              ))}
              <span className="pal-rgb__box pal-rgb__box--static">100%</span>
            </div>
          </div>
        </div>

        {tones.length > 0 ? (
          <>
            <div className="pal-divider" />
            <div className="pal-tones">
              {sortTones(tones).map((tone) => (
                <ToneRow key={tone.step} tone={tone} onChange={changeTone} onRemove={removeTone} />
              ))}
              {canAdd ? (
                <button type="button" className="pal-add" onClick={addTone}>
                  <span className="pal-add__label">Adicionar</span>
                  <Plus size={20} color="#5d5d5d" weight="regular" />
                </button>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </SidePanel>
  )
}

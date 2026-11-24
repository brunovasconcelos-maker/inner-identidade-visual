import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, MagnifyingGlass, X } from '@phosphor-icons/react'
import { GOOGLE_CATEGORIES, loadGoogleFonts } from '../../data/googleFonts.js'
import { loadGooglePreview } from '../../utils/fonts.js'
import { normalize } from '../../utils/format.js'

// Dropdown to pick a Google font: search, category filter and a list where every family
// is drawn in its own font. Previews load lazily, only for the rows on screen.
export default function FontPicker({ selectedFamily, onSelect, onClose }) {
  const [catalog, setCatalog] = useState(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const rootRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    loadGoogleFonts().then((fonts) => !cancelled && setCatalog(fonts))
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => inputRef.current && inputRef.current.focus(), [])

  // Esc closes only the picker (capture phase, before the modal sees it) and a click
  // outside closes it too.
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      onClose()
    }
    function onMouseDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) onClose()
    }
    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('mousedown', onMouseDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }, [onClose])

  // One observer for all rows: a row that scrolls into view loads its preview once.
  const observer = useMemo(
    () =>
      new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          loadGooglePreview(entry.target.dataset.family)
          observer.unobserve(entry.target)
        }
      }),
    [],
  )
  useEffect(() => () => observer.disconnect(), [observer])

  const results = useMemo(() => {
    if (!catalog) return []
    const term = normalize(query.trim())
    return catalog.filter(
      (font) =>
        (category === 'all' || font.category === category) && normalize(font.family).includes(term),
    )
  }, [catalog, query, category])

  return (
    <div className="font-picker" ref={rootRef} role="dialog" aria-label="Selecionar fonte">
      <div className="font-picker__search">
        <MagnifyingGlass size={20} color="#5d5d5d" weight="regular" />
        <input
          ref={inputRef}
          className="font-picker__input"
          type="text"
          value={query}
          placeholder="Buscar fonte"
          aria-label="Buscar fonte"
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query ? (
          <button
            type="button"
            className="icon-action"
            aria-label="Limpar busca"
            onClick={() => {
              setQuery('')
              inputRef.current.focus()
            }}
          >
            <X size={20} color="#5d5d5d" weight="regular" />
          </button>
        ) : null}
      </div>

      <div className="font-picker__cats" role="tablist" aria-label="Categorias">
        {GOOGLE_CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={category === item.id}
            className={`font-picker__cat${category === item.id ? ' font-picker__cat--active' : ''}`}
            onClick={() => setCategory(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="font-picker__list" role="listbox">
        {catalog === null ? null : results.length === 0 ? (
          <p className="font-picker__empty">Nenhuma fonte encontrada</p>
        ) : (
          results.map((font) => (
            <button
              key={font.family}
              type="button"
              role="option"
              aria-selected={font.family === selectedFamily}
              className="menu-row font-picker__row"
              data-family={font.family}
              ref={(element) => element && observer.observe(element)}
              onClick={() => onSelect(font)}
            >
              <span className="font-picker__name" style={{ fontFamily: `"${font.family}", Inter, sans-serif` }}>
                {font.family}
              </span>
              {font.family === selectedFamily ? <Check size={20} color="#000000" weight="regular" /> : null}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

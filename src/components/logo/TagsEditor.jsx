import { useState } from 'react'
import { Plus, X } from '@phosphor-icons/react'

// Tag chips with an X each. The "+" opens an inline input: Enter adds, Esc cancels.
// Duplicate tags (ignoring case) are not added.
export default function TagsEditor({ tags, onChange }) {
  const [adding, setAdding] = useState(false)
  const [value, setValue] = useState('')

  function stopAdding() {
    setAdding(false)
    setValue('')
  }

  function commit() {
    const tag = value.trim()
    if (tag && !tags.some((item) => item.toLowerCase() === tag.toLowerCase())) {
      onChange([...tags, tag])
    }
    stopAdding()
  }

  return (
    <div className="tags">
      {tags.map((tag) => (
        <span className="tag-chip" key={tag}>
          <span className="tag-chip__label">{tag}</span>
          <button
            type="button"
            className="tag-chip__remove"
            aria-label={`Remover ${tag}`}
            onClick={() => onChange(tags.filter((item) => item !== tag))}
          >
            <X size={18} color="#5d5d5d" weight="regular" />
          </button>
        </span>
      ))}
      {adding ? (
        <input
          className="tag-input"
          type="text"
          value={value}
          autoFocus
          autoComplete="off"
          aria-label="Nova tag"
          onChange={(event) => setValue(event.target.value)}
          onBlur={stopAdding}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commit()
            } else if (event.key === 'Escape') {
              event.preventDefault()
              event.stopPropagation()
              stopAdding()
            }
          }}
        />
      ) : (
        <button
          type="button"
          className="tag-add"
          aria-label="Adicionar tag"
          onClick={() => setAdding(true)}
        >
          <Plus size={19} color="#5d5d5d" weight="regular" />
        </button>
      )}
    </div>
  )
}

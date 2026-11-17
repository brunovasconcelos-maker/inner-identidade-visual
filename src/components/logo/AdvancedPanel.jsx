import { useState } from 'react'
import SidePanel from './SidePanel.jsx'
import TagsEditor from './TagsEditor.jsx'
import UsageRightsSelect from './UsageRightsSelect.jsx'
import { BUILTIN_RIGHTS, toggleUsageRight } from '../../data/usageRights.js'

export default function AdvancedPanel({ initial, customRights: initialCustomRights, onSave, onCancel }) {
  const [description, setDescription] = useState(initial.description)
  const [useCases, setUseCases] = useState(initial.useCases)
  const [tags, setTags] = useState(initial.tags)
  const [usageRights, setUsageRights] = useState(initial.usageRights)
  const [customRights, setCustomRights] = useState(initialCustomRights)

  const options = [...BUILTIN_RIGHTS, ...customRights]

  function handleCreate(name) {
    const existing = options.find((option) => option.toLowerCase() === name.toLowerCase())
    if (existing) {
      // Already an option: just make sure it is checked.
      if (!usageRights.includes(existing)) setUsageRights(toggleUsageRight(usageRights, existing))
      return
    }
    setCustomRights([...customRights, name])
    setUsageRights(toggleUsageRight(usageRights, name))
  }

  return (
    <SidePanel
      title="Opções avançadas"
      onCancel={onCancel}
      onSave={() => onSave({ description, useCases, tags, usageRights, customRights })}
    >
      <div className="panel-fields">
        <div className="panel-field">
          <label className="panel-field__label" htmlFor="logo-description">
            Descrição
          </label>
          <textarea
            id="logo-description"
            className="textarea"
            value={description}
            placeholder="Descreva esse arquivo"
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="panel-field">
          <label className="panel-field__label" htmlFor="logo-use-cases">
            Casos de uso
          </label>
          <textarea
            id="logo-use-cases"
            className="textarea"
            value={useCases}
            placeholder="Onde você pode usar esse arquivo"
            onChange={(event) => setUseCases(event.target.value)}
          />
        </div>
        <div className="panel-field">
          <span className="panel-field__label">Tags</span>
          <TagsEditor tags={tags} onChange={setTags} />
        </div>
        <div className="panel-field">
          <span className="panel-field__label">Direitos de uso</span>
          <UsageRightsSelect
            options={options}
            selected={usageRights}
            onToggle={(right) => setUsageRights(toggleUsageRight(usageRights, right))}
            onCreate={handleCreate}
          />
        </div>
      </div>
    </SidePanel>
  )
}

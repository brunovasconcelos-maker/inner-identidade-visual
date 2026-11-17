export const NOT_APPROVED = 'Não aprovado para uso público'

// Built-in options, in the order shown in the dropdown.
export const BUILTIN_RIGHTS = [
  'Uso interno',
  'Uso em redes sociais',
  'Uso no site',
  'Uso em materiais impressos',
  'Uso comercial/pago (anúncios)',
  'Uso por parceiros/revendedores',
  'Uso com imprensa',
  NOT_APPROVED,
]

// Default selection: every option checked except "Não aprovado para uso público".
export function defaultUsageRights(customRights = []) {
  return [...BUILTIN_RIGHTS.filter((right) => right !== NOT_APPROVED), ...customRights]
}

// Selection after toggling one option. "Não aprovado" excludes all the others.
export function toggleUsageRight(selected, right) {
  const isChecked = selected.includes(right)
  if (right === NOT_APPROVED) return isChecked ? [] : [NOT_APPROVED]
  const others = selected.filter((item) => item !== NOT_APPROVED)
  return isChecked ? others.filter((item) => item !== right) : [...others, right]
}

// Closed field text: first checked option plus "+N usos", or the placeholder.
export function usageRightsSummary(options, selected) {
  const checked = options.filter((option) => selected.includes(option))
  if (checked.length === 0) return null
  if (checked.length === 1) return checked[0]
  const rest = checked.length - 1
  return `${checked[0]}, +${rest} ${rest === 1 ? 'uso' : 'usos'}`
}

// Adds a custom right (checked) to { usageRights, customRights }. A right that already
// exists, ignoring case, is only checked.
export function addCustomRight(state, name) {
  const options = [...BUILTIN_RIGHTS, ...state.customRights]
  const existing = options.find((option) => option.toLowerCase() === name.toLowerCase())
  if (existing) {
    if (state.usageRights.includes(existing)) return state
    return { ...state, usageRights: toggleUsageRight(state.usageRights, existing) }
  }
  return {
    ...state,
    customRights: [...state.customRights, name],
    usageRights: toggleUsageRight(state.usageRights, name),
  }
}

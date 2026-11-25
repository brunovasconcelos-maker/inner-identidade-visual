import { OVERVIEW_LOADERS, FULL_LOADERS } from './setLoaders.js'
import { styleIdOf } from './libraries.js'

const keyOf = (library, styleLabel) => `${library.id}:${styleIdOf(library, styleLabel)}`

// The first 48 icons of a library style in alphabetical order of their official names:
// [[name, svg]]. One small lazy chunk per style.
export async function loadOverview(library, styleLabel) {
  return (await OVERVIEW_LOADERS[keyOf(library, styleLabel)]()).default
}

// Every icon of a library style, sorted by name: [[name, svg]]. A big lazy chunk, loaded only
// when the library zip is built.
export async function loadFullSet(library, styleLabel) {
  return (await FULL_LOADERS[keyOf(library, styleLabel)]()).default
}

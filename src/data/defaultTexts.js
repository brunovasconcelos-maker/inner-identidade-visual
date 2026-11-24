// Default texts of the "Logo principal". They fill an empty description or empty use cases,
// so the brand manual always has something to show (and the user can edit it afterwards).
export function defaultLogoTexts(brandName) {
  return {
    description: `Esta é a versão oficial da logo de ${brandName}. Ela reúne os elementos que representam a marca e deve ser a primeira escolha em qualquer aplicação.`,
    useCases:
      'Use em peças onde a marca precisa ser reconhecida de imediato, como site, redes sociais, embalagens, apresentações e materiais impressos. Aplique sempre a partir dos arquivos originais, sem alterações.',
  }
}

// Returns the logo with its empty fields filled (only for the principal type), or the
// same object when nothing was missing.
export function withDefaultLogoTexts(logo, brandName) {
  if (logo.type !== 'principal') return logo
  const empty = (value) => !String(value || '').trim()
  if (!empty(logo.description) && !empty(logo.useCases)) return logo
  const defaults = defaultLogoTexts(brandName)
  return {
    ...logo,
    description: empty(logo.description) ? defaults.description : logo.description,
    useCases: empty(logo.useCases) ? defaults.useCases : logo.useCases,
  }
}

// Same for every logo of an identity. Returns the same identity when nothing changed.
export function withDefaultTextsInIdentity(identity) {
  const logos = identity.logos.map((logo) => withDefaultLogoTexts(logo, identity.name))
  return logos.some((logo, index) => logo !== identity.logos[index]) ? { ...identity, logos } : identity
}

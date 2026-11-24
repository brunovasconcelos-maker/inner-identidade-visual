// Default texts of the principal and secondary logos. They fill an empty description or
// empty use cases, so the brand manual always has something to show (and the user can edit
// it afterwards). Other logo types have none.
export function defaultLogoTexts(brandName, type) {
  if (type === 'principal') {
    return {
      description: `Esta é a versão oficial da logo de ${brandName}. Ela reúne os elementos que representam a marca e deve ser a primeira escolha em qualquer aplicação.`,
      useCases:
        'Use em peças onde a marca precisa ser reconhecida de imediato, como site, redes sociais, embalagens, apresentações e materiais impressos. Aplique sempre a partir dos arquivos originais, sem alterações.',
    }
  }
  if (type === 'secundaria') {
    return {
      description: `Esta é a versão secundária da logo de ${brandName}. Ela funciona como alternativa à logo principal, mantendo os mesmos elementos de identidade.`,
      useCases:
        'Use quando a logo principal não se encaixar bem no espaço ou na proposta da peça. Aplique sempre a partir dos arquivos originais, sem alterações.',
    }
  }
  return null
}

// Returns the logo with its empty fields filled (principal and secondary only), or the
// same object when nothing was missing.
export function withDefaultLogoTexts(logo, brandName) {
  const defaults = defaultLogoTexts(brandName, logo.type)
  if (!defaults) return logo
  const empty = (value) => !String(value || '').trim()
  if (!empty(logo.description) && !empty(logo.useCases)) return logo
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

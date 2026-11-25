// Default texts of every logo type. They fill an empty description or
// empty use cases, so the brand manual always has something to show (and the user can edit
// it afterwards).
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
  if (type === 'vertical') {
    return {
      description: `Esta é a versão vertical da logo de ${brandName}, com os elementos organizados um sobre o outro. Ela ocupa menos largura e se adapta bem a espaços estreitos.`,
      useCases:
        'Use em formatos altos ou estreitos, como stories, posts verticais, banners laterais e embalagens altas. Aplique sempre a partir dos arquivos originais, sem alterações.',
    }
  }
  if (type === 'horizontal') {
    return {
      description: `Esta é a versão horizontal da logo de ${brandName}, com os elementos organizados lado a lado. Ela ocupa menos altura e funciona bem em espaços largos.`,
      useCases:
        'Use em formatos largos e baixos, como cabeçalhos de site, assinaturas de e-mail, banners e rodapés. Aplique sempre a partir dos arquivos originais, sem alterações.',
    }
  }
  if (type === 'tagline') {
    return {
      description: `Esta é a versão da logo de ${brandName} acompanhada da tagline. Ela une a identidade visual à mensagem principal da marca.`,
      useCases:
        'Use em peças institucionais e de divulgação onde a mensagem da marca precisa aparecer, como campanhas, apresentações e materiais impressos. Evite em tamanhos pequenos, onde a tagline perde a leitura.',
    }
  }
  return null
}

// ---------- fonts ----------

// Default texts of a font by type (principal, secundaria, digital).
export function defaultFontTexts(brandName, type) {
  if (type === 'principal') {
    return {
      description: `A tipografia principal é a fonte mais marcante de ${brandName}. Ela carrega a personalidade da marca e é a primeira a ser percebida nas peças.`,
      useCases:
        'Use em títulos, chamadas, destaques e textos de maior impacto. Prefira tamanhos grandes, onde o desenho da fonte aparece com mais força.',
    }
  }
  if (type === 'secundaria') {
    return {
      description:
        'A tipografia secundária acompanha a principal e garante conforto de leitura. Ela equilibra a comunicação, dando espaço para a fonte principal se destacar.',
      useCases:
        'Use em textos corridos, subtítulos, legendas e informações de apoio. Funciona bem em tamanhos menores e em blocos longos de texto.',
    }
  }
  if (type === 'digital') {
    return {
      description: `A tipografia digital é a fonte de apoio de ${brandName} para ambientes onde as fontes principais não podem ser carregadas, como e-mails, sistemas e alguns aplicativos.`,
      useCases:
        'Use quando a fonte principal ou secundária não estiver disponível. Ela mantém a comunicação próxima da identidade da marca, sem quebrar o layout.',
    }
  }
  return null
}

// ---------- icon ----------

// Default texts of the icon.
export function defaultIconTexts(brandName) {
  return {
    description: `Este é o ícone oficial de ${brandName}. Ele reúne em um único símbolo os elementos mais marcantes da marca e funciona sozinho, sem precisar do nome.`,
    useCases:
      'Use em espaços reduzidos ou quadrados, como foto de perfil, ícone de aplicativo, favicon, selos e carimbos. Aplique sempre a partir dos arquivos originais, sem alterações.',
  }
}

// An icon with its empty description or use cases filled, or the same object.
export function withDefaultIconTexts(icon, brandName) {
  const empty = (value) => !String(value || '').trim()
  if (!empty(icon.description) && !empty(icon.useCases)) return icon
  const defaults = defaultIconTexts(brandName)
  return {
    ...icon,
    description: empty(icon.description) ? defaults.description : icon.description,
    useCases: empty(icon.useCases) ? defaults.useCases : icon.useCases,
  }
}

// A font with its empty description or use cases filled, or the same object.
export function withDefaultFontTexts(font, brandName) {
  const defaults = defaultFontTexts(brandName, font.type)
  if (!defaults) return font
  const empty = (value) => !String(value || '').trim()
  if (!empty(font.description) && !empty(font.useCases)) return font
  return {
    ...font,
    description: empty(font.description) ? defaults.description : font.description,
    useCases: empty(font.useCases) ? defaults.useCases : font.useCases,
  }
}

// Returns the logo with its empty fields filled (every logo type), or the
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
  const tipografia = identity.tipografia.map((font) => withDefaultFontTexts(font, identity.name))
  const icones = identity.icones.map((icon) => withDefaultIconTexts(icon, identity.name))
  const logosChanged = logos.some((logo, index) => logo !== identity.logos[index])
  const fontsChanged = tipografia.some((font, index) => font !== identity.tipografia[index])
  const iconsChanged = icones.some((icon, index) => icon !== identity.icones[index])
  if (!logosChanged && !fontsChanged && !iconsChanged) return identity
  return {
    ...identity,
    ...(logosChanged ? { logos } : {}),
    ...(fontsChanged ? { tipografia } : {}),
    ...(iconsChanged ? { icones } : {}),
  }
}

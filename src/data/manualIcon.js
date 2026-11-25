import { contrastRatio, toneRows, upperHex } from './manualPalette.js'

export const ICON_INTRO = (marca) => [
  `O ícone é a versão mais compacta de ${marca}. Ele concentra a identidade em um símbolo simples, pensado para espaços pequenos e para ser reconhecido rapidamente.`,
  'Use o ícone quando a logo completa não couber ou perder a leitura. Em todas as aplicações, siga as variantes, a área de proteção e o tamanho mínimo definidos neste manual.',
]

export const ICON_TEXTS = {
  variants:
    'Versões alternativas do ícone para garantir boa leitura em qualquer fundo. Use a versão preta em fundos claros e impressões em uma cor, e a versão branca em fundos escuros, fotos e aplicações em negativo. Na dúvida, escolha sempre a variante com mais contraste.',
  safeSpace: [
    'A área de proteção do ícone equivale a 1/8 da sua largura e deve ficar livre em todos os lados. Nenhum texto, imagem ou elemento gráfico deve invadir esse espaço.',
    'O círculo indica a área segura para aplicações em formato redondo, como avatares e ícones de aplicativo. Mantenha os elementos importantes do ícone dentro dele para que nada seja cortado.',
  ],
  minSize:
    'Para manter a leitura, o ícone não deve ser aplicado abaixo de 16px em telas e 5mm em materiais impressos. Abaixo dessas medidas, os detalhes se perdem e o símbolo deixa de ser reconhecido.',
  applications:
    'O ícone foi pensado para funcionar em diferentes formatos. Os exemplos abaixo mostram como ele se comporta nos cortes mais comuns, mantendo sempre a área de proteção e o equilíbrio visual.',
  app: 'Nos ícones de aplicativo, o símbolo fica centralizado e respeita a área segura, funcionando tanto no formato quadrado arredondado quanto no circular.',
  square: 'Em perfis com corte quadrado, o ícone fica centralizado, com espaço livre suficiente nas bordas para não parecer apertado.',
  round: 'Em perfis com corte redondo, os elementos do ícone ficam dentro do círculo de segurança, sem cortes nas bordas.',
  favicon: (marca) =>
    `O favicon é o ícone que aparece na aba do navegador, nos favoritos e nos atalhos. Ele ajuda as pessoas a encontrarem o site de ${marca} rapidamente entre várias abas abertas, em temas claros e escuros.`,
}

// "www.bigodeshop.com.br": the identity name in lowercase, without spaces or accents.
export function faviconAddress(name) {
  const slug = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  return `www.${slug || 'marca'}.com.br`
}

// The original icon and each monochrome version, with the dominant color of each:
// [{ key, file, color }] (color is null until it is known).
export const versionKey = (index) => (index === 0 ? 'original' : `mono-${index}`)

// The icon version with the highest WCAG contrast against `background`.
export function bestVersion(versions, background) {
  return versions.reduce(
    (best, version) => {
      const ratio = version.color ? contrastRatio(version.color, background) : 0
      return ratio > best.ratio ? { version, ratio } : best
    },
    { version: versions[0], ratio: -1 },
  )
}

// Principal hex of a palette color.
export const principalHex = (color) => upperHex(toneRows(color).main.hex)

// Style of the application tiles:
//  1. the "Cor da marca" is the background, with the version of the icon that has the best
//     contrast against it, if that contrast reaches 3:1;
//  2. otherwise the original icon on the primary or secondary color that gives it the best
//     contrast;
//  3. with no palette, #F7F7F7 and the best version.
export function pickTileStyle(versions, palette) {
  const brand = palette.find((color) => color.category === 'marca')
  if (brand) {
    const bg = principalHex(brand)
    const best = bestVersion(versions, bg)
    if (best.ratio >= 3) return { background: bg, version: best.version }
  }
  const original = versions[0]
  const candidates = palette.filter((color) => color.category === 'primaria' || color.category === 'secundaria')
  let top = null
  if (original.color) {
    for (const color of candidates) {
      const hex = principalHex(color)
      const ratio = contrastRatio(original.color, hex)
      if (!top || ratio > top.ratio) top = { hex, ratio }
    }
  }
  if (top) return { background: top.hex, version: original }
  return { background: '#F7F7F7', version: bestVersion(versions, '#F7F7F7').version }
}

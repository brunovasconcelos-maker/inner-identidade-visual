import { useEffect, useState } from 'react'
import { DownloadSimple } from '@phosphor-icons/react'
import { useObjectUrl } from '../../hooks/useObjectUrl.js'
import { LOGO_SECTIONS } from '../../data/manual.js'
import { downloadLogoVersions, saveBlob } from '../../utils/download.js'
import { dominantColor, lowContrastBackground } from '../../utils/imageColor.js'
import SafeSpaceDiagram from './SafeSpaceDiagram.jsx'

const BOX_LIGHT = '#f7f7f7'
const BOX_DARK = '#000000'

// Gray (or black) box with the logo contained and centered. The download button shows
// on hover only.
function ImageBox({ file, fileName, bg, height, inner, label }) {
  const url = useObjectUrl(file)
  return (
    <div className="manual-box" style={{ background: bg, height }}>
      {url ? (
        <img
          className="manual-box__img"
          style={{ width: inner[0], height: inner[1] }}
          src={url}
          alt={label}
        />
      ) : null}
      <button
        type="button"
        className="manual-box__download"
        aria-label={`Baixar ${label}`}
        onClick={() => saveBlob(file, fileName)}
      >
        <DownloadSimple size={24} color="#000000" weight="regular" />
      </button>
    </div>
  )
}

// The original logo is always shown on the neutral gray.
function OriginalBox({ file, fileName, height, inner, label }) {
  return <ImageBox file={file} fileName={fileName} bg={BOX_LIGHT} height={height} inner={inner} label={label} />
}

// A box that renders the logo with one incorrect use applied in code.
function MisuseBox({ file, style, bg }) {
  const url = useObjectUrl(file)
  return (
    <div className="manual-misuse__box" style={{ background: bg }}>
      {url ? <img className="manual-misuse__img" style={style} src={url} alt="" /> : null}
    </div>
  )
}

function Misuse({ title, text, children }) {
  return (
    <div className="manual-misuse">
      <div className="manual-text-block manual-text-block--narrow">
        <h3 className="manual-h2">{title}</h3>
        <p className="manual-p">{text}</p>
      </div>
      {children}
    </div>
  )
}

const VARIANTS_TEXT =
  'Versões alternativas da logo para garantir boa leitura em qualquer fundo. Use a versão preta em fundos claros e impressões em uma cor, e a versão branca em fundos escuros, fotos e aplicações em negativo. Na dúvida, escolha sempre a variante com mais contraste.'
const MISUSE_INTRO =
  'Para manter a marca consistente e reconhecível, a logo não deve ser alterada. Os exemplos abaixo mostram os erros mais comuns. Na dúvida, use sempre os arquivos originais deste manual.'

// One logo type section of the manual (Figma nodes 6479:5211 and 6488:7870): hero, info,
// variants, safe space and incorrect uses.
export default function ManualLogoSection({ identity, logo }) {
  const config = LOGO_SECTIONS[logo.type]
  const letter = (identity.name.trim()[0] || '').toUpperCase()
  const monoVersions = logo.monoVersions || []
  const [dominant, setDominant] = useState('#000000')
  useEffect(() => {
    let alive = true
    dominantColor(logo.file).then((value) => {
      if (alive) setDominant(value)
    })
    return () => {
      alive = false
    }
  }, [logo.file])
  const noContrastBg = lowContrastBackground(dominant)

  const HERO = config.hero
  const VARIANT = config.box

  return (
    <section className="manual-logo-section" id={`logo-${logo.type}`}>
      <OriginalBox file={logo.file} fileName={logo.fileName} height={520} inner={HERO} label={config.title} />

      <div className="manual-block manual-block--info">
        <div className="manual-text-block manual-text-block--wide">
          <h2 className="manual-h2">{config.title}</h2>
          {logo.description ? <p className="manual-p">{logo.description}</p> : null}
          <h3 className="manual-h3">Casos de uso</h3>
          {logo.useCases ? <p className="manual-p">{logo.useCases}</p> : null}
        </div>
        <div className="manual-actions">
          <button type="button" className="manual-btn manual-btn--primary" onClick={() => saveBlob(logo.file, logo.fileName)}>
            {`Download ${config.download}`}
          </button>
          <button
            type="button"
            className="manual-btn manual-btn--secondary"
            onClick={() => downloadLogoVersions(identity.name, logo, config.zip)}
          >
            Download todas as versões
          </button>
        </div>
      </div>

      {monoVersions.length > 0 ? (
        <>
          <div className="manual-divider" />

          <section className="manual-block manual-block--column">
            {monoVersions.map((version, index) => {
              const box = (
                <div className="manual-box-wrap" key={version.id}>
                  <ImageBox
                    file={version.file}
                    fileName={version.fileName}
                    bg={version.previewBg === '#000000' ? BOX_DARK : BOX_LIGHT}
                    height={360}
                    inner={VARIANT}
                    label={version.name}
                  />
                </div>
              )
              return index === 0 ? (
                <div className="manual-row" key={version.id}>
                  <div className="manual-text-block manual-text-block--narrow">
                    <h2 className="manual-h2">Variantes da logo</h2>
                    <p className="manual-p">{VARIANTS_TEXT}</p>
                  </div>
                  {box}
                </div>
              ) : (
                box
              )
            })}
          </section>
        </>
      ) : null}

      <div className="manual-divider" />

      <section className="manual-block manual-block--row">
        <div className="manual-text-block manual-text-block--narrow">
          <h2 className="manual-h2">Safe space</h2>
          <div className="manual-p">
            <p>
              {`A área de proteção garante que a logo tenha espaço para respirar e seja lida com clareza. Ela é medida pela altura da letra “${letter}” e deve ficar livre em todos os lados da logo.`}
            </p>
            <p>
              Nenhum texto, imagem ou elemento gráfico deve invadir esse espaço. Quando a logo mudar de tamanho, a área de proteção acompanha a mesma proporção.
            </p>
          </div>
        </div>
        <div className="manual-box-wrap">
          <div className="manual-box manual-box--static" style={{ background: BOX_LIGHT, height: 360 }}>
            <SafeSpaceDiagram file={logo.file} identity={identity} letter={letter} area={VARIANT} />
          </div>
        </div>
      </section>

      <div className="manual-divider" />

      <section className="manual-block manual-block--column manual-block--misuse">
        <div className="manual-text-block manual-text-block--full">
          <h2 className="manual-h2">Usos incorretos</h2>
          <p className="manual-p">{MISUSE_INTRO}</p>
        </div>
        <div className="manual-misuse-grid">
          <Misuse title="Não distorça" text="Não estique nem achate a logo. Ao redimensionar, mantenha sempre a proporção original.">
            <MisuseBox file={logo.file} bg={BOX_LIGHT} style={{ transform: 'scale(1.5, 0.8)' }} />
          </Misuse>
          <Misuse title="Não altere as cores" text="Não aplique cores fora da paleta da marca. Use apenas a versão original e as variantes oficiais.">
            <MisuseBox file={logo.file} bg={BOX_LIGHT} style={{ filter: 'hue-rotate(150deg)' }} />
          </Misuse>
          <Misuse title="Não rotacione" text="Não gire nem incline a logo. Ela deve ser aplicada sempre na posição original.">
            <MisuseBox file={logo.file} bg={BOX_LIGHT} style={{ transform: 'rotate(-20deg)' }} />
          </Misuse>
          <Misuse
            title="Não use sem contraste"
            text="Não aplique a logo sobre fundos que dificultem a leitura, como cores próximas às da marca ou imagens muito carregadas."
          >
            <MisuseBox file={logo.file} bg={noContrastBg} style={{}} />
          </Misuse>
        </div>
      </section>
    </section>
  )
}

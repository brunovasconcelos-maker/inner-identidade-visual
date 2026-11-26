import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { DownloadSimple, FileArchive, TrademarkRegistered } from '@phosphor-icons/react'
import { useObjectUrl } from '../hooks/useObjectUrl.js'
import { findLogoType } from '../data/logoTypes.js'
import { saveBlob } from '../utils/download.js'

const DECELERATE = [0.05, 0.7, 0.1, 1]

// Green dot (the Logo folder icon, small) plus an underlined link.
function FolderLink({ href, onOpen, children }) {
  return (
    <span className="mago-msg__link-group">
      <span className="mago-msg__dot" aria-hidden="true">
        <TrademarkRegistered size={8} color="#2acc60" weight="fill" />
      </span>
      <a
        className="mago-msg__link"
        href={href}
        onClick={(event) => {
          event.preventDefault()
          onOpen()
        }}
      >
        {children}
      </a>
    </span>
  )
}

function LogoTile({ logo }) {
  const url = useObjectUrl(logo.file)
  const label = findLogoType(logo.type)?.label || 'Logo'
  return (
    <div className="mago-tile">
      {url && <img className="mago-tile__image" src={url} alt={label} draggable="false" />}
      <button
        type="button"
        className="mago-tile__download"
        aria-label={`Baixar ${logo.fileName}`}
        onClick={() => saveBlob(logo.file, logo.fileName)}
      >
        <DownloadSimple size={16} color="#5d5d5d" weight="regular" />
      </button>
    </div>
  )
}

function ZipCard({ zip }) {
  return (
    <button type="button" className="mago-zip" onClick={() => saveBlob(zip.blob, zip.fileName)}>
      <span className="mago-zip__icon">
        <FileArchive size={24} color="#5d5d5d" weight="regular" />
      </span>
      <span className="mago-zip__texts">
        <span className="mago-zip__name">{zip.fileName}</span>
        <span className="mago-zip__meta">{`Documento · ZIP · ${zip.sizeLabel}`}</span>
      </span>
      <DownloadSimple size={24} color="#5d5d5d" weight="regular" />
    </button>
  )
}

function AnswerBody({ answer, folderHref, onOpenFolder }) {
  if (answer.kind === 'logos') {
    return (
      <>
        <div className="mago-msg__row">
          <span>Segue todas as logos que encontrei em</span>
          <FolderLink href={folderHref} onOpen={onOpenFolder}>
            Logos
          </FolderLink>
        </div>
        <div className="mago-msg__tiles">
          {answer.logos.map((logo) => (
            <LogoTile key={logo.id} logo={logo} />
          ))}
        </div>
        {answer.zip && (
          <>
            <span>Ou baixe todas juntas</span>
            <ZipCard zip={answer.zip} />
          </>
        )}
      </>
    )
  }
  if (answer.kind === 'noLogos') {
    return (
      <div className="mago-msg__row">
        <span>Você ainda não adicionou nenhuma logo.</span>
        <FolderLink href={folderHref} onOpen={onOpenFolder}>
          Adicionar logo
        </FolderLink>
      </div>
    )
  }
  return <span>{answer.text}</span>
}

function Message({ message, animate, folderHref, onOpenFolder }) {
  const user = message.role === 'user'
  return (
    <motion.div
      className={`mago-msg ${user ? 'mago-msg--user' : 'mago-msg--mago'}`}
      initial={animate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: DECELERATE }}
    >
      {user ? (
        <div className="mago-msg__user-stack">
          <div className="mago-msg__bubble">{message.text}</div>
          <span className="mago-msg__time mago-msg__time--right">{message.time}</span>
        </div>
      ) : (
        <div className="mago-msg__mago-stack">
          <AnswerBody answer={message.answer} folderHref={folderHref} onOpenFolder={onOpenFolder} />
          <span className="mago-msg__time">{message.time}</span>
        </div>
      )}
    </motion.div>
  )
}

function Typing() {
  return (
    <motion.div
      className="mago-typing"
      aria-label="Mago está digitando"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: DECELERATE }}
    >
      <span />
      <span />
      <span />
    </motion.div>
  )
}

// The conversation below the "Hoje" pill. Scrolls to the newest message.
export default function MagoThread({ messages, pending, initialCount, identityId, onOpenFolder, bottomExtra }) {
  const scroller = useRef(null)
  const first = useRef(true)

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: first.current ? 'auto' : 'smooth' })
    first.current = false
  }, [messages.length, pending])

  return (
    <div className="mago-thread" ref={scroller} style={{ bottom: 86 + bottomExtra }}>
      <div className="mago-thread__column">
        {messages.map((message, index) => (
          <Message
            key={message.id}
            message={message}
            animate={index >= initialCount}
            folderHref={`#/id/${identityId}/logo`}
            onOpenFolder={onOpenFolder}
          />
        ))}
        {pending > 0 && <Typing />}
      </div>
    </div>
  )
}

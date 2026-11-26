import { useEffect, useRef, useState } from 'react'
import ManualPrintView from './ManualPrintView.jsx'
import { manualUrl } from '../../data/manual.js'

// Waits until the print view has its images, fonts and layout in place.
async function waitForPrintReady() {
  const root = document.querySelector('[data-manual-print]')
  try {
    await document.fonts.ready
  } catch {
    // Print with whatever fonts are there.
  }
  const started = Date.now()
  while (root && Date.now() - started < 5000) {
    const pending = [...root.querySelectorAll('img')].filter((img) => !img.complete)
    if (pending.length === 0) break
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  // Let the last effects (icon sets, font fitting) settle.
  await new Promise((resolve) => setTimeout(resolve, 600))
}

// "Manual completo" section of the Intro page: the PDF of the whole manual (the print dialog of
// the browser, saved as PDF) and a button that copies the link of the manual.
export default function ManualKit({ identity, themeStyle }) {
  const [printing, setPrinting] = useState(false)
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef(null)
  const title = useRef(null)

  useEffect(() => () => clearTimeout(copyTimer.current), [])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(manualUrl(identity.id))
    } catch (error) {
      console.error('Could not copy the link', error)
    }
    setCopied(true)
    clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopied(false), 1500)
  }

  // Mounting the print view renders every page; once it is ready the print dialog opens, and
  // the view is removed when the dialog closes.
  useEffect(() => {
    if (!printing) return undefined
    let alive = true
    const restore = () => {
      if (title.current !== null) document.title = title.current
      title.current = null
      if (alive) setPrinting(false)
    }
    window.addEventListener('afterprint', restore, { once: true })
    waitForPrintReady().then(() => {
      if (!alive) return
      title.current = document.title
      document.title = `${identity.name} - Manual da marca`
      window.print()
    })
    return () => {
      alive = false
      window.removeEventListener('afterprint', restore)
      if (title.current !== null) document.title = title.current
    }
  }, [printing, identity.name])

  return (
    <section className="manual-block manual-kit">
      <div className="manual-text-block manual-text-block--wide">
        <h2 className="manual-h2">Manual completo</h2>
        <p className="manual-p">
          Baixe o manual em PDF ou copie o link para compartilhar com quem vai trabalhar com a marca.
        </p>
      </div>
      <div className="manual-actions">
        <button
          type="button"
          className="manual-btn manual-btn--primary"
          aria-busy={printing}
          disabled={printing}
          onClick={() => setPrinting(true)}
        >
          Download PDF
        </button>
        <span className="manual-kit__copy">
          <button type="button" className="manual-btn manual-btn--secondary" onClick={copyLink}>
            Copiar link
          </button>
          {copied ? (
            <span className="tooltip" role="status">
              Link copiado
            </span>
          ) : null}
        </span>
      </div>
      {printing ? <ManualPrintView identity={identity} themeStyle={themeStyle} /> : null}
    </section>
  )
}

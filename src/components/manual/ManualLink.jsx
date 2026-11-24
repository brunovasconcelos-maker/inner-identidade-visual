import { Desktop } from '@phosphor-icons/react'
import { manualUrl } from '../../data/manual.js'

// "Ver meu manual": opens the brand manual in a new tab.
export default function ManualLink({ identityId }) {
  return (
    <a
      href={manualUrl(identityId)}
      target="_blank"
      rel="noopener"
      className="btn btn--outline btn--with-icon btn--manual"
    >
      <span className="btn__label">Ver meu manual</span>
      <Desktop size={20} weight="regular" />
    </a>
  )
}

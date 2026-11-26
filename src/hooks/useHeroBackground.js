import { useEffect, useState } from 'react'
import { pickAvatarBackground } from '../data/manualIcon.js'
import { HERO_FALLBACK_BACKGROUND, heroLogo } from '../data/manualIntro.js'
import { dominantColors } from '../utils/imageColor.js'

// Background of the Intro hero and of the cards that share it: the palette color with the
// highest contrast against the logo's highest chroma dominant color, skipping colors too close
// (deltaE below 10) to any of the logo colors. #F7F7F7 when none qualifies or there is no logo.
export function useHeroBackground(identity) {
  const logo = heroLogo(identity)
  const [state, setState] = useState({ file: null, background: HERO_FALLBACK_BACKGROUND })
  const file = logo ? logo.file : null
  useEffect(() => {
    let alive = true
    if (!file) return undefined
    dominantColors(file)
      .then((dominant) => {
        if (alive) setState({ file, background: pickAvatarBackground(dominant, identity.paleta, HERO_FALLBACK_BACKGROUND) })
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [file, identity.paleta])
  return file && state.file === file ? state.background : HERO_FALLBACK_BACKGROUND
}

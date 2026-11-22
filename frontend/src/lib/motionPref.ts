import { useEffect, useState } from 'react'

const KEY = 'litlens-motion'

/** Animations default to on, unless the OS asks for reduced motion. */
function initialMotion(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const stored = window.localStorage.getItem(KEY)
    if (stored === 'on') return true
    if (stored === 'off') return false
  } catch {
    /* storage blocked (private mode): fall through */
  }
  return !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/**
 * The user's animation preference. Also sets `data-motion` on <html>, which
 * index.css uses to stop CSS animations and transitions when it is off.
 */
export function useMotionPref(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(initialMotion)

  useEffect(() => {
    document.documentElement.dataset.motion = on ? 'on' : 'off'
    try {
      window.localStorage.setItem(KEY, on ? 'on' : 'off')
    } catch {
      /* non-fatal */
    }
  }, [on])

  return [on, setOn]
}

import { useEffect, useRef, useState } from 'react'
import { Mascot } from 'wobnimo'
import { branch } from '../../../mascots/owlPerch'
import type { Theme } from '../TopBar'

const EXPOSURE: Record<Theme, number> = { light: 1, dark: 0.78 }

/**
 * Hoot's branch, drawn by wobnimo so its lighting matches him, but frozen:
 * speed 0, not interactive, no effects. It sits in its own canvas under Hoot
 * (same size and framing), so his hops and turns never move it.
 */
export function BranchFigure({ theme, className = '' }: { theme: Theme; className?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const host = box.current
    if (!host) return
    const canvas = host.appendChild(document.createElement('canvas'))
    canvas.style.cssText = 'display:block;width:100%;height:100%'
    const still = new Mascot(canvas, branch, {
      state: 'idle',
      speed: 0,
      interactive: false,
      effects: false,
      floor: 0,
      exposure: EXPOSURE[theme],
      respectReducedMotion: false,
    })
    const offReady = still.on('ready', () => setReady(true))
    return () => {
      offReady()
      still.dispose()
      canvas.remove()
      setReady(false)
    }
  }, [theme])

  return (
    <div
      ref={box}
      aria-hidden="true"
      className={`transition-opacity duration-500 ease-out ${ready ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  )
}

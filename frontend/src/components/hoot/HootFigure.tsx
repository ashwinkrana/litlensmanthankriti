import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Mascot } from 'wobnimo'
import owl from '../../../mascots/owl'
import owlPerch from '../../../mascots/owlPerch'
import type { HootMood } from '../../lib/hootContext'
import type { Theme } from '../TopBar'

// Hoot v2's cap is ultramarine in the spec; in this amber "study desk" theme he
// wears the original owl's slate cap.
const SLATE = { cap: '#3d3a5c' }

// wobnimo ignores the cursor once it is more than ~3 of Hoot's widths away.
// We feed the cursor's direction in ourselves (clamped inside that range), so
// he looks toward it from anywhere on the page. `brain` is internal to
// wobnimo 0.2.0 (pinned exactly in package.json for this reason).
type WithBrain = { brain?: { pointer: { x: number; y: number } | null } }
const MAX_REACH = 2.6

// The studio lighting is tuned for light pages; on the dark theme it made him
// glow like a sticker. A lower exposure sits him in the dimmer scene.
const EXPOSURE: Record<Theme, number> = { light: 1, dark: 0.78 }

/**
 * Hoot himself, rendered with wobnimo's core API (not its React wrapper) so we
 * can steer his gaze page-wide. Fills its box, fades in once the shader is
 * built, holds still when `animate` is false (the Motion toggle).
 */
export function HootFigure({
  mood,
  animate,
  theme,
  perched = false,
  floor = 1,
  className = '',
  style,
}: {
  mood: HootMood
  animate: boolean
  theme: Theme
  /** Standing on his branch (owlPerch spec); the page edge crops the branch. */
  perched?: boolean
  floor?: number
  className?: string
  style?: CSSProperties
}) {
  const box = useRef<HTMLDivElement>(null)
  const mascot = useRef<Mascot | null>(null)
  const [ready, setReady] = useState(false)
  // Latest props, read when the mascot is (re)built.
  const latest = useRef({ mood, animate, floor })
  useEffect(() => {
    latest.current = { mood, animate, floor }
  })

  // Built per theme (exposure is fixed at construction) and per spec; mood and
  // motion changes go through the setters below.
  useEffect(() => {
    const host = box.current
    if (!host) return
    const canvas = host.appendChild(document.createElement('canvas'))
    canvas.style.cssText = 'display:block;width:100%;height:100%'
    const { mood: m, animate: a, floor: f } = latest.current
    const hoot = new Mascot(canvas, perched ? owlPerch : owl, {
      exposure: EXPOSURE[theme],
      state: m,
      palette: SLATE,
      speed: a ? 1 : 0,
      effects: a,
      floor: f,
      respectReducedMotion: false,
    })
    mascot.current = hoot
    const offReady = hoot.on('ready', () => setReady(true))

    // Runs after wobnimo's own pointer listener (registered just above), so it
    // can replace the "too far away" null with a clamped direction.
    const follow = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      const size = Math.max(r.width, 1) * 1.1
      let x = (e.clientX - (r.left + r.width / 2)) / size
      let y = (e.clientY - (r.top + r.height * 0.45)) / size
      const d = Math.hypot(x, y)
      if (d > MAX_REACH) {
        x = (x / d) * MAX_REACH
        y = (y / d) * MAX_REACH
      }
      const brain = (hoot as unknown as WithBrain).brain
      if (brain) brain.pointer = { x, y }
    }
    window.addEventListener('pointermove', follow, { passive: true })

    return () => {
      window.removeEventListener('pointermove', follow)
      offReady()
      hoot.dispose()
      canvas.remove()
      mascot.current = null
      setReady(false)
    }
  }, [theme, perched])

  useEffect(() => {
    mascot.current?.setState(mood)
  }, [mood])

  useEffect(() => {
    mascot.current?.setSpeed(animate ? 1 : 0)
    mascot.current?.setEffects(animate)
  }, [animate])

  return (
    <div
      ref={box}
      aria-hidden="true"
      className={`transition-opacity duration-500 ease-out ${ready ? 'opacity-100' : 'opacity-0'} ${className}`}
      style={style}
    />
  )
}

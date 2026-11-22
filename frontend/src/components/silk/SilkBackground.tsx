import { useEffect, useRef, useState } from 'react'
import type { Theme } from '../TopBar'
import type { SilkEngine, SilkPalette } from './engine'

const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

// Tints come from the LitLens tokens (amber, rose, sky / mint) so the silk
// belongs to the page. Light stays pale and dark stays deep so text reads.
const PALETTES: Record<Theme, SilkPalette> = {
  light: {
    base: rgb('#fff8f5'),
    tintA: rgb('#fcd59a'), // amber-peach
    tintB: rgb('#f9c6d3'), // blush
    tintC: rgb('#c9e6f2'), // pale sky, in patches
    glintColor: [1, 1, 1],
    tintMix: 0.64,
    shadeFloor: 0.86,
    shadeGain: 0.18,
    glint: 0.2,
  },
  dark: {
    base: rgb('#0b0f17'),
    tintA: rgb('#4a3510'), // amber, deep
    tintB: rgb('#2a1f45'), // plum-indigo
    tintC: rgb('#0f3038'), // deep teal, in patches
    glintColor: rgb('#fbbf24'),
    tintMix: 0.7,
    shadeFloor: 0.6,
    shadeGain: 0.8,
    glint: 0.14,
  },
}

// Shown before WebGL draws, and if WebGL isn't available at all.
const FALLBACK: Record<Theme, string> = {
  light: 'linear-gradient(135deg, #fff8f5, #fef3c7 45%, #fde2e2 75%, #e0f2fe)',
  dark: 'linear-gradient(135deg, #0b0f17, #1a1508 45%, #12112a 75%, #0a1d22)',
}

/**
 * Full-screen silk background (custom WebGL shader, no library). With
 * `animate` off it shows a single still frame instead of disappearing.
 */
export function SilkBackground({ theme, animate }: { theme: Theme; animate: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const engine = useRef<SilkEngine | null>(null)
  const [visible, setVisible] = useState(false)
  // Latest props, read once when the engine finishes loading.
  const latest = useRef({ theme, animate })
  useEffect(() => {
    latest.current = { theme, animate }
  })

  useEffect(() => {
    let cancelled = false
    import('./engine').then(({ createSilkEngine }) => {
      if (cancelled || !canvas.current) return
      const { theme: t, animate: a } = latest.current
      engine.current = createSilkEngine(canvas.current, PALETTES[t], a, () => setVisible(false))
      if (engine.current) setVisible(true)
    })
    return () => {
      cancelled = true
      engine.current?.dispose()
      engine.current = null
    }
  }, [])

  useEffect(() => {
    engine.current?.setPalette(PALETTES[theme])
  }, [theme])

  useEffect(() => {
    engine.current?.setAnimate(animate)
  }, [animate])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{ background: FALLBACK[theme] }}
    >
      <canvas
        ref={canvas}
        className={`h-full w-full transition-opacity duration-300 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}

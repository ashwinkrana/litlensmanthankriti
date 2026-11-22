import { useState, type CSSProperties } from 'react'
import { Mascot } from 'wobnimo/react'
import owl from '../../../mascots/owl'
import type { HootMood } from '../../lib/hootContext'
import type { Theme } from '../TopBar'

// The cap is the Proceedings ultramarine; on dark surfaces it lifts so it reads.
// In front of the ultramarine band ('onBand') it turns academic navy instead.
const PALETTE: Record<Theme | 'onBand', Record<string, string>> = {
  light: {},
  dark: { cap: '#4f60ff' },
  onBand: { cap: '#141a4d' },
}

/**
 * Hoot himself: the wobnimo canvas, filling its box, fading in once the
 * shader is built (no pop-in), recoloured for the theme.
 * `framing` < 1 crops in closer (for small badges); `floor` 0 drops the
 * floor shadow when he sits over content.
 */
export function HootFigure({
  mood,
  theme,
  animate,
  framing = 1,
  floor = 1,
  onBand = false,
  className = '',
  style,
}: {
  mood: HootMood
  theme: Theme
  animate: boolean
  framing?: number
  floor?: number
  /** Standing in front of the ultramarine band: use the navy cap. */
  onBand?: boolean
  className?: string
  style?: CSSProperties
}) {
  const [ready, setReady] = useState(false)
  return (
    <div className={`transition-opacity duration-500 ease-out ${ready ? 'opacity-100' : 'opacity-0'} ${className}`} style={style}>
      <Mascot
        // remount when motion is toggled so speed/effects apply from a clean start
        key={animate ? 'live' : 'still'}
        character={owl}
        state={mood}
        palette={PALETTE[onBand ? 'onBand' : theme]}
        speed={animate ? 1 : 0}
        effects={animate}
        respectReducedMotion={false}
        framing={framing}
        floor={floor}
        onReady={() => setReady(true)}
        // the library defaults to a fixed 160px box; fill (and shrink with) ours
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}

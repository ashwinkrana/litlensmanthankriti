import { useState, type CSSProperties } from 'react'
import { Mascot } from 'wobnimo/react'
import owl from '../../../mascots/owl'
import type { HootMood } from '../../lib/hootContext'

// Hoot v2's cap is ultramarine in the spec; in this amber "study desk" theme he
// wears the original owl's slate cap.
const SLATE = { cap: '#3d3a5c' }

/**
 * Hoot himself: the wobnimo canvas, filling its box, fading in once the
 * shader is built (no pop-in). `floor` 0 drops the floor shadow when he sits
 * over content; `animate` false holds him still (the Motion toggle).
 */
export function HootFigure({
  mood,
  animate,
  floor = 1,
  className = '',
  style,
}: {
  mood: HootMood
  animate: boolean
  floor?: number
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
        palette={SLATE}
        speed={animate ? 1 : 0}
        effects={animate}
        respectReducedMotion={false}
        floor={floor}
        onReady={() => setReady(true)}
        // the library defaults to a fixed 160px box; fill (and shrink with) ours
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
